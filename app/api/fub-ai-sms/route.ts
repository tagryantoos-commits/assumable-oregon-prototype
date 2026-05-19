export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/fub-ai-sms
 *
 * FUB OAuth webhook receiver for AI-powered text conversations.
 * Handles two flows:
 *
 * 1. NEW LEAD (peopleCreated) — sends context-aware initial text
 * 2. INBOUND TEXT (textMessagesCreated) — AI responds in Ryan's voice
 *
 * All texts sent through FUB's native messaging (OAuth POST /textMessages),
 * so conversations appear in the FUB contact timeline.
 *
 * Only processes leads assigned to Ryan Thomson.
 * Response delay: 30-60 seconds to feel human.
 */

// ─── Config ────────────────────────────────────────────────────────────────

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const FUB_API_KEY = (process.env.FOLLOWUPBOSS_API_KEY || '').trim();
const X_SYSTEM = 'assumable-guy-app';
const X_SYSTEM_KEY = '13712b503446bd0df8034fe8e53b8789';
const FUB_BASE = 'https://api.followupboss.com/v1';
const CALENDLY_URL = 'https://calendly.com/your-real-estate-agent-ryan/15min';

// OAuth credentials for token refresh
const OAUTH_CLIENT_ID = '8305911f2df104a88be8727bf9fc7765358456a0d8741c6ccb6a9535a919fc53';
const OAUTH_CLIENT_SECRET = '3140050082cbc372b07aede48f113dc32f970725d0e86a9896a5cb1c96b457444197966b6f5ef8dafe28c36d40bbbd271a1c630c48f9f93f4d28c730e72ee2cce28bbe91dfd16301f85961512ac87b27302e0e7e89cd7966073f01fb41813778f0df3c71';
const FUB_TOKEN_URL = 'https://app.followupboss.com/oauth/token';

// Token state — refreshed automatically when expired.
// FUB_REFRESH_TOKEN MUST be set in the deploy env (Vercel). No fallback —
// a hardcoded fallback would leak the credential into git history.
const FUB_REFRESH_TOKEN_ENV = process.env.FUB_REFRESH_TOKEN;
if (!FUB_REFRESH_TOKEN_ENV) {
  throw new Error(
    'FUB_REFRESH_TOKEN environment variable is required. ' +
    'Set it in Vercel project settings; source of truth is 1Password ' +
    '(op://OpenClaw Agents/FUB OAuth - Assumable Guy App/Refresh Token).'
  );
}
let cachedAccessToken = process.env.FUB_OAUTH_TOKEN || '';
let cachedRefreshToken: string = FUB_REFRESH_TOKEN_ENV;
let tokenExpiresAt = 0; // epoch ms

// FUB phone number for sending (get from FUB account)
const FUB_FROM_NUMBER = process.env.FUB_FROM_NUMBER || '+17196525367';

// Only respond to leads assigned to this user
const RYAN_USER_ID = 1; // Ryan Thomson's FUB user ID

// Response delay range (ms) — feel human, not instant
// TODO: increase to 30-60s after testing
const MIN_DELAY_MS = 8_000;  // 8 seconds (testing)
const MAX_DELAY_MS = 15_000; // 15 seconds (testing)

// ─── Banned words (from Ryan's voice guide) ────────────────────────────────

