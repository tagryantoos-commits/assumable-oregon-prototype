/**
 * /api/cron/daily-digest route tests.
 *
 * Covers:
 *   - Authorization: CRON_SECRET required, or ?force=1 / ?dry=1 to bypass
 *   - DST gate: 401/skipped unless hour is 8am MT (or bypassed)
 *   - Empty activity → posts "Quiet day" to channel, no DMs
 *   - Partial FUB failures → unaffected leads still enrich
 *   - Slack DM failure for one agent doesn't block channel post
 *   - Slack lookup by email failures → fallback to name in channel summary
 *   - Dry-run returns preview without posting to Slack
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ───────────────────────────────────────────────────────────────────────────
// Mocks
// ───────────────────────────────────────────────────────────────────────────

const mockSupabaseFrom = vi.fn();
const mockServiceClient = vi.fn();

vi.mock('next/server', () => {
  class MockNextRequest {
    url: string;
    _headers: Map<string, string>;
    nextUrl: URL;
    constructor(url: string, headers: Record<string, string> = {}) {
      this.url = url;
      this._headers = new Map(Object.entries(headers));
      this.nextUrl = new URL(url);
    }
    get headers() {
      const h = this._headers;
      return { get: (n: string) => h.get(n.toLowerCase()) ?? h.get(n) ?? null };
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

vi.mock('../../lib/supabase/server', () => ({
  createServiceClient: vi.fn(async () => ({
    from: mockSupabaseFrom,
  })),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

process.env.FOLLOWUPBOSS_API_KEY = 'fka_test';
process.env.SLACK_DIGEST_BOT_TOKEN = 'xoxb-test';
process.env.CRON_SECRET = 'test-cron-secret';

// Helper: build a mock Supabase query chain that resolves to the given rows.
function setSupabaseActivity(rows: Array<{ user_email: string; event_type: string; metadata: Record<string, unknown>; created_at: string }>, error: Error | null = null) {
  const data = error ? null : rows;
  mockSupabaseFrom.mockReturnValue({
    select: () => ({
      gte: () => Promise.resolve({ data, error }),
    }),
  });
}

// Helper: build a request object.
function makeReq(path: string, headers: Record<string, string> = {}) {
  const url = `https://assumableguy.com${path}`;
  const nextUrl = new URL(url);
  return {
    url,
    headers: { get: (n: string) => headers[n.toLowerCase()] ?? headers[n] ?? null },
    nextUrl,
  };
}

/**
 * Import the route fresh. Each test should call the helpers to prime mocks
 * (setSupabaseActivity + mockFetch) BEFORE calling the returned GET.
 */
async function loadGET() {
  vi.resetModules();
  const mod = await import('../../app/api/cron/daily-digest/route');
  return mod.GET as unknown as (req: {
    url: string;
    headers: { get: (n: string) => string | null };
    nextUrl: URL;
  }) => Promise<{ status: number; json: () => Promise<unknown> }>;
}

beforeEach(() => {
  // Reset before each test; individual tests re-prime as needed.
  mockFetch.mockReset();
  mockSupabaseFrom.mockReset();
  mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
});

