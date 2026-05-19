/**
 * /api/slack/events route tests.
 *
 * Contract:
 *   - URL verification challenge: echoed without signing (setup bootstrap)
 *   - Signed events: accepted and dispatched
 *   - Unsigned/tampered events: 401, never processed
 *   - Non-app_mention events: ignored silently
 *   - Cooldown per user
 *   - Slack reply posted in thread_ts of mention
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';

const mockSupabaseQuery = vi.fn();

vi.mock('next/server', () => {
  class MockNextRequest {
    _body: string;
    _headers: Map<string, string>;
    constructor(body: string, headers: Record<string, string> = {}) {
      this._body = body;
      this._headers = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    }
    async text() { return this._body; }
    get headers() {
      const h = this._headers;
      return { get: (n: string) => h.get(n.toLowerCase()) ?? null };
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
    from: () => ({
      select: () => ({
        gte: () => mockSupabaseQuery(),
      }),
    }),
  })),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const SECRET = 'test-signing-secret';
process.env.SLACK_SIGNING_SECRET = SECRET;
process.env.SLACK_DIGEST_BOT_TOKEN = 'xoxb-test';
process.env.FOLLOWUPBOSS_API_KEY = 'fka_test';

function sign(body: string, tsSecs: number): { ts: string; sig: string } {
  const ts = String(tsSecs);
  const base = `v0:${ts}:${body}`;
  const sig = 'v0=' + createHmac('sha256', SECRET).update(base).digest('hex');
  return { ts, sig };
}

function makeReq(rawBody: string, headers: Record<string, string> = {}) {
  return {
    text: async () => rawBody,
    headers: { get: (n: string) => headers[n.toLowerCase()] ?? null },
  };
}

async function loadPOST() {
  vi.resetModules();
  mockFetch.mockReset();
  mockSupabaseQuery.mockReset();
  mockSupabaseQuery.mockResolvedValue({ data: [], error: null });
  mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
  const mod = await import('../../app/api/slack/events/route');
  return mod.POST as unknown as (req: {
    text: () => Promise<string>;
    headers: { get: (n: string) => string | null };
  }) => Promise<{ status: number; json: () => Promise<unknown> }>;
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ───────────────────────────────────────────────────────────────────────────
// URL verification
// ───────────────────────────────────────────────────────────────────────────
describe('POST /api/slack/events — URL verification', () => {
  it('echoes the challenge on url_verification (no signature required)', async () => {
    const POST = await loadPOST();
    const body = JSON.stringify({ type: 'url_verification', challenge: 'abc-123' });
    const res = await POST(makeReq(body));
    expect(res.status).toBe(200);
    const data = await res.json() as { challenge: string };
    expect(data.challenge).toBe('abc-123');
  });

  it('url_verification without challenge value still ignored', async () => {
    const POST = await loadPOST();
    const body = JSON.stringify({ type: 'url_verification' });
    const res = await POST(makeReq(body));
    expect(res.status).toBe(401); // fails signature check since no challenge shortcut
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Signature verification
// ───────────────────────────────────────────────────────────────────────────
describe('POST /api/slack/events — signature verification', () => {
  it('rejects unsigned events with 401', async () => {
    const POST = await loadPOST();
    const body = JSON.stringify({ type: 'event_callback', event: { type: 'app_mention' } });
    const res = await POST(makeReq(body));
    expect(res.status).toBe(401);
  });

  it('rejects bad signature with 401', async () => {
    const POST = await loadPOST();
    const body = JSON.stringify({ type: 'event_callback', event: { type: 'app_mention' } });
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await POST(makeReq(body, {
      'x-slack-request-timestamp': ts,
      'x-slack-signature': 'v0=' + 'f'.repeat(64),
    }));
    expect(res.status).toBe(401);
  });

  it('accepts correctly-signed event_callback', async () => {
    const POST = await loadPOST();
    const body = JSON.stringify({
      type: 'event_callback',
      event: { type: 'reaction_added' }, // non-app_mention — ignored, but signature valid
    });
    const { ts, sig } = sign(body, Math.floor(Date.now() / 1000));
    const res = await POST(makeReq(body, {
      'x-slack-request-timestamp': ts,
      'x-slack-signature': sig,
    }));
    expect(res.status).toBe(200);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// app_mention handling
// ───────────────────────────────────────────────────────────────────────────
describe('POST /api/slack/events — app_mention', () => {
  function mentionBody(overrides: Partial<{ user: string; channel: string; ts: string; thread_ts: string; text: string }> = {}) {
    return JSON.stringify({
      type: 'event_callback',
      event: {
        type: 'app_mention',
        user: overrides.user ?? 'U_RYAN',
        channel: overrides.channel ?? 'C_BOTS',
        ts: overrides.ts ?? '1776900000.000100',
        thread_ts: overrides.thread_ts,
        text: overrides.text ?? '<@U_BOT>',
      },
    });
  }

  function signedHeaders(body: string) {
    const { ts, sig } = sign(body, Math.floor(Date.now() / 1000));
    return {
      'x-slack-request-timestamp': ts,
      'x-slack-signature': sig,
    };
  }

  function primeMocks(opts: { email?: string | null; fubUserId?: number | null; activity?: Array<Record<string, unknown>> } = {}) {
    const { email = 'ryan@TheAssumableGuy.com', fubUserId = 1, activity = [] } = opts;
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('users.info')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            email === null
              ? { ok: false, error: 'user_not_found' }
              : { ok: true, user: { profile: { email } } },
          ),
        });
      }
      if (url.includes('/users?limit')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            fubUserId === null
              ? { users: [] }
              : { users: [{ id: fubUserId, email: email ?? 'ryan@TheAssumableGuy.com' }] },
          ),
        });
      }
      if (url.includes('/people?email')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ people: [{ id: 999, firstName: 'Client', lastName: 'One', assignedUserId: fubUserId, assignedTo: 'Ryan Thomson' }] }),
        });
      }
      if (url.includes('chat.postMessage')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
    });
    mockSupabaseQuery.mockResolvedValue({ data: activity, error: null });
  }

  it('returns 200 and posts a Slack reply in-thread when mentioned', async () => {
    const POST = await loadPOST();
    primeMocks({});
    const body = mentionBody();
    const res = await POST(makeReq(body, signedHeaders(body)));
    expect(res.status).toBe(200);
    // Wait a tick for the async handler
    await new Promise(r => setTimeout(r, 50));
    const posts = mockFetch.mock.calls.filter(c => String(c[0]).includes('chat.postMessage'));
    expect(posts.length).toBeGreaterThanOrEqual(1);
    const postBody = JSON.parse(posts[posts.length - 1][1].body);
    expect(postBody.channel).toBe('C_BOTS');
    expect(postBody.thread_ts).toBe('1776900000.000100');
  });

  it('replies with "no activity" when user_activity is empty', async () => {
    const POST = await loadPOST();
    primeMocks({ activity: [] });
    const body = mentionBody();
    await POST(makeReq(body, signedHeaders(body)));
    await new Promise(r => setTimeout(r, 50));
    const postBody = JSON.parse(mockFetch.mock.calls.find(c => String(c[0]).includes('chat.postMessage'))![1].body);
    expect(postBody.text).toMatch(/no.*activity/i);
  });

  it('replies with digest text when user has active leads assigned', async () => {
    const POST = await loadPOST();
    primeMocks({
      activity: [{
        user_email: 'client@x.com',
        event_type: 'property_saved',
        metadata: { address: '77 Sun Up, Erie', assumable_rate: 3.75, price: 800000 },
        created_at: new Date().toISOString(),
      }],
    });
    const body = mentionBody();
    await POST(makeReq(body, signedHeaders(body)));
    await new Promise(r => setTimeout(r, 80));
    const postBody = JSON.parse(mockFetch.mock.calls.find(c => String(c[0]).includes('chat.postMessage'))![1].body);
    expect(postBody.text).toContain('77 Sun Up, Erie');
    expect(postBody.text).toContain('3.75%');
  });

  it('falls back gracefully when Slack email not resolvable', async () => {
    const POST = await loadPOST();
    primeMocks({ email: null });
    const body = mentionBody();
    await POST(makeReq(body, signedHeaders(body)));
    await new Promise(r => setTimeout(r, 50));
    const postBody = JSON.parse(mockFetch.mock.calls.find(c => String(c[0]).includes('chat.postMessage'))![1].body);
    expect(postBody.text).toMatch(/couldn't read.*email/i);
  });

  it('falls back gracefully when mentioner is not a FUB user', async () => {
    const POST = await loadPOST();
    primeMocks({ fubUserId: null });
    const body = mentionBody();
    await POST(makeReq(body, signedHeaders(body)));
    await new Promise(r => setTimeout(r, 50));
    const postBody = JSON.parse(mockFetch.mock.calls.find(c => String(c[0]).includes('chat.postMessage'))![1].body);
    expect(postBody.text).toMatch(/not showing up as an agent/i);
  });

  it('enforces a per-user cooldown (second mention within 60s gets told to wait)', async () => {
    const POST = await loadPOST();
    primeMocks({});
    const body = mentionBody();
    await POST(makeReq(body, signedHeaders(body)));
    await new Promise(r => setTimeout(r, 50));
    // Second mention from the same user
    const body2 = mentionBody({ ts: '1776900000.000200' });
    await POST(makeReq(body2, signedHeaders(body2)));
    await new Promise(r => setTimeout(r, 50));
    const posts = mockFetch.mock.calls.filter(c => String(c[0]).includes('chat.postMessage'));
    // Last reply should be the cooldown notice
    const lastBody = JSON.parse(posts[posts.length - 1][1].body);
    expect(lastBody.text).toMatch(/just asked|try again in/i);
  });

  it('uses event.ts as thread_ts when thread_ts is absent (start new thread)', async () => {
    const POST = await loadPOST();
    primeMocks({});
    const body = mentionBody({ user: 'U_NEW_USER', ts: '1776900000.777700' });
    await POST(makeReq(body, signedHeaders(body)));
    await new Promise(r => setTimeout(r, 50));
    const postBody = JSON.parse(mockFetch.mock.calls.find(c => String(c[0]).includes('chat.postMessage'))![1].body);
    expect(postBody.thread_ts).toBe('1776900000.777700');
  });

  it('ignores non-app_mention events without posting', async () => {
    const POST = await loadPOST();
    primeMocks({});
    const body = JSON.stringify({
      type: 'event_callback',
      event: { type: 'reaction_added', user: 'U1', item: { channel: 'C1' } },
    });
    await POST(makeReq(body, signedHeaders(body)));
    await new Promise(r => setTimeout(r, 30));
    const posts = mockFetch.mock.calls.filter(c => String(c[0]).includes('chat.postMessage'));
    expect(posts).toHaveLength(0);
  });
});
