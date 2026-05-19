export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '../../../lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

const FUB_API_KEY = (process.env.FOLLOWUPBOSS_API_KEY || '').replace(/\\n$/, '').trim();
const FUB_BASE = 'https://api.followupboss.com/v1';

const ALLOWED_TYPES = new Set([
  'property_viewed',
  'property_saved',
  'property_unsaved',
  'calculator_used',
  'return_visit',
  'market_page_visit',
  'page_viewed',
]);

/**
 * Map our internal event types to FUB's canonical event-type enum. Using the
 * canonical names (Viewed Page, Viewed Property, Saved Property, Property
 * Search, Visited Website) causes events to populate FUB's "Website Activity"
 * panel instead of landing in the generic timeline — matching the native
 * Pixel experience. See docs.followupboss.com/reference/events-post.
 *
 * property_viewed is throttled server-side to 1x per (user, listing) per 24h
 * (see VIEW_THROTTLE_MS). page_viewed is NOT server-throttled — the 30 min
 * per-URL client sessionStorage dedupe in lib/tracking.ts is enough, and
 * matches how the Pixel fires on theassumableguy.com (multiple hits per day
 * at different times are expected and desired).
 */
const FUB_MIRROR: Record<string, string | null> = {
  property_viewed: 'Viewed Property',
  property_saved: 'Saved Property',
  property_unsaved: null,            // digest only — unsaves are noise
  calculator_used: 'Calculator Used', // no canonical equivalent — stays in generic timeline
  return_visit: 'Visited Website',
  market_page_visit: 'Property Search',
  page_viewed: 'Viewed Page',
};

const VIEW_THROTTLE_MS = 24 * 60 * 60 * 1000;

interface FubPersonRef {
  fubPersonId: number | null;
  assignedUserId: number | null;
}

