export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { isMountainTimeHour } from '../../../../lib/digest';

const SLACK_BOT_TOKEN = process.env.SLACK_DIGEST_BOT_TOKEN || '';
const RYAN_SLACK_USER_ID = 'U0A5XAJ6DRC';
const SMOKE_HOUR_MT = 7; // fires at 7:55am MT — 5 min before the real 8am digest

/**
 * Fires at 7:55am MT year-round (scheduled at 13:55 + 14:55 UTC, DST gate
 * picks the right one). Hits the real daily-digest in dry-run mode. If
 * anything about the pipeline is broken — route 404ing from CDN cache,
 * Supabase down, Slack bot token rotated, FUB key invalid — this catches
 * it 5 minutes before the real run and DMs Ryan.
 *
 * Only DMs Ryan. Never posts to channels. Nothing happens on success
 * (silent by design so Ryan doesn't get noise when things are healthy).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : '';
  const isVercelCron = expected && authHeader === expected;
  const force = req.nextUrl.searchParams.get('force') === '1';

  if (!isVercelCron && !force) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // DST-robust 7am hour gate. ?force=1 bypasses for manual testing.
  if (!force && !isMountainTimeHour(SMOKE_HOUR_MT)) {
    return NextResponse.json({ skipped: true, reason: 'not_smoke_window' });
  }

  // Call the real digest in dry-run mode. Same host, internal roundtrip.
  const base = new URL(req.url).origin;
  const digestUrl = `${base}/api/cron/daily-digest?dry=1`;

  const startedAt = Date.now();
  let status = 0;
  let bodyText = '';
  let ok = false;
  let errMsg = '';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const r = await fetch(digestUrl, { signal: controller.signal });
      status = r.status;
      bodyText = (await r.text()).slice(0, 400);
      ok = r.ok && bodyText.startsWith('{');
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    errMsg = err instanceof Error ? err.message : String(err);
  }

  const elapsedMs = Date.now() - startedAt;

  if (ok) {
    // Healthy — silent.
    return NextResponse.json({ success: true, status, elapsedMs, url: digestUrl });
  }

  // Failure — DM Ryan so he knows before the 8am run.
  const lines = [
    `🚨 *Digest smoke test FAILED — 5 min before 8am MT fire*`,
    ``,
    `URL: \`${digestUrl}\``,
    `HTTP: ${status || 'no response'}${errMsg ? ` · error: ${errMsg}` : ''}`,
    `Elapsed: ${elapsedMs}ms`,
    ``,
    `First 400 chars of response:\n\`\`\`${bodyText || '(empty)'}\`\`\``,
    ``,
    `_The 8am digest will likely fail. Investigate before then or the team won't see their leads today._`,
  ];

  await dmRyan(lines.join('\n')).catch(e => console.error('[smoke] DM to Ryan failed:', e));

  return NextResponse.json(
    { success: false, status, elapsedMs, error: errMsg || 'non-200', bodySample: bodyText },
    { status: 500 },
  );
}

async function dmRyan(text: string): Promise<void> {
  if (!SLACK_BOT_TOKEN) throw new Error('SLACK_DIGEST_BOT_TOKEN missing');
  const headers = {
    Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
    'Content-Type': 'application/json; charset=utf-8',
  };
  // Open DM channel
  const openRes = await fetch('https://slack.com/api/conversations.open', {
    method: 'POST',
    headers,
    body: JSON.stringify({ users: RYAN_SLACK_USER_ID }),
  });
  const openData = (await openRes.json()) as { ok: boolean; channel?: { id: string }; error?: string };
  if (!openData.ok || !openData.channel?.id) {
    throw new Error(`conversations.open failed: ${openData.error}`);
  }
  const postRes = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      channel: openData.channel.id,
      text,
      unfurl_links: false,
    }),
  });
  const postData = (await postRes.json()) as { ok: boolean; error?: string };
  if (!postData.ok) throw new Error(`chat.postMessage failed: ${postData.error}`);
}
