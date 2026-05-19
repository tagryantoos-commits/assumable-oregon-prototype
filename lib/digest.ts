/**
 * Daily digest logic — pure functions (easy to test) + HTTP orchestration.
 *
 * Flow:
 *   1. Query last 24h of user_activity from Supabase
 *   2. Look up each active user's FUB person → assignedUserId
 *   3. Group activity by assigned agent
 *   4. Classify leads as hot / warm / quiet
 *   5. Render Slack blocks for (a) each agent DM and (b) team summary
 *   6. Send to Slack
 */

const FUB_BASE = 'https://api.followupboss.com/v1';

export interface ActivityRow {
  user_email: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface LeadSummary {
  email: string;
  name: string;
  phone: string | null;
  fubPersonId: number | null;
  assignedUserId: number | null;
  assignedToName: string | null;
  events: ActivityRow[];
  // Derived
  propertyViews: number;
  propertySaves: Array<{ address: string; rate?: number; price?: number }>;
  calculatorRuns: number;
  marketCitiesViewed: string[];
  returned: boolean;
  temperature: 'hot' | 'warm' | 'quiet';
}

export interface AgentDigest {
  assignedUserId: number | null; // null = unassigned bucket
  assignedToName: string; // "Unassigned" when null
  slackUserId: string | null; // resolved from assigned agent email
  leads: LeadSummary[];
  hotCount: number;
  warmCount: number;
}

/** Classify a lead by behavior. Tune thresholds here. */
export function classify(
  lead: Pick<LeadSummary, 'propertyViews' | 'propertySaves' | 'returned' | 'calculatorRuns' | 'marketCitiesViewed'>,
): 'hot' | 'warm' | 'quiet' {
  if (lead.propertySaves.length >= 1) return 'hot';
  if (lead.propertyViews >= 3) return 'hot';
  if (lead.returned) return 'hot';
  if (lead.propertyViews >= 1) return 'warm';
  if (lead.calculatorRuns >= 1) return 'warm';
  if (lead.marketCitiesViewed.length >= 1) return 'warm';
  return 'quiet';
}

/** Group activity rows by user, derive counts, classify. */
export function summarizeActivity(rows: ActivityRow[]): LeadSummary[] {
  const byEmail = new Map<string, ActivityRow[]>();
  for (const r of rows) {
    if (!byEmail.has(r.user_email)) byEmail.set(r.user_email, []);
    byEmail.get(r.user_email)!.push(r);
  }
  const out: LeadSummary[] = [];
  for (const [email, events] of byEmail.entries()) {
    const propertyViews = events.filter(e => e.event_type === 'property_viewed').length;
    const propertySaves = events
      .filter(e => e.event_type === 'property_saved')
      .map(e => ({
        address: String(e.metadata?.address ?? 'unknown'),
        rate: e.metadata?.assumable_rate as number | undefined,
        price: e.metadata?.price as number | undefined,
      }));
    const calculatorRuns = events.filter(e => e.event_type === 'calculator_used').length;
    const marketCitiesViewed = Array.from(
      new Set(
        events
          .filter(e => e.event_type === 'market_page_visit')
          .map(e => String(e.metadata?.city ?? ''))
          .filter(Boolean)
      )
    );
    const returned = events.some(e => e.event_type === 'return_visit');
    const partial = { propertyViews, propertySaves, returned, calculatorRuns, marketCitiesViewed };
    out.push({
      email,
      name: '',
      phone: null,
      fubPersonId: null,
      assignedUserId: null,
      assignedToName: null,
      events,
      propertyViews,
      propertySaves,
      calculatorRuns,
      marketCitiesViewed,
      returned,
      temperature: classify(partial),
    });
  }
  return out;
}

/** Batch-resolve FUB person + assignment for a set of emails. */
export async function enrichFromFub(
  leads: LeadSummary[],
  fubApiKey: string,
): Promise<LeadSummary[]> {
  const auth = 'Basic ' + Buffer.from(`${fubApiKey}:`).toString('base64');
  for (const lead of leads) {
    try {
      const r = await fetch(`${FUB_BASE}/people?email=${encodeURIComponent(lead.email)}&limit=1`, {
        headers: { Authorization: auth },
      });
      if (!r.ok) continue;
      const d = await r.json();
      const p = d?.people?.[0];
      if (!p) continue;
      lead.fubPersonId = p.id ?? null;
      lead.assignedUserId = p.assignedUserId ?? null;
      lead.assignedToName = p.assignedTo ?? null;
      lead.name = [p.firstName, p.lastName].filter(Boolean).join(' ') || lead.email;
      lead.phone = (p.phones?.[0]?.value as string | undefined) ?? null;
    } catch {
      // Skip — lead stays in Unassigned bucket.
    }
  }
  return leads;
}

/** Group enriched leads by assigned agent (null = Unassigned). */
export function groupByAgent(leads: LeadSummary[]): Map<number | null, LeadSummary[]> {
  const groups = new Map<number | null, LeadSummary[]>();
  for (const l of leads) {
    const key = l.assignedUserId ?? null;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(l);
  }
  // Sort each bucket by temperature: hot > warm > quiet, then by name
  for (const arr of groups.values()) {
    arr.sort((a, b) => {
      const order = { hot: 0, warm: 1, quiet: 2 } as const;
      if (order[a.temperature] !== order[b.temperature]) return order[a.temperature] - order[b.temperature];
      return a.name.localeCompare(b.name);
    });
  }
  return groups;
}

// ──────────────────────────────────────────────────────────────────────────
// DST-robust Mountain-Time helpers
// ──────────────────────────────────────────────────────────────────────────

/**
 * Returns the UTC timestamp of the most recent midnight in America/Denver.
 * Used by the on-demand digest to answer "today so far" scoped to the
 * team's timezone regardless of where the server runs.
 */
export function mountainTimeMidnightUtc(now: Date = new Date()): Date {
  // 'en-US' yields YYYY-MM-DD components for the user's local date in Denver.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Denver',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const d = parts.find(p => p.type === 'day')!.value;
  // Work out the offset by formatting the same instant's hour in Denver vs UTC.
  // Simpler: construct a Date at local midnight by iterating candidate offsets.
  // But Intl alone is enough if we fish out the TZ offset as a string.
  const off = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    timeZoneName: 'longOffset',
  }).formatToParts(now).find(p => p.type === 'timeZoneName')!.value; // e.g. "GMT-07:00"
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(off);
  const sign = match?.[1] === '-' ? -1 : 1;
  const hh = Number(match?.[2] ?? 0);
  const mm = Number(match?.[3] ?? 0);
  const offsetMinutes = sign * (hh * 60 + mm);
  // Local midnight in Denver, expressed as UTC
  const localMidnightUtcMs = Date.UTC(Number(y), Number(m) - 1, Number(d), 0, 0, 0) - offsetMinutes * 60 * 1000;
  return new Date(localMidnightUtcMs);
}

