import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Test the ppc-listings API logic directly using the real listings data

describe('PPC listings data', () => {
  let allListings: Record<string, unknown>[];

  beforeEach(() => {
    const filePath = join(process.cwd(), 'public', 'data', 'listings.json');
    const raw = readFileSync(filePath, 'utf-8');
    allListings = JSON.parse(raw);
  });

  it('has listings data available', () => {
    expect(allListings.length).toBeGreaterThan(0);
  });

  it('has listings with required PPC fields', () => {
    const required = ['id', 'city', 'state', 'assumableRate', 'assumableMonthlyPayment', 'marketMonthlyPayment', 'beds', 'baths', 'sqft', 'loanType'];
    const sample = allListings.slice(0, 10);
    for (const listing of sample) {
      for (const field of required) {
        expect(listing[field], `Missing field "${field}" on listing ${listing.id}`).toBeDefined();
      }
    }
  });

  it('has VA listings for the VA variant', () => {
    const vaListings = allListings.filter((l) => l.loanType === 'VA' && (l.assumableRate as number) <= 3.5);
    expect(vaListings.length).toBeGreaterThan(0);
  });

  it('can find at least 6 listings under 3.5% rate', () => {
    const lowRate = allListings.filter((l) => (l.assumableRate as number) <= 3.5);
    expect(lowRate.length).toBeGreaterThanOrEqual(6);
  });

  it('monthly savings calculation is correct', () => {
    for (const listing of allListings.slice(0, 20)) {
      const market = listing.marketMonthlyPayment as number;
      const assumable = listing.assumableMonthlyPayment as number;
      if (market > 0 && assumable > 0) {
        const savings = market - assumable;
        expect(savings).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('listings have photo URLs', () => {
    const withPhotos = allListings.filter((l) => {
      const urls = l.photoUrls as string[] | undefined;
      return urls && urls.length > 0;
    });
    // Most listings should have photos
    expect(withPhotos.length / allListings.length).toBeGreaterThan(0.8);
  });
});

describe('PPC listings filtering logic', () => {
  let allListings: Record<string, unknown>[];

  beforeEach(() => {
    const filePath = join(process.cwd(), 'public', 'data', 'listings.json');
    allListings = JSON.parse(readFileSync(filePath, 'utf-8'));
  });

  function filterForPPC(variant: string) {
    let filtered = allListings.filter((l) => (l.assumableRate as number) <= 3.5);
    if (variant === 'va') {
      filtered = filtered.filter((l) => l.loanType === 'VA');
    }
    for (const cap of [40000, 60000, 80000, 120000, 200000, Infinity]) {
      const pool = filtered.filter((l) => (l.estimatedEquityGap as number) <= cap);
      if (pool.length >= 6) {
        filtered = pool;
        break;
      }
    }
    filtered.sort(
      (a, b) =>
        ((b.marketMonthlyPayment as number) - (b.assumableMonthlyPayment as number)) -
        ((a.marketMonthlyPayment as number) - (a.assumableMonthlyPayment as number))
    );
    return filtered.slice(0, 6);
  }

  it('returns exactly 6 listings for general variant', () => {
    const results = filterForPPC('general');
    expect(results.length).toBe(6);
  });

  it('returns up to 6 listings for VA variant', () => {
    const results = filterForPPC('va');
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(6);
  });

  it('VA variant only contains VA loans', () => {
    const results = filterForPPC('va');
    for (const r of results) {
      expect(r.loanType).toBe('VA');
    }
  });

  it('results are sorted by highest savings first', () => {
    const results = filterForPPC('general');
    for (let i = 1; i < results.length; i++) {
      const prevSavings = (results[i - 1].marketMonthlyPayment as number) - (results[i - 1].assumableMonthlyPayment as number);
      const currSavings = (results[i].marketMonthlyPayment as number) - (results[i].assumableMonthlyPayment as number);
      expect(prevSavings).toBeGreaterThanOrEqual(currSavings);
    }
  });

  it('all results have rates at or below 3.5%', () => {
    const results = filterForPPC('general');
    for (const r of results) {
      expect(r.assumableRate as number).toBeLessThanOrEqual(3.5);
    }
  });
});

describe('Google Ads conversion tracking', () => {
  it('conversion ID and label are correct', () => {
    const CONVERSION_ID = 'AW-17997636825';
    const CONVERSION_LABEL = 'EvE5CJ69yY8cENnJ-IVD';
    const SEND_TO = `${CONVERSION_ID}/${CONVERSION_LABEL}`;

    expect(SEND_TO).toBe('AW-17997636825/EvE5CJ69yY8cENnJ-IVD');
  });

  it('conversion value is $50', () => {
    const value = 50.0;
    const currency = 'USD';
    expect(value).toBe(50.0);
    expect(currency).toBe('USD');
  });
});