const BANNED_WORDS = [
  'navigate', 'leverage', 'landscape', 'delve', 'realm', 'furthermore',
  'moreover', 'comprehensive', 'utilize', 'tailored', 'seamless', 'empower',
  'unlock', 'robust', 'streamline', 'touchpoint', 'synergy', 'deep dive',
  'game-changer', 'paradigm', 'holistic', 'in essence', 'excited to',
  'thrilled', 'Great question', "I'd be happy to help", 'Hope this helps',
  'Let me know if you have questions', "In today's market", 'moving forward',
  'Don\'t hesitate to reach out', 'facilitate', 'transformative',
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function fubAuth(): string {
  return 'Basic ' + Buffer.from(`${FUB_API_KEY}:`).toString('base64');
}

async function getValidOAuthToken(): Promise<string> {
  // If token is still valid (with 5 min buffer), use it
  if (cachedAccessToken && tokenExpiresAt > Date.now() + 300_000) {
    return cachedAccessToken;
  }

  // Refresh the token
  console.log('[FUB-OAuth] Refreshing access token...');
  const basicAuth = Buffer.from(`${OAUTH_CLIENT_ID}:${OAUTH_CLIENT_SECRET}`).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: cachedRefreshToken,
    client_id: OAUTH_CLIENT_ID,
    client_secret: OAUTH_CLIENT_SECRET,
  });

  const resp = await fetch(FUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error(`[FUB-OAuth] Refresh failed: ${resp.status} ${err}`);
    // Fall back to env var token as last resort
    return process.env.FUB_OAUTH_TOKEN || cachedAccessToken;
  }

  const data = await resp.json();
  cachedAccessToken = data.access_token;
  if (data.refresh_token) {
    cachedRefreshToken = data.refresh_token;
  }
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

  console.log(`[FUB-OAuth] Token refreshed, expires in ${data.expires_in}s`);

  // Persist to /tmp so other invocations can use it
  try {
    const fs = await import('fs/promises');
    await fs.mkdir('/tmp/fub-oauth', { recursive: true });
    await fs.writeFile('/tmp/fub-oauth/token.json', JSON.stringify({
      access_token: cachedAccessToken,
      refresh_token: cachedRefreshToken,
      expires_at: tokenExpiresAt,
    }));
  } catch {
    // Non-fatal
  }

  return cachedAccessToken;
}

// Try to load cached token from /tmp on cold start
async function initToken(): Promise<void> {
  if (tokenExpiresAt > 0) return; // Already initialized
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile('/tmp/fub-oauth/token.json', 'utf-8');
    const data = JSON.parse(raw);
    if (data.expires_at > Date.now()) {
      cachedAccessToken = data.access_token;
      cachedRefreshToken = data.refresh_token || cachedRefreshToken;
      tokenExpiresAt = data.expires_at;
      console.log('[FUB-OAuth] Loaded cached token from /tmp');
    }
  } catch {
    // No cached token, will refresh on first use
  }
}

async function oauthHeaders(): Promise<Record<string, string>> {
  await initToken();
  const token = await getValidOAuthToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-System': X_SYSTEM,
    'X-System-Key': X_SYSTEM_KEY,
  };
}

function mtNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Denver' }));
}

function isBusinessHours(): boolean {
  const h = mtNow().getHours();
  return h >= 8 && h < 20;
}

function randomDelay(): number {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

function sanitize(text: string): string {
  let out = text;
  // Remove em dashes
  out = out.replace(/—/g, '. ');
  out = out.replace(/–/g, ', ');
  // Remove banned words (case insensitive)
  for (const word of BANNED_WORDS) {
    const re = new RegExp(word, 'gi');
    out = out.replace(re, '');
  }
  // Clean up double spaces/periods
  out = out.replace(/\s{2,}/g, ' ').replace(/\.{2,}/g, '.').replace(/\.\s*\./g, '.').trim();
  return out;
}

function isOptOut(text: string): boolean {
  return /\b(stop|unsubscribe|remove|cancel|quit|optout|opt out)\b/i.test(text);
}

// ─── FUB Data Access ───────────────────────────────────────────────────────

async function fubGetPerson(personId: number): Promise<Record<string, unknown> | null> {
  const r = await fetch(`${FUB_BASE}/people/${personId}`, {
    headers: { Authorization: fubAuth() },
  });
  if (r.ok) return r.json();
  return null;
}

async function fubGetNotes(personId: number, limit = 10): Promise<string[]> {
  const r = await fetch(`${FUB_BASE}/notes?personId=${personId}&limit=${limit}`, {
    headers: { Authorization: fubAuth() },
  });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.notes || [])
    .map((n: Record<string, string>) => (n.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((b: string) => b && !b.includes('Call Script') && !b.includes('{{'));
}

async function fubGetEvents(personId: number, limit = 5): Promise<string[]> {
  const r = await fetch(`${FUB_BASE}/events?personId=${personId}&limit=${limit}`, {
    headers: { Authorization: fubAuth() },
  });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.events || []).map((e: Record<string, unknown>) => {
    const msg = e.message || '';
    const desc = e.description || '';
    const src = e.source || '';
    const type = e.type || '';
    return `[${type}] ${msg} ${desc} (source: ${src})`.trim();
  }).filter(Boolean);
}

async function fubAddNote(personId: number, body: string): Promise<void> {
  await fetch(`${FUB_BASE}/notes`, {
    method: 'POST',
    headers: { Authorization: fubAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId, body, subject: 'AI SMS (Ryan Voice)' }),
  });
}

