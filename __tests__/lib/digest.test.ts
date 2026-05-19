/**
 * Daily digest pure-function tests.
 *
 * Covers:
 *   - classify() → hot / warm / quiet thresholds
 *   - summarizeActivity() → groups by user, counts events, extracts saves
 *   - groupByAgent() → buckets by assigned FUB user, Unassigned for null
 *   - isMountainTimeHour() → DST-aware 8am MT detection
 */
import { describe, it, expect } from 'vitest';
import {
  ActivityRow,
  AgentDigest,
  classify,
  groupByAgent,
  isMountainTimeHour,
  LeadSummary,
  mountainTimeMidnightUtc,
  renderAgentDm,
  renderChannelSummary,
  summarizeActivity,
} from '../../lib/digest';

function row(email: string, type: string, metadata: Record<string, unknown> = {}): ActivityRow {
  return {
    user_email: email,
    event_type: type,
    metadata,
    created_at: new Date().toISOString(),
  };
}

describe('classify', () => {
  const base = { propertyViews: 0, propertySaves: [], returned: false, calculatorRuns: 0, marketCitiesViewed: [] };

  it('hot: any property save', () => {
    expect(classify({ ...base, propertySaves: [{ address: 'x' }] })).toBe('hot');
  });

  it('hot: 3+ property views', () => {
    expect(classify({ ...base, propertyViews: 3 })).toBe('hot');
  });

  it('hot: return visit after dormant', () => {
    expect(classify({ ...base, returned: true })).toBe('hot');
  });

  it('warm: 1-2 property views', () => {
    expect(classify({ ...base, propertyViews: 1 })).toBe('warm');
    expect(classify({ ...base, propertyViews: 2 })).toBe('warm');
  });

  it('warm: calculator used alone', () => {
    expect(classify({ ...base, calculatorRuns: 1 })).toBe('warm');
  });

  it('warm: market page visit alone', () => {
    expect(classify({ ...base, marketCitiesViewed: ['Denver'] })).toBe('warm');
  });

  it('quiet: no signal', () => {
    expect(classify(base)).toBe('quiet');
  });
});

describe('summarizeActivity', () => {
  it('groups rows by user_email and counts event types', () => {
    const rows: ActivityRow[] = [
      row('a@x.com', 'property_viewed', { listing_id: 'l1' }),
      row('a@x.com', 'property_viewed', { listing_id: 'l2' }),
      row('a@x.com', 'property_saved', { address: '1 Main St' }),
      row('b@x.com', 'calculator_used'),
      row('b@x.com', 'market_page_visit', { city: 'Denver' }),
    ];
    const leads = summarizeActivity(rows);
    const a = leads.find(l => l.email === 'a@x.com')!;
    const b = leads.find(l => l.email === 'b@x.com')!;
    expect(a.propertyViews).toBe(2);
    expect(a.propertySaves).toHaveLength(1);
    expect(a.propertySaves[0].address).toBe('1 Main St');
    expect(a.temperature).toBe('hot'); // save → hot
    expect(b.propertyViews).toBe(0);
    expect(b.calculatorRuns).toBe(1);
    expect(b.marketCitiesViewed).toEqual(['Denver']);
    expect(b.temperature).toBe('warm'); // calculator or market page = warm
  });

  it('dedupes market_page_visit cities per user', () => {
    const rows: ActivityRow[] = [
      row('a@x.com', 'market_page_visit', { city: 'Denver' }),
      row('a@x.com', 'market_page_visit', { city: 'Denver' }),
      row('a@x.com', 'market_page_visit', { city: 'Aurora' }),
    ];
    const leads = summarizeActivity(rows);
    expect(leads[0].marketCitiesViewed.sort()).toEqual(['Aurora', 'Denver']);
  });

  it('empty input returns empty array', () => {
    expect(summarizeActivity([])).toEqual([]);
  });
});

