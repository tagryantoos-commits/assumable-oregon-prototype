export const runtime = 'nodejs';

/**
 * POST /api/seller-sms-reply
 * Handles inbound SMS from expired-listing sellers.
 *
 * Features:
 *  Looks up seller in FUB by phone (expired-listing tag)
 *  Parses loan context from FUB notes (rate, balance, type, savings)
 *  Generates response in Ryan's voice via Claude
 *  Sends SMS reply via Twilio
 *  Updates FUB stage to AG: Seller - 2-Way Contact (ID 70)
 *  Adds FUB note with the exchange
 *  Sends Telegram alert to Ryan if seller shows interest
 */

const TWILIO_SID    = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_TOKEN  = process.env.TWILIO_AUTH_TOKEN  || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;
const FUB_KEY       = (process.env.FOLLOWUPBOSS_API_KEY || '').trim();
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID  || '';
const OUR_NUMBER     = '+17196525367';
const FUB_BASE       = 'https://api.followupboss.com/v1';
const CALENDLY_URL   = 'https://calendly.com/your-real-estate-agent-ryan/15min';
const FUB_STAGE_2WAY = 70; // AG: Seller - 2-Way Contact

type Message = { role: 'user' | 'assistant'; content: string };

// ---------------------------------------------------------------------------
// Content Sanitizer
// ---------------------------------------------------------------------------

function sanitizeContent(text: string): string {
  const aiTells = [
    /\bdelve\b/gi, /\brobust\b/gi, /\bseamless(ly)?\b/gi,
    /\bgame.changer\b/gi, /\bgame.changing\b/gi, /\bparadigm\b/gi,
    /\bleverage\b/gi, /\bsynergy\b/gi, /\bsynergies\b/gi,
    /\bcomprehensive\b/gi, /\btransformative\b/gi, /\binnovative\b/gi,
    /\bcutting.edge\b/gi, /\bstate.of.the.art\b/gi,
  ];

  // Remove em dashes (replace with plain dash or remove entirely)
  let clean = text.replace(/\u2014/g, ' - ').replace(/--/g, ' - ');

  // Replace AI tells
  for (const pattern of aiTells) {
    clean = clean.replace(pattern, '');
  }

  // Clean up double spaces
  clean = clean.replace(/  +/g, ' ').trim();
  return clean;
}

// ---------------------------------------------------------------------------
// Interest Detection
// ---------------------------------------------------------------------------

const INTEREST_PATTERNS = [
  /how does (this|it) work/i,
  /tell me more/i,
  /interested/i,
  /commission/i,
  /how much/i,
  /timeline/i,
  /process/i,
  /yes,? please/i,
  /sounds good/i,
  /sounds interesting/i,
  /what's? (this|it) about/i,
  /what is (this|it) about/i,
  /more info/i,
  /let'?s? (talk|chat|meet|connect)/i,
  /book.*(call|time|meeting)/i,
  /set up.*(call|time|meeting)/i,
  /when (are you|can we)/i,
  /available/i,
  /calendly/i,
  /schedule/i,
  /can you explain/i,
  /tell me about/i,
  /what (do|would|can) you/i,
];

function detectsInterest(text: string): boolean {
  return INTEREST_PATTERNS.some((p) => p.test(text));
}

function isOptOut(text: string): boolean {
  return /\b(stop|unsubscribe|remove|cancel|quit|optout|opt out)\b/i.test(text);
}

// ---------------------------------------------------------------------------
// Conversation History (best-effort, /tmp)
// ---------------------------------------------------------------------------

async function loadHistory(phone: string): Promise<Message[]> {
  const fs = await import('fs/promises');
  const dir = '/tmp/seller-conversations';
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
  const dir = '/tmp/seller-conversations';
  await fs.mkdir(dir, { recursive: true });
  const file = `${dir}/${phone.replace(/\D/g, '')}.json`;
  await fs.writeFile(file, JSON.stringify(history.slice(-30)));
}

// ---------------------------------------------------------------------------
// FUB Helpers
// ---------------------------------------------------------------------------

function fubAuth(): string {
  return 'Basic ' + Buffer.from(`${FUB_KEY}:`).toString('base64');
}

interface FubPerson {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  tags: string[];
  phones: Array<{ value: string; type: string }>;
  emails: Array<{ value: string; type: string }>;
  stage?: string;
}

async function fubGetPersonByPhone(phone: string): Promise<FubPerson | null> {
  const digits = phone.replace(/\D/g, '');
  const queries = [phone, digits, digits.replace(/^1/, '')];
  for (const q of queries) {
    try {
      const r = await fetch(`${FUB_BASE}/people?q=${encodeURIComponent(q)}&limit=5`, {
        headers: { Authorization: fubAuth() },
      });
      const d = await r.json();
      if (d.people?.length) {
        // Return the first person that has expired-listing tag, or just the first
        const seller = d.people.find((p: FubPerson) =>
          (p.tags || []).includes('expired-listing')
        );
        return seller || d.people[0];
      }
    } catch {
      // continue
    }
  }
  return null;
}

