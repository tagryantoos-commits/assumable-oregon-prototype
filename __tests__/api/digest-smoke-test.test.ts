/**
 * /api/cron/digest-smoke-test route tests.
 *
 * Contract:
 *   - 401 without auth/force
 *   - Skipped unless 7am MT hour (DST-aware)
 *   - On success (200 + JSON) → silent, no Slack calls
 *   - On failure (non-200, timeout, thrown error) → DM Ryan only, never
 *     posts to any channel
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

process.env.SLACK_DIGEST_BOT_TOKEN = 'xoxb-test';
process.env.CRON_SECRET = 'test-secret';

function makeReq(path: string, headers: Record<string, string> = {}) {
  const url = `https://assumableguy.com${path}`;
  return {
    url,
    headers: { get: (n: string) => headers[n.toLowerCase()] ?? headers[n] ?? null },
    nextUrl: new URL(url),
  };
}

async function loadGET() {
  vi.resetModules();
  const mod = await import('../../app/api/cron/digest-smoke-test/route');
  return mod.GET as unknown as (req: {
    url: string;
    headers: { get: (n: string) => string | null };
    nextUrl: URL;
  }) => Promise<{ status: number; json: () => Promise<unknown> }>;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('GET /api/cron/digest-smoke-test — authorization', () => {
  it('returns 401 without Bearer or ?force=1', async () => {
    const GET = await loadGET();
    const res = await GET(makeReq('/api/cron/digest-smoke-test'));
    expect(res.status).toBe(401);
  });

  it('allows with correct Bearer CRON_SECRET', async () => {
    const GET = await loadGET();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"dryRun":true}'),
    });
    // 13:55 UTC on a summer date = 7:55 MT (hour 7)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T13:55:00Z'));
    try {
      const res = await GET(makeReq('/api/cron/digest-smoke-test', {
        authorization: 'Bearer test-secret',
      }));
      expect(res.status).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });

  it('?force=1 bypasses auth + DST gate', async () => {
    const GET = await loadGET();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"dryRun":true}'),
    });
    // Middle of the night — DST gate would block
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T06:00:00Z'));
    try {
      const res = await GET(makeReq('/api/cron/digest-smoke-test?force=1'));
      expect(res.status).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('GET /api/cron/digest-smoke-test — MT hour gate', () => {
  it('skips at 8am MT (one hour late — not the smoke window)', async () => {
    const GET = await loadGET();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T14:55:00Z')); // 8:55 MDT
    try {
      const res = await GET(makeReq('/api/cron/digest-smoke-test', {
        authorization: 'Bearer test-secret',
      }));
      const body = await res.json() as { skipped?: boolean };
      expect(body.skipped).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('fires at 7am MT (smoke window) in summer MDT', async () => {
    const GET = await loadGET();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"dryRun":true,"success":true}'),
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T13:55:00Z')); // 7:55 MDT
    try {
      const res = await GET(makeReq('/api/cron/digest-smoke-test', {
        authorization: 'Bearer test-secret',
      }));
      const body = await res.json() as { success?: boolean; skipped?: boolean };
      expect(body.success).toBe(true);
      expect(body.skipped).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('fires at 7am MT in winter MST', async () => {
    const GET = await loadGET();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"dryRun":true,"success":true}'),
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T14:55:00Z')); // 7:55 MST
    try {
      const res = await GET(makeReq('/api/cron/digest-smoke-test', {
        authorization: 'Bearer test-secret',
      }));
      const body = await res.json() as { success?: boolean; skipped?: boolean };
      expect(body.success).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('GET /api/cron/digest-smoke-test — failure handling', () => {
  it('on healthy digest (200 + JSON) → no Slack calls, silent success', async () => {
    const GET = await loadGET();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"dryRun":true,"leads":3}'),
    });
    await GET(makeReq('/api/cron/digest-smoke-test?force=1'));
    const slackCalls = mockFetch.mock.calls.filter(c => String(c[0]).includes('slack.com'));
    expect(slackCalls).toHaveLength(0);
  });

  it('on 404 from digest route → DMs Ryan, never posts to channel', async () => {
    const GET = await loadGET();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/cron/daily-digest')) {
        return Promise.resolve({
          ok: false,
          status: 404,
          text: () => Promise.resolve('<!DOCTYPE html>404...'),
        });
      }
      if (url.includes('conversations.open')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, channel: { id: 'D_RYAN' } }),
        });
      }
      if (url.includes('chat.postMessage')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
    });
    const res = await GET(makeReq('/api/cron/digest-smoke-test?force=1'));
    expect(res.status).toBe(500);
    // Verify DM was sent to Ryan's DM channel ID, not a channel name
    const posts = mockFetch.mock.calls.filter(c => String(c[0]).includes('chat.postMessage'));
    expect(posts).toHaveLength(1);
    const body = JSON.parse((posts[0][1] as { body: string }).body);
    expect(body.channel).toBe('D_RYAN'); // opened via conversations.open for U0A5XAJ6DRC
    expect(body.text).toContain('FAILED');
    expect(body.text).toContain('404');
  });

  it('on fetch timeout/throw → DMs Ryan with error message', async () => {
    const GET = await loadGET();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/cron/daily-digest')) {
        return Promise.reject(new Error('ECONNREFUSED'));
      }
      if (url.includes('conversations.open')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, channel: { id: 'D_RYAN' } }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
    });
    const res = await GET(makeReq('/api/cron/digest-smoke-test?force=1'));
    expect(res.status).toBe(500);
    const posts = mockFetch.mock.calls.filter(c => String(c[0]).includes('chat.postMessage'));
    expect(posts).toHaveLength(1);
    const body = JSON.parse((posts[0][1] as { body: string }).body);
    expect(body.text).toContain('ECONNREFUSED');
  });

  it('on non-JSON 200 response (HTML) → treats as failure, DMs Ryan', async () => {
    const GET = await loadGET();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/cron/daily-digest')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('<!DOCTYPE html><html>...'),
        });
      }
      if (url.includes('conversations.open')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, channel: { id: 'D_RYAN' } }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
    });
    const res = await GET(makeReq('/api/cron/digest-smoke-test?force=1'));
    expect(res.status).toBe(500);
    // Should have sent DM
    expect(mockFetch.mock.calls.some(c => String(c[0]).includes('chat.postMessage'))).toBe(true);
  });

  it('smoke test failure never posts to channels (only DM)', async () => {
    const GET = await loadGET();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/cron/daily-digest')) {
        return Promise.resolve({ ok: false, status: 503, text: () => Promise.resolve('Service Unavailable') });
      }
      if (url.includes('conversations.open')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, channel: { id: 'D_RYAN' } }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
    });
    await GET(makeReq('/api/cron/digest-smoke-test?force=1'));
    // Verify NO call targeted a #channel name
    const channelPosts = mockFetch.mock.calls.filter(c => {
      if (!String(c[0]).includes('chat.postMessage')) return false;
      const body = JSON.parse(((c[1] as { body: string }) ?? { body: '{}' }).body);
      return typeof body.channel === 'string' && body.channel.startsWith('#');
    });
    expect(channelPosts).toHaveLength(0);
  });
});
