// v2 — recruiting webhook active
export const runtime = 'nodejs';

/**
 * Meta Lead Gen Webhook
 * 
 * Receives Facebook/Instagram Lead Ad form submissions via Meta Webhooks
 * and creates leads in FollowUpBoss automatically.
 * 
 * Flow: User fills Lead Form → Meta fires webhook → This endpoint →
 *       Fetches full lead data from Graph API → Creates person in FUB
 *
 * Supports two routing paths:
 *   1. Buyer leads  → createFubPerson() (unchanged)
 *   2. Agent recruiting leads → handleRecruitingLead() (new)
 */

const FUB_API_KEY = (process.env.FOLLOWUPBOSS_API_KEY || '').trim();
const FUB_BASE = 'https://api.followupboss.com/v1';
const META_VERIFY_TOKEN = 'TAG3_META_LEADADS_VERIFY_2026';

// Matches ppc-lead/route.ts pattern — the proven working auth from Vercel
function fubHeaders(): Record<string, string> {
  return {
    Authorization: 'Basic ' + Buffer.from(`${FUB_API_KEY}:`).toString('base64'),
    'Content-Type': 'application/json',
    'X-System': 'assumableguy.com',
    'X-System-Key': FUB_API_KEY,
  };
}

// System user token — used to fetch lead details from Graph API
const FB_TOKEN = process.env.FB_SYSTEM_USER_TOKEN || '';
const GRAPH_BASE = 'https://graph.facebook.com/v19.0';

// Known recruiting form IDs (fallback if form_name not in payload)
const RECRUITING_FORM_IDS = ['1276835697465347', '3087065164828345'];

// FUB recruiting config
const FUB_RECRUITING_STAGE = 'Recruiting Lead';
const FUB_RECRUITING_STAGE_ID = 78;
const FUB_RECRUITING_ASSIGNED_USER_ID = 1;
const FUB_RECRUITING_SOURCE = 'Facebook - Agent Recruiting';
const FUB_RECRUITING_TAGS = ['Agent Recruiting', 'Facebook - Recruiting', 'Agent Recruiting Form May 2026'];
const FUB_BUYER_TAGS_TO_REMOVE = ['Assumable Nurture Drip', 'Assumable Ecosystem', 'The Assumable Guy'];

// ─────────────────────────────────────────────
// GET: Meta webhook verification
// ─────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    console.log('[Meta Webhook] Verification successful');
    return new Response(challenge, { status: 200 });
  }

  // Temporary diagnostic probe — ?probe=TAG3&ts=...
  if (searchParams.get('probe') === 'TAG3') {
    const fbToken = process.env.FB_SYSTEM_USER_TOKEN || '';
    const fubKey = process.env.FOLLOWUPBOSS_API_KEY || '';
    const probe: Record<string, unknown> = {
      token_set: !!fbToken, token_len: fbToken.length, token_prefix: fbToken.substring(0, 15),
      fub_key_set: !!fubKey, fub_key_prefix: fubKey.substring(0, 10),
    };
    // 1. Meta fetch
    try {
      const r = await fetch(`https://graph.facebook.com/v19.0/1444477673674052?fields=field_data&access_token=${fbToken}`);
      probe.meta_status = r.status; probe.meta_ok = r.ok;
      if (!r.ok) probe.meta_error = (await r.text()).substring(0, 200);
      else probe.meta_fields = ((await r.json() as {field_data?: unknown[]}).field_data || []).length;
    } catch (e) { probe.meta_catch = String(e); }
    // 2. FUB lookup
    try {
      const r = await fetch(`https://api.followupboss.com/v1/people?email=tag3webhooktest%40assumableguy.com&limit=1`, {
        headers: { Authorization: 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'), 'X-System': 'assumableguy.com', 'X-System-Key': FUB_API_KEY },
      });
      probe.fub_lookup_status = r.status;
      const d = await r.json() as {people?: Array<{id: number}>};
      probe.fub_person_id = d.people?.[0]?.id ?? null;
    } catch (e) { probe.fub_lookup_catch = String(e); }
    // 3. FUB btoa test
    try { probe.btoa_works = !!btoa(fubKey + ':'); } catch (e) { probe.btoa_error = String(e); }
    return Response.json(probe);
  }

  console.warn(`[Meta Webhook] Verification failed: mode=${mode}`);
  return new Response('Forbidden', { status: 403 });
}

