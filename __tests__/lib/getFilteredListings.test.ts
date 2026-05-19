/**
 * Featured-listings filter tests.
 *
 * Locks in the audit-fix behavior (2026-04-21):
 *   - $350K price floor (no sub-$350K listings in featured)
 *   - Sub-$1M buckets: gap must be $10K-$70K
 *   - $1M+ buckets: gap constraint relaxed (lowest-gap wins)
 *   - Rate <= 3.999% (2s and 3s only, 2s prioritized)
 *   - Price buckets A=$350-500K, B=$500-700K, C=$700K-1M, D=$1M-1.5M, E=$1.5M+
 *   - Interleave output (one per bucket), city variety within buckets
 */
import { describe, it, expect } from 'vitest';
import { getFilteredListings, formatEquityGapLabel } from '../../lib/getFilteredListings';
import type { Listing } from '../../lib/listings';

function make(overrides: Partial<Listing>): Listing {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    slug: 'slug',
    address: '1 Main',
    city: 'Denver',
    state: 'CO',
    zip: '80203',
    price: 400000,
    assumableRate: 2.75,
    remainingLoanBalance: 350000,
    assumableMonthlyPayment: 1500,
    marketMonthlyPayment: 2500,
    monthlySavings: 1000,
    estimatedEquityGap: 30000,
    cashToClose: 30000,
    loanType: 'FHA',
    beds: 3,
    baths: 2,
    sqft: 1500,
    annualTaxes: 3000,
    hoa: 0,
    photoUrls: [],
    description: '',
    daysOnMarket: 10,
    sourceUrl: '',
    latitude: 39.7,
    longitude: -104.9,
    ...overrides,
  };
}

