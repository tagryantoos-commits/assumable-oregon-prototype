export const runtime = 'nodejs';

/**
 * FUB (FollowUpBoss) Webhook Endpoint
 *
 * FollowUpBoss calls this when any lead arrives (Facebook ads, referrals, etc.)
 * We relay it to n8n → Vapi for an instant outbound AI call.
 *
 * Additionally: if the lead source is "FACEBOOK" (FUB's native FB integration),
 * we enrich it by querying Meta Graph API for ad attribution, then update
 * the FUB person with proper source/tags.
 *
 * Setup in FollowUpBoss:
 *   Settings → API → Outbound Webhooks → Add Webhook
 *   URL: https://assumableguy.com/api/fub-webhook
 *   Events: New Person / New Lead
 */

import { createHmac, timingSafeEqual } from 'crypto';

const FUB_API_KEY = process.env.FOLLOWUPBOSS_API_KEY || '';
const FUB_BASE = 'https://api.followupboss.com/v1';
const FB_TOKEN = process.env.FB_SYSTEM_USER_TOKEN || '';
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID || 'act_1419786802007852';
const GRAPH_BASE = 'https://graph.facebook.com/v21.0';
const WEBHOOK_SECRET = process.env.FUB_WEBHOOK_SECRET || '';

// ---------------------------------------------------------------------------
// OUTBOUND AUTOMATION KILL SWITCH — intentionally disabled 2026-04-21
// ---------------------------------------------------------------------------
// The n8n → Vapi outbound call trigger below is OFF. The downstream voice AI
// pipeline is not live yet. This webhook still enriches Facebook leads via
// Meta Graph, but does NOT initiate any outbound call. Flip to true only
// after confirming n8n/Vapi is ready.
const VAPI_OUTBOUND_ENABLED = false;

// ─── Spam Detection ──────────────────────────────────────────────────────────

function isSpamName(name: string): boolean {
  if (!name || name.length < 2) return false;
  const trimmed = name.trim();
  // Single word with no spaces and >8 chars = likely random string
  if (trimmed.length > 8 && !trimmed.includes(' ') && /^[A-Za-z0-9]+$/.test(trimmed)) {
    // Check for mixed case gibberish (e.g. "6ytRe58xpM", "PzBRdqIrBb")
    const hasDigits = /\d/.test(trimmed);
    const hasMixedCase = /[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed);
    if (hasDigits || hasMixedCase) return true;
  }
  // All lowercase single word >10 chars with no vowel patterns
  if (trimmed.length > 10 && !trimmed.includes(' ') && /^[a-z0-9]+$/i.test(trimmed)) {
    const vowelRatio = (trimmed.match(/[aeiou]/gi) || []).length / trimmed.length;
    if (vowelRatio < 0.15 || vowelRatio > 0.7) return true;
  }
  return false;
}