// ─────────────────────────────────────────────
// POST: Receive lead events
// ─────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[Meta Webhook] Event received:', JSON.stringify(body).substring(0, 500));

    const entries = body.entry || [];
    let processed = 0;

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== 'leadgen') continue;

        const value = change.value || {};
        const leadId = value.leadgen_id;
        if (!leadId) continue;

        // ── Early recruiting detection (before any Graph API call) ──
        // Check form_id from webhook payload against known recruiting form IDs
        const earlyFormId: string = value.form_id || '';
        const earlyFormName: string = value.form_name || '';
        const isRecruiting = isRecruitingForm(earlyFormId, earlyFormName);

        if (isRecruiting) {
          console.log(`[Meta Webhook] Early recruiting detection (form_id: ${earlyFormId}) — fetching lead with system user token`);
          // Fetch lead directly with system user token (no page token hop)
          const leadData = await fetchLead(leadId);
          if (!leadData) continue;

          const fields = parseFields(leadData.field_data || []);
          const formId = earlyFormId || leadData.form_id || '';
          const formName = earlyFormName || await getFormName(formId);
          const campaignInfo = {
            campaign_name: value.campaign_name || '',
            adset_name: value.adset_name || '',
            ad_name: value.ad_name || '',
            form_id: formId,
          };

          console.log(`[Meta Webhook] Routing as recruiting lead (form: "${formName || formId}")`);
          const result = await handleRecruitingLead(fields, campaignInfo, formName);
          if (result) processed++;
          continue; // early return — skip buyer logic
        }

        // ── Buyer lead path — fetch with system user token directly ──
        const leadData = await fetchLead(leadId);
        if (!leadData) continue;

        // Parse fields
        const fields = parseFields(leadData.field_data || []);
        const formId = earlyFormId || leadData.form_id || '';
        const campaignInfo = {
          campaign_name: value.campaign_name || '',
          adset_name: value.adset_name || '',
          ad_name: value.ad_name || '',
          form_id: formId,
        };

        // Secondary form name check (in case form_name wasn't in payload)
        let formName: string = earlyFormName;
        if (!formName && formId) {
          formName = await getFormName(formId);
        }

        if (isRecruitingForm(formId, formName)) {
          // Caught via form name lookup (shouldn't happen often given early detection)
          console.log(`[Meta Webhook] Routing as recruiting lead (form: "${formName || formId}")`);
          const result = await handleRecruitingLead(fields, campaignInfo, formName);
          if (result) processed++;
          continue;
        }

        const result = await createFubPerson(fields, campaignInfo);
        if (result) processed++;
      }
    }

    console.log(`[Meta Webhook] Processed ${processed} leads`);
    return Response.json({ ok: true, processed });
  } catch (err) {
    console.error('[Meta Webhook] Error:', err);
    return Response.json({ ok: true }); // Always 200 so Meta doesn't retry
  }
}

// ─────────────────────────────────────────────
// Helpers: Meta / Graph API
// ─────────────────────────────────────────────

async function fetchLead(leadId: string, token: string = FB_TOKEN) {
  try {
    console.log(`[Meta Webhook] fetchLead: token_set=${!!token}, token_prefix=${token.substring(0,15)}`);
    const resp = await fetch(
      `${GRAPH_BASE}/${leadId}?fields=field_data,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id&access_token=${token}`,
      { signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined }
    );
    if (!resp.ok) {
      const errBody = await resp.text();
      console.error(`[Meta Webhook] Lead fetch failed: ${resp.status} — ${errBody.substring(0,200)}`);
      return null;
    }
    return await resp.json();
  } catch (err) {
    console.error(`[Meta Webhook] Lead fetch error:`, String(err));
    return null;
  }
}

async function getFormName(formId: string, token: string = FB_TOKEN): Promise<string> {
  try {
    const resp = await fetch(`${GRAPH_BASE}/${formId}?fields=name&access_token=${token}`);
    if (!resp.ok) return '';
    const data = await resp.json() as { name?: string };
    return data.name || '';
  } catch {
    return '';
  }
}

function parseFields(fieldData: Array<{ name: string; values: string[] }>) {
  const result: Record<string, string> = {};
  for (const field of fieldData) {
    const name = field.name?.toLowerCase().replace(/\s+/g, '_') || '';
    result[name] = field.values?.[0] || '';
  }
  return result;
}

// ─────────────────────────────────────────────
// Recruiting: detection helper
// ─────────────────────────────────────────────

