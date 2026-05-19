export const runtime = 'nodejs';

/**
 * POST /api/sms-reply
 * Twilio inbound SMS webhook — fires when a lead replies to our SMS.
 *
 * Features:
 *  ✅ Business hours gate (8am–8pm MT)
 *  ✅ Rate limiting (1 AI reply per 10 min per lead)
 *  ✅ Opt-out handling (stop/unsubscribe/remove/cancel/quit)
 *  ✅ FUB lead lookup by phone (name + context for AI)
 *  ✅ FUB note logging (every exchange)
 *  ✅ Hot lead flag (tags FUB + notifies Ryan via note)
 *  ✅ Conversation history in /tmp (best-effort persistence)
 *  ✅ Claude Haiku for fast, cheap responses
 */

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;
const FUB_KEY      = (process.env.FOLLOWUPBOSS_API_KEY || '').trim();
const OUR_NUMBER   = '+17196525367';
const FUB_BASE     = 'https://api.followupboss.com/v1';
const CALENDLY_URL = 'https://calendly.com/your-real-estate-agent-ryan/15min';
const RATE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

// ─── Helpers ────────────────────────────────────────────────────────────────

function mtHour(): number {
  return parseInt(
    new Date().toLocaleString('en-US', {
      timeZone: 'America/Denver',
      hour: 'numeric',
      hour12: false,
    })
  );
}

function isBusinessHours(): boolean {
  const h = mtHour();
  return h >= 8 && h < 20;
}

function isOptOut(text: string): boolean {
  return /\b(stop|unsubscribe|remove|cancel|quit|optout|opt out)\b/i.test(text);
}

function isHotLead(reply: string): boolean {
  // Claude signals hot lead with a marker
  return reply.includes('[HOT_LEAD]');
}

function sanitizeReply(reply: string): string {
  return reply.replace('[HOT_LEAD]', '').trim();
}

function fubAuth(): string {
  return 'Basic ' + Buffer.from(`${FUB_KEY}:`).toString('base64');
}

// ─── FUB ────────────────────────────────────────────────────────────────────

async function fubGetPersonByPhone(phone: string): Promise<{ id: number; name: string; firstName: string } | null> {
  // Try both +1XXXXXXXXXX and 10-digit formats
  const digits = phone.replace(/\D/g, '');
  const queries = [phone, digits, digits.replace(/^1/, '')];
  for (const q of queries) {
    const r = await fetch(`${FUB_BASE}/people?q=${encodeURIComponent(q)}&limit=1`, {
      headers: { Authorization: fubAuth() },
    });
    const d = await r.json().catch(() => ({}));
    if (d.people?.length) return d.people[0];
  }
  return null;
}

async function fubAddNote(personId: number, body: string): Promise<void> {
  await fetch(`${FUB_BASE}/notes`, {
    method: 'POST',
    headers: { Authorization: fubAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId, body, subject: 'AI SMS Conversation' }),
  });
}

async function fubTagOptOut(personId: number): Promise<void> {
  // Add "SMS Opt-Out" tag via a note and update person tags
  await fetch(`${FUB_BASE}/people/${personId}`, {
    method: 'PUT',
    headers: { Authorization: fubAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: ['SMS Opt-Out'] }),
  });
  await fubAddNote(personId, '⛔ Lead texted STOP — removed from all SMS outreach.');
}

async function fubMarkHotLead(personId: number, conversationSummary: string): Promise<void> {
  await fubAddNote(
    personId,
    `🔥 HOT LEAD — AI qualified this lead via SMS and they want to book a call!\n\nConversation:\n${conversationSummary}\n\nAction: Follow up ASAP or confirm Calendly booking.`
  );
  // Update stage to Hot
  await fetch(`${FUB_BASE}/people/${personId}`, {
    method: 'PUT',
    headers: { Authorization: fubAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: 'Hot' }),
  }).catch(() => {});
}

