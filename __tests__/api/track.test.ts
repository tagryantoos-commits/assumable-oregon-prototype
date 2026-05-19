/**
 * /api/track route tests.
 *
 * Locks in contract:
 *   - Identity resolved from Supabase session cookie (server-side), never
 *     from the request body — prevents spoofing
 *   - Anonymous requests silently ignored (no-op, returns success:true)
 *   - Invalid event types rejected with 400
 *   - Writes to user_activity on auth'd requests
 *   - Mirrors to FUB for all high-signal types including property_viewed
 *     (throttled to 1x per listing per 24h). property_unsaved and
 *     market_page_visit stay digest-only.
 *   - Supabase failure doesn't block FUB mirror, and vice versa
 *   - Non-2xx FUB responses are logged (were silently swallowed before)
 *   - FUB person lookup runs before event POST (identity reconciliation)
 */
import { describe, it, expect, vi } from 'vitest';

// ───────────────────────────────────────────────────────────────────────────
// Module-level mocks — must be set up before importing the route module.
// ───────────────────────────────────────────────────────────────────────────

const mockInsert = vi.fn();
const mockGetUser = vi.fn();
// Throttle query result: { count } returned by the chained select builder.
const mockViewCount = { value: 1 as number | null, error: null as unknown };

vi.mock('next/server', () => {
  class MockNextRequest {
    _body: unknown;
    url: string;
    constructor(body: unknown, url = 'https://assumableguy.com/api/track') {
      this._body = body;
      this.url = url;
    }
    async json() {
      if (this._body === '__BAD_JSON__') throw new SyntaxError('invalid json');
      return this._body;
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

// Chained query builder mock — supports .select().eq().eq().eq().gte() awaited.
function makeSelectChain() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn(() =>
    Promise.resolve({ count: mockViewCount.value, error: mockViewCount.error }),
  );
  return chain;
}

vi.mock('../../lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
  createServiceClient: vi.fn(async () => ({
    from: (_table: string) => ({
      insert: mockInsert,
      ...makeSelectChain(),
    }),
  })),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

process.env.FOLLOWUPBOSS_API_KEY = 'fka_test';

// Helper: most mirror paths hit /people (lookup) then /events (post). Default
// both to ok:true so tests that don't care about the lookup don't break.
function defaultFetchOk() {
  mockFetch.mockImplementation(async (url: string) => {
    if (typeof url === 'string' && url.includes('/people')) {
      return { ok: true, json: async () => ({ people: [{ id: 42 }] }) };
    }
    return { ok: true, json: async () => ({}), text: async () => '' };
  });
}

// Return only the /events fetch calls, ignoring the /people lookup.
function eventCalls() {
  return mockFetch.mock.calls.filter(([url]) =>
    typeof url === 'string' && url.includes('/events'),
  );
}

async function loadPOST(opts: { user?: { email: string; id: string } | null } = {}) {
  vi.resetModules();
  mockInsert.mockReset();
  mockGetUser.mockReset();
  mockFetch.mockReset();
  mockInsert.mockResolvedValue({ error: null });
  mockViewCount.value = 1; // the row just inserted → not throttled
  mockViewCount.error = null;
  defaultFetchOk();
  const user = opts.user === null
    ? null
    : opts.user ?? { email: 'alice@example.com', id: 'sess_123' };
  mockGetUser.mockResolvedValue({ data: { user } });
  const mod = await import('../../app/api/track/route');
  return mod.POST as unknown as (req: {
    json: () => Promise<unknown>;
    url?: string;
  }) => Promise<{ status: number; json: () => Promise<unknown> }>;
}

function makeReq(body: unknown) {
  return {
    json: async () => body,
    url: 'https://assumableguy.com/api/track',
  };
}

describe('POST /api/track — auth + validation', () => {
  it('returns tracked:false for anonymous (no session)', async () => {
    const POST = await loadPOST({ user: null });
    const res = await POST(makeReq({ type: 'property_viewed', payload: { listing_id: 'x' } }));
    const body = await res.json() as { success: boolean; tracked: boolean };
    expect(body.tracked).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    const POST = await loadPOST();
    const res = await POST({ json: async () => { throw new SyntaxError('x'); } } as never);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_json' });
  });

  it('returns 400 for unknown event type', async () => {
    const POST = await loadPOST();
    const res = await POST(makeReq({ type: 'hack_me', payload: {} }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_type' });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns 400 when type is missing', async () => {
    const POST = await loadPOST();
    const res = await POST(makeReq({ payload: {} }));
    expect(res.status).toBe(400);
  });

  it('IGNORES client-supplied user_email (identity is server-derived)', async () => {
    const POST = await loadPOST();
    // Malicious client tries to attribute the event to someone else
    await POST(makeReq({
      type: 'property_saved',
      payload: { listing_id: 'x' },
      user_email: 'attacker-target@example.com',
    }));
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.user_email).toBe('alice@example.com'); // derived from session, not body
  });
});

describe('POST /api/track — Supabase persistence', () => {
  it('inserts a row with correct shape for property_viewed', async () => {
    const POST = await loadPOST();
    await POST(makeReq({
      type: 'property_viewed',
      payload: { listing_id: 'l-123', city: 'Denver', price: 450000 },
    }));
    expect(mockInsert).toHaveBeenCalledWith({
      user_email: 'alice@example.com',
      event_type: 'property_viewed',
      metadata: { listing_id: 'l-123', city: 'Denver', price: 450000 },
      session_id: 'sess_123',
    });
  });

  it('continues to FUB mirror even if Supabase insert fails', async () => {
    const POST = await loadPOST();
    mockInsert.mockRejectedValueOnce(new Error('supabase down'));
    await POST(makeReq({
      type: 'property_saved', // high-signal → mirrors to FUB
      payload: { listing_id: 'l-1' },
    }));
    // FUB fetch should still be called
    expect(mockFetch).toHaveBeenCalled();
  });
});

describe('POST /api/track — FUB mirror allowlist', () => {
  it('MIRRORS property_saved as canonical "Saved Property"', async () => {
    const POST = await loadPOST();
    await POST(makeReq({ type: 'property_saved', payload: { listing_id: 'l' } }));
    const events = eventCalls();
    expect(events).toHaveLength(1);
    const body = JSON.parse(events[0][1].body);
    expect(body.type).toBe('Saved Property');
    expect(body.person.emails[0].value).toBe('alice@example.com');
  });

  it('MIRRORS calculator_used to FUB (custom type — no canonical equivalent)', async () => {
    const POST = await loadPOST();
    await POST(makeReq({ type: 'calculator_used', payload: { price: 450000 } }));
    const events = eventCalls();
    expect(events).toHaveLength(1);
    expect(JSON.parse(events[0][1].body).type).toBe('Calculator Used');
  });

  it('MIRRORS return_visit as canonical "Visited Website"', async () => {
    const POST = await loadPOST();
    await POST(makeReq({ type: 'return_visit', payload: {} }));
    const events = eventCalls();
    expect(events).toHaveLength(1);
    expect(JSON.parse(events[0][1].body).type).toBe('Visited Website');
  });

  it('MIRRORS market_page_visit as canonical "Property Search"', async () => {
    const POST = await loadPOST();
    await POST(makeReq({ type: 'market_page_visit', payload: { city: 'Denver' } }));
    const events = eventCalls();
    expect(events).toHaveLength(1);
    expect(JSON.parse(events[0][1].body).type).toBe('Property Search');
  });

  it('MIRRORS page_viewed as canonical "Viewed Page" with pageTitle/pageUrl/pageDuration', async () => {
    const POST = await loadPOST();
    await POST(makeReq({
      type: 'page_viewed',
      payload: {
        page_title: 'The Assumable Guy',
        page_url: 'https://assumableguy.com/',
        page_referrer: 'https://google.com/',
        page_duration: 47,
      },
    }));
    const events = eventCalls();
    expect(events).toHaveLength(1);
    const body = JSON.parse(events[0][1].body);
    expect(body.type).toBe('Viewed Page');
    expect(body.pageTitle).toBe('The Assumable Guy');
    expect(body.pageUrl).toBe('https://assumableguy.com/');
    expect(body.pageReferrer).toBe('https://google.com/');
    expect(body.pageDuration).toBe(47);
  });

  it('omits pageDuration from the FUB body when payload has no page_duration', async () => {
    const POST = await loadPOST();
    await POST(makeReq({
      type: 'page_viewed',
      payload: { page_title: 'T', page_url: 'https://assumableguy.com/' },
    }));
    const body = JSON.parse(eventCalls()[0][1].body);
    expect(body.pageDuration).toBeUndefined();
  });

  it('MIRRORS property_viewed when it is the first view in the throttle window', async () => {
    const POST = await loadPOST();
    // count=1 means only the just-inserted row exists → not throttled
    mockViewCount.value = 1;
    await POST(makeReq({ type: 'property_viewed', payload: { listing_id: 'l-1' } }));
    const events = eventCalls();
    expect(events).toHaveLength(1);
    expect(JSON.parse(events[0][1].body).type).toBe('Viewed Property');
  });

  it('THROTTLES property_viewed when a prior view exists within 24h', async () => {
    const POST = await loadPOST();
    // count>=2 means the insert + at least one prior view → skip mirror
    mockViewCount.value = 2;
    await POST(makeReq({ type: 'property_viewed', payload: { listing_id: 'l-1' } }));
    expect(eventCalls()).toHaveLength(0);
    expect(mockInsert).toHaveBeenCalled(); // Supabase row still written
  });

  it('mirrors property_viewed when listing_id is missing (no throttle key available)', async () => {
    const POST = await loadPOST();
    await POST(makeReq({ type: 'property_viewed', payload: {} }));
    // No listing_id → throttle is a no-op → event fires
    expect(eventCalls()).toHaveLength(1);
  });

  it('does NOT mirror property_unsaved', async () => {
    const POST = await loadPOST();
    await POST(makeReq({ type: 'property_unsaved', payload: { listing_id: 'x' } }));
    expect(eventCalls()).toHaveLength(0);
  });

  it('FUB failure does not surface to caller (still returns success)', async () => {
    const POST = await loadPOST();
    mockFetch.mockRejectedValue(new Error('fub 500'));
    const res = await POST(makeReq({ type: 'property_saved', payload: { listing_id: 'x' } }));
    expect(res.status).toBe(200);
    expect((await res.json() as { success: boolean }).success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it('skips FUB mirror entirely when FUB_API_KEY is empty', async () => {
    const origKey = process.env.FOLLOWUPBOSS_API_KEY;
    process.env.FOLLOWUPBOSS_API_KEY = '';
    try {
      const POST = await loadPOST();
      await POST(makeReq({ type: 'property_saved', payload: { listing_id: 'x' } }));
      expect(mockFetch).not.toHaveBeenCalled(); // not even a /people lookup
      expect(mockInsert).toHaveBeenCalled();
    } finally {
      process.env.FOLLOWUPBOSS_API_KEY = origKey;
    }
  });
});

describe('POST /api/track — identity reconciliation', () => {
  it('runs a /people lookup before the /events POST', async () => {
    const POST = await loadPOST();
    await POST(makeReq({ type: 'property_saved', payload: { listing_id: 'x' } }));
    const urls = mockFetch.mock.calls.map(c => c[0] as string);
    const peopleIdx = urls.findIndex(u => u.includes('/people'));
    const eventsIdx = urls.findIndex(u => u.includes('/events'));
    expect(peopleIdx).toBeGreaterThanOrEqual(0);
    expect(eventsIdx).toBeGreaterThan(peopleIdx);
  });

  it('warns when no FUB person matches the Supabase email but still posts the event', async () => {
    const POST = await loadPOST();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/people')) {
        return { ok: true, json: async () => ({ people: [] }) };
      }
      return { ok: true, json: async () => ({}), text: async () => '' };
    });
    await POST(makeReq({ type: 'property_saved', payload: { listing_id: 'x' } }));
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/no FUB person matches alice@example\.com/),
    );
    expect(eventCalls()).toHaveLength(1); // still posts
    warn.mockRestore();
  });
});

describe('POST /api/track — FUB error visibility', () => {
  it('logs the FUB response body when /events returns non-2xx', async () => {
    const POST = await loadPOST();
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/people')) {
        return { ok: true, json: async () => ({ people: [{ id: 42 }] }) };
      }
      return {
        ok: false,
        status: 400,
        json: async () => ({}),
        text: async () => '{"errorMessage":"invalid type"}',
      };
    });
    await POST(makeReq({ type: 'property_saved', payload: { listing_id: 'x' } }));
    expect(err).toHaveBeenCalledWith(
      expect.stringMatching(/FUB \/events 400 for alice@example\.com.*invalid type/),
    );
    err.mockRestore();
  });
});

describe('POST /api/track — note formatting', () => {
  it('builds a readable note for property_saved with address + rate + price', async () => {
    const POST = await loadPOST();
    await POST(makeReq({
      type: 'property_saved',
      payload: { address: '1310 Burnham', assumable_rate: 2.68, price: 150000 },
    }));
    const body = JSON.parse(eventCalls()[0][1].body);
    expect(body.note).toContain('Saved Property');
    expect(body.note).toContain('1310 Burnham');
    expect(body.note).toContain('2.68%');
    expect(body.note).toContain('$150,000');
  });

  it('falls back to just the fubType when payload is empty', async () => {
    const POST = await loadPOST();
    await POST(makeReq({ type: 'return_visit', payload: {} }));
    expect(JSON.parse(eventCalls()[0][1].body).note).toBe('Visited Website');
  });
});
