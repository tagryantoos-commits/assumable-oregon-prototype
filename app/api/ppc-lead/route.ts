export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

const FUB_KEY = process.env.FOLLOWUPBOSS_API_KEY?.trim() || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8079079144';

// ---------------------------------------------------------------------------
// OUTBOUND AUTOMATION KILL SWITCH — intentionally disabled 2026-04-21
// ---------------------------------------------------------------------------
// The n8n → Vapi outbound call trigger below is OFF. The downstream voice AI
// pipeline is not live yet. Flip to true only after confirming n8n/Vapi is
// ready; otherwise PPC leads fire into a dead webhook.
const VAPI_OUTBOUND_ENABLED = false;

// ─── FollowUpBoss ─────────────────────────────────────────────────────────────

async function sendToFUB(data: {
  name: string;
  email: string;
  phone: string;
  budget?: string;
  formId?: string;
  formType?: string;
  source?: string;
  buyerType?: string;
}) {
  const { name, email, phone, budget, formId } = data;
  const [firstName, ...rest] = (name || '').trim().split(' ');
  const lastName = rest.join(' ') || '';

  const person: Record<string, unknown> = {
    firstName,
    lastName,
    source: data.source || 'Google PPC',
    stage: 'AG: New Lead',
  };

  if (email) person.emails = [{ value: email }];
  if (phone) person.phones = [{ value: phone, type: 'mobile' }];
  const tags: string[] = [data.formType || 'Form: PPC Lead'];
  if (data.source) tags.push(`Ad Campaign: ${data.source}`);
  person.tags = tags;

  // Note: Ad Campaign as first line for visibility on lead card
  const noteLines: string[] = [];
  if (data.source) noteLines.push(`Ad Campaign: ${data.source}`);
  if (budget) noteLines.push(`Budget: ${budget}`);
  if (formId) noteLines.push(`Form position: ${formId}`);

  const authHeader = 'Basic ' + Buffer.from(`${FUB_KEY}:`).toString('base64');
  const headers = {
    Authorization: authHeader,
    'Content-Type': 'application/json',
    'X-System': 'assumableguy.com',
    'X-System-Key': FUB_KEY,
  };

  // Use /events endpoint — accepts any source string, no FUB whitelist restriction
  const eventPayload: Record<string, unknown> = {
    source: data.source || 'Google PPC',
    system: 'assumableguy.com',
    type: 'Registration',
    person,
  };

  if (noteLines.length > 0) {
    eventPayload.note = noteLines.join('\n');
  }

  const eventRes = await fetch('https://api.followupboss.com/v1/events', {
    method: 'POST',
    headers,
    body: JSON.stringify(eventPayload),
  });

  const responseData = await eventRes.json().catch(() => ({})) as { id?: unknown };

  if (!eventRes.ok) {
    console.error('[FUB ppc-lead] Event create error:', eventRes.status, responseData);
    return { success: false, error: `FUB ${eventRes.status}` };
  }

  console.log('[FUB ppc-lead] Event created:', responseData);
  return { success: true, data: responseData };
}

// ─── Telegram ─────────────────────────────────────────────────────────────────

async function sendTelegram(data: {
  name: string;
  email: string;
  phone: string;
  budget?: string;
  source?: string;
  buyerType?: string;
}) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[Telegram] No bot token configured');
    return;
  }

  const msg = [
    '🔥 *New Google PPC Lead!*',
    '',
    `👤 *Name:* ${data.name}`,
    `📧 *Email:* ${data.email}`,
    `📱 *Phone:* ${data.phone}`,
    data.buyerType ? `🏷 *Type:* ${data.buyerType}` : '',
    data.budget ? `💰 *Budget:* ${data.budget}` : '',
    '',
    `📍 Source: ${data.source || 'Google PPC'}`,
    '📋 Stage: AG: New Lead → FollowUpBoss',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: msg,
        parse_mode: 'Markdown',
      }),
    });
    console.log('[Telegram] Notification sent');
  } catch (err) {
    console.error('[Telegram] Error:', err);
  }
}

// ─── Spam guard ───────────────────────────────────────────────────────────────

const ipLog = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipLog.get(ip);
  if (!entry || now > entry.resetAt) {
    ipLog.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return false;
  }
  entry.count++;
  return entry.count > 5;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!FUB_KEY) {
    console.error('[FUB] FOLLOWUPBOSS_API_KEY not set');
    return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // Honeypot
  if (body.website || body.url || body._hp || body.fax) {
    return NextResponse.json({ success: true });
  }

  // Rate limit
  if (isRateLimited(ip)) {
    console.log('[SPAM] Rate limited:', ip);
    return NextResponse.json({ success: true });
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const budget = String(body.budget || '').trim();
  const formId = String(body.formId || '').trim();
  const formType = String(body.formType || '').trim() || undefined;
  const source = String(body.source || '').trim() || undefined;
  const buyerType = String(body.buyerType || '').trim() || undefined;

  if (!name || !email || !phone) {
    return NextResponse.json(
      { success: false, error: 'name, email, phone required' },
      { status: 400 }
    );
  }

  const leadData = { name, email, phone, budget, formId, formType, source, buyerType };

  // Run FUB + Telegram in parallel (non-blocking on Telegram)
  const [fubResult] = await Promise.all([
    sendToFUB(leadData),
    sendTelegram(leadData).catch(console.error),
  ]);

  // Also forward to existing leads pipeline (n8n / Vapi call trigger)
  // DISABLED: see VAPI_OUTBOUND_ENABLED flag at top of file.
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (VAPI_OUTBOUND_ENABLED && webhookUrl && phone) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, source: 'google-ppc' }),
    }).catch(console.error);
  }

  return NextResponse.json({ success: true, fubSuccess: fubResult.success });
}

export async function GET() {
  return NextResponse.json({ message: 'PPC lead capture endpoint active' });
}
