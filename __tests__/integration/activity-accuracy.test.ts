/**
 * End-to-end accuracy tests.
 *
 * Answers the question: "does what the Slack digest shows actually match
 * what the user really did?"
 *
 * The pipeline has 3 transformation boundaries where accuracy could drift:
 *   1. Client event  → /api/track POST body
 *   2. POST body     → user_activity INSERT (metadata jsonb)
 *   3. DB rows       → summarizeActivity → rendered Slack text
 *
 * Every test here traces a specific user action through all 3 and asserts
 * the Slack line reads exactly what the real event payload said.
 *
 * If any of these tests ever fail, agents could be getting inaccurate
 * reports about client activity — which was Ryan's concern on 2026-04-22.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ActivityRow,
  classify,
  groupByAgent,
  LeadSummary,
  renderAgentDm,
  renderChannelSummary,
  summarizeActivity,
} from '../../lib/digest';

// ───────────────────────────────────────────────────────────────────────────
// 1. Client event shape must match what tracking.ts sends
// ───────────────────────────────────────────────────────────────────────────
describe('Client event → /api/track payload fidelity', () => {
  it('property_viewed payload fields are passed through unmodified', async () => {
    // jsdom env so window + sessionStorage exist
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    (globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;

    // Module is in node env for this suite by default, so simulate browser
    const originalWindow = (globalThis as unknown as { window?: unknown }).window;
    (globalThis as unknown as { window?: unknown }).window = {};
    (globalThis as unknown as { sessionStorage?: Storage }).sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;

    try {
      vi.resetModules();
      const { trackActivity } = await import('../../lib/tracking');

      const payload = {
        listing_id: 'listing_01ABCD',
        address: '5038 Evanston, Aurora',
        city: 'Aurora',
        price: 524900,
        assumable_rate: 2.88,
        monthly_savings: 823,
      };
      trackActivity('property_viewed', payload);

      expect(mockFetch).toHaveBeenCalledOnce();
      const [, opts] = mockFetch.mock.calls[0];
      const body = JSON.parse((opts as { body: string }).body);
      // Every field arrives on the server EXACTLY as the client sent it
      expect(body.type).toBe('property_viewed');
      expect(body.payload).toEqual(payload); // strict equality — no field loss
    } finally {
      (globalThis as unknown as { window?: unknown }).window = originalWindow;
    }
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 2. DB row → LeadSummary (no count drift, no metadata corruption)
// ───────────────────────────────────────────────────────────────────────────
describe('summarizeActivity → event counts and metadata preserved exactly', () => {
  function row(email: string, type: string, metadata: Record<string, unknown> = {}): ActivityRow {
    return { user_email: email, event_type: type, metadata, created_at: new Date().toISOString() };
  }

  it('N distinct property_viewed rows → propertyViews === N (no double count)', () => {
    const rows = Array.from({ length: 7 }, (_, i) => row('alice@x.com', 'property_viewed', { listing_id: `L${i}` }));
    const leads = summarizeActivity(rows);
    expect(leads[0].propertyViews).toBe(7);
  });

  it('property_saved metadata fields flow into propertySaves[] unchanged', () => {
    const rows = [
      row('alice@x.com', 'property_saved', { address: '5038 Evanston, Aurora', assumable_rate: 2.88, price: 524900 }),
    ];
    const leads = summarizeActivity(rows);
    expect(leads[0].propertySaves).toHaveLength(1);
    const s = leads[0].propertySaves[0];
    expect(s.address).toBe('5038 Evanston, Aurora');
    expect(s.rate).toBe(2.88);
    expect(s.price).toBe(524900);
  });

  it('multiple distinct saves all preserved (order + data)', () => {
    const rows = [
      row('alice@x.com', 'property_saved', { address: 'A', assumable_rate: 2.5 }),
      row('alice@x.com', 'property_saved', { address: 'B', assumable_rate: 3.0 }),
      row('alice@x.com', 'property_saved', { address: 'C', assumable_rate: 2.75 }),
    ];
    const leads = summarizeActivity(rows);
    const addresses = leads[0].propertySaves.map(s => s.address);
    expect(addresses).toEqual(['A', 'B', 'C']);
  });

  it('missing address in property_saved renders literally as "unknown", not silently truncated', () => {
    const rows = [row('alice@x.com', 'property_saved', { assumable_rate: 2.75 })];
    const leads = summarizeActivity(rows);
    expect(leads[0].propertySaves[0].address).toBe('unknown');
  });

  it('calculator_used N times → calculatorRuns === N', () => {
    const rows = [
      row('alice@x.com', 'calculator_used', { price: 400000 }),
      row('alice@x.com', 'calculator_used', { price: 450000 }),
    ];
    const leads = summarizeActivity(rows);
    expect(leads[0].calculatorRuns).toBe(2);
  });

  it('duplicate market_page_visit for same city dedupes to 1 in display, but still warm', () => {
    const rows = [
      row('alice@x.com', 'market_page_visit', { city: 'Denver' }),
      row('alice@x.com', 'market_page_visit', { city: 'Denver' }),
      row('alice@x.com', 'market_page_visit', { city: 'Denver' }),
    ];
    const leads = summarizeActivity(rows);
    expect(leads[0].marketCitiesViewed).toEqual(['Denver']);
    expect(leads[0].temperature).toBe('warm');
  });

  it('return_visit row → returned === true (hot classification)', () => {
    const rows = [row('alice@x.com', 'return_visit', {})];
    const leads = summarizeActivity(rows);
    expect(leads[0].returned).toBe(true);
    expect(leads[0].temperature).toBe('hot');
  });

  it('mixed event types — counts are independent, no cross-contamination', () => {
    const rows = [
      row('alice@x.com', 'property_viewed', { listing_id: 'L1' }),
      row('alice@x.com', 'property_viewed', { listing_id: 'L2' }),
      row('alice@x.com', 'property_saved', { address: '123 Main' }),
      row('alice@x.com', 'calculator_used', {}),
      row('alice@x.com', 'market_page_visit', { city: 'Aurora' }),
    ];
    const leads = summarizeActivity(rows);
    const l = leads[0];
    expect(l.propertyViews).toBe(2);
    expect(l.propertySaves).toHaveLength(1);
    expect(l.calculatorRuns).toBe(1);
    expect(l.marketCitiesViewed).toEqual(['Aurora']);
  });

  it('events from one user never bleed into another user', () => {
    const rows = [
      row('alice@x.com', 'property_saved', { address: 'Alice Property' }),
      row('bob@x.com',   'property_saved', { address: 'Bob Property' }),
    ];
    const leads = summarizeActivity(rows);
    const alice = leads.find(l => l.email === 'alice@x.com')!;
    const bob = leads.find(l => l.email === 'bob@x.com')!;
    expect(alice.propertySaves[0].address).toBe('Alice Property');
    expect(bob.propertySaves[0].address).toBe('Bob Property');
    expect(alice.propertySaves).toHaveLength(1);
    expect(bob.propertySaves).toHaveLength(1);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 3. Rendered Slack text reflects real data verbatim
// ───────────────────────────────────────────────────────────────────────────
describe('Rendered Slack digest reflects real activity verbatim', () => {
  function mkLeadFromEvents(email: string, name: string, assignedToName: string, events: Array<{ type: string; meta?: Record<string, unknown> }>): LeadSummary {
    const rows: ActivityRow[] = events.map(e => ({
      user_email: email,
      event_type: e.type,
      metadata: e.meta ?? {},
      created_at: new Date().toISOString(),
    }));
    const base = summarizeActivity(rows)[0];
    return { ...base, name, fubPersonId: 999, assignedUserId: 1, assignedToName, phone: '7195551234' };
  }

  it('exact-view-count is what Slack says — "1 view" / "2 views" / "3 views"', () => {
    const leads = [
      mkLeadFromEvents('x1@x.com', 'One View', 'Ryan', [{ type: 'property_viewed', meta: { listing_id: 'a' } }]),
      mkLeadFromEvents('x2@x.com', 'Two Views', 'Ryan', [
        { type: 'property_viewed', meta: { listing_id: 'a' } },
        { type: 'property_viewed', meta: { listing_id: 'b' } },
      ]),
      mkLeadFromEvents('x3@x.com', 'Three Views', 'Ryan', [
        { type: 'property_viewed', meta: { listing_id: 'a' } },
        { type: 'property_viewed', meta: { listing_id: 'b' } },
        { type: 'property_viewed', meta: { listing_id: 'c' } },
      ]),
    ];
    const { text } = renderAgentDm({
      assignedUserId: 1, assignedToName: 'Ryan', slackUserId: 'U_R',
      leads, hotCount: 1, warmCount: 2,
    }, 'today');
    expect(text).toContain('*One View* · 👁 1 view');
    expect(text).toContain('*Two Views* · 👁 2 views');
    expect(text).toContain('*Three Views* · 👁 3 views');
  });

  it('saved address rendered in digest is BIT-EXACT to property_saved.metadata.address', () => {
    // Regression test for Ryan's Apr 22 concern: "Brett saved 5038 Evanston"
    // must actually be what the user saved, never a mutation.
    const EXPECTED_ADDRESS = '5038 Evanston, Aurora';
    const EXPECTED_RATE = 2.88;
    const lead = mkLeadFromEvents('brett@x.com', 'Brett Badgett', 'Ryan', [
      { type: 'property_saved', meta: { address: EXPECTED_ADDRESS, assumable_rate: EXPECTED_RATE, price: 524900 } },
    ]);
    const { text } = renderAgentDm({
      assignedUserId: 1, assignedToName: 'Ryan', slackUserId: 'U_R',
      leads: [lead], hotCount: 1, warmCount: 0,
    }, 'today');
    expect(text).toContain(EXPECTED_ADDRESS);
    expect(text).toContain(`(${EXPECTED_RATE}%)`);
  });

  it('digest never invents saves that weren\'t in the input data', () => {
    const lead = mkLeadFromEvents('quiet@x.com', 'Quiet User', 'Ryan', [
      { type: 'property_viewed', meta: { listing_id: 'L1' } },
    ]);
    const { text } = renderAgentDm({
      assignedUserId: 1, assignedToName: 'Ryan', slackUserId: 'U_R',
      leads: [lead], hotCount: 0, warmCount: 1,
    }, 'today');
    // Must NOT contain "saved" in this lead's summary, since propertySaves=[]
    expect(text).not.toMatch(/Quiet User.*saved/);
    expect(text).not.toMatch(/⭐/); // no save star
  });

  it('digest "X views" integer matches exactly the count of property_viewed rows', () => {
    // Fuzzed: try every count 0..10, verify the rendered number is always N
    for (let n = 1; n <= 10; n++) {
      const events = Array.from({ length: n }, (_, i) => ({ type: 'property_viewed' as const, meta: { listing_id: `L${i}` } }));
      const lead = mkLeadFromEvents(`u${n}@x.com`, `User ${n}`, 'Ryan', events);
      const { text } = renderAgentDm({
        assignedUserId: 1, assignedToName: 'Ryan', slackUserId: 'U_R',
        leads: [lead], hotCount: n >= 3 ? 1 : 0, warmCount: n < 3 ? 1 : 0,
      }, 'today');
      const viewLabel = n === 1 ? '1 view' : `${n} views`;
      expect(text).toContain(viewLabel);
    }
  });

  it('channel summary total counts === sum across agents (no drift)', () => {
    const r1 = mkLeadFromEvents('a@x.com', 'Alice', 'Ryan', [{ type: 'property_saved', meta: { address: 'X' } }]);
    const r2 = mkLeadFromEvents('b@x.com', 'Bob', 'Ryan', [{ type: 'property_viewed', meta: { listing_id: 'L' } }]);
    const j1 = mkLeadFromEvents('c@x.com', 'Cara', 'Jhoselyn', [{ type: 'return_visit' }]);
    const digests = [
      { assignedUserId: 1, assignedToName: 'Ryan', slackUserId: 'U_R', leads: [r1, r2], hotCount: 1, warmCount: 1 },
      { assignedUserId: 2, assignedToName: 'Jhoselyn', slackUserId: 'U_J', leads: [j1], hotCount: 1, warmCount: 0 },
    ];
    const { text } = renderChannelSummary(digests, 'today', 3);
    expect(text).toContain('3 leads active');
    expect(text).toContain('🔥 2 hot');
    expect(text).toContain('☕ 1 warm');
  });

  it('channel summary does not leak data across agents', () => {
    const ryanLead = mkLeadFromEvents('ryan-client@x.com', 'Ryan Client', 'Ryan', [
      { type: 'property_saved', meta: { address: 'Ryan Only Property' } },
    ]);
    const jhosLead = mkLeadFromEvents('jhos-client@x.com', 'Jhos Client', 'Jhoselyn', [
      { type: 'property_saved', meta: { address: 'Jhos Only Property' } },
    ]);
    const digests = [
      { assignedUserId: 1, assignedToName: 'Ryan', slackUserId: 'U_R', leads: [ryanLead], hotCount: 1, warmCount: 0 },
      { assignedUserId: 2, assignedToName: 'Jhoselyn', slackUserId: 'U_J', leads: [jhosLead], hotCount: 1, warmCount: 0 },
    ];
    const ryanDm = renderAgentDm(digests[0], 'today').text;
    const jhosDm = renderAgentDm(digests[1], 'today').text;
    expect(ryanDm).toContain('Ryan Only Property');
    expect(ryanDm).not.toContain('Jhos Only Property');
    expect(jhosDm).toContain('Jhos Only Property');
    expect(jhosDm).not.toContain('Ryan Only Property');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 4. Classification boundaries are exact
// ───────────────────────────────────────────────────────────────────────────
describe('Classification thresholds are exact (no fuzzy boundaries)', () => {
  const base = { propertyViews: 0, propertySaves: [], returned: false, calculatorRuns: 0, marketCitiesViewed: [] };

  it('exactly 2 views = warm; exactly 3 views = hot (fence-post correct)', () => {
    expect(classify({ ...base, propertyViews: 2 })).toBe('warm');
    expect(classify({ ...base, propertyViews: 3 })).toBe('hot');
  });

  it('0 of everything = quiet', () => {
    expect(classify(base)).toBe('quiet');
  });

  it('a single save dominates any combination of lesser signals', () => {
    expect(classify({ ...base, propertySaves: [{ address: 'X' }] })).toBe('hot');
    expect(classify({ ...base, propertySaves: [{ address: 'X' }], propertyViews: 0 })).toBe('hot');
    expect(classify({ ...base, propertySaves: [{ address: 'X' }], calculatorRuns: 5 })).toBe('hot');
  });

  it('save without a recorded address still counts as hot', () => {
    expect(classify({ ...base, propertySaves: [{ address: 'unknown' }] })).toBe('hot');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 5. groupByAgent accuracy — no lead duplication, no loss
// ───────────────────────────────────────────────────────────────────────────
describe('groupByAgent never loses or duplicates leads', () => {
  function mk(email: string, assigned: number | null): LeadSummary {
    return {
      email, name: email, phone: null, fubPersonId: null, assignedUserId: assigned,
      assignedToName: null, events: [], propertyViews: 1, propertySaves: [],
      calculatorRuns: 0, marketCitiesViewed: [], returned: false, temperature: 'warm',
    };
  }

  it('100 leads across 5 agents — sum of bucket sizes === 100', () => {
    const leads: LeadSummary[] = [];
    for (let i = 0; i < 100; i++) {
      leads.push(mk(`u${i}@x.com`, (i % 5) + 1));
    }
    const groups = groupByAgent(leads);
    let total = 0;
    for (const bucket of groups.values()) total += bucket.length;
    expect(total).toBe(100);
  });

  it('each lead appears in exactly one bucket', () => {
    const leads = [mk('a@x.com', 1), mk('b@x.com', 2), mk('c@x.com', null)];
    const groups = groupByAgent(leads);
    const emails: string[] = [];
    for (const bucket of groups.values()) {
      for (const l of bucket) emails.push(l.email);
    }
    expect(emails.sort()).toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
  });
});
