/**
 * @vitest-environment jsdom
 *
 * Client-side tracking helper tests.
 *
 * Exercises lib/tracking.ts in a browser-like environment:
 *   - Dedupe windows per event type via sessionStorage
 *   - SSR (no window) → no-op
 *   - Storage blocked → still fires
 *   - Fire-and-forget (fetch failures don't throw)
 *   - Correct URL + body shape
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.resetModules();
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
  (globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('trackActivity — basic', () => {
  it('fires a fire-and-forget POST to /api/track with correct body shape', async () => {
    const { trackActivity } = await import('../../lib/tracking');
    trackActivity('property_saved', { listing_id: 'abc', address: '1 Main St' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/track');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.type).toBe('property_saved');
    expect(body.payload).toEqual({ listing_id: 'abc', address: '1 Main St' });
  });

  it('includes Content-Type application/json and keepalive:true', async () => {
    const { trackActivity } = await import('../../lib/tracking');
    trackActivity('property_saved', { listing_id: 'abc' });
    const opts = mockFetch.mock.calls[0][1];
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.keepalive).toBe(true);
  });

  it('never throws when fetch rejects', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    const { trackActivity } = await import('../../lib/tracking');
    expect(() => trackActivity('property_saved', { listing_id: 'abc' })).not.toThrow();
  });

  it('passes through empty payload when none provided', async () => {
    const { trackActivity } = await import('../../lib/tracking');
    trackActivity('return_visit');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.payload).toEqual({});
  });
});

describe('trackActivity — dedupe windows', () => {
  it('property_viewed fires once per listing per 30min window', async () => {
    const { trackActivity } = await import('../../lib/tracking');
    trackActivity('property_viewed', { listing_id: 'abc' });
    trackActivity('property_viewed', { listing_id: 'abc' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('different listing_ids get independent dedupe keys', async () => {
    const { trackActivity } = await import('../../lib/tracking');
    trackActivity('property_viewed', { listing_id: 'abc' });
    trackActivity('property_viewed', { listing_id: 'xyz' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('property_saved always fires (window = 0)', async () => {
    const { trackActivity } = await import('../../lib/tracking');
    trackActivity('property_saved', { listing_id: 'abc' });
    trackActivity('property_saved', { listing_id: 'abc' });
    trackActivity('property_saved', { listing_id: 'abc' });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('property_unsaved always fires (window = 0)', async () => {
    const { trackActivity } = await import('../../lib/tracking');
    trackActivity('property_unsaved', { listing_id: 'abc' });
    trackActivity('property_unsaved', { listing_id: 'abc' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('market_page_visit dedupes per city', async () => {
    const { trackActivity } = await import('../../lib/tracking');
    trackActivity('market_page_visit', { city: 'Denver' });
    trackActivity('market_page_visit', { city: 'Denver' });   // suppressed
    trackActivity('market_page_visit', { city: 'Aurora' });   // fires
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('dedupe window expires and allows re-fire after elapsing', async () => {
    const { trackActivity } = await import('../../lib/tracking');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-21T10:00:00Z'));
    trackActivity('property_viewed', { listing_id: 'abc' });
    // 31 minutes later — window for property_viewed is 30 min
    vi.setSystemTime(new Date('2026-04-21T10:31:00Z'));
    trackActivity('property_viewed', { listing_id: 'abc' });
    vi.useRealTimers();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('persists dedupe key across multiple calls within the same "session"', async () => {
    const { trackActivity } = await import('../../lib/tracking');
    trackActivity('calculator_used', { price: 450000 });
    trackActivity('calculator_used', { price: 500000 });
    trackActivity('calculator_used', { price: 600000 });
    // All dedupe to the same key (no listing_id, no city → uses 'calculator_used')
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe('trackActivity — storage edge cases', () => {
  it('fires normally when sessionStorage.getItem returns null', async () => {
    const { trackActivity } = await import('../../lib/tracking');
    // Default: storage is empty, getItem returns null
    trackActivity('property_viewed', { listing_id: 'abc' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('continues to fire when sessionStorage.setItem throws (e.g. quota)', async () => {
    const originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('QuotaExceeded'); };
    try {
      const { trackActivity } = await import('../../lib/tracking');
      // shouldFire catches the throw and returns true → fetch still fires
      trackActivity('property_viewed', { listing_id: 'abc' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    } finally {
      Storage.prototype.setItem = originalSet;
    }
  });
});

describe('trackActivity — SSR safety', () => {
  it('is a no-op when window is undefined (server-side import)', async () => {
    // Mock: simulate no-window env by stubbing window access inside the module.
    // Easiest way: spy on fetch; module already early-returns if typeof window === 'undefined'.
    // In jsdom, window exists. We test the branch indirectly by verifying
    // that server-side imports (resetModules + delete window) early-return.
    const origWindow = (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { window?: unknown }).window;
    try {
      const { trackActivity } = await import('../../lib/tracking');
      trackActivity('property_viewed', { listing_id: 'abc' });
      expect(mockFetch).not.toHaveBeenCalled();
    } finally {
      (globalThis as unknown as { window?: unknown }).window = origWindow;
    }
  });
});