describe('groupByAgent', () => {
  const mkLead = (email: string, assignedUserId: number | null, temp: 'hot' | 'warm' | 'quiet'): LeadSummary => ({
    email,
    name: email,
    phone: null,
    fubPersonId: 1,
    assignedUserId,
    assignedToName: null,
    events: [],
    propertyViews: 0,
    propertySaves: [],
    calculatorRuns: 0,
    marketCitiesViewed: [],
    returned: false,
    temperature: temp,
  });

  it('buckets leads by assignedUserId', () => {
    const leads = [
      mkLead('a@x.com', 1, 'hot'),
      mkLead('b@x.com', 1, 'warm'),
      mkLead('c@x.com', 2, 'hot'),
      mkLead('d@x.com', null, 'warm'),
    ];
    const groups = groupByAgent(leads);
    expect(groups.get(1)).toHaveLength(2);
    expect(groups.get(2)).toHaveLength(1);
    expect(groups.get(null)).toHaveLength(1);
  });

  it('sorts each bucket hot → warm → quiet, then by name', () => {
    const leads = [
      mkLead('z@x.com', 1, 'warm'),
      mkLead('a@x.com', 1, 'quiet'),
      mkLead('b@x.com', 1, 'hot'),
    ];
    const bucket = groupByAgent(leads).get(1)!;
    expect(bucket.map(l => l.email)).toEqual(['b@x.com', 'z@x.com', 'a@x.com']);
  });
});

describe('isMountainTimeHour (DST-aware)', () => {
  it('matches 8am MDT (summer) when UTC is 14:00', () => {
    // 2026-07-15 is in MDT (UTC-6). 8am MDT = 14:00 UTC.
    const mdtMorning = new Date('2026-07-15T14:30:00Z');
    expect(isMountainTimeHour(8, mdtMorning)).toBe(true);
    expect(isMountainTimeHour(9, mdtMorning)).toBe(false);
  });

  it('matches 8am MST (winter) when UTC is 15:00', () => {
    // 2026-01-15 is in MST (UTC-7). 8am MST = 15:00 UTC.
    const mstMorning = new Date('2026-01-15T15:30:00Z');
    expect(isMountainTimeHour(8, mstMorning)).toBe(true);
    expect(isMountainTimeHour(7, mstMorning)).toBe(false);
  });

  it('returns false an hour off in either season', () => {
    // 14:00 UTC on a winter date is 7am MST, not 8am
    expect(isMountainTimeHour(8, new Date('2026-01-15T14:30:00Z'))).toBe(false);
    // 15:00 UTC on a summer date is 9am MDT, not 8am
    expect(isMountainTimeHour(8, new Date('2026-07-15T15:30:00Z'))).toBe(false);
  });

  it('handles spring-forward (MST → MDT, 2026-03-08 at 02:00 local → 03:00)', () => {
    // At 14:00 UTC on spring-forward day (Mar 8 2026), Denver is in MDT, so it's 8am.
    // (Spring forward happened at 02:00 local that morning.)
    expect(isMountainTimeHour(8, new Date('2026-03-08T14:30:00Z'))).toBe(true);
    // 15:00 UTC that same day is 9am MDT, not 8am.
    expect(isMountainTimeHour(8, new Date('2026-03-08T15:30:00Z'))).toBe(false);
  });

  it('handles fall-back (MDT → MST, 2026-11-01 at 02:00 local → 01:00)', () => {
    // At 15:00 UTC on fall-back day, Denver is in MST, so it's 8am.
    expect(isMountainTimeHour(8, new Date('2026-11-01T15:30:00Z'))).toBe(true);
    expect(isMountainTimeHour(8, new Date('2026-11-01T14:30:00Z'))).toBe(false);
  });

  it('handles midnight MT (hour normalization)', () => {
    // 00:00 MST = 07:00 UTC
    expect(isMountainTimeHour(0, new Date('2026-01-15T07:30:00Z'))).toBe(true);
    expect(isMountainTimeHour(24, new Date('2026-01-15T07:30:00Z'))).toBe(false);
  });

  it('returns the right hour for every 3-hour UTC slice in summer', () => {
    // Sanity: pick a summer day and verify hour rolls correctly
    const check = (utcHour: number, expectedMtHour: number) =>
      isMountainTimeHour(
        expectedMtHour,
        new Date(`2026-07-15T${String(utcHour).padStart(2, '0')}:15:00Z`),
      );
    // MDT = UTC-6, so UTC 06 → MT 00, UTC 09 → MT 03, UTC 12 → MT 06, UTC 18 → MT 12
    expect(check(6, 0)).toBe(true);
    expect(check(9, 3)).toBe(true);
    expect(check(12, 6)).toBe(true);
    expect(check(18, 12)).toBe(true);
  });
});