/**
 * Returns true iff the current UTC time falls in the hour that's `target` am/pm
 * in America/Denver (handles DST automatically via Intl API).
 */
export function isMountainTimeHour(target: number, now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? -1);
  // 'en-US' with hour12: false sometimes returns '24' for midnight — normalize.
  const normalized = hour === 24 ? 0 : hour;
  return normalized === target;
}

// ──────────────────────────────────────────────────────────────────────────
// Slack rendering
// ──────────────────────────────────────────────────────────────────────────

function formatLead(l: LeadSummary): string {
  const bits: string[] = [];
  if (l.propertyViews > 0) bits.push(`👁 ${l.propertyViews} view${l.propertyViews === 1 ? '' : 's'}`);
  if (l.propertySaves.length > 0) bits.push(`⭐ ${l.propertySaves.length} saved`);
  if (l.calculatorRuns > 0) bits.push(`💰 calc`);
  if (l.returned) bits.push(`🔄 returned after dormant`);
  if (l.marketCitiesViewed.length > 0) bits.push(`📍 ${l.marketCitiesViewed.join(', ')}`);

  const tempIcon = l.temperature === 'hot' ? '🔥 ' : l.temperature === 'warm' ? '· ' : '· ';
  const phone = l.phone ? ` <tel:${l.phone}|${l.phone}>` : '';
  const fubLink = l.fubPersonId
    ? ` · <https://theassumableguy.followupboss.com/2/people/view/${l.fubPersonId}|FUB>`
    : '';
  const saved = l.propertySaves
    .slice(0, 2)
    .map(p => `_${p.address}${p.rate ? ` (${p.rate}%)` : ''}_`)
    .join(', ');
  const savedLine = saved ? `\n   └ Saved: ${saved}` : '';

  return `${tempIcon}*${l.name}* · ${bits.join(' · ')} · <mailto:${l.email}|email>${phone}${fubLink}${savedLine}`;
}

export function renderAgentDm(digest: AgentDigest, forDate: string): { text: string; blocks: unknown[] } {
  const mention = digest.slackUserId ? `<@${digest.slackUserId}>` : digest.assignedToName;
  const hot = digest.leads.filter(l => l.temperature === 'hot');
  const warm = digest.leads.filter(l => l.temperature === 'warm');
  const lines: string[] = [];
  lines.push(`Hey ${mention}, here's your activity summary for *${forDate}*.`);
  lines.push('');
  if (hot.length > 0) {
    lines.push(`🔥 *Hot leads — call today* (${hot.length})`);
    hot.forEach(l => lines.push(formatLead(l)));
    lines.push('');
  }
  if (warm.length > 0) {
    lines.push(`☕ *Warm activity* (${warm.length})`);
    warm.forEach(l => lines.push(formatLead(l)));
  }
  if (hot.length === 0 && warm.length === 0) {
    lines.push('_Quiet day — no logged-in activity on your assigned leads in the last 24h._');
  }
  const text = lines.join('\n');
  return {
    text,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text } },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '_AssumableGuy Digest · fires daily at 8am MT · configure: https://assumableguy.com/_',
          },
        ],
      },
    ],
  };
}

export function renderChannelSummary(
  digests: AgentDigest[],
  forDate: string,
  totalLeads: number,
): { text: string; blocks: unknown[] } {
  const totalHot = digests.reduce((s, d) => s + d.hotCount, 0);
  const totalWarm = digests.reduce((s, d) => s + d.warmCount, 0);
  const lines: string[] = [];
  lines.push(`*Website Activity — ${forDate}*`);
  lines.push(`${totalLeads} leads active · 🔥 ${totalHot} hot · ☕ ${totalWarm} warm`);
  lines.push('');
  for (const d of digests) {
    const mention = d.slackUserId ? `<@${d.slackUserId}>` : d.assignedToName;
    lines.push(`*${mention}* — ${d.leads.length} active (${d.hotCount} hot)`);
    for (const l of d.leads) {
      lines.push(formatLead(l));
    }
    lines.push('');
  }
  const text = lines.join('\n');
  return {
    text,
    blocks: [{ type: 'section', text: { type: 'mrkdwn', text } }],
  };
}
