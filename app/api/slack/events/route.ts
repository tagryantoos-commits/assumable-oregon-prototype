export const runtime = 'nodejs';
export const maxDuration = 15;

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../../lib/supabase/server';
import {
  ActivityRow,
  enrichFromFub,
  groupByAgent,
  mountainTimeMidnightUtc,
  renderAgentDm,
  summarizeActivity,
  AgentDigest,
  LeadSummary,
} from '../../../../lib/digest';
import { verifySlackSignature } from '../../../../lib/slack-verify';

const FUB_API_KEY = (process.env.FOLLOWUPBOSS_API_KEY || '').replace(/\\n$/, '').trim();
const SLACK_BOT_TOKEN = process.env.SLACK_DIGEST_BOT_TOKEN || '';
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '';
const FUB_BASE = 'https://api.followupboss.com/v1';
const SLACK_BASE = 'https://slack.com/api';

// In-memory cooldown to prevent rapid double-posts. Keyed by slack user ID.
// Cold starts wipe this, which is fine — worst case one extra reply.
const COOLDOWN_MS = 60_000;
const cooldown = new Map<string, number>();

export async function POST(req: NextRequest) {
  // Read raw body — HMAC must be computed over the exact bytes Slack sent,
  // not re-serialized JSON.
  const rawBody = await req.text();
  const tsHeader = req.headers.get('x-slack-request-timestamp');
  const sigHeader = req.headers.get('x-slack-signature');

  console.log('[slack-events] inbound', {
    bytes: rawBody.length,
    hasTs: !!tsHeader,
    hasSig: !!sigHeader,
    ua: req.headers.get('user-agent'),
    retryNum: req.headers.get('x-slack-retry-num'),
    retryReason: req.headers.get('x-slack-retry-reason'),
  });

  // Parse once for routing.
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  // URL verification challenge (fires once when the endpoint is configured).
  if (payload.type === 'url_verification' && typeof payload.challenge === 'string') {
    // Slack's own docs say the challenge exchange doesn't need signature
    // verification but we still bail if it's obviously malformed.
    return NextResponse.json({ challenge: payload.challenge });
  }

  // Every other request must be signed.
  if (!verifySlackSignature(rawBody, tsHeader, sigHeader, SLACK_SIGNING_SECRET)) {
    console.warn('[slack-events] signature verification failed');
    return NextResponse.json({ error: 'bad_signature' }, { status: 401 });
  }

  if (payload.type !== 'event_callback') {
    return NextResponse.json({ ok: true, ignored: payload.type });
  }

  const event = payload.event as {
    type: string;
    user?: string;
    channel?: string;
    ts?: string;
    thread_ts?: string;
    text?: string;
  };

  if (event?.type !== 'app_mention') {
    return NextResponse.json({ ok: true, ignored_event: event?.type });
  }

  const slackUserId = event.user;
  const channel = event.channel;
  const threadTs = event.thread_ts || event.ts; // reply in thread

  if (!slackUserId || !channel || !threadTs) {
    return NextResponse.json({ ok: true, reason: 'incomplete_event' });
  }

  // Slack retries on non-2xx. Ack immediately; do the real work async so we
  // stay under the 3-second response budget. `await` works in Vercel Node
  // runtime because the function stays alive for maxDuration.
  ack(
    handleMention({ slackUserId, channel, threadTs, text: event.text || '' })
      .catch(err => console.error('[slack-events] handler failed:', err))
  );
  return NextResponse.json({ ok: true });
}

function ack(_work: Promise<void>): void {
  // Vercel serverless completes the HTTP response when we return, but the
  // function instance stays alive until the pending promise resolves or
  // maxDuration is hit. This is a no-op wrapper for readability.
  void _work;
}

// ──────────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────────