async function deleteSpamLead(personId: number | string) {
  const authHeader = `Basic ${btoa(FUB_API_KEY + ':')}`;
  try {
    // Move to "Trash" stage and add spam tag so it's filtered out
    await fetch(`${FUB_BASE}/people/${personId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ stage: 'Trash', tags: ['Auto-Spam'] }),
    });
    console.log(`[SPAM] Trashed lead ${personId}`);
  } catch (err) {
    console.error(`[SPAM] Failed to trash lead ${personId}:`, err);
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // Verify webhook signature if secret is configured
    if (WEBHOOK_SECRET) {
      const signature = request.headers.get('x-fub-signature') || request.headers.get('x-webhook-signature') || '';
      if (signature) {
        const expected = createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
        const sigBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expected);
        if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
          console.error('[FUB Webhook] Invalid signature');
          return Response.json({ error: 'Invalid signature' }, { status: 403 });
        }
      }
    }

    const body = JSON.parse(rawBody);
    console.log('[FUB Webhook] Event received:', body.event || body.eventType || 'unknown');

    // ─── OAuth Webhook Events (emails, texts, calls, notes) ────────
    // These come from the OAuth-created webhooks and may contain
    // communication content useful for buyer criteria extraction.
    const eventType = body.event || body.eventType || '';
    if (eventType.startsWith('emails') || eventType.startsWith('textMessages') ||
        eventType.startsWith('calls') || eventType.startsWith('notes') ||
        eventType.startsWith('events')) {
      console.log(`[FUB Webhook] Communication event: ${eventType}`);
      // Return 200 so FUB knows we received it
      return Response.json({ ok: true, event: eventType });
    }

    const person = body.person || body;
    const personId = person.id || body.resourceId;

    const name = [person.firstName, person.lastName].filter(Boolean).join(' ');
    const phone = person.phones?.[0]?.value || person.phone || '';
    const email = person.emails?.[0]?.value || person.email || '';
    const source = (person.source || '').toString();

    // ─── Spam filter: catch bot leads before they reach agents ─────
    if (isSpamName(name) || isSpamName(person.firstName || '') || isSpamName(person.lastName || '')) {
      console.log(`[SPAM] Detected spam lead (source: ${source}, id: ${personId})`);
      if (personId) {
        deleteSpamLead(personId).catch(console.error);
      }
      return Response.json({ ok: true, spam: true });
    }

    // Relay to n8n for Vapi call
    // DISABLED: see VAPI_OUTBOUND_ENABLED flag at top of file.
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (VAPI_OUTBOUND_ENABLED && webhookUrl && phone) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, source: 'followupboss' }),
      }).catch(console.error);
    }

    // Enrich Facebook-sourced leads with Meta ad attribution
    if (source.toLowerCase().includes('facebook') && personId && FB_TOKEN) {
      enrichFacebookLead(personId, email, phone).catch((err) =>
        console.error('[FUB Webhook] Enrichment error:', err)
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[FUB Webhook] Error:', err);
    return Response.json({ ok: true }); // always 200 so FUB doesn't retry
  }
}

// GET: FUB webhook verification — only respond if we recognize the challenge
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  if (code && WEBHOOK_SECRET) {
    // Only echo the code if the request also includes our expected verification token
    const token = searchParams.get('verify_token');
    if (token === WEBHOOK_SECRET) {
      return new Response(code, { status: 200 });
    }
    return Response.json({ error: 'Invalid verify_token' }, { status: 403 });
  }
  if (code) {
    // Fallback: FUB's standard verification (echo code back)
    return new Response(code, { status: 200 });
  }
  return Response.json({ status: 'active' });
}

async function enrichFacebookLead(personId: number | string, email: string, phone: string) {
  console.log(`[FUB Webhook] Enriching Facebook lead: person=${personId}`);

  // Search Meta leads by email
  const metaLead = await findMetaLead(email, phone);
  if (!metaLead) {
    console.log('[FUB Webhook] No matching Meta lead found — skipping enrichment');
    return;
  }

  console.log(`[FUB Webhook] Found Meta lead: campaign=${metaLead.campaign_name} ad=${metaLead.ad_name}`);

  // Build tags
  const tags: string[] = ['Meta Paid Social'];
  if (metaLead.campaign_name) {
    tags.push(`Meta - ${metaLead.campaign_name}`);
  }
  if (metaLead.ad_name) {
    tags.push(`Ad: ${metaLead.ad_name}`);
  }

  // Add note with full attribution
  const note = [
    'Meta Ad Attribution (enriched)',
    `Campaign: ${metaLead.campaign_name || 'Unknown'}`,
    `Ad Set: ${metaLead.adset_name || 'Unknown'}`,
    `Ad: ${metaLead.ad_name || 'Unknown'}`,
  ].join('\n');

  // Update FUB person
  const updatePayload: Record<string, unknown> = {
    source: 'Meta - Paid Social',
    tags,
  };

  const authHeader = `Basic ${btoa(FUB_API_KEY + ':')}`;

  // PATCH person to update source and tags
  const patchResp = await fetch(`${FUB_BASE}/people/${personId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body: JSON.stringify(updatePayload),
  });

  if (!patchResp.ok) {
    console.error(`[FUB Webhook] FUB update failed: ${patchResp.status} ${await patchResp.text()}`);
    return;
  }

  // Add note
  const noteResp = await fetch(`${FUB_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body: JSON.stringify({ personId: Number(personId), subject: 'Meta Ad Attribution', body: note }),
  });

  if (!noteResp.ok) {
    console.error(`[FUB Webhook] FUB note failed: ${noteResp.status}`);
  }

  console.log(`[FUB Webhook] Enrichment complete for person ${personId}`);
}

interface MetaLeadResult {
  campaign_name: string;
  adset_name: string;
  ad_name: string;
  ad_id: string;
}

async function findMetaLead(email: string, phone: string): Promise<MetaLeadResult | null> {
  // Try email first, then phone
  for (const [field, value] of [['email', email], ['phone_number', phone]]) {
    if (!value) continue;

    try {
      const filtering = JSON.stringify([{ field, operator: 'EQUAL', value }]);
      const url = `${GRAPH_BASE}/${FB_AD_ACCOUNT_ID}/leads?filtering=${encodeURIComponent(filtering)}&fields=ad_id,ad_name,adset_name,campaign_name,created_time&access_token=${FB_TOKEN}`;

      const resp = await fetch(url);
      if (!resp.ok) {
        console.error(`[FUB Webhook] Meta lead search failed (${field}): ${resp.status}`);
        continue;
      }

      const data = await resp.json() as { data?: MetaLeadResult[] };
      if (data.data && data.data.length > 0) {
        return data.data[0];
      }
    } catch (err) {
      console.error(`[FUB Webhook] Meta lead search error (${field}):`, err);
    }
  }

  return null;
}