function isRecruitingForm(formId: string, formName: string): boolean {
  if (formName && formName.toLowerCase().includes('agent recruiting')) return true;
  if (formId && RECRUITING_FORM_IDS.includes(formId)) return true;
  return false;
}

// ─────────────────────────────────────────────
// Recruiting: FUB routing
// ─────────────────────────────────────────────

async function handleRecruitingLead(
  fields: Record<string, string>,
  campaign: { campaign_name: string; adset_name: string; ad_name: string; form_id: string },
  formName: string
): Promise<unknown> {
  const name = fields.full_name || `${fields.first_name || ''} ${fields.last_name || ''}`.trim();
  const email = fields.email || '';
  const phone = fields.phone || fields.phone_number || '';
  const dealCount = fields['how_many_deals_have_you_closed_in_the_last_twelve_months??'] || fields.deal_count || '';
  const brokerage = fields['what_brokerage_are_you_with?'] || fields.brokerage || '';
  const inboxUrl = fields.inbox_url || '';

  if (!email && !phone) {
    console.warn('[Meta Webhook] Recruiting lead has no email or phone — skipping');
    return null;
  }

  // Build note body
  const noteLines = [
    '🤝 AGENT RECRUITING LEAD — via Facebook Lead Ad',
    '',
    '📋 Form answers:',
    `• Deals closed (last 12 months): ${dealCount || 'N/A'}`,
    `• Brokerage: ${brokerage || 'N/A'}`,
    '',
    `📣 Campaign: ${campaign.campaign_name || 'Unknown'}`,
  ];
  if (inboxUrl) noteLines.push(`📱 Messenger: ${inboxUrl}`);
  noteLines.push('', 'Routed automatically by TAG3 webhook.');
  const noteBody = noteLines.join('\n');

  // Check if person already exists in FUB by email or phone (GET with X-System)
  let existingPersonId: number | null = null;
  if (email) {
    existingPersonId = await findFubPersonByEmail(email);
  }
  if (!existingPersonId && phone) {
    existingPersonId = await findFubPersonByPhone(phone);
  }

  let personId: number | null = null;

  if (existingPersonId) {
    console.log(`[Meta Webhook] Recruiting — existing FUB person found: ID=${existingPersonId}`);
    // PATCH/PUT the person with recruiting routing (plain API key auth — no X-System)
    const patched = await patchFubPersonForRecruiting(existingPersonId);
    if (patched) personId = existingPersonId;
  } else {
    console.log('[Meta Webhook] Recruiting — creating new FUB person via /v1/events');
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const eventPayload: Record<string, unknown> = {
      source: FUB_RECRUITING_SOURCE,
      type: 'person',
      message: noteBody,
      person: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { emails: [{ value: email }] }),
        ...(phone && { phones: [{ value: phone }] }),
        assignedUserId: FUB_RECRUITING_ASSIGNED_USER_ID,
        stage: FUB_RECRUITING_STAGE,
        tags: FUB_RECRUITING_TAGS,
      },
    };

    const createdId = await createFubEvent(eventPayload);
    if (createdId) personId = createdId;
  }

  if (!personId) {
    console.error('[Meta Webhook] Recruiting — failed to create/update FUB person');
    return null;
  }

  // Post note (for both new and existing persons)
  await addFubNote(personId, noteBody);

  console.log(`[Meta Webhook] Recruiting lead processed: FUB person ID=${personId}`);
  return { id: personId };
}