async function handleMention(args: {
  slackUserId: string;
  channel: string;
  threadTs: string;
  text: string;
}): Promise<void> {
  const { slackUserId, channel, threadTs } = args;

  // 60s cooldown per user to prevent accidental double-fires.
  const last = cooldown.get(slackUserId) ?? 0;
  const now = Date.now();
  if (now - last < COOLDOWN_MS) {
    await slackReply(channel, threadTs,
      `Hang on — you just asked. Try again in ${Math.ceil((COOLDOWN_MS - (now - last)) / 1000)}s.`);
    return;
  }
  cooldown.set(slackUserId, now);

  // Resolve mentioner → email → FUB user ID
  const email = await slackEmailFor(slackUserId);
  if (!email) {
    await slackReply(channel, threadTs,
      `_Couldn't read your email from Slack — make sure the bot has users:read.email scope._`);
    return;
  }

  const fubUserId = await findFubUserByEmail(email);
  if (!fubUserId) {
    await slackReply(channel, threadTs,
      `_You're not showing up as an agent in FollowUpBoss (looked up by ${email}). If that email is wrong, update your Slack profile._`);
    return;
  }

  // Pull today's activity (midnight MT → now) and render the mentioner's slice
  const since = mountainTimeMidnightUtc(new Date()).toISOString();
  const sb = await createServiceClient();
  const { data: rows, error } = await sb
    .from('user_activity')
    .select('user_email, event_type, metadata, created_at')
    .gte('created_at', since);

  if (error) {
    console.error('[slack-events] supabase query failed:', error);
    await slackReply(channel, threadTs,
      `_Something broke reading the activity log. Ryan has been notified._`);
    return;
  }

  const activityRows = (rows || []) as ActivityRow[];
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  if (activityRows.length === 0) {
    await slackReply(channel, threadTs,
      `_No logged-in activity from any leads so far on ${todayLabel}. Full team digest fires tomorrow at 8am MT._`);
    return;
  }

  // Full pipeline — summarize → enrich → group, then pull just this agent's bucket
  let leads = summarizeActivity(activityRows);
  leads = await enrichFromFub(leads, FUB_API_KEY);
  const groups = groupByAgent(leads);
  const myLeads: LeadSummary[] = groups.get(fubUserId) ?? [];

  const hotCount = myLeads.filter(l => l.temperature === 'hot').length;
  const warmCount = myLeads.filter(l => l.temperature === 'warm').length;

  if (myLeads.length === 0) {
    await slackReply(channel, threadTs,
      `_No activity yet today (${todayLabel}) from your assigned leads. Team channel will show the full picture at 8am MT tomorrow._`);
    return;
  }

  const digest: AgentDigest = {
    assignedUserId: fubUserId,
    assignedToName: '',
    slackUserId,
    leads: myLeads,
    hotCount,
    warmCount,
  };

  const { text } = renderAgentDm(digest, `${todayLabel} (so far)`);
  await slackReply(channel, threadTs, text);
}

// ──────────────────────────────────────────────────────────────────────────
// Slack + FUB helpers
// ──────────────────────────────────────────────────────────────────────────

async function slackEmailFor(userId: string): Promise<string | null> {
  try {
    const r = await fetch(`${SLACK_BASE}/users.info?user=${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
    });
    const d = (await r.json()) as { ok: boolean; user?: { profile?: { email?: string } } };
    return d.ok ? (d.user?.profile?.email ?? null) : null;
  } catch {
    return null;
  }
}

async function findFubUserByEmail(email: string): Promise<number | null> {
  if (!FUB_API_KEY) return null;
  const auth = 'Basic ' + Buffer.from(`${FUB_API_KEY}:`).toString('base64');
  try {
    const r = await fetch(`${FUB_BASE}/users?limit=100`, { headers: { Authorization: auth } });
    if (!r.ok) return null;
    const d = (await r.json()) as { users?: Array<{ id: number; email: string }> };
    const match = (d.users || []).find(u => u.email?.toLowerCase() === email.toLowerCase());
    return match?.id ?? null;
  } catch {
    return null;
  }
}

async function slackReply(channel: string, threadTs: string, text: string): Promise<void> {
  if (!SLACK_BOT_TOKEN) return;
  await fetch(`${SLACK_BASE}/chat.postMessage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ channel, thread_ts: threadTs, text, unfurl_links: false }),
  });
}
