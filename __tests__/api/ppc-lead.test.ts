import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/server', () => {
  class MockNextRequest {
    _body: unknown;
    _headers: Map<string, string>;
    constructor(body: unknown, opts?: { headers?: Record<string, string> }) {
      this._body = body;
      this._headers = new Map(Object.entries(opts?.headers || {}));
    }
    async json() { return this._body; }
    get headers() {
      const h = this._headers;
      return { get: (n: string) => h.get(n) || null };
    }
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

const mockFetch = vi.fn();
global.fetch = mockFetch;
process.env.FOLLOWUPBOSS_API_KEY = 'test_ppc_key';
process.env.TELEGRAM_BOT_TOKEN = '';
process.env.N8N_WEBHOOK_URL = '';

describe('POST /api/ppc-lead', () => {
  let POST: (req: unknown) => Promise<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    process.env.FOLLOWUPBOSS_API_KEY = 'test_ppc_key';
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) });
    const mod = await import('../../app/api/ppc-lead/route');
    POST = mod.POST as (req: unknown) => Promise<unknown>;
  });

  it('captures a valid PPC lead with correct source', async () => {
    const req = {
      json: () => Promise.resolve({
        name: 'Jane Doe',
        email: 'jane@test.com',
        phone: '7195551234',
        source: 'PPC - Fort Carson VA Buyers',
        formType: 'Form: PPC - Fort Carson VA Buyers',
      }),
      headers: { get: (n: string) => n === 'x-forwarded-for' ? '10.0.0.1' : null },
    };
    const res = await POST(req) as { _jsonData: { success: boolean; fubSuccess: boolean } };
    expect(res._jsonData.success).toBe(true);
    expect(res._jsonData.fubSuccess).toBe(true);
  });

  it('returns 400 if name is missing', async () => {
    const req = {
      json: () => Promise.resolve({ email: 'test@test.com', phone: '123' }),
      headers: { get: () => '10.0.0.2' },
    };
    const res = await POST(req) as { status: number; _jsonData: { error: string } };
    expect(res.status).toBe(400);
    expect(res._jsonData.error).toContain('required');
  });

  it('returns 400 if email is missing', async () => {
    const req = {
      json: () => Promise.resolve({ name: 'Test', phone: '123' }),
      headers: { get: () => '10.0.0.3' },
    };
    const res = await POST(req) as { status: number };
    expect(res.status).toBe(400);
  });

  it('returns 400 if phone is missing', async () => {
    const req = {
      json: () => Promise.resolve({ name: 'Test', email: 'test@test.com' }),
      headers: { get: () => '10.0.0.4' },
    };
    const res = await POST(req) as { status: number };
    expect(res.status).toBe(400);
  });

  it('silently rejects honeypot submissions', async () => {
    mockFetch.mockClear();
    const req = {
      json: () => Promise.resolve({
        name: 'Bot', email: 'bot@bot.com', phone: '123',
        website: 'http://spam.com',
      }),
      headers: { get: () => '10.0.0.5' },
    };
    const res = await POST(req) as { _jsonData: { success: boolean } };
    expect(res._jsonData.success).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON', async () => {
    const req = {
      json: () => Promise.reject(new Error('bad json')),
      headers: { get: () => '10.0.0.6' },
    };
    const res = await POST(req) as { status: number };
    expect(res.status).toBe(400);
  });

  it('returns 500 if FUB key not set', async () => {
    process.env.FOLLOWUPBOSS_API_KEY = '';
    vi.resetModules();
    const mod = await import('../../app/api/ppc-lead/route');
    const POST2 = mod.POST as (req: unknown) => Promise<unknown>;

    const req = {
      json: () => Promise.resolve({ name: 'Test', email: 'test@test.com', phone: '123' }),
      headers: { get: () => '10.0.0.7' },
    };
    const res = await POST2(req) as { status: number };
    expect(res.status).toBe(500);
  });

  it('sends correct source tag for each ad group', async () => {
    const adGroups = [
      { source: 'PPC - Fort Carson VA Buyers', formType: 'Form: PPC - Fort Carson VA Buyers' },
      { source: 'PPC - Assumable Searchers', formType: 'Form: PPC - Assumable Searchers' },
      { source: 'PPC - Low Rate Seekers', formType: 'Form: PPC - Low Rate Seekers' },
    ];

    for (const ag of adGroups) {
      mockFetch.mockClear();
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) });

      const req = {
        json: () => Promise.resolve({
          name: 'Test Lead',
          email: 'test@example.com',
          phone: '7195551234',
          source: ag.source,
          formType: ag.formType,
        }),
        headers: { get: () => `source-test-${Math.random()}` },
      };
      await POST(req);

      // Verify FUB was called with the correct source
      const fubCall = mockFetch.mock.calls.find(
        (c: unknown[]) => String(c[0]).includes('followupboss.com/v1/events')
      );
      expect(fubCall, `FUB should be called for ${ag.source}`).toBeDefined();
      const fubBody = JSON.parse((fubCall![1] as { body: string }).body);
      expect(fubBody.source).toBe(ag.source);
    }
  });
});