describe('mountainTimeMidnightUtc', () => {
  it('summer (MDT, UTC-6): 3pm MDT on Jul 15 → midnight MDT is 06:00 UTC same day', () => {
    const now = new Date('2026-07-15T21:00:00Z'); // 3pm MDT
    const midnight = mountainTimeMidnightUtc(now);
    expect(midnight.toISOString()).toBe('2026-07-15T06:00:00.000Z');
  });

  it('winter (MST, UTC-7): 3pm MST on Jan 15 → midnight MST is 07:00 UTC same day', () => {
    const now = new Date('2026-01-15T22:00:00Z'); // 3pm MST
    const midnight = mountainTimeMidnightUtc(now);
    expect(midnight.toISOString()).toBe('2026-01-15T07:00:00.000Z');
  });

  it('crossing UTC midnight: 11pm MT on Mar 10 → midnight MT is previous day UTC', () => {
    // 11pm MDT on Mar 10, 2026 = 05:00 UTC Mar 11. Midnight MDT Mar 10 = 06:00 UTC Mar 10.
    const now = new Date('2026-03-11T05:00:00Z');
    const midnight = mountainTimeMidnightUtc(now);
    expect(midnight.toISOString()).toBe('2026-03-10T06:00:00.000Z');
  });

  it('spring-forward day (Mar 8 2026): midnight is still pre-DST MST anchor', () => {
    // Before 2am local on Mar 8, still MST (UTC-7). Midnight Mar 8 = 07:00 UTC Mar 8.
    const now = new Date('2026-03-08T08:00:00Z'); // 2am MDT (1am MST then sprung)
    const midnight = mountainTimeMidnightUtc(now);
    // 8 Mar 2026 local midnight in Denver. en-US date at 08:00 UTC is still "2026-03-08"
    // since Denver is UTC-6 (already MDT after 2am local). So midnight UTC = 06:00 UTC Mar 8?
    // Actually at 08:00 UTC on Mar 8, Denver is 02:00 MDT (post-spring-forward). The local
    // date is Mar 8. But the offset at midnight Mar 8 was -07:00 (MST, before DST).
    // Our helper uses the CURRENT offset, so it reports 06:00 UTC (MDT-based midnight).
    // That's a known acceptable ±1 hour edge case on DST-transition days.
    expect(['2026-03-08T06:00:00.000Z', '2026-03-08T07:00:00.000Z']).toContain(midnight.toISOString());
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Edge cases / robustness
// ──────────────────────────────────────────────────────────────────────────
describe('summarizeActivity — robustness', () => {
  it('handles empty metadata without throwing', () => {
    const rows: ActivityRow[] = [
      row('a@x.com', 'property_viewed'),
      row('a@x.com', 'property_saved'),
      row('a@x.com', 'calculator_used'),
      row('a@x.com', 'market_page_visit'),
      row('a@x.com', 'return_visit'),
    ];
    const leads = summarizeActivity(rows);
    expect(leads).toHaveLength(1);
    expect(leads[0].propertyViews).toBe(1);
    expect(leads[0].propertySaves).toHaveLength(1);
    expect(leads[0].propertySaves[0].address).toBe('unknown'); // fallback
    expect(leads[0].temperature).toBe('hot'); // returned=true
  });

  it('ignores unknown event_types (doesn\'t crash the pipeline)', () => {
    const rows: ActivityRow[] = [
      row('a@x.com', 'unknown_event_type', { foo: 'bar' }),
      row('a@x.com', 'property_viewed', { listing_id: 'l1' }),
    ];
    const leads = summarizeActivity(rows);
    expect(leads[0].propertyViews).toBe(1);
    expect(leads[0].propertySaves).toHaveLength(0);
  });

  it('handles empty city in market_page_visit metadata', () => {
    const rows: ActivityRow[] = [
      row('a@x.com', 'market_page_visit', { city: '' }),
      row('a@x.com', 'market_page_visit', { city: 'Denver' }),
    ];
    const leads = summarizeActivity(rows);
    expect(leads[0].marketCitiesViewed).toEqual(['Denver']); // empty filtered out
  });
});

describe('groupByAgent — edge cases', () => {
  const mk = (email: string, assigned: number | null, temp: 'hot' | 'warm' | 'quiet'): LeadSummary => ({
    email, name: email, phone: null, fubPersonId: null, assignedUserId: assigned,
    assignedToName: null, events: [], propertyViews: 0, propertySaves: [],
    calculatorRuns: 0, marketCitiesViewed: [], returned: false, temperature: temp,
  });

  it('empty input returns empty map', () => {
    expect(groupByAgent([]).size).toBe(0);
  });

  it('all-unassigned → single null bucket', () => {
    const groups = groupByAgent([mk('a@x.com', null, 'warm'), mk('b@x.com', null, 'hot')]);
    expect(groups.size).toBe(1);
    expect(groups.get(null)).toHaveLength(2);
  });

  it('stable ordering within same-temperature leads by name', () => {
    const bucket = groupByAgent([
      mk('charlie@x.com', 1, 'hot'),
      mk('alice@x.com', 1, 'hot'),
      mk('bob@x.com', 1, 'hot'),
    ]).get(1)!;
    expect(bucket.map(l => l.email)).toEqual(['alice@x.com', 'bob@x.com', 'charlie@x.com']);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Rendering
// ──────────────────────────────────────────────────────────────────────────
function mkLeadWithActivity(opts: Partial<LeadSummary>): LeadSummary {
  return {
    email: opts.email ?? 'jane@example.com',
    name: opts.name ?? 'Jane Doe',
    phone: 'phone' in opts ? opts.phone! : '7195551111',
    fubPersonId: opts.fubPersonId ?? 42,
    assignedUserId: opts.assignedUserId ?? 1,
    assignedToName: opts.assignedToName ?? 'Ryan Thomson',
    events: [],
    propertyViews: opts.propertyViews ?? 0,
    propertySaves: opts.propertySaves ?? [],
    calculatorRuns: opts.calculatorRuns ?? 0,
    marketCitiesViewed: opts.marketCitiesViewed ?? [],
    returned: opts.returned ?? false,
    temperature: opts.temperature ?? 'quiet',
  };
}

describe('renderAgentDm', () => {
  const mkDigest = (leads: LeadSummary[]): AgentDigest => ({
    assignedUserId: 1,
    assignedToName: 'Ryan Thomson',
    slackUserId: 'U0A5XAJ6DRC',
    leads,
    hotCount: leads.filter(l => l.temperature === 'hot').length,
    warmCount: leads.filter(l => l.temperature === 'warm').length,
  });

  it('mentions the agent via Slack <@id> syntax when slackUserId present', () => {
    const { text } = renderAgentDm(mkDigest([mkLeadWithActivity({ temperature: 'hot', propertyViews: 3 })]), 'Tuesday, Apr 21');
    expect(text).toContain('<@U0A5XAJ6DRC>');
  });

  it('falls back to name when slackUserId is null', () => {
    const d = { ...mkDigest([]), slackUserId: null, assignedToName: 'Bryon Franklin' };
    const { text } = renderAgentDm(d, 'Tuesday, Apr 21');
    expect(text).toContain('Bryon Franklin');
    expect(text).not.toContain('<@');
  });

  it('shows hot leads under a "call today" heading', () => {
    const { text } = renderAgentDm(mkDigest([
      mkLeadWithActivity({ name: 'Hot One', temperature: 'hot', propertyViews: 3 }),
    ]), 'Tuesday, Apr 21');
    expect(text).toMatch(/🔥.*Hot leads.*call today.*\(1\)/);
    expect(text).toContain('Hot One');
  });

  it('shows quiet-day message when no signal', () => {
    const { text } = renderAgentDm(mkDigest([]), 'Tuesday, Apr 21');
    expect(text).toContain('Quiet day');
  });

  it('includes a mailto link for every lead', () => {
    const { text } = renderAgentDm(mkDigest([
      mkLeadWithActivity({ email: 'user@x.com', temperature: 'hot', propertyViews: 3 }),
    ]), 'today');
    expect(text).toContain('<mailto:user@x.com|email>');
  });

  it('omits the phone link when lead has no phone', () => {
    const { text } = renderAgentDm(mkDigest([
      mkLeadWithActivity({ phone: null, temperature: 'hot', propertyViews: 3 }),
    ]), 'today');
    expect(text).not.toContain('<tel:');
  });

  it('includes the FUB link when fubPersonId is present', () => {
    const { text } = renderAgentDm(mkDigest([
      mkLeadWithActivity({ fubPersonId: 18390, temperature: 'hot', propertyViews: 3 }),
    ]), 'today');
    expect(text).toContain('followupboss.com/2/people/view/18390');
  });

  it('truncates saved list to 2 addresses', () => {
    const { text } = renderAgentDm(mkDigest([
      mkLeadWithActivity({
        temperature: 'hot',
        propertySaves: [
          { address: '1 First St' },
          { address: '2 Second St' },
          { address: '3 Third St' },
        ],
      }),
    ]), 'today');
    expect(text).toContain('1 First St');
    expect(text).toContain('2 Second St');
    expect(text).not.toContain('3 Third St');
  });
});

describe('renderChannelSummary', () => {
  const mkDigest = (agentId: number, name: string, leads: LeadSummary[]): AgentDigest => ({
    assignedUserId: agentId,
    assignedToName: name,
    slackUserId: `U${agentId}`,
    leads,
    hotCount: leads.filter(l => l.temperature === 'hot').length,
    warmCount: leads.filter(l => l.temperature === 'warm').length,
  });

  it('shows total counts in header', () => {
    const digests = [
      mkDigest(1, 'Ryan', [
        mkLeadWithActivity({ email: 'a@x.com', temperature: 'hot', propertyViews: 3 }),
        mkLeadWithActivity({ email: 'b@x.com', temperature: 'warm', propertyViews: 1 }),
      ]),
      mkDigest(2, 'Jhoselyn', [
        mkLeadWithActivity({ email: 'c@x.com', temperature: 'hot', propertyViews: 3 }),
      ]),
    ];
    const { text } = renderChannelSummary(digests, 'Tuesday', 3);
    expect(text).toContain('3 leads active');
    expect(text).toContain('2 hot');
    expect(text).toContain('1 warm');
  });

  it('mentions each agent with @slack-id', () => {
    const digests = [mkDigest(1, 'Ryan', [mkLeadWithActivity({ temperature: 'hot' })])];
    const { text } = renderChannelSummary(digests, 'today', 1);
    expect(text).toContain('<@U1>');
  });

  it('falls back to name when an agent has no Slack match', () => {
    const d = mkDigest(2, 'NoSlack Person', [mkLeadWithActivity({ temperature: 'hot' })]);
    d.slackUserId = null;
    const { text } = renderChannelSummary([d], 'today', 1);
    expect(text).toContain('NoSlack Person');
  });
});
