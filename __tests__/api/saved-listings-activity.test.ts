/**
 * /api/saved-listings → user_activity accuracy tests.
 *
 * The save button logs activity server-side (unlike view events which
 * fire client-side via trackActivity). This means metadata comes from
 * the listing DB, not user input. Verify that:
 *   - property_saved writes the LISTING's true address/city/price/rate,
 *     not user-supplied fields (can't be spoofed)
 *   - property_unsaved logs correctly
 *   - Non-existent listing_id still logs with a fallback (audit trail)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────
const mockInsert = vi.fn();
const mockFromUpsert = vi.fn();
const mockFromDelete = vi.fn();
const mockGetUser = vi.fn();

vi.mock('next/server', () => {
  class MockNextRequest {
    _body: unknown;
    _cookies: Map<string, { value: string }>;
    constructor(body: unknown, cookies: Record<string, string> = {}) {
      this._body = body;
      this._cookies = new Map(Object.entries(cookies).map(([k, v]) => [k, { value: v }]));
    }
    async json() { return this._body; }
    get cookies() {
      const c = this._cookies;
      return {
        get: (n: string) => c.get(n),
        getAll: () => Array.from(c.entries()).map(([name, { value }]) => ({ name, value })),
      };
    }
  }
  class MockNextResponse {
    status: number;
    _body: unknown;
    constructor(body: unknown, init?: { status?: number }) {
      this._body = body;
      this.status = init?.status ?? 200;
    }
    static json(body: unknown, init?: { status?: number }) {
      return new MockNextResponse(body, init);
    }
    async json() { return this._body; }
  }
  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => {
      if (table === 'user_activity') {
        return { insert: mockInsert };
      }
      if (table === 'saved_listings') {
        return {
          upsert: mockFromUpsert,
          delete: () => ({ eq: () => ({ eq: mockFromDelete }) }),
        };
      }
      return { insert: vi.fn(), select: vi.fn(), delete: vi.fn(), upsert: vi.fn() };
    },
  })),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

// The route looks up listings by ID — mock a real-ish fixture.
vi.mock('../../lib/listings', () => ({
  getListingById: (id: string) => {
    if (id === 'l-5038-evanston') {
      return {
        id: 'l-5038-evanston',
        address: '5038 Evanston',
        city: 'Aurora',
        state: 'CO',
        price: 524900,
        assumableRate: 2.88,
        loanType: 'VA',
        estimatedEquityGap: 14930,
      };
    }
    return undefined;
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon';
process.env.FOLLOWUPBOSS_API_KEY = 'fka_test';

async function loadPOST() {
  vi.resetModules();
  mockInsert.mockReset();
  mockFromUpsert.mockReset();
  mockFromDelete.mockReset();
  mockGetUser.mockReset();
  mockFetch.mockReset();
  mockInsert.mockResolvedValue({ error: null });
  mockFromUpsert.mockResolvedValue({ error: null });
  mockFromDelete.mockResolvedValue({ error: null });
  mockGetUser.mockResolvedValue({ data: { user: { email: 'alice@example.com' } } });
  mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ people: [] }) });
  const mod = await import('../../app/api/saved-listings/route');
  return mod.POST as unknown as (req: {
    json: () => Promise<unknown>;
    cookies: { get: (n: string) => { value: string } | undefined };
  }) => Promise<{ status: number; json: () => Promise<unknown> }>;
}

function makeReq(body: unknown) {
  return {
    json: async () => body,
    cookies: { get: () => undefined },
  };
}

describe('POST /api/saved-listings — property_saved activity accuracy', () => {
  it('writes the listing\'s TRUE address/city/price/rate (from DB, not user input)', async () => {
    const POST = await loadPOST();
    // Malicious client submits fake metadata in the body. Server must ignore it.
    await POST(makeReq({
      listingId: 'l-5038-evanston',
      action: 'save',
      address: 'SPOOFED ADDRESS',
      price: 999999999,
    }));

    // Find the user_activity insert call
    const activityCall = mockInsert.mock.calls[0];
    expect(activityCall).toBeDefined();
    const row = activityCall[0];
    expect(row.user_email).toBe('alice@example.com');
    expect(row.event_type).toBe('property_saved');
    // Metadata MUST come from the server's listing lookup, not the POST body
    expect(row.metadata.address).toBe('5038 Evanston, Aurora'); // from getListingById
    expect(row.metadata.price).toBe(524900);                    // from DB, not 999999999
    expect(row.metadata.assumable_rate).toBe(2.88);
    expect(row.metadata.city).toBe('Aurora');
    expect(row.metadata.listing_id).toBe('l-5038-evanston');
    // Spoofed fields must not appear
    expect(row.metadata.address).not.toBe('SPOOFED ADDRESS');
  });

  it('property_unsaved logs the event with listing metadata', async () => {
    const POST = await loadPOST();
    await POST(makeReq({ listingId: 'l-5038-evanston', action: 'unsave' }));
    const row = mockInsert.mock.calls[0][0];
    expect(row.event_type).toBe('property_unsaved');
    expect(row.metadata.address).toBe('5038 Evanston, Aurora');
  });

  it('unknown listing_id → still logs (audit trail), metadata has listing_id only', async () => {
    const POST = await loadPOST();
    await POST(makeReq({ listingId: 'l-does-not-exist', action: 'save' }));
    const row = mockInsert.mock.calls[0][0];
    expect(row.event_type).toBe('property_saved');
    expect(row.metadata).toEqual({ listing_id: 'l-does-not-exist' });
  });

  it('anonymous request never writes to user_activity', async () => {
    const POST = await loadPOST();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    // Also no tag3_user cookie → unauthenticated
    const res = await POST(makeReq({ listingId: 'l-5038-evanston', action: 'save' }));
    expect(res.status).toBe(401);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('every save creates exactly one activity row (no double write on upsert conflict)', async () => {
    const POST = await loadPOST();
    await POST(makeReq({ listingId: 'l-5038-evanston', action: 'save' }));
    // Activity insert called exactly once per successful save
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('user_email in the activity row is EXACTLY the authenticated user (not fixable from body)', async () => {
    const POST = await loadPOST();
    mockGetUser.mockResolvedValue({ data: { user: { email: 'real-user@x.com' } } });
    await POST(makeReq({
      listingId: 'l-5038-evanston',
      action: 'save',
      user_email: 'impersonated@attacker.com', // spoof attempt
    }));
    const row = mockInsert.mock.calls[0][0];
    expect(row.user_email).toBe('real-user@x.com');
    expect(row.user_email).not.toBe('impersonated@attacker.com');
  });
});