describe('PPC form validation logic', () => {
  function validateEmail(val: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function validatePhone(val: string): boolean {
    const digits = val.replace(/\D/g, '');
    if (digits.length < 10) return false;
    const fake = ['0000000000','1111111111','2222222222','3333333333','4444444444',
                  '5555555555','6666666666','7777777777','8888888888','9999999999',
                  '5555551234','5555550100'];
    return !fake.includes(digits.slice(-10));
  }

  it('validates real email addresses', () => {
    expect(validateEmail('ryan@test.com')).toBe(true);
    expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
    expect(validateEmail('name@sub.domain.com')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('missing@')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
    expect(validateEmail('spaces in@email.com')).toBe(false);
  });

  it('validates real phone numbers', () => {
    expect(validatePhone('7195551234')).toBe(true);
    expect(validatePhone('(719) 555-1234')).toBe(true);
    expect(validatePhone('+1 719-555-1234')).toBe(true);
    expect(validatePhone('719.624.3472')).toBe(true);
  });

  it('rejects fake phone numbers', () => {
    expect(validatePhone('0000000000')).toBe(false);
    expect(validatePhone('5555555555')).toBe(false);
    expect(validatePhone('5555551234')).toBe(false);
    expect(validatePhone('123')).toBe(false);
    expect(validatePhone('')).toBe(false);
  });
});

describe('PPC variant configs', () => {
  const VARIANT_CONFIGS: Record<string, { variant: string; headline: string; source: string }> = {
    va: {
      variant: 'va',
      headline: 'PCSing to Fort Carson? See homes for sale with 2-3% VA rates.',
      source: 'PPC - Fort Carson VA Buyers',
    },
    general: {
      variant: 'general',
      headline: 'Homes for sale with 2-3% mortgage rates. See the list.',
      source: 'PPC - Assumable Searchers',
    },
    lowrate: {
      variant: 'general',
      headline: 'Save $1,100+/month on your mortgage payments!',
      source: 'PPC - Low Rate Seekers',
    },
  };

  it('has all three ad group variants', () => {
    expect(VARIANT_CONFIGS.va).toBeDefined();
    expect(VARIANT_CONFIGS.general).toBeDefined();
    expect(VARIANT_CONFIGS.lowrate).toBeDefined();
  });

  it('each variant has a unique source tag', () => {
    const sources = Object.values(VARIANT_CONFIGS).map(v => v.source);
    expect(new Set(sources).size).toBe(3);
  });

  it('source tags match Google Ads campaign naming', () => {
    expect(VARIANT_CONFIGS.va.source).toBe('PPC - Fort Carson VA Buyers');
    expect(VARIANT_CONFIGS.general.source).toBe('PPC - Assumable Searchers');
    expect(VARIANT_CONFIGS.lowrate.source).toBe('PPC - Low Rate Seekers');
  });

  it('VA variant filters to VA loan type', () => {
    expect(VARIANT_CONFIGS.va.variant).toBe('va');
  });

  it('headlines are under 90 chars (Google RSA limit)', () => {
    for (const [key, config] of Object.entries(VARIANT_CONFIGS)) {
      expect(config.headline.length, `${key} headline too long: ${config.headline.length} chars`).toBeLessThanOrEqual(90);
    }
  });
});

describe('PPC landing page URLs', () => {
  const pages = [
    { path: '/ppc/va-loan-assumption', variantKey: 'va' },
    { path: '/ppc/assumable-mortgage', variantKey: 'general' },
    { path: '/ppc/buy-home-low-rate', variantKey: 'lowrate' },
  ];

  it('all three landing pages have valid variant keys', () => {
    const validKeys = ['va', 'general', 'lowrate'];
    for (const page of pages) {
      expect(validKeys).toContain(page.variantKey);
    }
  });

  it('no duplicate variant keys across pages', () => {
    const keys = pages.map(p => p.variantKey);
    expect(new Set(keys).size).toBe(3);
  });
});