// ─── Send Text via FUB OAuth ───────────────────────────────────────────────

async function sendTextViaFUB(toNumber: string, message: string, personId: number): Promise<boolean> {
  const headers = await oauthHeaders();
  const resp = await fetch(`${FUB_BASE}/textMessages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      toNumber,
      fromNumber: FUB_FROM_NUMBER,
      message,
      personId,
    }),
  });

  if (resp.ok) {
    console.log(`[FUB-SMS] Sent to ${toNumber}: "${message.substring(0, 80)}..."`);
    return true;
  }

  const err = await resp.text();
  console.error(`[FUB-SMS] Send failed: ${resp.status} ${err.substring(0, 200)}`);
  return false;
}

// ─── Conversation History (Vercel /tmp) ────────────────────────────────────

type Msg = { role: 'user' | 'assistant'; content: string };

async function loadHistory(personId: number): Promise<Msg[]> {
  const fs = await import('fs/promises');
  const dir = '/tmp/fub-sms-conversations';
  await fs.mkdir(dir, { recursive: true });
  try {
    return JSON.parse(await fs.readFile(`${dir}/${personId}.json`, 'utf-8'));
  } catch {
    return [];
  }
}

async function saveHistory(personId: number, history: Msg[]): Promise<void> {
  const fs = await import('fs/promises');
  const dir = '/tmp/fub-sms-conversations';
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(`${dir}/${personId}.json`, JSON.stringify(history.slice(-30)));
}

// ─── AI Response (Claude in Ryan's Voice) ──────────────────────────────────

const RYAN_SYSTEM_PROMPT = `You are Ryan Thomson, The Assumable Guy, texting a lead from your phone. You're a Colorado Springs real estate agent who specializes in assumable mortgages. You've closed 150+ assumptions and saved buyers over $48M.

HOW YOU TEXT:
- Short, punchy messages. 1-3 sentences max. Like a real person texting.
- Use contractions: I'm, you're, that's, it's, don't, won't, can't
- Casual openers: "Hey [name]" or "What's up [name]"
- No sign-offs. No "Best," or "Thanks," or "– Ryan". Just end naturally.
- Jump straight to the point. No "Hope this message finds you well."
- Use "lol" or "haha" very sparingly and only when genuinely funny
- Never start with "Hi there!" or "Hello!" — too formal for text
- One exclamation point max per message. Usually zero.
- NO em dashes (—) ever. Use periods, commas, or colons instead.

YOUR PERSONALITY IN TEXT:
- Direct but warm. Like texting a friend who happens to know real estate.
- Lead with value: the rate, the savings, the math. Not features.
- Honest about downsides: "I'll be straight with you, it's not for everyone"
- Uses phrases like: "run the numbers", "here's the deal", "no pressure at all"
- If someone asks a question, answer it first, then explain
- Never dodge a question or redirect without answering

NEVER USE THESE WORDS:
navigate, leverage, landscape, delve, realm, furthermore, moreover, comprehensive, utilize, tailored, seamless, empower, unlock, robust, streamline, game-changer, paradigm, holistic, in essence, transformative, facilitate, synergy, deep dive, "In today's market", "Hope this helps", "Don't hesitate", "Great question", "I'd be happy to help"

WHAT IS AN ASSUMABLE MORTGAGE (if asked):
"So basically, instead of getting a new loan at 7%, the buyer takes over the seller's existing loan. Could be 2.5-3.5%. On a 400K home that's saving you like $1,000 a month. It's real, it's legal, and I do about 3-4 of these a month."

SALES APPROACH:
1. Build rapport first. Ask about them, their situation, what they're looking for.
2. Qualify naturally through conversation (not a checklist):
   - Primary home or investment?
   - What area/city in Colorado?
   - Rough budget or payment range?
   - Timeline (when do they need to move/close)?
   - VA or FHA eligible? (matters for assumptions)
3. Share value: specific numbers, savings, real examples
4. When qualified, book the call: "${CALENDLY_URL}"
5. Never be pushy. "No pressure, just figured you'd want to know the numbers."

IF THEY'RE NOT INTERESTED: "No worries at all. If things change, you know where to find me." End it clean.

OPT-OUT: If they say stop/unsubscribe/remove, reply ONLY: "Got it, you're off the list. Take care."

SIGNAL: If the lead is qualified and wants to book/call, include [HOT_LEAD] in your reply (removed before sending).`;

async function generateInitialText(
  person: Record<string, unknown>,
  notes: string[],
  events: string[],
): Promise<string> {
  const firstName = (person.firstName as string) || '';
  const source = (person.source as string) || '';
  const tags = ((person.tags as Array<Record<string, string>>) || []).map(t => t.value || t).join(', ');

  const contextParts: string[] = [];
  if (source) contextParts.push(`Lead source: ${source}`);
  if (tags) contextParts.push(`Tags: ${tags}`);
  for (const e of events.slice(0, 3)) contextParts.push(`Event: ${e}`);
  for (const n of notes.slice(0, 2)) contextParts.push(`Note: ${n.substring(0, 200)}`);

  const prompt = `A new lead just came in. Send them a first text message as Ryan. Make it feel natural and context-aware based on how they found you.

Lead name: ${firstName || 'there'}
${contextParts.join('\n')}

Write ONE text message (under 300 chars). Reference their source or interest if you can. Don't be generic. Make it feel like you personally noticed them and reached out.`;

  return callClaude([], prompt);
}

async function generateReply(
  history: Msg[],
  person: Record<string, unknown>,
  notes: string[],
  inboundMessage: string,
): Promise<string> {
  const firstName = (person.firstName as string) || '';
  const source = (person.source as string) || '';
  const tags = ((person.tags as Array<Record<string, string>>) || []).map(t => t.value || t).join(', ');
  const stage = ((person.stage as Record<string, string>) || {}).name || '';

  let contextBlock = '';
  if (firstName) contextBlock += `Lead name: ${firstName}\n`;
  if (source) contextBlock += `Lead source: ${source}\n`;
  if (stage) contextBlock += `Stage: ${stage}\n`;
  if (tags) contextBlock += `Tags: ${tags}\n`;
  if (notes.length) contextBlock += `Agent notes:\n${notes.slice(0, 3).map(n => `- ${n.substring(0, 200)}`).join('\n')}\n`;

  const systemWithContext = RYAN_SYSTEM_PROMPT + (contextBlock ? `\n\nLEAD CONTEXT:\n${contextBlock}` : '');

  const messages: Msg[] = [
    ...history,
    { role: 'user', content: inboundMessage },
  ];

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 250,
      system: systemWithContext,
      messages,
    }),
  });

  const data = await resp.json();
  return (data as Record<string, Array<Record<string, string>>>).content?.[0]?.text || "Hey, let me get back to you on that. Give me a few.";
}