describe('getFilteredListings', () => {
  it('excludes listings below the $350K floor', () => {
    const pool = [
      make({ id: 'cheap', price: 200000, estimatedEquityGap: 25000 }),
      make({ id: 'ok', price: 400000, estimatedEquityGap: 25000 }),
    ];
    const result = getFilteredListings(pool, { limit: 10 });
    expect(result.map(l => l.id)).toEqual(['ok']);
  });

  it('excludes sub-$1M listings with gap below $10K', () => {
    const pool = [
      make({ id: 'zero-gap', price: 400000, estimatedEquityGap: 0 }),
      make({ id: 'under-10k', price: 400000, estimatedEquityGap: 5000 }),
      make({ id: 'in-range', price: 400000, estimatedEquityGap: 25000 }),
    ];
    const result = getFilteredListings(pool, { limit: 10 });
    expect(result.map(l => l.id)).toEqual(['in-range']);
  });

  it('excludes sub-$1M listings with gap above $70K', () => {
    const pool = [
      make({ id: 'too-high', price: 400000, estimatedEquityGap: 90000 }),
      make({ id: 'in-range', price: 400000, estimatedEquityGap: 60000 }),
    ];
    const result = getFilteredListings(pool, { limit: 10 });
    expect(result.map(l => l.id)).toEqual(['in-range']);
  });

  it('INCLUDES $1M+ listings even when gap is above $70K, picking lowest gap', () => {
    const pool = [
      make({ id: 'm-high-gap', price: 1200000, estimatedEquityGap: 500000, city: 'Denver' }),
      make({ id: 'm-lower-gap', price: 1200000, estimatedEquityGap: 200000, city: 'Boulder' }),
    ];
    const result = getFilteredListings(pool, { limit: 10 });
    // Both included (bucket D = $1M-$1.5M), lowest gap first
    expect(result.map(l => l.id)).toEqual(['m-lower-gap', 'm-high-gap']);
  });

  it('excludes listings with rate above 3.999%', () => {
    const pool = [
      make({ id: 'four', price: 400000, assumableRate: 4.1, estimatedEquityGap: 30000 }),
      make({ id: 'three', price: 400000, assumableRate: 3.5, estimatedEquityGap: 30000 }),
    ];
    const result = getFilteredListings(pool, { limit: 10 });
    expect(result.map(l => l.id)).toEqual(['three']);
  });

  it('prioritizes 2% rates before 3% rates within the same bucket', () => {
    const pool = [
      make({ id: 'three-pct', price: 400000, assumableRate: 3.5, estimatedEquityGap: 20000, city: 'Denver' }),
      make({ id: 'two-pct', price: 400000, assumableRate: 2.5, estimatedEquityGap: 20000, city: 'Boulder' }),
    ];
    const result = getFilteredListings(pool, { limit: 10 });
    expect(result[0].id).toBe('two-pct');
    expect(result[1].id).toBe('three-pct');
  });

  it('places the first listing in the $350K-$500K bucket when present', () => {
    const pool = [
      make({ id: 'bucketA-400', price: 400000, estimatedEquityGap: 25000, city: 'Denver' }),
      make({ id: 'bucketC-800', price: 800000, estimatedEquityGap: 25000, city: 'Boulder' }),
      make({ id: 'bucketE-2M', price: 2000000, estimatedEquityGap: 500000, city: 'Aspen' }),
    ];
    const result = getFilteredListings(pool, { limit: 3 });
    expect(result[0].id).toBe('bucketA-400');
  });

  it('interleaves buckets A-E rather than filling one at a time', () => {
    const pool = [
      make({ id: 'a1', price: 400000, estimatedEquityGap: 15000, city: 'C1' }),
      make({ id: 'a2', price: 400000, estimatedEquityGap: 20000, city: 'C2' }),
      make({ id: 'a3', price: 400000, estimatedEquityGap: 25000, city: 'C3' }),
      make({ id: 'b1', price: 600000, estimatedEquityGap: 15000, city: 'C4' }),
      make({ id: 'c1', price: 800000, estimatedEquityGap: 15000, city: 'C5' }),
    ];
    const result = getFilteredListings(pool, { limit: 3 });
    // First result from A, second from B, third from C (not a1/a2/a3).
    expect(result[0].id).toBe('a1');
    expect(result[1].id).toBe('b1');
    expect(result[2].id).toBe('c1');
  });

  it('prefers city variety within each bucket', () => {
    const pool = [
      make({ id: 'a-denver-1', price: 400000, estimatedEquityGap: 15000, city: 'Denver' }),
      make({ id: 'a-denver-2', price: 420000, estimatedEquityGap: 15001, city: 'Denver' }),
      make({ id: 'a-boulder', price: 450000, estimatedEquityGap: 15002, city: 'Boulder' }),
      make({ id: 'b-denver',  price: 600000, estimatedEquityGap: 15000, city: 'Denver' }),
      make({ id: 'b-aurora',  price: 650000, estimatedEquityGap: 15001, city: 'Aurora' }),
    ];
    const result = getFilteredListings(pool, { limit: 5 });
    // Second trip through bucket A should grab Boulder (unseen) before Denver-2.
    // Order: A=Denver, B=Denver (first from B is Denver, but Denver already seen
    // → scans 3 deep and picks Aurora instead), next A=Boulder (unseen), etc.
    const cities = result.map(l => l.city);
    // Distinct-city prefix must hit 3 distinct cities in the first 3 slots.
    expect(new Set(cities.slice(0, 3)).size).toBe(3);
  });

  it('respects limit even when pool has many more candidates', () => {
    const pool = Array.from({ length: 30 }, (_, i) =>
      make({ id: `l${i}`, price: 400000 + i * 10000, estimatedEquityGap: 15000 + i * 100 })
    );
    expect(getFilteredListings(pool, { limit: 6 }).length).toBe(6);
  });

  it('city pre-filter narrows the pool', () => {
    const pool = [
      make({ id: 'denver', price: 400000, estimatedEquityGap: 25000, city: 'Denver' }),
      make({ id: 'boulder', price: 400000, estimatedEquityGap: 25000, city: 'Boulder' }),
    ];
    const result = getFilteredListings(pool, { limit: 10, city: 'Denver' });
    expect(result.map(l => l.id)).toEqual(['denver']);
  });

  // The /homes "Best Deals" sort relaxes the price floor when the user has
  // set an explicit price filter. Lock that contract in.
  it('minPrice: 0 override lets sub-$350K listings through', () => {
    const pool = [
      make({ id: 'cheap', price: 200000, estimatedEquityGap: 25000 }),
      make({ id: 'mid', price: 400000, estimatedEquityGap: 25000 }),
    ];
    const result = getFilteredListings(pool, { limit: 10, minPrice: 0 });
    expect(result.map(l => l.id).sort()).toEqual(['cheap', 'mid']);
  });

  // Similarly, when the user filters by rate, the featured rate ceiling
  // (3.999%) should be relaxable via maxRate.
  it('maxRate: 10 override lets 4%+ rates through', () => {
    const pool = [
      make({ id: 'four-pct', price: 400000, assumableRate: 4.5, estimatedEquityGap: 25000 }),
      make({ id: 'three-pct', price: 400000, assumableRate: 3.5, estimatedEquityGap: 25000 }),
    ];
    const result = getFilteredListings(pool, { limit: 10, maxRate: 10 });
    expect(result.map(l => l.id).sort()).toEqual(['four-pct', 'three-pct']);
  });
});

describe('formatEquityGapLabel', () => {
  it('returns "Low/No Equity Gap" (no em-dash) for zero or negative gap', () => {
    const { label, isZeroGap } = formatEquityGapLabel(0);
    expect(label).toBe('Low/No Equity Gap, ask about options');
    expect(isZeroGap).toBe(true);
    expect(label).not.toContain('—');
  });

  it('returns "Under $10K to close" when gap < 10000', () => {
    expect(formatEquityGapLabel(5000).label).toBe('Under $10K to close');
  });

  it('formats specific amounts with commas', () => {
    expect(formatEquityGapLabel(42500).label).toBe('$42,500 to close');
  });
});