async function findFubPersonByEmail(email: string): Promise<number | null> {
  try {
    const resp = await fetch(`${FUB_BASE}/people?email=${encodeURIComponent(email)}&limit=1`, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
        'X-System': 'assumableguy.com',
        'X-System-Key': FUB_API_KEY,
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json() as { people?: Array<{ id: number }> };
    return data.people?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function findFubPersonByPhone(phone: string): Promise<number | null> {
  try {
    const resp = await fetch(`${FUB_BASE}/people?phone=${encodeURIComponent(phone)}&limit=1`, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
        'X-System': 'assumableguy.com',
        'X-System-Key': FUB_API_KEY,
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json() as { people?: Array<{ id: number }> };
    return data.people?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function patchFubPersonForRecruiting(personId: number): Promise<boolean> {
  // Use PUT /v1/people/{id} with plain API key auth — no X-System (known silent failure issue)
  try {
    const payload = {
      stage: FUB_RECRUITING_STAGE,          // name-based — required for FUB to update
      stageId: FUB_RECRUITING_STAGE_ID,     // belt-and-suspenders
      assignedUserId: FUB_RECRUITING_ASSIGNED_USER_ID,
      tags: FUB_RECRUITING_TAGS,            // full replacement — buyer drip tags dropped automatically
    };
    const resp = await fetch(`${FUB_BASE}/people/${personId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
        'X-System': 'assumableguy.com',
        'X-System-Key': FUB_API_KEY,
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      console.error(`[Meta Webhook] FUB PATCH person failed: ${resp.status} ${await resp.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Meta Webhook] FUB PATCH person error:', err);
    return false;
  }
}

async function createFubEvent(payload: Record<string, unknown>): Promise<number | null> {
  try {
    const resp = await fetch(`${FUB_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      console.error(`[Meta Webhook] FUB event create failed: ${resp.status} ${await resp.text()}`);
      return null;
    }
    const data = await resp.json() as { id?: number; person?: { id?: number } };
    // /v1/events returns the event; person ID may be nested
    const id = data.person?.id ?? data.id ?? null;
    console.log(`[Meta Webhook] FUB event created: ID=${id}`);
    return id;
  } catch (err) {
    console.error('[Meta Webhook] FUB event create error:', err);
    return null;
  }
}

async function addFubNote(personId: number, body: string): Promise<void> {
  try {
    const resp = await fetch(`${FUB_BASE}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
      },
      body: JSON.stringify({ personId, body, isHtml: false }),
    });
    if (!resp.ok) {
      console.warn(`[Meta Webhook] FUB note create failed: ${resp.status}`);
    }
  } catch (err) {
    console.warn('[Meta Webhook] FUB note create error:', err);
  }
}

// ─────────────────────────────────────────────
// Buyer leads: existing logic (unchanged)
// ─────────────────────────────────────────────

async function createFubPerson(
  fields: Record<string, string>,
  campaign: { campaign_name: string; adset_name: string; ad_name: string; form_id: string }
) {
  const name = fields.full_name || `${fields.first_name || ''} ${fields.last_name || ''}`.trim();
  const email = fields.email || '';
  const phone = fields.phone_number || fields.phone || '';

  if (!email && !phone) {
    console.warn('[Meta Webhook] Lead has no email or phone — skipping');
    return null;
  }

  // Build note with qualifying info
  const noteParts = [
    `Source: Facebook Lead Ad`,
    `Campaign: ${campaign.campaign_name || 'Unknown'}`,
    `Ad Set: ${campaign.adset_name || 'Unknown'}`,
    `Ad: ${campaign.ad_name || 'Unknown'}`,
    `Form ID: ${campaign.form_id || ''}`,
  ];

  // Add qualifying answers
  if (fields.buying_timeline) noteParts.push(`Timeline: ${fields.buying_timeline}`);
  if (fields.buyer_type) noteParts.push(`Buyer Type: ${fields.buyer_type}`);

  // Granular ad-level tags
  const tags: string[] = ['Meta Paid Social'];
  if (campaign.campaign_name) {
    tags.push(`Meta - ${campaign.campaign_name}`);
  }
  if (campaign.ad_name) {
    tags.push(`Ad: ${campaign.ad_name}`);
  }
  // Buyer-type tags based on campaign name
  const cn = campaign.campaign_name.toLowerCase();
  if (cn.includes('va') || cn.includes('military')) {
    tags.push('VA/Military Buyer');
  } else if (cn.includes('first') || cn.includes('buyer') || cn.includes('ftb')) {
    tags.push('First Time Buyer');
  } else if (cn.includes('investor')) {
    tags.push('Investor');
  }

  // Split name into first/last for /v1/events person sub-object
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const payload: Record<string, unknown> = {
    source: 'FACEBOOK',
    type: 'buyer',
    message: noteParts.join('\n'),
    person: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { emails: [{ value: email }] }),
      ...(phone && { phones: [{ value: phone }] }),
      tags,
    },
  };

  try {
    const resp = await fetch(`${FUB_BASE}/events`, {
      method: 'POST',
      headers: fubHeaders(),
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      console.error(`[Meta Webhook] FUB error ${resp.status}: ${await resp.text()}`);
      return null;
    }

    const data = await resp.json() as { id?: number; person?: { id?: number } };
    const id = data.person?.id ?? data.id ?? null;
    console.log(`[Meta Webhook] FUB buyer event created: ID=${id}`);
    return { id };
  } catch (err) {
    console.error('[Meta Webhook] FUB request failed:', err);
    return null;
  }
}
