export const runtime = 'nodejs';

/**
 * POST /api/sarah-call-complete
 * Vapi post-call webhook for Sarah (seller assistant ID 80fd34bd).
 *
 * Fires when a call with a seller ends.
 * Analyzes transcript with Claude, updates FUB, sends Telegram alert.
 */

const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY!;
const FUB_KEY        = (process.env.FOLLOWUPBOSS_API_KEY || '').trim();
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8654834801:AAGUWA7qXfea2ygUC9a1P0_B7IAzxpX3CEg';
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID   || '8079079144';
const FUB_BASE       = 'https://api.followupboss.com/v1';
const FUB_STAGE_2WAY = 70; // AG: Seller - 2-Way Contact

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
    const r = await fetch(`${FUB_BASE}/notes?personId=${personId}&limit=5`, {
      headers: { Authorization: fubAuth() },
    });
    const d = await r.json();
    return (d.notes || []).map((n: { body: string }) => n.body || '');
  } catch {
    return [];
  }
}

async function fubUpdateStage(personId: number, stageId: number): Promise<void> {
  await fetch(`${FUB_BASE}/people/${personId}`, {
    method: 'PUT',
    headers: { Authorization: fubAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ stageId }),
  }).catch(() => {});
}

async function fubAddNote(personId: number, body: string, subject?: string): Promise<void> {
  await fetch(`${FUB_BASE}/notes`, {
    method: 'POST',
    headers: { Authorization: fubAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personId,
      body,
      subject: subject || 'Sarah Call - Post-Call Analysis',
    }),
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Loan Context from FUB Notes
// ---------------------------------------------------------------------------

interface LoanContext {
  address: string;
  ownerName: string;
  loanType: string;
  loanRate: number;
  loanBalance: number;
  monthlySavings: number;
}

function extractLoanContext(person: FubPerson, notes: string[]): LoanContext {
  const fullNotes = notes.join('\n');
  const rateMatch    = fullNotes.match(/Interest Rate:\s*([\d.]+)%/i);
  const balanceMatch = fullNotes.match(/Estimated Balance:\s*\$([\d,]+)/i);
  const typeMatch    = fullNotes.match(/Loan Type:\s*(VA|FHA|USDA|Conv\w*)/i);
  const savingsMatch = fullNotes.match(/Estimated Monthly Savings[^:]*:\s*\$([\d,]+)/i);
  const addressMatch = fullNotes.match(/Property:\s*([^\n]+)/i);

  const ownerName = person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Seller';

  return {
    address:        (addressMatch?.[1]  || '').trim(),
    ownerName,
    loanType:       (typeMatch?.[1]     || 'FHA/VA').trim(),
    loanRate:       rateMatch    ? parseFloat(rateMatch[1])                     : 0,
    loanBalance:    balanceMatch ? parseInt(balanceMatch[1].replace(/,/g, ''))  : 0,
    monthlySavings: savingsMatch ? parseInt(savingsMatch[1].replace(/,/g, ''))  : 0,
  };
}

// ---------------------------------------------------------------------------
// Claude - Analyze Transcript
// ---------------------------------------------------------------------------

interface CallAnalysis {
  outcome: 'interested' | 'maybe' | 'not_interested';
  summary: string;
  keyObjections: string[];
}

async function analyzeTranscript(transcript: string, ctx: LoanContext): Promise<CallAnalysis> {
  const systemPrompt = `You are analyzing a call transcript between Sarah (an AI assistant for The Assumable Guy real estate team) and a seller whose expired listing may have an assumable mortgage.

Analyze the conversation and return ONLY a JSON object with this exact structure:
{
  "outcome": "interested" | "maybe" | "not_interested",
  "summary": "2-3 sentence plain-text summary of what happened",
  "keyObjections": ["objection 1", "objection 2"]
}

Rules for outcome:
- "interested": seller asked questions, agreed to a follow-up, requested more info, or gave positive signals
- "maybe": seller was neutral, said call back later, or gave non-committal response
- "not_interested": seller explicitly said no, hung up, or asked not to be contacted

Context: Property at ${ctx.address || 'their property'}, ${ctx.loanType} loan at ${ctx.loanRate}%.`;

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
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Transcript:\n${transcript}` }],
      }),
    });
    const data  = await resp.json();
    const text  = data.content?.[0]?.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as CallAnalysis;
    }
  } catch (err) {
    console.error('[Claude] Transcript analysis error:', err);
  }

  return {
    outcome: 'maybe',
    summary: 'Call completed. Unable to parse transcript analysis.',
    keyObjections: [],
  };
}

// ---------------------------------------------------------------------------
// Telegram Alert
// ---------------------------------------------------------------------------

async function sendTelegramCallAlert(
  ctx: LoanContext,
  phone: string,
  analysis: CallAnalysis,
  recordingUrl?: string
): Promise<void> {
  const outcomeEmoji = {
    interested:    'INTERESTED',
    maybe:         'MAYBE',
    not_interested: 'NOT INTERESTED',
  }[analysis.outcome];

  const savings = ctx.monthlySavings ? `$${ctx.monthlySavings.toLocaleString()}` : 'N/A';

  let text =
    `SARAH CALL COMPLETE\n` +
    `Name: ${ctx.ownerName}\n` +
    `Address: ${ctx.address || 'see FUB'}\n` +
    `Phone: ${phone}\n` +
    `Loan: ${ctx.loanType} @ ${ctx.loanRate}%\n` +
    `Outcome: ${outcomeEmoji}\n` +
    `Summary: ${analysis.summary}`;

  if (analysis.keyObjections?.length) {
    text += `\nObjections: ${analysis.keyObjections.join('; ')}`;
  }
  if (recordingUrl) {
    text += `\nRecording: ${recordingUrl}`;
  }

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
    console.error('[Telegram] Call alert failed');
  }
}

// ---------------------------------------------------------------------------
// Extract Phone from Vapi Payload
// ---------------------------------------------------------------------------

function extractPhone(payload: Record<string, unknown>): string {
  // Vapi sends call data in various paths depending on event type
  const call = (payload.call || payload) as Record<string, unknown>;
  const customer = call.customer as Record<string, unknown> | undefined;
  if (customer?.number) return String(customer.number);
  if (call.to) return String(call.to);
  if (call.customerNumber) return String(call.customerNumber);

  // Try message.call path
  const msg = payload.message as Record<string, unknown> | undefined;
  if (msg) {
    const msgCall = msg.call as Record<string, unknown> | undefined;
    if (msgCall?.customer) {
      const mc = msgCall.customer as Record<string, unknown>;
      if (mc.number) return String(mc.number);
    }
  }

  return '';
}

function extractTranscript(payload: Record<string, unknown>): string {
  const call = (payload.call || payload) as Record<string, unknown>;

  // Vapi puts transcript in call.artifact.transcript or as a separate field
  const artifact = call.artifact as Record<string, unknown> | undefined;
  if (artifact?.transcript) return String(artifact.transcript);

  if (call.transcript) return String(call.transcript);

  // Message-based transcript
  const msg = payload.message as Record<string, unknown> | undefined;
  if (msg?.artifact) {
    const ma = msg.artifact as Record<string, unknown>;
    if (ma.transcript) return String(ma.transcript);
  }

  // Reconstruct from messages array
  const messages = (call.messages || (msg as Record<string, unknown>)?.messages) as Array<{
    role: string;
    message?: string;
    content?: string;
  }> | undefined;

  if (messages?.length) {
    return messages
      .map((m) => `${m.role}: ${m.message || m.content || ''}`)
      .join('\n');
  }

  return '';
}

function extractRecordingUrl(payload: Record<string, unknown>): string {
  const call = (payload.call || payload) as Record<string, unknown>;
  const artifact = call.artifact as Record<string, unknown> | undefined;
  if (artifact?.recordingUrl) return String(artifact.recordingUrl);
  if (call.recordingUrl) return String(call.recordingUrl);

  const msg = payload.message as Record<string, unknown> | undefined;
  if (msg?.artifact) {
    const ma = msg.artifact as Record<string, unknown>;
    if (ma.recordingUrl) return String(ma.recordingUrl);
  }
  return '';
}

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  // Only process end-of-call events
  const msgPayload = payload.message as Record<string, unknown> | undefined;
  const eventType = ((payload.type as string) || (msgPayload?.type as string) || '') as string;
  if (eventType && !['end-of-call-report', 'call-ended', 'end_of_call_report'].includes(eventType)) {
    console.log(`[SarahCall] Ignoring event type: ${eventType}`);
    return new Response('OK', { status: 200 });
  }

  const phone        = extractPhone(payload);
  const transcript   = extractTranscript(payload);
  const recordingUrl = extractRecordingUrl(payload);

  console.log(`[SarahCall] Call ended, transcript length: ${transcript.length}`);

  if (!phone) {
    console.warn('[SarahCall] No phone number found in payload');
    return new Response('OK', { status: 200 });
  }

  // Look up seller in FUB
  const person = await fubGetPersonByPhone(phone).catch(() => null);
  if (!person) {
    console.warn(`[SarahCall] No FUB record found for ${phone}`);
    return new Response('OK', { status: 200 });
  }

  const notes = await fubGetPersonNotes(person.id).catch(() => [] as string[]);
  const ctx   = extractLoanContext(person, notes);

  // Analyze transcript
  const analysis = transcript
    ? await analyzeTranscript(transcript, ctx).catch(() => ({
        outcome: 'maybe' as const,
        summary: 'Transcript analysis failed.',
        keyObjections: [],
      }))
    : { outcome: 'maybe' as const, summary: 'No transcript available.', keyObjections: [] };

  console.log(`[SarahCall] Outcome for person ${person.id}: ${analysis.outcome}`);

  const noteBody =
    `Sarah Post-Call Analysis\n` +
    `Phone: ${phone}\n` +
    `Outcome: ${analysis.outcome.toUpperCase()}\n\n` +
    `Summary: ${analysis.summary}\n\n` +
    (analysis.keyObjections?.length
      ? `Key Objections:\n${analysis.keyObjections.map((o) => `- ${o}`).join('\n')}\n\n`
      : '') +
    (recordingUrl ? `Recording: ${recordingUrl}\n\n` : '') +
    (transcript ? `Transcript:\n${transcript.substring(0, 2000)}` : '');

  if (analysis.outcome === 'interested' || analysis.outcome === 'maybe') {
    // Update FUB to 2-Way Contact and send Telegram alert
    await fubUpdateStage(person.id, FUB_STAGE_2WAY).catch(() => {});
    await fubAddNote(person.id, noteBody).catch(() => {});
    await sendTelegramCallAlert(ctx, phone, analysis, recordingUrl).catch(() => {});
  } else {
    // Not interested - add note only, do NOT advance stage
    await fubAddNote(person.id, noteBody, 'Sarah Call - Not Interested').catch(() => {});
  }

  return new Response('OK', { status: 200 });
}

export async function GET() {
  return new Response('Sarah call complete webhook active', { status: 200 });
}
