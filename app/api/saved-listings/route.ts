export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { createHmac } from 'crypto';
import { getListingById } from '../../../lib/listings';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const FUB_API_KEY = process.env.FOLLOWUPBOSS_API_KEY?.trim() || '';
const FUB_BASE_URL = 'https://api.followupboss.com/v1';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'tag3-cookie-secret-change-me';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

async function getUserEmail(req: NextRequest): Promise<string | null> {
  // Try Supabase auth session first (uses anon key, respects RLS)
  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) return user.email;
  } catch {
    // Silent fallback
  }

  // Fallback: HMAC-signed tag3_user cookie
  const cookie = req.cookies.get('tag3_user')?.value;
  if (!cookie) return null;
  try {
    const decoded = Buffer.from(cookie, 'base64').toString('utf-8');
    const colonIdx = decoded.lastIndexOf(':');
    if (colonIdx === -1) return null;

    const email = decoded.substring(0, colonIdx);
    const sig = decoded.substring(colonIdx + 1);

    const expectedSig = createHmac('sha256', COOKIE_SECRET).update(email).digest('hex');
    if (sig !== expectedSig) return null;

    return email.includes('@') ? email : null;
  } catch {
    return null;
  }
}

// GET /api/saved-listings — fetch user's saved listing IDs
export async function GET(req: NextRequest) {
  const email = await getUserEmail(req);
  if (!email) {
    return NextResponse.json({ savedListingIds: [] });
  }

  const sb = getSupabase();
  const { data, error } = await sb
    .from('saved_listings')
    .select('listing_id')
    .eq('user_email', email)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[SAVED] Fetch error:', error);
    return NextResponse.json({ savedListingIds: [] });
  }

  return NextResponse.json({
    savedListingIds: (data || []).map(r => r.listing_id),
  });
}

// POST /api/saved-listings — save or unsave a listing
export async function POST(req: NextRequest) {
  const email = await getUserEmail(req);
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const { listingId, action } = body as { listingId: string; action: 'save' | 'unsave' };

  if (!listingId || !action) {
    return NextResponse.json({ error: 'Missing listingId or action' }, { status: 400 });
  }

  const sb = getSupabase();

  if (action === 'save') {
    const { error } = await sb
      .from('saved_listings')
      .upsert(
        { user_email: email, listing_id: listingId },
        { onConflict: 'user_email,listing_id' }
      );

    if (error) {
      console.error('[SAVED] Save error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    // Log to user_activity for the daily digest.
    logActivity(email, 'property_saved', listingId).catch(() => {});

    // Fire-and-forget: notify agent in FUB
    notifyFUB(email, listingId).catch(err =>
      console.error('[SAVED] FUB notification failed:', err)
    );

    return NextResponse.json({ success: true, saved: true });
  }

  if (action === 'unsave') {
    const { error } = await sb
      .from('saved_listings')
      .delete()
      .eq('user_email', email)
      .eq('listing_id', listingId);

    if (error) {
      console.error('[SAVED] Unsave error:', error);
      return NextResponse.json({ error: 'Failed to unsave' }, { status: 500 });
    }

    logActivity(email, 'property_unsaved', listingId).catch(() => {});

    return NextResponse.json({ success: true, saved: false });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// Log to user_activity table for the daily digest.
async function logActivity(email: string, eventType: string, listingId: string) {
  const listing = getListingById(listingId);
  const sb = getSupabase();
  await sb.from('user_activity').insert({
    user_email: email,
    event_type: eventType,
    metadata: listing
      ? {
          listing_id: listing.id,
          address: `${listing.address}, ${listing.city}`,
          city: listing.city,
          price: listing.price,
          assumable_rate: listing.assumableRate,
        }
      : { listing_id: listingId },
  });
}

// Notify the client's agent in FUB when a listing is saved
async function notifyFUB(email: string, listingId: string) {
  if (!FUB_API_KEY) return;

  const listing = getListingById(listingId);
  if (!listing) return;

  const auth = 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64');

  // Look up person by email
  const searchRes = await fetch(
    `${FUB_BASE_URL}/people?email=${encodeURIComponent(email)}&limit=1`,
    { headers: { Authorization: auth } }
  );

  if (!searchRes.ok) return;

  const searchData = await searchRes.json();
  const person = searchData?.people?.[0];
  if (!person?.id) return;

  // Add a note about the saved listing
  await fetch(`${FUB_BASE_URL}/notes`, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personId: person.id,
      subject: 'Saved a Listing',
      body: `Saved: ${listing.address}, ${listing.city} CO — ${listing.assumableRate}% ${listing.loanType}, $${listing.price.toLocaleString()}. Equity gap: $${listing.estimatedEquityGap.toLocaleString()}.\n\nView: https://assumableguy.com/homes/${listing.id}`,
    }),
  });
}