async function fubCheckOptOutTag(personId: number): Promise<boolean> {
  const r = await fetch(`${FUB_BASE}/people/${personId}`, {
    headers: { Authorization: fubAuth() },
  });
  const d = await r.json().catch(() => ({}));
  const tags: string[] = d.tags || [];
  return tags.some((t: string) => /opt.?out|stop|unsubscribe/i.test(t));
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────

async function checkRateLimit(phone: string): Promise<boolean> {
  const fs = await import('fs/promises');
  const dir = '/tmp/sms-ratelimit';
  await fs.mkdir(dir, { recursive: true });
  const file = `${dir}/${phone.replace(/\D/g, '')}.json`;
  try {
    const data = JSON.parse(await fs.readFile(file, 'utf-8'));
    const elapsed = Date.now() - data.lastReply;
    if (elapsed < RATE_LIMIT_MS) return false; // still rate-limited
  } catch {
    // No file = not rate-limited
  }
  return true; // allowed
}

async function setRateLimit(phone: string): Promise<void> {
  const fs = await import('fs/promises');
  const dir = '/tmp/sms-ratelimit';
  await fs.mkdir(dir, { recursive: true });
  const file = `${dir}/${phone.replace(/\D/g, '')}.json`;
  await fs.writeFile(file, JSON.stringify({ lastReply: Date.now() }));
}

// ─── Conversation History ────────────────────────────────────────────────────

type Message = { role: 'user' | 'assistant'; content: string };

async function loadHistory(phone: string): Promise<Message[]> {
  const fs = await import('fs/promises');
  const dir = '/tmp/sms-conversations';
  await fs.mkdir(dir, { recursive: true });
  const file = `${dir}/${phone.replace(/\D/g, '')}.json`;
  try {
    return JSON.parse(await fs.readFile(file, 'utf-8'));
  } catch {
    return [];
  }
}

async function saveHistory(phone: string, history: Message[]): Promise<void> {
  const fs = await import('fs/promises');
  const dir = '/tmp/sms-conversations';
  await fs.mkdir(dir, { recursive: true });
  const file = `${dir}/${phone.replace(/\D/g, '')}.json`;
  // Keep last 20 messages to avoid bloat
  const trimmed = history.slice(-20);
  await fs.writeFile(file, JSON.stringify(trimmed));
}

// ─── AI ─────────────────────────────────────────────────────────────────────

async function generateReply(
  history: Message[],
  leadName: string | null
): Promise<string> {
  const nameContext = leadName ? `The lead's name is ${leadName}.` : '';

  const systemPrompt = `You are Alex, an SMS assistant for Ryan Thomson at The Assumable Guy — a Colorado real estate team specializing in assumable mortgages.

${nameContext}

YOUR JOB: Qualify leads and book a call with Ryan. Do this through natural, helpful conversation.

RULES:
- Keep replies SHORT — under 160 chars if possible, 320 max
- Ask ONE question at a time
- Never be pushy or salesy
- Sign messages as "– Alex @ The Assumable Guy"
- Be warm, direct, conversational (like a real person texting)

QUALIFICATION (work through these naturally, in order):
1. Primary home or investment property?
2. Which city/area in Colorado?
3. Rough price range/budget?
4. Timeline — buying in next 60–90 days?

BOOKING: Once they're qualified (has a goal, area, budget, near-term timeline), send the booking link:
"Awesome! You can grab a free 15-min call with Ryan here: ${CALENDLY_URL}"

WHAT IS AN ASSUMABLE MORTGAGE (if they ask):
"You take over the seller's existing low-rate loan — could be 2–3% vs today's 6.8%+. Saves $500–1,100/mo on a $400–500K home."

HOT LEAD SIGNAL: If the lead is fully qualified AND has expressed clear intent to book/buy, include exactly [HOT_LEAD] anywhere in your reply (this will be removed before sending — it's just a signal for our system).

OPT-OUT: If they say stop/unsubscribe/remove, reply ONLY with: "Got it — you're removed from our list. Take care!"

IMPORTANT: Do NOT repeat questions already answered in the conversation history.`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: systemPrompt,
      messages: history,
    }),
  });

  const data = await resp.json();
  return data.content?.[0]?.text || "Thanks! Ryan's team will follow up shortly.";
}

