export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../lib/supabase/server';

const FUB_API_KEY = process.env.FOLLOWUPBOSS_API_KEY?.trim() || '';
const FUB_BASE_URL = 'https://api.followupboss.com/v1';

// ---------------------------------------------------------------------------
// OUTBOUND AUTOMATION KILL SWITCHES — intentionally disabled 2026-04-21
// ---------------------------------------------------------------------------
// The Vapi outbound call and Twilio SMS triggers below are OFF because the
// downstream pipelines are not fully set up yet (n8n → Vapi workflow not
// live; Twilio number not registered). Leaving the code in place so it can
// be flipped back on quickly once those systems are ready — just change
// these flags to true. Do NOT flip without confirming downstream is live.
const VAPI_OUTBOUND_ENABLED = false;
const SMS_LEAD_AGENT_ENABLED = false;

// ---------------------------------------------------------------------------
// Supabase backup for exit-intent leads
// ---------------------------------------------------------------------------
async function backupExitIntentLead(args: {
  first_name: string;
  email: string;
  fub_synced: boolean;
  fub_error?: string;
  utm: Record<string, string>;
  landing_url?: string;
}) {
  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.from('exit_intent_leads').insert({
      first_name: args.first_name || null,
      email: args.email,
      fub_synced: args.fub_synced,
      fub_error: args.fub_error || null,
      utm_source: args.utm.utm_source || null,
      utm_medium: args.utm.utm_medium || null,
      utm_campaign: args.utm.utm_campaign || null,
      landing_url: args.landing_url || null,
    });
    if (error) console.error('[Supabase] exit_intent_leads insert failed:', error);
  } catch (e) {
    console.error('[Supabase] exit_intent_leads client error:', e);
  }
}

// ---------------------------------------------------------------------------
// UTM → FUB source mapping
// ---------------------------------------------------------------------------

const CAMPAIGN_SOURCE_MAP: Record<string, string> = {
  'Assumable-List-COS-Buyer-Leads': 'Google PPC',
  'assumable-list-cos-buyer-leads': 'Google PPC',
  'Assumable List - COS Buyer Leads': 'Google PPC',
};

// Ad group → FUB source mapping (keyed by utm_content from Google Ads ValueTrack {adgroupname})
const AD_GROUP_SOURCE_MAP: Record<string, string> = {
  'Fort-Carson-VA': 'PPC - Fort Carson VA Buyers',
  'fort-carson-va': 'PPC - Fort Carson VA Buyers',
  'Fort Carson VA Buyers': 'PPC - Fort Carson VA Buyers',
  'Assumable-Searchers': 'PPC - Assumable Searchers',
  'assumable-searchers': 'PPC - Assumable Searchers',
  'Assumable Mortgage Searchers': 'PPC - Assumable Searchers',
  'Low-Rate-Seekers': 'PPC - Low Rate Seekers',
  'low-rate-seekers': 'PPC - Low Rate Seekers',
  'Low Rate Seekers': 'PPC - Low Rate Seekers',
};

// ---------------------------------------------------------------------------
// Source resolution — lead flow buckets
// ---------------------------------------------------------------------------
// Every website lead falls into one of six FUB sources, aligned with Lead Flows
// in FUB admin. Source drives routing + action plans; formType tags still give
// per-form granularity inside each bucket.
//
//   Website - Buyer        Inline CTA, Listing Inquiry, Talk to Agent,
//                          Alex Chat (buyer interest)
//   Website - Seller       Seller Valuation, Alex Chat (seller interest)
//   Website - Exit Intent  Exit-intent popup only
//   Website - Nurture      Course / AI-course waitlists (education-first)
//   Website - Registration Account-creation gate (AuthGate; written from
//                          /api/auth/register, not this route)
//   Google PPC             Any organic lead arriving with gclid or google/cpc
//                          UTMs — existing ad-group-level mapping preserved
// ---------------------------------------------------------------------------

