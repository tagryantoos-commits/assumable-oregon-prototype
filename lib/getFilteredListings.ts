import { Listing } from './listings';

export interface GetFilteredListingsOptions {
  limit?: number;       // default: return all
  city?: string;        // filter to a specific city (for market pages)
  minPrice?: number;    // default: 350000
  minGap?: number;      // default: 10000 (applies only to sub-$1M buckets)
  maxGap?: number;      // default: 70000 (applies only to sub-$1M buckets)
  maxRate?: number;     // default: 3.999
}

/** Returns the rate tier: 0 = 2.x%, 1 = 3.x% */
function getRateTier(rate: number): number {
  return rate < 3.0 ? 0 : 1;
}

/**
 * Returns bucket index 0–4 based on price, or -1 if below minPrice.
 * A: $350K–$500K · B: $500K–$700K · C: $700K–$1M · D: $1M–$1.5M · E: $1.5M+
 */
function getPriceBucket(price: number, minPrice: number): number {
  if (price < minPrice) return -1;
  if (price < 500000) return 0;
  if (price < 700000) return 1;
  if (price < 1000000) return 2;
  if (price < 1500000) return 3;
  return 4;
}

/** Buckets D and E ($1M+) relax gap constraints — take whatever has the lowest gap. */
function bucketEnforcesGapRange(bucketIndex: number): boolean {
  return bucketIndex < 3;
}

/**
 * Returns a formatted cash-to-close label for display in listing cards.
 *
 * - gap <= 0     → "Low/No Equity Gap, ask about options"
 * - gap < $10K   → "Under $10K to close"
 * - gap >= $10K  → actual formatted number (e.g. "$42,500 to close")
 */
export function formatEquityGapLabel(estimatedEquityGap: number): {
  label: string;
  isZeroGap?: boolean;
} {
  if (estimatedEquityGap <= 0) {
    return { label: 'Low/No Equity Gap, ask about options', isZeroGap: true };
  }
  if (estimatedEquityGap < 10000) {
    return { label: 'Under $10K to close' };
  }
  return { label: `$${Math.round(estimatedEquityGap).toLocaleString()} to close` };
}

/**
 * Returns a filtered and bucketed list of listings for the Featured section.
 *
 * Hard filters (applied to sub-$1M buckets A–C):
 *   - assumableRate <= maxRate (default 3.999 → only 2.x% and 3.x%)
 *   - estimatedEquityGap between minGap and maxGap (default $10K–$70K)
 *   - price >= minPrice (default $350K)
 *
 * Buckets D and E ($1M+) relax the gap constraints — they still require
 * rate <= maxRate and price in bucket range, but take whatever has the
 * lowest equity gap available.
 *
 * Sort/output order:
 *   Listings are split into 5 price buckets (A–E), ranked within each bucket
 *   by rate tier (2.x first) → equity gap ascending → price ascending.
 *   Results are interleaved: one best from A, B, C, D, E, then second-best, etc.
 *   City variety: within each bucket, up to 3 positions are scanned to prefer
 *   a listing from a city not already in the result set.
 */
export function getFilteredListings(
  listings: Listing[],
  options: GetFilteredListingsOptions = {}
): Listing[] {
  const {
    limit,
    city,
    minPrice = 350000,
    minGap = 10000,
    maxGap = 70000,
    maxRate = 3.999,
  } = options;

  // Optional city pre-filter
  let pool = city
    ? listings.filter(l => l.city.toLowerCase() === city.toLowerCase())
    : listings;

  // Rate filter + price floor (applied globally); gap filters applied per-bucket
  pool = pool.filter(
    l => l.assumableRate <= maxRate && l.price >= minPrice
  );

  if (pool.length === 0) return [];

  // Split into 5 price buckets (skip anything below minPrice)
  const buckets: Listing[][] = [[], [], [], [], []];
  for (const l of pool) {
    const b = getPriceBucket(l.price, minPrice);
    if (b < 0) continue;
    if (bucketEnforcesGapRange(b)) {
      if (l.estimatedEquityGap < minGap || l.estimatedEquityGap > maxGap) continue;
    }
    buckets[b].push(l);
  }

  // Sort each bucket: rateTier asc → equityGap asc → price asc
  for (const bucket of buckets) {
    bucket.sort((a, b) => {
      const aTier = getRateTier(a.assumableRate);
      const bTier = getRateTier(b.assumableRate);
      if (aTier !== bTier) return aTier - bTier;
      if (a.estimatedEquityGap !== b.estimatedEquityGap) {
        return a.estimatedEquityGap - b.estimatedEquityGap;
      }
      return a.price - b.price;
    });
  }

  // Work with mutable copies so we can splice
  const remaining = buckets.map(b => [...b]);
  const result: Listing[] = [];
  const seenCities = new Set<string>();

  // How many positions ahead to scan for city variety within a bucket
  const VARIETY_SCAN = 3;

  function pickFromBucket(bucket: Listing[]): Listing | null {
    if (bucket.length === 0) return null;
    // Scan up to VARIETY_SCAN items for one from a not-yet-seen city
    for (let i = 0; i < Math.min(VARIETY_SCAN, bucket.length); i++) {
      if (!seenCities.has(bucket[i].city)) {
        const [picked] = bucket.splice(i, 1);
        return picked;
      }
    }
    // All top candidates are from seen cities — just take the best one
    return bucket.shift()!;
  }

  // Cycle through buckets A→E repeatedly until limit is hit or all exhausted
  while (result.length < (limit ?? Infinity)) {
    let anyPicked = false;
    for (let b = 0; b < 5; b++) {
      if (result.length >= (limit ?? Infinity)) break;
      const picked = pickFromBucket(remaining[b]);
      if (picked) {
        result.push(picked);
        seenCities.add(picked.city);
        anyPicked = true;
      }
    }
    if (!anyPicked) break;
  }

  return result;
}