// ─── Twilio SMS ──────────────────────────────────────────────────────────────

async function sendSMS(to: string, body: string): Promise<void> {
  const params = new URLSearchParams({ From: OUR_NUMBER, To: to, Body: body });
  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    }
  );
  const result = await resp.json();
  console.log('[SMS] Sent to', to, '| SID:', result.sid, '| Status:', result.status);
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let from = '';
  let body = '';
  let messageSid = '';

  try {
    const formData = await request.formData();
    from        = (formData.get('From')       as string) || '';
    body        = (formData.get('Body')       as string) || '';
    messageSid  = (formData.get('MessageSid') as string) || '';
  } catch {
    return new Response('', { status: 200 });
  }

  if (!from || !body) return new Response('', { status: 200 });

  console.log(`[SMS] Inbound message [${messageSid}]`);

  // ── 1. Opt-out check (always process, no rate limit) ──────────────────────
  if (isOptOut(body)) {
    const lead = await fubGetPersonByPhone(from).catch(() => null);
    if (lead?.id) {
      await fubTagOptOut(lead.id).catch(() => {});
    }
    await sendSMS(from, "Got it — you're removed from our list. Take care!");
    console.log('[SMS] Opt-out processed');
    return twimlOk();
  }

  // ── 2. FUB lead lookup ────────────────────────────────────────────────────
  const lead = await fubGetPersonByPhone(from).catch(() => null);
  const leadName = lead?.firstName || null;
  const leadId   = lead?.id       || null;

  // Check if already opted out in FUB
  if (leadId) {
    const optedOut = await fubCheckOptOutTag(leadId).catch(() => false);
    if (optedOut) {
      console.log('[SMS] Lead is opted out in FUB, ignoring');
      return twimlOk();
    }
  }

  // ── 3. Business hours check ───────────────────────────────────────────────
  if (!isBusinessHours()) {
    console.log('[SMS] Outside business hours, not responding');
    // Still log the inbound to FUB so Ryan sees it
    if (leadId) {
      await fubAddNote(
        leadId,
        `📱 Inbound SMS (outside hours — no auto-reply sent):\nFrom: ${from}\nMessage: "${body}"`
      ).catch(() => {});
    }
    return twimlOk();
  }

  // ── 4. Rate limit check ───────────────────────────────────────────────────
  const allowed = await checkRateLimit(from).catch(() => true);
  if (!allowed) {
    console.log('[SMS] Rate limited — skipping reply');
    return twimlOk();
  }

  // ── 5. Load + update conversation history ─────────────────────────────────
  const history = await loadHistory(from).catch(() => [] as Message[]);
  history.push({ role: 'user', content: body });

  // ── 6. Generate AI reply ──────────────────────────────────────────────────
  const rawReply = await generateReply(history, leadName);
  const hotLead  = isHotLead(rawReply);
  const reply    = sanitizeReply(rawReply);

  history.push({ role: 'assistant', content: reply });
  await saveHistory(from, history).catch(() => {});
  await setRateLimit(from).catch(() => {});

  // ── 7. FUB logging ────────────────────────────────────────────────────────
  if (leadId) {
    const noteBody =
      `📱 SMS Conversation\n` +
      `Lead: ${from}${leadName ? ` (${leadName})` : ''}\n\n` +
      `Lead said: "${body}"\n` +
      `Alex replied: "${reply}"`;

    await fubAddNote(leadId, noteBody).catch(() => {});

    if (hotLead) {
      const convSummary = history
        .map((m) => `${m.role === 'user' ? leadName || 'Lead' : 'Alex'}: ${m.content}`)
        .join('\n');
      await fubMarkHotLead(leadId, convSummary).catch(() => {});
    }
  }

  // ── 8. Send SMS ───────────────────────────────────────────────────────────
  await sendSMS(from, reply);
  console.log(`[SMS] Replied${hotLead ? ' 🔥 HOT LEAD' : ''} [${messageSid}]`);

  return twimlOk();
}

function twimlOk() {
  return new Response('<?xml version="1.0"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function GET() {
  return new Response('SMS Reply endpoint active', { status: 200 });
}