async function fubGetPersonNotes(personId: number): Promise<string[]> {
  try {
    const r = await fetch(`${FUB_BASE}/notes?personId=${personId}&limit=10`, {
      headers: { Authorization: fubAuth() },
    });
    const d = await r.json();
    return (d.notes || []).map((n: { body: string }) => n.body || '');
  } catch {
    return [];
  }
}

async function fubUpdateStage(personId: number, stageId: number): Promise<void> {
  try {
    await fetch(`${FUB_BASE}/people/${personId}`, {
      method: 'PUT',
      headers: { Authorization: fubAuth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId }),
    });
  } catch {
    // non-fatal
  }
}

async function fubAddNote(personId: number, body: string): Promise<void> {
  try {
    await fetch(`${FUB_BASE}/notes`, {
      method: 'POST',
      headers: { Authorization: fubAuth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId, body, subject: 'Seller SMS Conversation' }),
    });
  } catch {
    // non-fatal
  }
}

async function fubTagOptOut(personId: number): Promise<void> {
  try {
    const r = await fetch(`${FUB_BASE}/people/${personId}`, {
      headers: { Authorization: fubAuth() },
    });
    const d = await r.json();
    const existing: string[] = d.tags || [];
    if (!existing.includes('SMS Opt-Out')) {
      await fetch(`${FUB_BASE}/people/${personId}`, {
        method: 'PUT',
        headers: { Authorization: fubAuth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: [...existing, 'SMS Opt-Out'] }),
      });
    }
    await fubAddNote(personId, 'Seller texted STOP - removed from SMS outreach.');
  } catch {
    // non-fatal
  }
}

// ---------------------------------------------------------------------------
// Loan Context Extraction from FUB Notes
// ---------------------------------------------------------------------------

interface LoanContext {
  address: string;
  ownerName: string;
  loanType: string;
  loanRate: number;
  loanBalance: number;
  monthlySavings: number;
  lender: string;
}

function extractLoanContext(person: FubPerson, notes: string[]): LoanContext {
  const fullNotes = notes.join('\n');

  // Parse loan details from the structured note format added by expired_va_agent.py
  const rateMatch    = fullNotes.match(/Interest Rate:\s*([\d.]+)%/i);
  const balanceMatch = fullNotes.match(/Estimated Balance:\s*\$([\d,]+)/i);
  const typeMatch    = fullNotes.match(/Loan Type:\s*(VA|FHA|USDA|Conv\w*)/i);
  const savingsMatch = fullNotes.match(/Estimated Monthly Savings[^:]*:\s*\$([\d,]+)/i);
  const lenderMatch  = fullNotes.match(/Lender:\s*([^\n]+)/i);
  const addressMatch = fullNotes.match(/Property:\s*([^\n]+)/i);

  const ownerName = person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'there';

  return {
    address:        (addressMatch?.[1]  || '').trim(),
    ownerName,
    loanType:       (typeMatch?.[1]     || 'FHA/VA').trim(),
    loanRate:       rateMatch    ? parseFloat(rateMatch[1])                     : 0,
    loanBalance:    balanceMatch ? parseInt(balanceMatch[1].replace(/,/g, ''))  : 0,
    monthlySavings: savingsMatch ? parseInt(savingsMatch[1].replace(/,/g, ''))  : 0,
    lender:         (lenderMatch?.[1]   || '').trim(),
  };
}

// ---------------------------------------------------------------------------
// Telegram Alert
// ---------------------------------------------------------------------------

async function sendTelegramAlert(ctx: LoanContext, phone: string, message: string): Promise<void> {
  const savings = ctx.monthlySavings ? `$${ctx.monthlySavings.toLocaleString()}` : 'unknown';
  const text =
    `SELLER RESPONDED\n` +
    `Name: ${ctx.ownerName}\n` +
    `Address: ${ctx.address || 'see FUB'}\n` +
    `Loan: ${ctx.loanType} @ ${ctx.loanRate}% (~${savings}/mo savings for buyer)\n` +
    `They said: "${message}"\n` +
    `Reply in FUB or text ${phone}`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch {
    console.error('[Telegram] Alert failed');
  }
}

// ---------------------------------------------------------------------------
// Claude - Generate Seller Response
// ---------------------------------------------------------------------------

