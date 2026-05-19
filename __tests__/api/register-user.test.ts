import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Next.js modules before importing the route
vi.mock('next/server', () => {
  class MockNextResponse {
    body: unknown;
    status: number;
    _cookies: Map<string, { value: string; options: Record<string, unknown> }>;

    constructor(body: unknown, init?: { status?: number }) {
      this.body = body;
      this.status = init?.status || 200;
      this._cookies = new Map();
    }

    static json(data: unknown, init?: { status?: number }) {
      const res = new MockNextResponse(data, init);
      (res as unknown as Record<string, unknown>)._jsonData = data;
      return res;
    }

    get cookies() {
      const cookies = this._cookies;
      return {
        set(name: string, value: string, options?: Record<string, unknown>) {
          cookies.set(name, { value, options: options || {} });
        },
        get(name: string) {
          return cookies.get(name);
        },
      };
    }

    json() {
      return (this as Record<string, unknown>)._jsonData;
    }
  }

  return {
    NextRequest: vi.fn(),
    NextResponse: MockNextResponse,
  };
});

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Set env BEFORE module imports
process.env.FOLLOWUPBOSS_API_KEY = 'test_fub_key';
process.env.TELEGRAM_BOT_TOKEN = '';
process.env.TELEGRAM_CHAT_ID = '';
process.env.COOKIE_SECRET = 'test-cookie-secret';

// Helper: decode the HMAC-signed cookie value back to its email component.
// The route stores base64("<email>:<hmac-sha256>"). We mirror that format
// here so cookie-shape assertions stay readable.
import { createHmac } from 'crypto';
function signedTokenFor(email: string): string {
  const sig = createHmac('sha256', process.env.COOKIE_SECRET!).update(email).digest('hex');
  return Buffer.from(`${email}:${sig}`).toString('base64');
}

describe('POST /api/register-user', () => {
  let POST: (req: unknown) => Promise<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    const mod = await import('../../app/api/register-user/route');
    POST = mod.POST as (req: unknown) => Promise<unknown>;
  });

  it('returns 400 if email is missing', async () => {
    const req = { json: () => Promise.resolve({ name: 'Test', phone: '123' }) };
    const res = await POST(req) as { status: number };
    expect(res.status).toBe(400);
  });

  it('returns success and sets a signed session cookie for valid registration', async () => {
    // Mock FUB search (no existing person)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ people: [] }),
    });
    // Mock FUB create person
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 123 }),
    });

    const req = {
      json: () => Promise.resolve({ name: 'Ryan Test', email: 'ryan@test.com', phone: '7195551234', returning: false }),
    };
    const res = await POST(req) as {
      _jsonData: { success: boolean };
      cookies: { get: (n: string) => { value: string } | undefined };
    };

    expect(res._jsonData.success).toBe(true);
    const cookie = res.cookies.get('tag3_user');
    expect(cookie).toBeDefined();
    expect(cookie!.value).toBe(signedTokenFor('ryan@test.com'));
  });

  it('sets tag3_user cookie with correct properties', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ people: [] }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 123 }),
    });

    const req = {
      json: () => Promise.resolve({ name: 'Test', email: 'test@test.com', phone: '123', returning: false }),
    };
    const res = await POST(req) as { cookies: { get: (n: string) => { value: string; options: Record<string, unknown> } | undefined } };

    const cookie = res.cookies.get('tag3_user');
    expect(cookie).toBeDefined();
    // Cookie value is base64(email:hmac-sha256) — HMAC prevents tampering.
    expect(cookie!.value).toBe(signedTokenFor('test@test.com'));
    expect(cookie!.options.maxAge).toBe(60 * 60 * 24 * 30);
    expect(cookie!.options.path).toBe('/');
    expect(cookie!.options.httpOnly).toBe(true);
    expect(cookie!.options.secure).toBe(true);
    expect(cookie!.options.sameSite).toBe('lax');
  });

  it('skips FUB for returning users', async () => {
    const req = {
      json: () => Promise.resolve({ email: 'returning@test.com', returning: true }),
    };
    const res = await POST(req) as Record<string, unknown>;
    const data = (res as Record<string, unknown>)._jsonData as { success: boolean };

    expect(data.success).toBe(true);
    // FUB should NOT have been called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not create duplicate FUB lead for existing person', async () => {
    // Mock FUB search — person already exists
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ people: [{ id: 456, name: 'Existing Person' }] }),
    });

    const req = {
      json: () => Promise.resolve({ name: 'Existing', email: 'exists@test.com', phone: '123', returning: false }),
    };
    await POST(req);

    // Only 1 fetch call (the search), no create call
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('still returns success if FUB fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('FUB is down'));

    const req = {
      json: () => Promise.resolve({ name: 'Test', email: 'test@test.com', phone: '123', returning: false }),
    };
    const res = await POST(req) as Record<string, unknown>;
    const data = (res as Record<string, unknown>)._jsonData as { success: boolean };

    expect(data.success).toBe(true);
  });

  it('encodes the email correctly inside the signed cookie (even with special characters)', async () => {
    const req = {
      json: () => Promise.resolve({ email: 'special+chars@example.com', returning: true }),
    };
    const res = await POST(req) as {
      cookies: { get: (n: string) => { value: string } | undefined };
    };
    const cookie = res.cookies.get('tag3_user');
    expect(cookie).toBeDefined();

    // Decode: the cookie is base64("<email>:<hmac>"). Split at the last colon
    // so email domains with colons (none in practice, but belt-and-suspenders)
    // don't break the assertion.
    const decoded = Buffer.from(cookie!.value, 'base64').toString('utf-8');
    const colonIdx = decoded.lastIndexOf(':');
    expect(colonIdx).toBeGreaterThan(-1);
    expect(decoded.substring(0, colonIdx)).toBe('special+chars@example.com');
  });
});