function resolvePpcSource(lead: Record<string, unknown>): string | null {
  const utmSource = (lead.utm_source as string) || '';
  const utmMedium = (lead.utm_medium as string) || '';
  const utmCampaign = (lead.utm_campaign as string) || '';
  const utmContent = (lead.utm_content as string) || '';
  const gclid = (lead.gclid as string) || '';

  const isGooglePPC = !!gclid ||
    (utmSource.toLowerCase() === 'google' && utmMedium.toLowerCase() === 'cpc');
  if (!isGooglePPC) return null;

  if (utmContent && AD_GROUP_SOURCE_MAP[utmContent]) return AD_GROUP_SOURCE_MAP[utmContent];
  if (utmCampaign && CAMPAIGN_SOURCE_MAP[utmCampaign]) return CAMPAIGN_SOURCE_MAP[utmCampaign];
  return 'Google PPC';
}

function resolveFubSource(lead: Record<string, unknown>): string {
  const formType = String(lead.formType || '');

  if (formType === 'Form: Exit Intent') return 'Website - Exit Intent';

  // PPC signals always win for organic forms that happened to arrive via ads,
  // so ad attribution is preserved.
  const ppc = resolvePpcSource(lead);
  if (ppc) return ppc;

  // Seller-intent forms
  if (formType === 'Form: Seller Valuation Request' || formType === 'Form: Seller PPC') {
    return 'Website - Seller';
  }
  // Alex chat — split buyer vs seller interest from the chat conversation
  if (formType === 'Form: Chatbot') {
    const interest = String(lead.interest || '').toLowerCase();
    return interest === 'seller' ? 'Website - Seller' : 'Website - Buyer';
  }

  // Education / nurture waitlists
  if (formType === 'Form: Course Waitlist' || formType === 'Form: AI Course Waitlist') {
    return 'Website - Nurture';
  }

  // Recruiting pipeline is not a real estate lead — kept out of the Website-*
  // sources so it doesn't pollute buyer/seller reporting.
  if (formType === 'recruiting') return 'Recruiting';

  // All other explicit website forms are buyer-intent by default:
  //   Form: Inline CTA, Form: Listing Inquiry, Form: Talk to Agent, Form: Modal Popup
  if (formType.startsWith('Form:')) return 'Website - Buyer';

  // Safety fallback for any request that doesn't set formType (shouldn't happen)
  return 'Website - Buyer';
}