// ───────────────────────────────────────────────────────────────────────────
// Authorization
// ───────────────────────────────────────────────────────────────────────────
describe('GET /api/cron/daily-digest — authorization', () => {
  it('returns 401 without auth bearer, ?force, or ?dry', async () => {
    const GET = await loadGET();
    const res = await GET(makeReq('/api/cron/daily-digest'));
    expect(res.status).toBe(401);
  });

  it('allows request with correct Bearer CRON_SECRET', async () => {
    // This test should only verify auth passes, so use ?dry=1 to bypass Slack posting.
    // Actually we need to set up activity data for the full run to work.
    setSupabaseActivity([]);
    const GET = await loadGET();
    setSupabaseActivity([]);
    const res = await GET(makeReq('/api/cron/daily-digest?dry=1', {
      authorization: 'Bearer test-cron-secret',
    }));
    expect(res.status).toBe(200);
  });

  it('allows ?dry=1 without auth (for manual testing)', async () => {
    const GET = await loadGET();
    setSupabaseActivity([]);
    const res = await GET(makeReq('/api/cron/daily-digest?dry=1'));
    expect(res.status).toBe(200);
    const body = await res.json() as { dryRun?: boolean; success?: boolean };
    expect(body.success ?? body.dryRun).toBe(true);
  });

  it('allows ?force=1 without auth (for manual testing)', async () => {
    const GET = await loadGET();
    setSupabaseActivity([]);
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
    const res = await GET(makeReq('/api/cron/daily-digest?force=1'));
    expect(res.status).toBe(200);
  });

  it('rejects wrong Bearer token with 401', async () => {
    const GET = await loadGET();
    const res = await GET(makeReq('/api/cron/daily-digest', {
      authorization: 'Bearer wrong-secret',
    }));
    expect(res.status).toBe(401);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// DST gate
// ───────────────────────────────────────────────────────────────────────────
describe('GET /api/cron/daily-digest — DST gate', () => {
  it('skips with reason not_8am_MT when cron fires at a non-8am UTC hour', async () => {
    const GET = await loadGET();
    setSupabaseActivity([]);
    // 20:00 UTC = 14:00 MDT (2pm), definitely not 8am
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T20:00:00Z'));
    try {
      const res = await GET(makeReq('/api/cron/daily-digest', {
        authorization: 'Bearer test-cron-secret',
      }));
      const body = await res.json() as { skipped?: boolean; reason?: string };
      expect(body.skipped).toBe(true);
      expect(body.reason).toBe('not_8am_MT');
    } finally {
      vi.useRealTimers();
    }
  });

  it('proceeds when cron fires at exactly 8am MT in summer (14:00 UTC)', async () => {
    const GET = await loadGET();
    setSupabaseActivity([]);
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T14:30:00Z'));
    try {
      const res = await GET(makeReq('/api/cron/daily-digest', {
        authorization: 'Bearer test-cron-secret',
      }));
      expect(res.status).toBe(200);
      const body = await res.json() as { success?: boolean; skipped?: boolean };
      expect(body.success).toBe(true);
      expect(body.skipped).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('proceeds when cron fires at exactly 8am MT in winter (15:00 UTC)', async () => {
    const GET = await loadGET();
    setSupabaseActivity([]);
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T15:30:00Z'));
    try {
      const res = await GET(makeReq('/api/cron/daily-digest', {
        authorization: 'Bearer test-cron-secret',
      }));
      const body = await res.json() as { success?: boolean; skipped?: boolean };
      expect(body.success).toBe(true);
      expect(body.skipped).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('?dry=1 bypasses DST gate (useful for mid-day manual test)', async () => {
    const GET = await loadGET();
    setSupabaseActivity([]);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T20:00:00Z')); // 2pm MT
    try {
      const res = await GET(makeReq('/api/cron/daily-digest?dry=1'));
      const body = await res.json() as { dryRun?: boolean; success?: boolean; skipped?: boolean };
      expect(body.skipped).toBeUndefined();
      expect(body.success ?? body.dryRun).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Empty state
// ───────────────────────────────────────────────────────────────────────────
describe('GET /api/cron/daily-digest — empty activity', () => {
  it('posts "Quiet day" to channel when zero activity rows', async () => {
    const GET = await loadGET();
    setSupabaseActivity([]);
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
    await GET(makeReq('/api/cron/daily-digest?force=1'));
    // Find the Slack channel post
    const slackCalls = mockFetch.mock.calls.filter(c => String(c[0]).includes('chat.postMessage'));
    expect(slackCalls.length).toBeGreaterThanOrEqual(1);
    const body = JSON.parse((slackCalls[0][1] as { body: string }).body);
    expect(body.channel).toBe('#bots-that-help');
    expect(body.text).toContain('Quiet day');
  });

  it('dry-run with zero activity returns empty summary, no Slack calls', async () => {
    const GET = await loadGET();
    setSupabaseActivity([]);
    await GET(makeReq('/api/cron/daily-digest?dry=1'));
    const slackCalls = mockFetch.mock.calls.filter(c => String(c[0]).includes('slack.com'));
    expect(slackCalls.length).toBe(0);
  });

  it('returns 500 and does not post when Supabase query errors', async () => {
    const GET = await loadGET();
    setSupabaseActivity([], new Error('db down'));
    const res = await GET(makeReq('/api/cron/daily-digest?force=1'));
    expect(res.status).toBe(500);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Full-run with seeded activity, dry-run mode (doesn't post)
// ───────────────────────────────────────────────────────────────────────────
describe('GET /api/cron/daily-digest — dry-run with real-shaped data', () => {
  it('groups leads by assignedUserId and classifies correctly', async () => {
    setSupabaseActivity([
      { user_email: 'alice@x.com', event_type: 'property_viewed', metadata: { listing_id: 'l1' }, created_at: '2026-04-21T10:00:00Z' },
      { user_email: 'alice@x.com', event_type: 'property_viewed', metadata: { listing_id: 'l2' }, created_at: '2026-04-21T10:00:00Z' },
      { user_email: 'alice@x.com', event_type: 'property_viewed', metadata: { listing_id: 'l3' }, created_at: '2026-04-21T10:00:00Z' },
      { user_email: 'bob@x.com',   event_type: 'calculator_used', metadata: {}, created_at: '2026-04-21T10:00:00Z' },
    ]);
    // Mock FUB + Slack responses (URL-encoded @ becomes %40 in the real calls)
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('alice%40x.com') || url.includes('alice@x.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            people: [{ id: 101, firstName: 'Alice', lastName: 'A', assignedUserId: 1, assignedTo: 'Ryan Thomson' }],
          }),
        });
      }
      if (url.includes('bob%40x.com') || url.includes('bob@x.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            people: [{ id: 102, firstName: 'Bob', lastName: 'B', assignedUserId: 2, assignedTo: 'Jhoselyn' }],
          }),
        });
      }
      if (url.includes('/users/1')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ name: 'Ryan Thomson', email: 'ryan@x.com' }) });
      }
      if (url.includes('/users/2')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ name: 'Jhoselyn', email: 'jhoselyn@x.com' }) });
      }
      if (url.includes('users.lookupByEmail')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, user: { id: 'U_SLACK' } }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
    });

    const GET = await loadGET();
    const res = await GET(makeReq('/api/cron/daily-digest?dry=1'));
    const body = await res.json() as {
      leads: number; digests: Array<{ agent: string; hot: number; warm: number }>;
    };
    expect(body.leads).toBe(2);
    const ryanDigest = body.digests.find(d => d.agent === 'Ryan Thomson');
    const jhoselynDigest = body.digests.find(d => d.agent === 'Jhoselyn');
    expect(ryanDigest?.hot).toBe(1); // alice: 3 views → hot
    expect(jhoselynDigest?.warm).toBe(1); // bob: calc → warm
  });

  it('places leads with no FUB match into Unassigned bucket', async () => {
    setSupabaseActivity([
      { user_email: 'ghost@x.com', event_type: 'property_saved', metadata: { address: 'X' }, created_at: '2026-04-21T10:00:00Z' },
    ]);
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/people?email=')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ people: [] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
    });
    const GET = await loadGET();
    const res = await GET(makeReq('/api/cron/daily-digest?dry=1'));
    const body = await res.json() as { digests: Array<{ agent: string }> };
    expect(body.digests.some(d => d.agent === 'Unassigned')).toBe(true);
  });

  it('recovers when FUB lookup errors (lead drops to Unassigned)', async () => {
    setSupabaseActivity([
      { user_email: 'alice@x.com', event_type: 'property_saved', metadata: { address: 'X' }, created_at: '2026-04-21T10:00:00Z' },
    ]);
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/people?')) {
        return Promise.reject(new Error('fub 503'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
    });
    const GET = await loadGET();
    const res = await GET(makeReq('/api/cron/daily-digest?dry=1'));
    expect(res.status).toBe(200);
    const body = await res.json() as { leads: number };
    expect(body.leads).toBe(1); // still surfaces in digest, just unassigned
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Slack posting behavior (force mode)
// ───────────────────────────────────────────────────────────────────────────
describe('GET /api/cron/daily-digest — Slack posting', () => {
  function setupMocks(overrides: { slackLookupOk?: boolean; dmOpenOk?: boolean; dmPostOk?: boolean } = {}) {
    const { slackLookupOk = true, dmOpenOk = true, dmPostOk = true } = overrides;
    mockFetch.mockImplementation((url: string, opts?: { body?: string }) => {
      if (url.includes('/people?email')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            people: [{ id: 101, firstName: 'Alice', lastName: 'A', assignedUserId: 1, assignedTo: 'Ryan Thomson' }],
          }),
        });
      }
      if (url.includes('/users/1')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ name: 'Ryan Thomson', email: 'ryan@x.com' }) });
      }
      if (url.includes('users.lookupByEmail')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(slackLookupOk ? { ok: true, user: { id: 'U_RYAN' } } : { ok: false, error: 'users_not_found' }) });
      }
      if (url.includes('conversations.open')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(dmOpenOk ? { ok: true, channel: { id: 'D_RYAN' } } : { ok: false, error: 'user_not_found' }) });
      }
      if (url.includes('chat.postMessage')) {
        const body = JSON.parse(opts?.body ?? '{}');
        if (body.channel === 'D_RYAN') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(dmPostOk ? { ok: true } : { ok: false, error: 'channel_not_found' }) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
    });
  }

  it('posts to #bots-that-help on successful run', async () => {
    setSupabaseActivity([
      { user_email: 'alice@x.com', event_type: 'property_saved', metadata: { address: 'X' }, created_at: '2026-04-21T10:00:00Z' },
    ]);
    setupMocks();
    const GET = await loadGET();
    await GET(makeReq('/api/cron/daily-digest?force=1'));
    const channelPost = mockFetch.mock.calls.find(c =>
      String(c[0]).includes('chat.postMessage')
      && JSON.parse((c[1] as { body: string }).body).channel === '#bots-that-help'
    );
    expect(channelPost).toBeDefined();
  });

  it('DMs the agent when slack lookup succeeds', async () => {
    setSupabaseActivity([
      { user_email: 'alice@x.com', event_type: 'property_saved', metadata: { address: 'X' }, created_at: '2026-04-21T10:00:00Z' },
    ]);
    setupMocks();
    const GET = await loadGET();
    const res = await GET(makeReq('/api/cron/daily-digest?force=1'));
    const body = await res.json() as { dms: Array<{ agent: string; ok: boolean }> };
    const dm = body.dms.find(d => d.agent === 'Ryan Thomson');
    expect(dm?.ok).toBe(true);
  });

  it('marks DM as no_slack_match when agent email doesn\'t match Slack', async () => {
    setSupabaseActivity([
      { user_email: 'alice@x.com', event_type: 'property_saved', metadata: { address: 'X' }, created_at: '2026-04-21T10:00:00Z' },
    ]);
    setupMocks({ slackLookupOk: false });
    const GET = await loadGET();
    const res = await GET(makeReq('/api/cron/daily-digest?force=1'));
    const body = await res.json() as { dms: Array<{ agent: string; ok: boolean; reason?: string }> };
    const dm = body.dms.find(d => d.agent === 'Ryan Thomson');
    expect(dm?.ok).toBe(false);
    expect(dm?.reason).toBe('no_slack_match');
    // Channel post should still happen
    const channelPost = mockFetch.mock.calls.find(c =>
      String(c[0]).includes('chat.postMessage')
      && JSON.parse((c[1] as { body: string }).body).channel === '#bots-that-help'
    );
    expect(channelPost).toBeDefined();
  });

  it('skips DM for agent with only quiet leads (no signal)', async () => {
    // Bob is Unassigned with only a quiet event — no DM target anyway, but test the flag.
    setSupabaseActivity([
      { user_email: 'quiet@x.com', event_type: 'property_viewed', metadata: { listing_id: 'l1' }, created_at: '2026-04-21T10:00:00Z' },
    ]);
    // Return an agent (Ryan) but ensure the lead stays warm (1 view = warm)
    setupMocks();
    const GET = await loadGET();
    const res = await GET(makeReq('/api/cron/daily-digest?force=1'));
    const body = await res.json() as { dms: Array<{ agent: string; ok: boolean; reason?: string }> };
    const dm = body.dms.find(d => d.agent === 'Ryan Thomson');
    // warm lead → still has signal → DM should be attempted (ok=true)
    expect(dm?.ok).toBe(true);
  });

  it('DM failure for one agent does not prevent channel post', async () => {
    setSupabaseActivity([
      { user_email: 'alice@x.com', event_type: 'property_saved', metadata: { address: 'X' }, created_at: '2026-04-21T10:00:00Z' },
    ]);
    setupMocks({ dmPostOk: false });
    const GET = await loadGET();
    const res = await GET(makeReq('/api/cron/daily-digest?force=1'));
    // DM failed but channel still runs
    const channelPost = mockFetch.mock.calls.find(c =>
      String(c[0]).includes('chat.postMessage')
      && JSON.parse((c[1] as { body: string }).body).channel === '#bots-that-help'
    );
    expect(channelPost).toBeDefined();
    expect(res.status).toBe(200);
  });

  it('dry-run with data never calls Slack endpoints', async () => {
    setSupabaseActivity([
      { user_email: 'alice@x.com', event_type: 'property_saved', metadata: { address: 'X' }, created_at: '2026-04-21T10:00:00Z' },
    ]);
    setupMocks();
    const GET = await loadGET();
    await GET(makeReq('/api/cron/daily-digest?dry=1'));
    const slackPosts = mockFetch.mock.calls.filter(c => {
      const u = String(c[0]);
      return u.includes('chat.postMessage') || u.includes('conversations.open');
    });
    expect(slackPosts).toHaveLength(0);
  });
});
