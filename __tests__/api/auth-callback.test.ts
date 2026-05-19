/**
 * /auth/callback route tests.
 *
 * The callback handles PKCE code exchange (and the token_hash variant) for the
 * Supabase password-reset flow. It's the missing piece that prevented
 * resetPasswordForEmail links from working before 2026-04-21.
 *
 * Expectations:
 *   - ?code=X → exchangeCodeForSession(X) then redirect to `next`
 *   - ?token_hash=X&type=recovery → verifyOtp(...) then redirect to `next`
 *   - No code/token_hash → redirect to /auth/reset-password?error=missing_code
 *   - Exchange error → redirect to `next?error=...`
 *   - `next` must start with `/` (open-redirect protection)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/server', () => {
  class MockNextRequest {
    url: string;
    constructor(url: string) { this.url = url; }
  }
  class MockNextResponse {
    static redirect(location: string) {
      return { status: 307, headers: { location } };
    }
  }
  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse };
});

const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();

vi.mock('../../lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession, verifyOtp },
  })),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon';

type RouteReq = { url: string };
type RouteRes = { status: number; headers: { location: string } };

async function loadGET() {
  vi.resetModules();
  exchangeCodeForSession.mockReset();
  verifyOtp.mockReset();
  const mod = await import('../../app/auth/callback/route');
  return mod.GET as unknown as (req: RouteReq) => Promise<RouteRes>;
}

function url(path: string) {
  return `https://assumableguy.com${path}`;
}

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exchanges a PKCE code and redirects to `next` on success', async () => {
    const GET = await loadGET();
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });
    const res = await GET({ url: url('/auth/callback?code=abc123&next=/auth/reset-password') });
    expect(exchangeCodeForSession).toHaveBeenCalledWith('abc123');
    expect(res.status).toBe(307);
    expect(res.headers.location).toBe('https://assumableguy.com/auth/reset-password');
  });

  it('defaults `next` to "/" when omitted', async () => {
    const GET = await loadGET();
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });
    const res = await GET({ url: url('/auth/callback?code=abc') });
    expect(res.headers.location).toBe('https://assumableguy.com/');
  });

  it('redirects with ?error=... when code exchange fails', async () => {
    const GET = await loadGET();
    exchangeCodeForSession.mockResolvedValueOnce({ error: { message: 'invalid grant' } });
    const res = await GET({ url: url('/auth/callback?code=bad&next=/auth/reset-password') });
    expect(res.status).toBe(307);
    expect(res.headers.location).toMatch(/\/auth\/reset-password\?error=invalid%20grant/);
  });

  it('verifies token_hash + type=recovery via verifyOtp', async () => {
    const GET = await loadGET();
    verifyOtp.mockResolvedValueOnce({ error: null });
    const res = await GET({
      url: url('/auth/callback?token_hash=tok_abc&type=recovery&next=/auth/reset-password'),
    });
    expect(verifyOtp).toHaveBeenCalledWith({ type: 'recovery', token_hash: 'tok_abc' });
    expect(res.headers.location).toBe('https://assumableguy.com/auth/reset-password');
  });

  it('surfaces verifyOtp errors with ?error=... on redirect', async () => {
    const GET = await loadGET();
    verifyOtp.mockResolvedValueOnce({ error: { message: 'token expired' } });
    const res = await GET({
      url: url('/auth/callback?token_hash=tok&type=recovery&next=/auth/reset-password'),
    });
    expect(res.headers.location).toMatch(/\/auth\/reset-password\?error=token%20expired/);
  });

  it('redirects to /auth/reset-password?error=missing_code when no code or token_hash', async () => {
    const GET = await loadGET();
    const res = await GET({ url: url('/auth/callback') });
    expect(res.status).toBe(307);
    expect(res.headers.location).toBe(
      'https://assumableguy.com/auth/reset-password?error=missing_code'
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('blocks open-redirect attempts by forcing `next` to start with /', async () => {
    const GET = await loadGET();
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });
    const res = await GET({
      url: url('/auth/callback?code=abc&next=https://evil.example.com/steal'),
    });
    // `next` didn't start with "/", so route falls back to "/"
    expect(res.headers.location).toBe('https://assumableguy.com/');
  });

  it('preserves `next` paths that already include query strings when appending error', async () => {
    const GET = await loadGET();
    exchangeCodeForSession.mockResolvedValueOnce({ error: { message: 'x' } });
    const res = await GET({
      url: url('/auth/callback?code=bad&next=/auth/reset-password%3Fsource%3Demail'),
    });
    // URL-decoded `next` is /auth/reset-password?source=email, so error joins with &
    expect(res.headers.location).toContain('/auth/reset-password?source=email&error=');
  });
});
