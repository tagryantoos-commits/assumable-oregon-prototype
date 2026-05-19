import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Next.js
vi.mock('next/server', () => {
  class MockNextRequest {
    _body: unknown;
    headers: Map<string, string>;

    constructor(body: unknown, opts?: { headers?: Record<string, string> }) {
      this._body = body;
      this.headers = new Map(Object.entries(opts?.headers || {}));
    }

    async json() { return this._body; }
    get(name: string) { return this.headers.get(name); }
  }

  class MockNextResponse {
    _jsonData: unknown;
    status: number;

    constructor(data: unknown, init?: { status?: number }) {
      this._jsonData = data;
      this.status = init?.status || 200;
    }

    static json(data: unknown, init?: { status?: number }) {
      return new MockNextResponse(data, init);
    }
  }

  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse };
});

// Mock fs (used for local log)
vi.mock('fs', () => ({
  appendFileSync: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Set env BEFORE any module imports read them
process.env.FOLLOWUPBOSS_API_KEY = 'test_key';
process.env.N8N_WEBHOOK_URL = '';
process.env.NEXT_PUBLIC_BASE_URL = 'https://assumableguy.com';

describe('POST /api/leads', () => {
  let POST: (req: unknown) => Promise<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    // Default: FUB returns success
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });
    const mod = await import('../../app/api/leads/route');
    POST = mod.POST as (req: unknown) => Promise<unknown>;
  });

  it('captures a valid lead', async () => {
    const req = {
      json: () => Promise.resolve({
        name: 'John Smith',
        email: 'john@example.com',
        phone: '7195551234',
        source: 'listing_detail',
        formType: 'Form: Listing Inquiry',
      }),
      headers: { get: (n: string) => n === 'x-forwarded-for' ? '1.2.3.4' : null },
    };
    const res = await POST(req) as { _jsonData: { success: boolean } };
    expect(res._jsonData.success).toBe(true);
  });

  it('silently rejects honeypot submissions', async () => {
    const req = {
      json: () => Promise.resolve({
        name: 'Spammer',
        email: 'spam@bot.com',
        website: 'http://spam.com', // honeypot field
      }),
      headers: { get: () => '1.2.3.4' },
    };
    const res = await POST(req) as { _jsonData: { success: boolean } };
    // Should return success (silent rejection)
    expect(res._jsonData.success).toBe(true);
    // FUB should NOT have been called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects spam bot names silently', async () => {
    const req = {
      json: () => Promise.resolve({
        name: 'NkgeSHHHJqmLhTducBpraJX',
        email: 'bot@test.com',
        phone: '1234567890',
      }),
      headers: { get: () => '5.6.7.8' },
    };
    const res = await POST(req) as { _jsonData: { success: boolean } };
    expect(res._jsonData.success).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = {
      json: () => Promise.reject(new Error('invalid json')),
      headers: { get: () => '1.2.3.4' },
    };
    const res = await POST(req) as { status: number };
    expect(res.status).toBe(400);
  });

  it('returns 500 if FUB key is not set', async () => {
    vi.stubEnv('FOLLOWUPBOSS_API_KEY', '');
    vi.resetModules();
    const mod = await import('../../app/api/leads/route');
    const POST2 = mod.POST as (req: unknown) => Promise<unknown>;

    const req = {
      json: () => Promise.resolve({ name: 'Test', email: 'test@test.com', phone: '123' }),
      headers: { get: () => '1.2.3.4' },
    };
    const res = await POST2(req) as { status: number };
    expect(res.status).toBe(500);
  });
});

describe('Spam name detection', () => {
  // These test the isSpamName logic indirectly through the leads endpoint
  const spamNames = [
    'NkgeSHHHJqmLhTducBpraJX',
    'VRstltdTDQ',
    '4wkLtEpnhT',
    '6ytRe58xpM',
    'PzBRdqIrBb',
    'KvMIKW6gIt',
  ];

  const realNames = [
    'Ryan Thomson',
    'John Smith',
    'Pam Brown',
    'Doris',
    'Kiya',
    'Justin Daleo',
    'MaryMargaret West',
  ];

  let POST: (req: unknown) => Promise<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) });
    const mod = await import('../../app/api/leads/route');
    POST = mod.POST as (req: unknown) => Promise<unknown>;
  });

  for (const name of spamNames) {
    it(`detects "${name}" as spam`, async () => {
      mockFetch.mockClear();
      const req = {
        json: () => Promise.resolve({ name, email: 'x@x.com', phone: '123' }),
        headers: { get: () => `spam-test-${Math.random()}` },
      };
      await POST(req);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  }

  for (const name of realNames) {
    it(`allows "${name}" as real`, async () => {
      // Re-import with env set to ensure FUB_API_KEY is populated
      process.env.FOLLOWUPBOSS_API_KEY = 'test_key_for_real_names';
      vi.resetModules();
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) });
      const mod = await import('../../app/api/leads/route');
      const POST2 = mod.POST as (req: unknown) => Promise<unknown>;

      const req = {
        json: () => Promise.resolve({ name, email: 'real@test.com', phone: '7195551234' }),
        headers: { get: () => `real-test-${Math.random()}` },
      };
      await POST2(req);
      expect(mockFetch).toHaveBeenCalled();
    });
  }
});