interface TrackBody {
  type: string;
  payload?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  let body: TrackBody;
  try {
    body = (await req.json()) as TrackBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { type, payload = {} } = body;
  if (!type || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  }

  // Resolve identity from the Supabase session cookie, not from the request body.
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const email = authData?.user?.email;
  if (!email) {
    // Anonymous request — silently ignore. No tracking without a known user.
    return NextResponse.json({ success: true, tracked: false });
  }

  const service = await createServiceClient();

  // Write to Supabase user_activity (service client — bypasses RLS).
  try {
    await service.from('user_activity').insert({
      user_email: email,
      event_type: type,
      metadata: payload as Record<string, unknown>,
      session_id: authData?.user?.id || null,
    });
  } catch (err) {
    console.error('[track] supabase insert failed:', err);
    // Continue — FUB mirror is still valuable.
  }

  // Mirror to FUB activity timeline — capture person ref for potential task creation.
  const fubPerson = await mirrorToFub(service, email, type, payload).catch((err): FubPersonRef => {
    console.error('[track] FUB mirror failed:', err);
    return { fubPersonId: null, assignedUserId: null };
  });

  // On first website-activity event of the day, create a FUB call task so the
  // assigned agent is prompted to reach out.
  if (fubPerson?.fubPersonId) {
    const firstToday = await isFirstEventToday(service, email).catch(() => false);
    if (firstToday) {
      createFubCallTask(service, email, fubPerson.fubPersonId, fubPerson.assignedUserId).catch(err =>
        console.error('[track] FUB task creation error:', err),
      );
    }
  }

  return NextResponse.json({ success: true, tracked: true });
}

/**
 * Check whether the row just inserted is the *first* user_activity event for
 * this email today (UTC). Because the row was already committed before this
 * check, a count of 1 means no prior event existed today.
 */
async function isFirstEventToday(
  service: SupabaseClient,
  email: string,
): Promise<boolean> {
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const { count, error } = await service
    .from('user_activity')
    .select('id', { count: 'exact', head: true })
    .eq('user_email', email)
    .gte('created_at', todayUtc.toISOString());
  if (error) {
    console.warn('[track] isFirstEventToday query failed:', error);
    return false;
  }
  // count === 1 → only the row we just inserted → this IS the first event today
  return (count ?? 0) <= 1;
}

/**
 * Create a FUB "Call" task assigned to the lead's owner, linked to the person
 * record, with today as the due date. Called at most once per day per lead
 * (the caller is responsible for the dedup check).
 */
async function createFubCallTask(
  _service: SupabaseClient,
  email: string,
  fubPersonId: number,
  assignedUserId: number | null,
): Promise<void> {
  if (!FUB_API_KEY) return;

  const authHeader = 'Basic ' + Buffer.from(`${FUB_API_KEY}:`).toString('base64');
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const taskBody: Record<string, unknown> = {
    type: 'Call',
    name: 'Lead has website activity today - called them about property. See website activity in lead profile',
    dueDate: today,
    personId: fubPersonId,
  };
  if (assignedUserId) {
    taskBody.assignedUserId = assignedUserId;
  }

  const res = await fetch(`${FUB_BASE}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskBody),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(
      `[track] FUB /tasks ${res.status} for ${email} (person ${fubPersonId}): ${errText.slice(0, 500)}`,
    );
  } else {
    console.log(`[track] FUB call task created for person ${fubPersonId}, due ${today}`);
  }
}

/**
 * Mirror an activity event to FUB's Website Activity timeline. Returns the
 * resolved FUB person ref (id + assigned user id) so the caller can reuse it
 * without a second API call.
 */
async function mirrorToFub(
  service: SupabaseClient,
  email: string,
  type: string,
  payload: Record<string, unknown>,
): Promise<FubPersonRef> {
  const noRef: FubPersonRef = { fubPersonId: null, assignedUserId: null };

  if (!FUB_API_KEY) return noRef;
  const fubType = FUB_MIRROR[type];
  if (!fubType) return noRef; // event kind is digest-only

  // Throttle property_viewed: at most one FUB event per (user, listing) per 24h.
  // The insert above has already committed the row we're evaluating, so a count
  // of >=2 means a prior view exists in the window and we've already mirrored.
  if (type === 'property_viewed') {
    const listingId = typeof payload.listing_id === 'string' ? payload.listing_id : null;
    if (listingId) {
      const since = new Date(Date.now() - VIEW_THROTTLE_MS).toISOString();
      const { count, error } = await service
        .from('user_activity')
        .select('id', { count: 'exact', head: true })
        .eq('user_email', email)
        .eq('event_type', 'property_viewed')
        .eq('metadata->>listing_id', listingId)
        .gte('created_at', since);
      if (error) {
        console.warn(`[track] view-throttle query failed for ${email}/${listingId}:`, error);
      } else if ((count ?? 0) > 1) {
        return noRef; // already mirrored this listing for this user in the window
      }
    }
  }

  const authHeader = 'Basic ' + Buffer.from(`${FUB_API_KEY}:`).toString('base64');

  // Identity reconciliation — look up the FUB Person by email.
  // We capture the person id and assigned-user id here so the caller can reuse
  // them for task creation without a second /people call.
  let fubPersonId: number | null = null;
  let assignedUserId: number | null = null;
  try {
    const personRes = await fetch(
      `${FUB_BASE}/people?email=${encodeURIComponent(email)}&limit=1`,
      { headers: { Authorization: authHeader } },
    );
    if (!personRes.ok) {
      console.warn(`[track] FUB person lookup ${personRes.status} for ${email}`);
    } else {
      const personData = await personRes.json().catch(() => null);
      const person = personData?.people?.[0];
      if (!person?.id) {
        console.warn(`[track] no FUB person matches ${email} — event will upsert one`);
      } else {
        fubPersonId = person.id as number;
        assignedUserId = (person.assignedTo?.id ?? person.ownerId ?? null) as number | null;
      }
    }
  } catch (err) {
    console.warn(`[track] FUB person lookup threw for ${email}:`, err);
  }

  // Build a human-readable description for the FUB note field.
  const parts: string[] = [];
  if (payload.address) parts.push(`${payload.address}`);
  if (payload.city && !payload.address) parts.push(`${payload.city}`);
  if (payload.assumable_rate !== undefined) parts.push(`${payload.assumable_rate}%`);
  if (payload.price) parts.push(`$${Number(payload.price).toLocaleString()}`);
  if (payload.monthly_savings) parts.push(`save $${Number(payload.monthly_savings).toLocaleString()}/mo`);
  const description = parts.length > 0 ? `${fubType}: ${parts.join(' · ')}` : fubType;

  const eventBody: Record<string, unknown> = {
    source: 'Website - Activity',
    system: 'assumableguy.com',
    type: fubType,
    person: { emails: [{ value: email }] },
    note: description,
  };

  // FUB's "Viewed Page" / "Viewed Property" / "Property Search" event types
  // render as clickable links in Website Activity when pageTitle + pageUrl are
  // provided. pageReferrer is optional but helps attribution. pageDuration
  // (seconds) feeds FUB's time-on-page stats.
  if (payload.page_title) eventBody.pageTitle = payload.page_title;
  if (payload.page_url) eventBody.pageUrl = payload.page_url;
  if (payload.page_referrer) eventBody.pageReferrer = payload.page_referrer;
  if (typeof payload.page_duration === 'number' && payload.page_duration >= 0) {
    eventBody.pageDuration = payload.page_duration;
  }

  const eventRes = await fetch(`${FUB_BASE}/events`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      'X-System': 'assumableguy.com',
      'X-System-Key': FUB_API_KEY,
    },
    body: JSON.stringify(eventBody),
  });

  if (!eventRes.ok) {
    const errText = await eventRes.text().catch(() => '');
    console.error(
      `[track] FUB /events ${eventRes.status} for ${email} (${type}): ${errText.slice(0, 500)}`,
    );
  }

  return { fubPersonId, assignedUserId };
}
