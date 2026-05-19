/**
 * Lead flow routing tests.
 *
 * Covers the 6-source FUB architecture:
 *   Website - Registration, Website - Buyer, Website - Seller,
 *   Website - Exit Intent, Website - Nurture, Google PPC (+ ad groups),
 *   Recruiting.
 *
 * Each test submits to /api/leads, /api/chat, or /api/auth/register with
 * a mocked fetch, then asserts the outbound FUB payload shape.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ───────────────────────────────────────────────────────────────────────────
// Next.js mocks (match the pattern used by leads.test.ts + ppc-lead.test.ts)
// ───────────────────────────────────────────────────────────────────────────
vi.mock('next/server', () => {
  class MockNextRequest {
    _body: unknown;
    _headers: Map<string, string>;
    nextUrl: { origin: string };
    constructor(body: unknown, opts?: { headers?: Record<string, string>; origin?: string }) {
      this._body = body;
      this._headers = new Map(Object.entries(opts?.headers || {}));
      this.nextUrl = { origin: opts?.origin || 'https://assumableguy.com' };
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

// Stub Supabase for exit-intent backup — the route imports it lazily but we
// prevent a real network call by making the service client return a chainable
// noop insert.
vi.mock('../../lib/supabase/server', () => ({
  createServiceClient: vi.fn(async () => ({
    from: () => ({
      insert: () => Promise.resolve({ error: null }),
    }),
  })),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

process.env.FOLLOWUPBOSS_API_KEY = 'test_key';
process.env.N8N_WEBHOOK_URL = '';
process.env.TELEGRAM_BOT_TOKEN = '';
process.env.NEXT_PUBLIC_BASE_URL = 'https://assumableguy.com';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service';
process.env.ANTHROPIC_API_KEY = 'test_anthropic';

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────
let uniqueIp = 0;
function makeReq(body: Record<string, unknown>, origin = 'https://assumableguy.com') {
  uniqueIp += 1;
  return {
    json: () => Promise.resolve(body),
    headers: { get: (n: string) => n === 'x-forwarded-for' ? `9.9.${Math.floor(uniqueIp / 250)}.${uniqueIp % 250}` : null },
    nextUrl: { origin },
  };
}

function fubEventCall() {
  return mockFetch.mock.calls.find(
    (c: unknown[]) => String(c[0]).includes('followupboss.com/v1/events')
  );
}

function fubPersonCreateCall() {
  return mockFetch.mock.calls.find(
    (c: unknown[]) =>
      String(c[0]) === 'https://api.followupboss.com/v1/people' &&
      (c[1] as { method?: string })?.method === 'POST'
  );
}

async function submitToLeads(body: Record<string, unknown>) {
  const mod = await import('../../app/api/leads/route');
  const POST = mod.POST as (req: unknown) => Promise<unknown>;
  return POST(makeReq(body));
}

// ───────────────────────────────────────────────────────────────────────────
// /api/leads — source resolution per bucket
// ───────────────────────────────────────────────────────────────────────────
describe('/api/leads — source resolution', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) });
  });

  describe('Bucket: Website - Buyer', () => {
    const buyerForms = [
      'Form: Inline CTA',
      'Form: Listing Inquiry',
      'Form: Talk to Agent',
      'Form: Modal Popup',                       // LeadCaptureModal (deleted but its formType still routes safely)
    ];
    for (const formType of buyerForms) {
      it(`"${formType}" routes to Website - Buyer`, async () => {
        await submitToLeads({
          name: 'Ryan Test', email: 'b@t.com', phone: '7195551234', formType,
        });
        const call = fubEventCall();
        expect(call, `FUB should be called for ${formType}`).toBeDefined();
        const body = JSON.parse((call![1] as { body: string }).body);
        expect(body.source).toBe('Website - Buyer');
      });
    }

    // MarketExpertForm / CastleRockExpertForm — every city market page
    // ("Talk to an Assumable Mortgage Expert in <City>") must route to
    // Website - Buyer. Exhaustive list — if a new market page is added,
    // add it here so the route-to-bucket contract is locked in.
    const marketCities = [
      'Arvada', 'Aurora', 'Boulder', 'Broomfield', 'Castle Rock',
      'Colorado Springs', 'Denver', 'Fort Collins', 'Fountain', 'Greeley',
      'Highlands Ranch', 'Lakewood', 'Longmont', 'Loveland', 'Parker',
      'Peyton', 'Pueblo', 'Thornton', 'Westminster',
    ];
    for (const city of marketCities) {
      const formType = `Form: ${city} Expert Contact`;
      it(`market page "${city}" (${formType}) routes to Website - Buyer`, async () => {
        await submitToLeads({
          name: `${city.split(' ').join('')} Test`,
          email: `expert-${city.toLowerCase().replace(/\s+/g, '-')}@t.com`,
          phone: '7195551234',
          formType,
          message: 'I am a: Buyer',
          source: `${city.toLowerCase().replace(/\s+/g, '_')}_expert_form`,
        });
        const call = fubEventCall();
        expect(call, `FUB should be called for ${city}`).toBeDefined();
        const body = JSON.parse((call![1] as { body: string }).body);
        expect(body.source).toBe('Website - Buyer');
        // Tag should preserve the city-specific formType so FUB smart lists
        // can filter by individual market page.
        expect(body.person.tags).toContain(formType);
      });
    }

    it('Form: Chatbot with interest=buyer → Website - Buyer', async () => {
      await submitToLeads({
        name: 'Chat Buyer', email: 'cb@t.com', phone: '7195551234',
        interest: 'buyer', formType: 'Form: Chatbot',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.source).toBe('Website - Buyer');
    });

    it('Form: Chatbot without interest defaults to Website - Buyer', async () => {
      await submitToLeads({
        name: 'Chat Default', email: 'cd@t.com', phone: '7195551234',
        formType: 'Form: Chatbot',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.source).toBe('Website - Buyer');
    });
  });

  describe('Bucket: Website - Seller', () => {
    const sellerForms = ['Form: Seller Valuation Request', 'Form: Seller PPC'];
    for (const formType of sellerForms) {
      it(`"${formType}" routes to Website - Seller`, async () => {
        await submitToLeads({
          name: 'Sally Seller', email: 's@t.com', phone: '7195551234', formType,
        });
        const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
        expect(body.source).toBe('Website - Seller');
      });
    }

    it('Form: Chatbot with interest=seller → Website - Seller', async () => {
      await submitToLeads({
        name: 'Chat Seller', email: 'cs@t.com', phone: '7195551234',
        interest: 'seller', formType: 'Form: Chatbot',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.source).toBe('Website - Seller');
    });

    it('capitalized "Seller" interest also routes correctly (case-insensitive)', async () => {
      await submitToLeads({
        name: 'Chat Seller', email: 'cs2@t.com', phone: '7195551234',
        interest: 'Seller', formType: 'Form: Chatbot',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.source).toBe('Website - Seller');
    });
  });

  describe('Bucket: Website - Exit Intent', () => {
    it('Form: Exit Intent → Website - Exit Intent', async () => {
      await submitToLeads({
        name: 'Exit', email: 'e@t.com', first_name: 'Exit',
        formType: 'Form: Exit Intent',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.source).toBe('Website - Exit Intent');
    });

    it('exit-intent omits phone from FUB payload even if submitted', async () => {
      await submitToLeads({
        name: 'Exit', email: 'e2@t.com', phone: '7195551234',
        formType: 'Form: Exit Intent',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.person.phones).toBeUndefined();
    });

    it('exit-intent applies 3 specific tags (Exit Intent, Nurture, Assumable Ecosystem)', async () => {
      await submitToLeads({
        name: 'Exit', email: 'e3@t.com',
        formType: 'Form: Exit Intent',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.person.tags).toEqual(
        expect.arrayContaining(['Exit Intent', 'Nurture', 'Assumable Ecosystem'])
      );
      expect(body.person.tags).toHaveLength(3);
    });
  });

  describe('Bucket: Website - Nurture', () => {
    const nurtureForms = ['Form: Course Waitlist', 'Form: AI Course Waitlist'];
    for (const formType of nurtureForms) {
      it(`"${formType}" routes to Website - Nurture`, async () => {
        await submitToLeads({
          name: 'Nurt Test', email: 'n@t.com', phone: '7195551234', formType,
        });
        const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
        expect(body.source).toBe('Website - Nurture');
      });
    }
  });

  describe('Bucket: Recruiting', () => {
    it('formType "recruiting" (lowercase) → Recruiting source', async () => {
      await submitToLeads({
        name: 'Alice Agent', email: 'r@t.com', phone: '7195551234',
        formType: 'recruiting',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.source).toBe('Recruiting');
    });

    it('recruiting tag preserves lowercase', async () => {
      await submitToLeads({
        name: 'Alice Agent', email: 'r2@t.com', phone: '7195551234',
        formType: 'recruiting',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.person.tags).toEqual(['recruiting']);
    });
  });

  describe('Bucket: Google PPC (takes precedence over formType bucket)', () => {
    it('Inline CTA + gclid → PPC ad group source (not Website - Buyer)', async () => {
      await submitToLeads({
        name: 'Ppc User', email: 'p@t.com', phone: '7195551234',
        formType: 'Form: Inline CTA',
        gclid: 'TEST_GCLID',
        utm_source: 'google', utm_medium: 'cpc',
        utm_content: 'Fort-Carson-VA',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.source).toBe('PPC - Fort Carson VA Buyers');
    });

    it('Seller Valuation + google/cpc UTMs → PPC overrides Website - Seller', async () => {
      await submitToLeads({
        name: 'Ppc Seller', email: 'ps@t.com', phone: '7195551234',
        formType: 'Form: Seller Valuation Request',
        utm_source: 'google', utm_medium: 'cpc',
        utm_content: 'Assumable-Searchers',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.source).toBe('PPC - Assumable Searchers');
    });

    it('Chatbot + gclid → PPC overrides Website - Buyer/Seller', async () => {
      await submitToLeads({
        name: 'Ppc Chat', email: 'pc@t.com', phone: '7195551234',
        formType: 'Form: Chatbot', interest: 'seller',
        gclid: 'CHAT_GCLID', utm_source: 'google', utm_medium: 'cpc',
        utm_content: 'Low-Rate-Seekers',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.source).toBe('PPC - Low Rate Seekers');
    });

    it('Unmapped ad group + gclid → generic "Google PPC"', async () => {
      await submitToLeads({
        name: 'Ppc Other', email: 'po@t.com', phone: '7195551234',
        formType: 'Form: Inline CTA',
        gclid: 'UNKNOWN_GCLID',
        utm_source: 'google', utm_medium: 'cpc',
        utm_content: 'some-new-unmapped-adgroup',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.source).toBe('Google PPC');
    });
  });

  describe('Tag assembly', () => {
    it('non-PPC buyer lead tags include formType only', async () => {
      await submitToLeads({
        name: 'Buyer One', email: 'b1@t.com', phone: '7195551234',
        formType: 'Form: Inline CTA',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.person.tags).toEqual(['Form: Inline CTA']);
    });

    it('PPC lead tags include formType AND PPC source', async () => {
      await submitToLeads({
        name: 'Ppc Tag', email: 'pt@t.com', phone: '7195551234',
        formType: 'Form: Inline CTA',
        gclid: 'TEST_GCLID',
        utm_source: 'google', utm_medium: 'cpc',
        utm_content: 'Fort-Carson-VA',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.person.tags).toEqual(
        expect.arrayContaining(['Form: Inline CTA', 'PPC - Fort Carson VA Buyers'])
      );
    });
  });

  describe('Phone handling', () => {
    it('Website - Buyer includes phone in FUB payload', async () => {
      await submitToLeads({
        name: 'Phone Test', email: 'ph@t.com', phone: '7195551234',
        formType: 'Form: Inline CTA',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.person.phones).toEqual([{ value: '7195551234', type: 'mobile' }]);
    });

    it('Website - Seller includes phone', async () => {
      await submitToLeads({
        name: 'Seller Phone', email: 'sp@t.com', phone: '7195551234',
        formType: 'Form: Seller Valuation Request',
      });
      const body = JSON.parse((fubEventCall()![1] as { body: string }).body);
      expect(body.person.phones).toEqual([{ value: '7195551234', type: 'mobile' }]);
    });
  });
});

// ───────────────────────────────────────────────────────────────────────────
// /api/auth/register — AuthGate → Website - Registration
// ───────────────────────────────────────────────────────────────────────────
describe('/api/auth/register (AuthGate)', () => {
  let POST: (req: unknown) => Promise<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    // First fetch is a search — return empty so the create path runs.
    // All subsequent fetches (person create, event create, telegram) succeed.
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/v1/people?email=')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ people: [] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1 }) });
    });
    const mod = await import('../../app/api/auth/register/route');
    POST = mod.POST as (req: unknown) => Promise<unknown>;
  });

  it('creates a FUB person with source "Website - Registration"', async () => {
    await POST(makeReq({
      firstName: 'Alex', lastName: 'Buyer',
      email: 'newuser@example.com', phone: '7195551234',
      userType: 'buyer',
    }));
    const createCall = fubPersonCreateCall();
    expect(createCall).toBeDefined();
    const payload = JSON.parse((createCall![1] as { body: string }).body);
    expect(payload.source).toBe('Website - Registration');
  });

  it('sets stage to "AG: New Lead"', async () => {
    await POST(makeReq({
      firstName: 'Alex', lastName: 'Buyer',
      email: 'newuser2@example.com', phone: '7195551234',
      userType: 'buyer',
    }));
    const payload = JSON.parse((fubPersonCreateCall()![1] as { body: string }).body);
    expect(payload.stage).toBe('AG: New Lead');
  });

  it('tags include Form: Website Registration + User Type: buyer', async () => {
    await POST(makeReq({
      firstName: 'Alex', lastName: 'Buyer',
      email: 'newuser3@example.com', phone: '7195551234',
      userType: 'buyer',
    }));
    const payload = JSON.parse((fubPersonCreateCall()![1] as { body: string }).body);
    expect(payload.tags).toEqual(
      expect.arrayContaining(['Form: Website Registration', 'User Type: buyer'])
    );
  });

  it('tags include correct User Type for agent', async () => {
    await POST(makeReq({
      firstName: 'Alex', lastName: 'Agent',
      email: 'agent@example.com', phone: '7195551234',
      userType: 'agent',
    }));
    const payload = JSON.parse((fubPersonCreateCall()![1] as { body: string }).body);
    expect(payload.tags).toContain('User Type: agent');
  });

  it('tags include correct User Type for investor', async () => {
    await POST(makeReq({
      firstName: 'Ivan', lastName: 'Investor',
      email: 'investor@example.com', phone: '7195551234',
      userType: 'investor',
    }));
    const payload = JSON.parse((fubPersonCreateCall()![1] as { body: string }).body);
    expect(payload.tags).toContain('User Type: investor');
  });

  it('event POST also uses Website - Registration source', async () => {
    await POST(makeReq({
      firstName: 'Event', lastName: 'Test',
      email: 'event@example.com', phone: '7195551234',
      userType: 'buyer',
    }));
    const eventCall = fubEventCall();
    expect(eventCall).toBeDefined();
    const eventBody = JSON.parse((eventCall![1] as { body: string }).body);
    expect(eventBody.source).toBe('Website - Registration');
  });

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeReq({
      firstName: 'NoEmail', lastName: 'Test', phone: '7195551234',
    }));
    expect((res as { status: number }).status).toBe(400);
  });

  it('skips the FUB create if the person already exists', async () => {
    mockFetch.mockReset();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/v1/people?email=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ people: [{ id: 99, firstName: 'Existing' }] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1 }) });
    });
    await POST(makeReq({
      firstName: 'Dup', lastName: 'User',
      email: 'existing@example.com', phone: '7195551234',
      userType: 'buyer',
    }));
    // Should NOT create (only the search call happened)
    expect(fubPersonCreateCall()).toBeUndefined();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// /api/chat — Alex chat widget
// ───────────────────────────────────────────────────────────────────────────
describe('/api/chat (Alex widget)', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
  });

  it('forwards interest field to /api/leads when LEAD_DATA is emitted', async () => {
    // Mock: first fetch is to anthropic, returns a reply with LEAD_DATA. Second
    // fetch is the internal POST to /api/leads — we just need to record it.
    const claudeReply = "Perfect - I'll make sure Ryan reaches out.\n" +
      'LEAD_DATA:{"name":"Sally Seller","email":"sally@example.com","phone":"7195551234","interest":"seller"}';
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes('api.anthropic.com')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(''),
          json: () => Promise.resolve({ content: [{ type: 'text', text: claudeReply }] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    });

    const mod = await import('../../app/api/chat/route');
    const POST = mod.POST as (req: unknown) => Promise<unknown>;
    const res = await POST(makeReq({
      messages: [{ role: 'user', content: '7195551234' }],
      pageUrl: 'https://assumableguy.com/',
    }));
    expect((res as { _jsonData: { leadCaptured: boolean } })._jsonData.leadCaptured).toBe(true);

    // Allow the fire-and-forget internal fetch to register in the mock
    await new Promise(r => setTimeout(r, 20));

    const leadsCall = mockFetch.mock.calls.find(
      (c: unknown[]) => String(c[0]).endsWith('/api/leads')
    );
    expect(leadsCall, 'internal POST to /api/leads should fire').toBeDefined();
    const leadsBody = JSON.parse((leadsCall![1] as { body: string }).body);
    expect(leadsBody.interest).toBe('seller');
    expect(leadsBody.formType).toBe('Form: Chatbot');
  });

  it('uses landing_url (not url) to avoid /api/leads honeypot', async () => {
    const claudeReply = 'Got it.\n' +
      'LEAD_DATA:{"name":"Brad Buyer","email":"brad@example.com","phone":"7195551234","interest":"buyer"}';
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes('api.anthropic.com')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(''),
          json: () => Promise.resolve({ content: [{ type: 'text', text: claudeReply }] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    });

    const mod = await import('../../app/api/chat/route');
    const POST = mod.POST as (req: unknown) => Promise<unknown>;
    await POST(makeReq({
      messages: [{ role: 'user', content: '7195551234' }],
      pageUrl: 'https://assumableguy.com/some-page',
    }));
    await new Promise(r => setTimeout(r, 20));

    const leadsCall = mockFetch.mock.calls.find(
      (c: unknown[]) => String(c[0]).endsWith('/api/leads')
    );
    const leadsBody = JSON.parse((leadsCall![1] as { body: string }).body);
    // The key regression: the chat route MUST NOT send `url:` (which would
    // trigger the /api/leads honeypot and silently drop the lead).
    expect(leadsBody.url).toBeUndefined();
    expect(leadsBody.landing_url).toBe('https://assumableguy.com/some-page');
  });

  it('does not fire lead capture when LEAD_DATA is missing', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes('api.anthropic.com')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(''),
          json: () => Promise.resolve({ content: [{ type: 'text', text: 'Hey! How can I help?' }] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    });

    const mod = await import('../../app/api/chat/route');
    const POST = mod.POST as (req: unknown) => Promise<unknown>;
    const res = await POST(makeReq({
      messages: [{ role: 'user', content: 'Hi' }],
    }));
    expect((res as { _jsonData: { leadCaptured: boolean } })._jsonData.leadCaptured).toBe(false);

    const leadsCall = mockFetch.mock.calls.find(
      (c: unknown[]) => String(c[0]).endsWith('/api/leads')
    );
    expect(leadsCall).toBeUndefined();
  });

  it('returns 400 if messages array is empty', async () => {
    const mod = await import('../../app/api/chat/route');
    const POST = mod.POST as (req: unknown) => Promise<unknown>;
    const res = await POST(makeReq({ messages: [] }));
    expect((res as { status: number }).status).toBe(400);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Dead-code regression — LeadCaptureModal should not exist
// ───────────────────────────────────────────────────────────────────────────
describe('Dead component regression', () => {
  it('components/LeadCaptureModal.tsx is removed', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const p = path.resolve(__dirname, '../../components/LeadCaptureModal.tsx');
    expect(fs.existsSync(p), 'LeadCaptureModal.tsx should be deleted').toBe(false);
  });
});
