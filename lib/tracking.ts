/**
 * Client-side activity tracking helper.
 *
 * Fires a fire-and-forget POST to /api/track. The server resolves the user
 * identity from the Supabase session cookie — the client never passes email,
 * so anonymous visitors can't be attributed (and bots can't spoof identities).
 *
 * Usage:
 *   import { trackActivity } from '@/lib/tracking';
 *   trackActivity('property_viewed', { listing_id: 'abc', address: '...' });
 */

export type ActivityEventType =
  | 'property_viewed'
  | 'property_saved'
  | 'property_unsaved'
  | 'calculator_used'
  | 'return_visit'
  | 'market_page_visit'
  | 'page_viewed';

export interface ActivityPayload {
  listing_id?: string;
  address?: string;
  city?: string;
  price?: number;
  assumable_rate?: number;
  monthly_savings?: number;
  page_title?: string;
  page_url?: string;
  page_referrer?: string;
  page_duration?: number; // seconds spent on the page (measured on leave)
  [key: string]: unknown;
}

// Dedupe key: same (event_type, primary_id) won't fire more often than the
// window below. Survives page navigation within the same browsing context
// via sessionStorage.
const DEDUPE_WINDOW_MS: Record<ActivityEventType, number> = {
  property_viewed: 30 * 60 * 1000,   // 30 min per listing
  property_saved: 0,                  // always fire
  property_unsaved: 0,                // always fire
  calculator_used: 60 * 60 * 1000,   // 1h (don't spam on every slider adjustment)
  return_visit: 24 * 60 * 60 * 1000, // 24h — one return_visit per day max
  market_page_visit: 15 * 60 * 1000, // 15 min per city
  // page_viewed: always fire. The event is emitted on page-leave, not on
  // mount, so each event represents a distinct "finished" visit. Natural
  // sparsity comes from the act of navigating/closing, not sessionStorage.
  page_viewed: 0,
};

function dedupeKey(type: ActivityEventType, payload: ActivityPayload): string {
  const primary = payload.listing_id || payload.page_url || payload.city || type;
  return `track:${type}:${primary}`;
}

function shouldFire(type: ActivityEventType, payload: ActivityPayload): boolean {
  if (typeof window === 'undefined') return false;
  const window_ms = DEDUPE_WINDOW_MS[type] ?? 0;
  if (window_ms === 0) return true;
  try {
    const key = dedupeKey(type, payload);
    const last = sessionStorage.getItem(key);
    if (last && Date.now() - Number(last) < window_ms) return false;
    sessionStorage.setItem(key, String(Date.now()));
    return true;
  } catch {
    return true; // storage blocked → fire anyway
  }
}

export function trackActivity(type: ActivityEventType, payload: ActivityPayload = {}): void {
  if (typeof window === 'undefined') return;
  if (!shouldFire(type, payload)) return;

  // Best-effort, never blocks UI.
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, payload }),
    keepalive: true,
  }).catch(() => {
    // Swallow — tracking failures must never surface to the user.
  });
}