async function generateSellerReply(
  history: Message[],
  ctx: LoanContext,
  isFirstReply: boolean
): Promise<string> {
  const rate      = ctx.loanRate    ? `${ctx.loanRate}%`                      : 'a low rate';
  const balance   = ctx.loanBalance ? `$${ctx.loanBalance.toLocaleString()}`  : 'the remaining balance';
  const savings   = ctx.monthlySavings ? `$${ctx.monthlySavings.toLocaleString()}` : '$900+';
  const firstName = ctx.ownerName.split(' ')[0] || 'there';

  const systemPrompt = sanitizeContent(`You are Ryan Thomson, a real estate agent in Colorado Springs specializing in assumable mortgages. You are responding to a homeowner whose listing expired.

Their property at ${ctx.address || 'their property'} has a ${ctx.loanType} loan at ${rate} with an estimated balance of ${balance}. A buyer assuming this loan vs getting a new mortgage at today's 6.8% rate saves approximately ${savings}/month.

Their name is ${firstName}.

Your goal is to get them on a 15-minute call. Be direct, plain, educational. Answer questions honestly. Never oversell. If they ask about commissions, say "same as any listing - we can go over all of it in 15 minutes."

When they are ready to talk, offer the Calendly link: ${CALENDLY_URL}

Rules:
- Keep responses under 3 sentences for SMS
- Never mention competitors
- No em dashes
- No AI tells (no "delve", "robust", "seamless", "game-changer")
${isFirstReply ? '- Include "Text STOP to opt out" at the end of your reply' : '- Do NOT include opt-out language (already sent in first message)'}
- If they express interest or ask questions, signal this by including [INTERESTED] anywhere in your response (will be removed before sending)`);

  try {
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
        system: systemPrompt,
        messages: history,
      }),
    });
    const data = await resp.json();
    return data.content?.[0]?.text || `Hey ${firstName}, thanks for the reply. I can explain everything in 10 minutes - want to grab a quick call? ${CALENDLY_URL}`;
  } catch (err) {
    console.error('[Claude] Error:', err);
    return `Hey ${firstName}, thanks for reaching out. Happy to explain everything in 10 minutes. ${CALENDLY_URL}`;
  }
}

// ---------------------------------------------------------------------------
// Twilio SMS
// ---------------------------------------------------------------------------

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
  console.log('[SellerSMS] Sent to', to, '| SID:', result.sid);
}

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  let from = '';
  let body = '';

  try {
    const formData = await request.formData();
    from = (formData.get('From') as string) || '';
    body = (formData.get('Body') as string) || '';
  } catch {
    return twimlOk();
  }

  if (!from || !body) return twimlOk();

  console.log(`[SellerSMS] Inbound message received`);

  // 1. Opt-out handling
  if (isOptOut(body)) {
    const person = await fubGetPersonByPhone(from).catch(() => null);
    if (person?.id) await fubTagOptOut(person.id).catch(() => {});
    await sendSMS(from, "Got it - you're removed from our list. Take care!");
    return twimlOk();
  }

  // 2. Look up seller in FUB
  const person = await fubGetPersonByPhone(from).catch(() => null);
  if (!person) {
    console.log(`[SellerSMS] No FUB record found, skipping`);
    return twimlOk();
  }

  // 3. Get notes for loan context
  const notes = await fubGetPersonNotes(person.id).catch(() => [] as string[]);
  const ctx   = extractLoanContext(person, notes);

  // 4. Load conversation history
  const history = await loadHistory(from).catch(() => [] as Message[]);
  const isFirstReply = history.length === 0;
  history.push({ role: 'user', content: body });

  // 5. Generate Claude response
  const rawReply    = await generateSellerReply(history, ctx, isFirstReply);
  const showsInterest = rawReply.includes('[INTERESTED]') || detectsInterest(body);
  const cleanReply  = sanitizeContent(rawReply.replace('[INTERESTED]', '').trim());

  history.push({ role: 'assistant', content: cleanReply });
  await saveHistory(from, history).catch(() => {});

  // 6. Send SMS
  await sendSMS(from, cleanReply);

  // 7. Update FUB stage to 2-Way Contact
  await fubUpdateStage(person.id, FUB_STAGE_2WAY).catch(() => {});

  // 8. Add FUB note
  const noteBody =
    `Seller SMS Exchange\n` +
    `Phone: ${from}\n\n` +
    `Seller said: "${body}"\n` +
    `Ryan replied: "${cleanReply}"`;
  await fubAddNote(person.id, noteBody).catch(() => {});

  // 9. Telegram alert if interested
  if (showsInterest) {
    await sendTelegramAlert(ctx, from, body).catch(() => {});
  }

  console.log(`[SellerSMS] Replied to person ${person.id}${showsInterest ? ' [INTEREST DETECTED]' : ''}`);
  return twimlOk();
}

function twimlOk() {
  return new Response('<?xml version="1.0"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function GET() {
  return new Response('Seller SMS Reply endpoint active', { status: 200 });
}
