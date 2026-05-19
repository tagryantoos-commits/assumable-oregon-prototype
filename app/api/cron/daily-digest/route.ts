export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../../lib/supabase/server';
import {
  ActivityRow,
  AgentDigest,
  enrichFromFub,
  groupByAgent,
  isMountainTimeHour,
  renderAgentDm,
  renderChannelSummary,
  summarizeActivity,
} from '../../../../lib/digest';

const FUB_API_KEY = (process.env.FOLLOWUPBOSS_API_KEY || '').replace(/\\n$/, '').trim();
const SLACK_BOT_TOKEN = process.env.SLACK_DIGEST_BOT_TOKEN || '';
const DIGEST_CHANNEL = process.env.SLACK_DIGEST_CHANNEL || '#bots-that-help';
const DIGEST_HOUR_MT = 8;

const FUB_BASE = 'https://api.followupboss.com/v1';
const SLACK_BASE = 'https://slack.com/api';

export async function GET(req: NextRequest) {
  // Protect from arbitrary hits: Vercel cron sends a CRON_SECRET header.
  const authHeader = req.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : '';
  const isVercelCron = expected && authHeader === expected;
  const dryRun = req.nextUrl.searchParams.get('dry') === '1';
  const force = req.nextUrl.searchParams.get('force') === '1';

  if (!isVercelCron && !force && !dryRun) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // DST-robust 8am MT gate. `force=1` and `dry=1` bypass for manual testing.
  if (!force && !dryRun && !isMountainTimeHour(DIGEST_HOUR_MT)) {
    return NextResponse.json({ skipped: true, reason: 'not_8am_MT' });
  }

  // Pull last 24h of activity.
  const sb = await createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: rows, error } = await sb
    .from('user_activity')
    .select('user_email, event_type, metadata, created_at')
    .gte('created_at', since);
  if (error) {
    console.error('[digest] supabase query failed:', error);
    return NextResponse.json({ error: 'supabase_failed', detail: error.message }, { status: 500 });
  }
  const activityRows = (rows || []) as ActivityRow[];

  if (activityRows.length === 0) {
    const forDate = new Date().toLocaleDateString('en-US', { timeZone: 'America/Denver' });
    if (!dryRun) {
      await postToSlackChannel(
        DIGEST_CHANNEL,
        `*Website Activity — ${forDate}*\n_Quiet day — no authenticated users had logged activity in the last 24 hours._`,
        [],
      );
    }
    return NextResponse.json({ success: true, activity_rows: 0, dryRun });
  }

  // Summarize → enrich with FUB → group by agent.
  let leads = summarizeActivity(activityRows);
  leads = await enrichFromFub(leads, FUB_API_KEY);
  const groups = groupByAgent(leads);

  // Build digests per agent; resolve Slack user IDs via users.lookupByEmail.
  const digests: AgentDigest[] = [];
  for (const [assignedUserId, bucketLeads] of groups.entries()) {
    const agent = assignedUserId
      ? await fetchFubUser(assignedUserId)
      : null;
    const slackUserId = agent?.email ? await slackLookupEmail(agent.email) : null;
    const hotCount = bucketLeads.filter(l => l.temperature === 'hot').length;
    const warmCount = bucketLeads.filter(l => l.temperature === 'warm').length;
    digests.push({
      assignedUserId,
      assignedToName: agent?.name || (assignedUserId ? `Agent ${assignedUserId}` : 'Unassigned'),
      slackUserId,
      leads: bucketLeads,
      hotCount,
      warmCount,
    });
  }

  // Sort digests by total hot leads desc for channel summary readability.
  digests.sort((a, b) => b.hotCount - a.hotCount || b.leads.length - a.leads.length);

  const forDate = new Date().toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Dry-run: return rendered payload instead of posting.
  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      forDate,
      activity_rows: activityRows.length,
      leads: leads.length,
      digests: digests.map(d => ({
        agent: d.assignedToName,
        slackUserId: d.slackUserId,
        hot: d.hotCount,
        warm: d.warmCount,
        total: d.leads.length,
        dmPreview: renderAgentDm(d, forDate).text,
      })),
      channelPreview: renderChannelSummary(digests, forDate, leads.length).text,
    });
  }

  // DM each agent who has active leads (skip if only quiet leads).
  const dmResults: Array<{ agent: string; ok: boolean; reason?: string }> = [];
  for (const d of digests) {
    const hasSignal = d.hotCount > 0 || d.warmCount > 0;
    if (!hasSignal) {
      dmResults.push({ agent: d.assignedToName, ok: false, reason: 'no_signal' });
      continue;
    }
    if (!d.slackUserId) {
      dmResults.push({ agent: d.assignedToName, ok: false, reason: 'no_slack_match' });
      continue;
    }
    const { text, blocks } = renderAgentDm(d, forDate);
    const ok = await postToSlackDm(d.slackUserId, text, blocks);
    dmResults.push({ agent: d.assignedToName, ok });
  }

  // Team summary — always post to channel.
  const summary = renderChannelSummary(digests, forDate, leads.length);
  await postToSlackChannel(DIGEST_CHANNEL, summary.text, summary.blocks);

  return NextResponse.json({
    success: true,
    forDate,
    activity_rows: activityRows.length,
    leads: leads.length,
    digests: digests.length,
    dms: dmResults,
  });
}

// ──────────────────────────────────────────────────────────────────────────
// FUB helpers
// ──────────────────────────────────────────────────────────────────────────

async function fetchFubUser(userId: number): Promise<{ name: string; email: string } | null> {
  if (!FUB_API_KEY) return null;
  const auth = 'Basic ' + Buffer.from(`${FUB_API_KEY}:`).toString('base64');
  try {
    const r = await fetch(`${FUB_BASE}/users/${userId}`, {
      headers: { Authorization: auth },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return { name: u.name ?? '', email: u.email ?? '' };
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Slack helpers
// ──────────────────────────────────────────────────────────────────────────

async function slackCall<T>(method: string, body: unknown): Promise<T> {
  const r = await fetch(`${SLACK_BASE}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });
  return (await r.json()) as T;
}

async function slackLookupEmail(email: string): Promise<string | null> {
  if (!SLACK_BOT_TOKEN) return null;
  try {
    const r = await fetch(`${SLACK_BASE}/users.lookupByEmail?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
    });
    const d = (await r.json()) as { ok: boolean; user?: { id: string } };
    return d.ok ? d.user?.id ?? null : null;
  } catch {
    return null;
  }
}

async function postToSlackChannel(channel: string, text: string, blocks: unknown[]): Promise<boolean> {
  if (!SLACK_BOT_TOKEN) return false;
  const d = await slackCall<{ ok: boolean; error?: string }>('chat.postMessage', {
    channel,
    text,
    blocks,
    unfurl_links: false,
  });
  if (!d.ok) console.error('[digest] channel post failed:', d.error);
  return d.ok;
}

async function postToSlackDm(slackUserId: string, text: string, blocks: unknown[]): Promise<boolean> {
  if (!SLACK_BOT_TOKEN) return false;
  // Open (or fetch existing) DM channel, then post.
  const open = await slackCall<{ ok: boolean; channel?: { id: string }; error?: string }>(
    'conversations.open',
    { users: slackUserId },
  );
  if (!open.ok || !open.channel?.id) {
    console.error('[digest] DM open failed:', open.error);
    return false;
  }
  const post = await slackCall<{ ok: boolean; error?: string }>('chat.postMessage', {
    channel: open.channel.id,
    text,
    blocks,
    unfurl_links: false,
  });
  if (!post.ok) console.error('[digest] DM post failed:', post.error);
  return post.ok;
}