async function callClaude(history: Msg[], userMessage: string): Promise<string> {
  const messages: Msg[] = [...history, { role: 'user', content: userMessage }];

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 250,
      system: RYAN_SYSTEM_PROMPT,
      messages,
    }),
  });

  const data = await resp.json();
  return (data as Record<string, Array<Record<string, string>>>).content?.[0]?.text || "Hey, let me get back to you. Give me a few.";
}

// ─── Webhook Handler ───────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventType = body.event || '';

    console.log(`[FUB-AI-SMS] Event: ${eventType}`, JSON.stringify(body).substring(0, 500));

    // ── New Lead: send initial text ──────────────────────────────────
    if (eventType === 'peopleCreated') {
      const personId = body.resourceId || body.id;
      if (!personId) return Response.json({ ok: true, skipped: 'no personId' });

      // Get person details
      const person = await fubGetPerson(personId);
      if (!person) return Response.json({ ok: true, skipped: 'person not found' });

      // ── Recruiting Lead Interception (runs before any SMS logic) ────
      const personTags = ((person.tags as Array<Record<string, string> | string>) || [])
        .map((t) => (typeof t === 'string' ? t : (t.value || '')));
      const isRecruitingLead = personTags.some((tag) =>
        tag.toLowerCase().includes('agent recruiting')
      );

      if (isRecruitingLead) {
        const personName = (person.name as string) || `ID ${personId}`;
        console.log(`[FUB-Recruiting] Fixed routing for: ${personName} (ID ${personId})`);
        await fetch(`${FUB_BASE}/people/${personId}`, {
          method: 'PUT',
          headers: { Authorization: fubAuth(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage: 'Recruiting Lead',
            stageId: 78,
            assignedUserId: 1,
            tags: ['Agent Recruiting', 'Facebook - Recruiting', 'Agent Recruiting Form May 2026'],
          }),
        });
        return Response.json({ ok: true, action: 'recruiting_lead_fixed', personId });
      }

      // Add "Verified Buyer Lead" tag — gates buyer action plans in FUB automation
      const rawTags = (person.tags as Array<string | { value: string }>) || [];
      const currentTags: string[] = rawTags.map((t) =>
        typeof t === 'string' ? t : (t.value || '')
      );

      if (!currentTags.includes('Verified Buyer Lead')) {
        await fetch(`${FUB_BASE}/people/${personId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: fubAuth(), // plain API key, no X-System on PUT
          },
          body: JSON.stringify({
            tags: [...currentTags, 'Verified Buyer Lead'],
          }),
        });
      }

      // Only process Ryan's leads
      const assignedTo = person.assignedTo as Record<string, unknown> | undefined;
      const assignedUserId = assignedTo?.id || person.assignedUserId;
      if (assignedUserId && assignedUserId !== RYAN_USER_ID) {
        console.log(`[FUB-AI-SMS] Skipping: assigned to user ${assignedUserId}, not Ryan`);
        return Response.json({ ok: true, skipped: 'not assigned to Ryan' });
      }

      // Get phone number
      const phones = (person.phones as Array<Record<string, string>>) || [];
      const phone = phones[0]?.value;
      if (!phone) return Response.json({ ok: true, skipped: 'no phone' });

      if (!isBusinessHours()) {
        console.log('[FUB-AI-SMS] Outside business hours, queuing for later');
        return Response.json({ ok: true, skipped: 'outside business hours' });
      }

      // Get context
      const notes = await fubGetNotes(personId);
      const events = await fubGetEvents(personId);

      // Generate initial text
      const rawReply = await generateInitialText(person, notes, events);
      const reply = sanitize(rawReply.replace('[HOT_LEAD]', ''));

      // Delay to feel human (30-60s)
      const delay = randomDelay();
      console.log(`[FUB-AI-SMS] Delaying ${Math.round(delay / 1000)}s before initial text to person ${personId}`);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Send via FUB
      const sent = await sendTextViaFUB(phone, reply, personId);

      // Log to FUB notes
      await fubAddNote(personId, `[AI Initial Text]\nTo: ${phone}\n${reply}${sent ? '' : '\n⚠️ SEND FAILED'}`);

      // Save to history
      await saveHistory(personId, [{ role: 'assistant', content: reply }]);

      return Response.json({ ok: true, action: 'initial_text', sent });
    }

    // ── Inbound Text: AI reply ───────────────────────────────────────
    if (eventType === 'textMessagesCreated') {
      const isIncoming = body.isIncoming ?? body.data?.isIncoming;
      if (!isIncoming) {
        return Response.json({ ok: true, skipped: 'outbound text' });
      }

      const personId = body.personId || body.data?.personId;
      const message = body.message || body.data?.message || body.data?.body || '';
      const fromNumber = body.fromNumber || body.data?.fromNumber || body.data?.phone || '';

      if (!personId || !message) {
        return Response.json({ ok: true, skipped: 'missing personId or message' });
      }

      // Get person details
      const person = await fubGetPerson(personId);
      if (!person) return Response.json({ ok: true, skipped: 'person not found' });

      // Only process Ryan's leads
      const assignedTo = person.assignedTo as Record<string, unknown> | undefined;
      const assignedUserId = assignedTo?.id || person.assignedUserId;
      if (assignedUserId && assignedUserId !== RYAN_USER_ID) {
        return Response.json({ ok: true, skipped: 'not assigned to Ryan' });
      }

      // Get phone
      const phones = (person.phones as Array<Record<string, string>>) || [];
      const phone = fromNumber || phones[0]?.value;
      if (!phone) return Response.json({ ok: true, skipped: 'no phone' });

      // Opt-out check
      if (isOptOut(message)) {
        await sendTextViaFUB(phone, "Got it, you're off the list. Take care.", personId);
        await fubAddNote(personId, '⛔ Lead texted STOP. Removed from AI SMS.');
        return Response.json({ ok: true, action: 'opt_out' });
      }

      if (!isBusinessHours()) {
        console.log('[FUB-AI-SMS] Outside business hours, not replying');
        return Response.json({ ok: true, skipped: 'outside business hours' });
      }

      // Load conversation history
      const history = await loadHistory(personId);

      // Get context
      const notes = await fubGetNotes(personId);

      // Generate reply
      const rawReply = await generateReply(history, person, notes, message);
      const isHot = rawReply.includes('[HOT_LEAD]');
      const reply = sanitize(rawReply.replace('[HOT_LEAD]', ''));

      // Update history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: reply });
      await saveHistory(personId, history);

      // Delay to feel human
      const delay = randomDelay();
      console.log(`[FUB-AI-SMS] Delaying ${Math.round(delay / 1000)}s before reply to person ${personId}`);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Send via FUB
      const sent = await sendTextViaFUB(phone, reply, personId);

      // Log to FUB notes
      await fubAddNote(
        personId,
        `[AI SMS Conversation]\nLead: ${message}\nRyan (AI): ${reply}${isHot ? '\n🔥 HOT LEAD' : ''}${sent ? '' : '\n⚠️ SEND FAILED'}`,
      );

      // Hot lead handling
      if (isHot) {
        await fetch(`${FUB_BASE}/people/${personId}`, {
          method: 'PUT',
          headers: { Authorization: fubAuth(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: 'Hot', tags: ['AI-Hot-Lead'] }),
        }).catch(() => {});
      }

      return Response.json({ ok: true, action: 'reply', sent, isHot });
    }

    // ── Other events: log and pass ───────────────────────────────────
    return Response.json({ ok: true, event: eventType });
  } catch (err) {
    console.error('[FUB-AI-SMS] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
