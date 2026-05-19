/**
 * Kill-switch behavioral tests — verifies that even with N8N_WEBHOOK_URL set
 * and a phone number provided, the Vapi trigger and Twilio SMS agent do not
 * fire. The only thing preventing them is the VAPI_OUTBOUND_ENABLED /
 * SMS_LEAD_AGENT_ENABLED constants set to `false`. Flipping those flags
 * back to `true` would break these tests, which is the desired failure
 * mode: the re-enable must be deliberate and paired with updated tests.
 */
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

vi.mock('../../lib/supabase/server', () => ({
  createServiceClient: vi.fn(async () => ({
    from: () => ({ insert: () => Promise.resolve({ error: null }) }),
  })),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Intentionally set webhook URLs to plausible non-empty values. The whole
// point is to prove the kill-switch (not a missing env var) is what blocks
// the fire.
process.env.FOLLOWUPBOSS_API_KEY = 'test_key';
process.env.N8N_WEBHOOK_URL = 'https://n8n.test/webhook/vapi';
process.env.NEXT_PUBLIC_BASE_URL = 'https://assumableguy.com';
process.env.TELEGRAM_BOT_TOKEN = '';

function makeReq(body: Record<string, unknown>) {
  return {
    json: () => Promise.resolve(body),
    headers: { get: (n: string) => n === 'x-forwarded-for' ? `7.7.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` : null },
  };
}

function vapiWebhookCalled(): boolean {
  return mockFetch.mock.calls.some(
    (c: unknown[]) => String(c[0]).startsWith('https://n8n.test/webhook/vapi')
  );
}

function smsLeadAgentCalled(): boolean {
  return mockFetch.mock.calls.some(
    (c: unknown[]) => String(c[0]).includes('/api/sms-lead')
  );
}

// ───────────────────────────────────────────────────────────────────────────
// /api/leads — both kill switches
// ───────────────────────────────────────────────────────────────────────────
describe('/api/leads kill switches', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) });
  });

  it('does NOT fire Vapi webhook even with phone + N8N_WEBHOOK_URL set', async () => {
    const mod = await import('../../app/api/leads/route');
    const POST = mod.POST as (req: unknown) => Promise<unknown>;
    await POST(makeReq({
      name: 'Kill Switch Test',
      email: 'killswitch@test.com',
      phone: '7195551234',
      formType: 'Form: Contact',
    }));
    expect(vapiWebhookCalled()).toBe(false);
  });

  it('does NOT fire SMS lead agent even with phone set', async () => {
    const mod = await import('../../app/api/leads/route');
    const POST = mod.POST as (req: unknown) => Promise<unknown>;
    await POST(makeReq({
      name: 'Kill Switch Test',
      email: 'killswitch2@test.com',
      phone: '7195551234',
      formType: 'Form: Contact',
    }));
    expect(smsLeadAgentCalled()).toBe(false);
  });

  it('still creates the FUB event (normal lead capture still works)', async () => {
    const mod = await import('../../app/api/leads/route');
    const POST = mod.POST as (req: unknown) => Promise<unknown>;
    await POST(makeReq({
      name: 'Kill Switch Test',
      email: 'killswitch3@test.com',
      phone: '7195551234',
      formType: 'Form: Contact',
    }));
    const fubCalled = mockFetch.mock.calls.some(
      (c: unknown[]) => String(c[0]).includes('followupboss.com/v1/events')
    );
    expect(fubCalled).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// /api/ppc-lead — Vapi kill switch
// ───────────────────────────────────────────────────────────────────────────
describe('/api/ppc-lead kill switch', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) });
  });

  it('does NOT fire Vapi webhook for a PPC lead with phone + webhook URL set', async () => {
    const mod = await import('../../app/api/ppc-lead/route');
    const POST = mod.POST as (req: unknown) => Promise<unknown>;
    await POST(makeReq({
      name: 'PPC Kill Test',
      email: 'ppc-killswitch@test.com',
      phone: '7195551234',
      source: 'PPC - Fort Carson VA Buyers',
      formType: 'Form: PPC - Fort Carson VA Buyers',
    }));
    expect(vapiWebhookCalled()).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Form: Contact routes to the Website - Buyer FUB bucket (the new contact
// page's core contract — if this ever stops being true, contact-form leads
// land in the wrong pipeline).
// ───────────────────────────────────────────────────────────────────────────
describe('Form: Contact routes to Website - Buyer', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) });
  });

  it('sets FUB source to "Website - Buyer" for Form: Contact submissions', async () => {
    const mod = await import('../../app/api/leads/route');
    const POST = mod.POST as (req: unknown) => Promise<unknown>;
    await POST(makeReq({
      name: 'Contact Route Test',
      email: 'contact-route@test.com',
      phone: '7195551234',
      message: 'Testing contact form routing',
      formType: 'Form: Contact',
    }));
    const eventCall = mockFetch.mock.calls.find(
      (c: unknown[]) => String(c[0]).includes('followupboss.com/v1/events')
    );
    expect(eventCall, 'FUB event should be created').toBeDefined();
    const body = JSON.parse((eventCall![1] as { body: string }).body);
    expect(body.source).toBe('Website - Buyer');
    expect(body.person.tags).toContain('Form: Contact');
  });
});