async function sendToFollowUpBoss(lead: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const { name, email, phone, message, propertyAddress } = lead as {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    propertyAddress?: string;
  };

  const gclid = (lead.gclid as string) || '';
  const utmTerm = (lead.utm_term as string) || '';
  const utmCampaign = (lead.utm_campaign as string) || '';
  const landingUrl = (lead.landing_url as string) || '';

  const fubSource = resolveFubSource(lead);
  const isExitIntent = fubSource === 'Website - Exit Intent';
  const isPpc = fubSource === 'Google PPC'
    || fubSource.startsWith('PPC - ');

  // Build the person object. Only include fields that are present.
  const person: Record<string, unknown> = {};
  if (name) person.name = name;
  if (email) person.emails = [{ value: email }];
  // Exit-intent leads never include a phone by design.
  if (phone && !isExitIntent) person.phones = [{ value: phone, type: 'mobile' }];
  if (landingUrl) person.sourceUrl = landingUrl;

  // Tags
  const tags: string[] = [];
  if (isExitIntent) {
    tags.push('Exit Intent', 'Nurture', 'Assumable Ecosystem');
  } else {
    if (lead.formType) tags.push(lead.formType as string);
    // For PPC, echo the campaign/ad-group source as a tag so FUB smart lists
    // can filter by ad group even while source stays "Google PPC"-family.
    if (isPpc) tags.push(fubSource);
  }
  if (tags.length > 0) person.tags = tags;

  // Build note from message + property details + context
  const noteLines: string[] = [];

  // Property details for tour requests
  if (lead.address || lead.listingId) {
    noteLines.push(`--- Property Inquiry ---`);
    if (lead.address) noteLines.push(`Property: ${lead.address}`);
    if (lead.price) noteLines.push(`List Price: $${Number(lead.price).toLocaleString()}`);
    if (lead.assumableRate) noteLines.push(`Assumable Rate: ${lead.assumableRate}%`);
    if (lead.listingId) noteLines.push(`View listing: https://assumableguy.com/homes/${lead.listingId}`);
    noteLines.push('');
  }

  if (message) noteLines.push(message);
  if (lead.source) noteLines.push(`Source: ${lead.source}`);
  if (utmCampaign) noteLines.push(`Campaign: ${utmCampaign}`);
  if (utmTerm) noteLines.push(`Search Term: ${utmTerm}`);
  if (gclid) noteLines.push(`Google Click ID: ${gclid}`);

  const payload: Record<string, unknown> = {
    source: fubSource,
    system: 'assumableguy.com',
    type: 'Registration',
    person,
  };

  if (propertyAddress) {
    payload.property = { street: propertyAddress };
  }

  if (noteLines.length > 0) {
    payload.note = noteLines.join('\n');
  }

  const authHeader = 'Basic ' + Buffer.from(`${FUB_API_KEY}:`).toString('base64');

  try {
    const res = await fetch(`${FUB_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'X-System': 'assumableguy.com',
        'X-System-Key': FUB_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('[FUB] Error response:', res.status, data);
      return { success: false, error: `FUB returned ${res.status}: ${JSON.stringify(data)}` };
    }

    // Also create an explicit note on the person with property details
    if (noteLines.length > 0 && email) {
      createFubNote(email as string, lead, noteLines, authHeader).catch(e =>
        console.error('[FUB] Note creation failed:', e)
      );
    }

    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[FUB] Fetch error:', msg);
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// FUB note creation (separate from event)
// ---------------------------------------------------------------------------
async function createFubNote(
  email: string,
  lead: Record<string, unknown>,
  noteLines: string[],
  authHeader: string,
) {
  // Wait a moment for the event/person to be created
  await new Promise(r => setTimeout(r, 2000));

  const searchRes = await fetch(
    `${FUB_BASE_URL}/people?email=${encodeURIComponent(email)}&limit=1`,
    { headers: { Authorization: authHeader } }
  );
  if (!searchRes.ok) {
    console.error('[FUB] Person lookup failed:', searchRes.status);
    return;
  }
  const searchData = await searchRes.json();
  const personId = searchData?.people?.[0]?.id;
  if (!personId) {
    console.error('[FUB] Person not found for note:', email);
    return;
  }

  const noteSubject = lead.address
    ? `Tour Request: ${lead.address}`
    : 'New Inquiry from Website';

  const noteRes = await fetch(`${FUB_BASE_URL}/notes`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personId,
      subject: noteSubject,
      body: noteLines.join('\n'),
    }),
  });

  if (!noteRes.ok) {
    console.error('[FUB] Note creation failed:', noteRes.status, await noteRes.text());
  } else {
    console.log(`[FUB] Note created for person ${personId}: ${noteSubject}`);
  }
}

// ---------------------------------------------------------------------------
// Spam detection helpers
// ---------------------------------------------------------------------------

/** Returns true if the name looks like a bot-generated random string.
 *  Pattern: a single "word" (no spaces) with mixed upper+lower case
 *  and no vowel-consonant structure of a real name.
 *  Examples caught: NkgeSHHHJqmLhTducBpraJX, VRstltdTDQ, 4wkLtEpnhT
 */
function isSpamName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  // Mixed random case after first char = bot string. Previously this function
  // also rejected any single word >12 chars, which silently dropped legitimate
  // long first names (e.g. exit-intent popup collects first_name only).
  const words = trimmed.split(/\s+/);
  for (const word of words) {
    if (word.length >= 8 && /[A-Z]/.test(word.slice(1)) && /[a-z]/.test(word) && /^[A-Za-z0-9]+$/.test(word)) {
      // More than 3 uppercase letters after position 0 = not a normal name
      const uppercaseCount = (word.slice(1).match(/[A-Z]/g) || []).length;
      if (uppercaseCount >= 3) return true;
    }
  }
  return false;
}

/** In-memory rate limiter: max 3 submissions per IP per 10 minutes */
const ipSubmissions = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipSubmissions.get(ip);
  if (!entry || now > entry.resetAt) {
    ipSubmissions.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return false;
  }
  entry.count++;
  return entry.count > 3;
}

export async function POST(req: NextRequest) {
  if (!FUB_API_KEY) {
    console.error('[FUB] FOLLOWUPBOSS_API_KEY not set');
    return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
  }

  let body: Record<string, unknown> = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // --- Honeypot: bots fill hidden fields, humans don't ---
  if (body.website || body.url || body._hp || body.company2 || body.fax) {
    console.log('[SPAM] Honeypot triggered from IP:', ip);
    return NextResponse.json({ success: true, message: 'Lead captured' }); // silent reject
  }

  // --- Spam name detection ---
  const nameRaw = (body.name as string) || '';
  if (isSpamName(nameRaw)) {
    console.log('[SPAM] Bot name detected:', nameRaw, 'from IP:', ip);
    return NextResponse.json({ success: true, message: 'Lead captured' }); // silent reject
  }

  // --- Rate limiting ---
  if (isRateLimited(ip)) {
    console.log('[SPAM] Rate limit hit from IP:', ip);
    return NextResponse.json({ success: true, message: 'Lead captured' }); // silent reject
  }

  const lead = {
    ...body,
    receivedAt: new Date().toISOString(),
    ip,
  };

  // --- Send to FollowUpBoss ---
  const fubResult = await sendToFollowUpBoss(lead);
  if (fubResult.success) {
    console.log('[FUB] Lead sent successfully');
  } else {
    console.error('[FUB] Lead failed to send:', fubResult.error);
  }

  // --- Exit-intent Supabase backup (always write, regardless of FUB outcome) ---
  if (body.formType === 'Form: Exit Intent' && (body.email as string)) {
    await backupExitIntentLead({
      first_name: (body.first_name as string) || (body.name as string) || '',
      email: body.email as string,
      fub_synced: fubResult.success,
      fub_error: fubResult.success ? undefined : fubResult.error,
      utm: {
        utm_source: (body.utm_source as string) || '',
        utm_medium: (body.utm_medium as string) || '',
        utm_campaign: (body.utm_campaign as string) || '',
      },
      landing_url: (body.landing_url as string) || '',
    });
  }

  // --- Fire-and-forget to n8n → Vapi (instant outbound call) ---
  // DISABLED: see VAPI_OUTBOUND_ENABLED flag at top of file.
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const phone = (body.phone as string) || '';
  const name = (body.name as string) || '';
  const email = (body.email as string) || '';
  if (VAPI_OUTBOUND_ENABLED && webhookUrl && phone) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, source: 'website-leads-api' }),
    }).catch(console.error);
  }

  // --- Fire SMS lead agent (non-blocking) ---
  // DISABLED: see SMS_LEAD_AGENT_ENABLED flag at top of file.
  if (SMS_LEAD_AGENT_ENABLED && phone) {
    fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://assumableguy.com'}/api/sms-lead`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, source: 'website' }),
      }
    ).catch(console.error);
  }

  // --- Always return 200 to avoid breaking form UX ---
  return NextResponse.json({
    success: true,
    message: 'Lead captured',
  });
}

export async function GET() {
  return NextResponse.json({ message: 'Lead capture endpoint active' });
}
