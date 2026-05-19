export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

interface RawListing {
  id: string;
  city: string;
  state: string;
  assumableRate: number;
  assumableMonthlyPayment: number;
  marketMonthlyPayment: number;
  estimatedEquityGap: number;
  loanType: string;
  beds: number;
  baths: number;
  sqft: number;
  photoUrls?: string[];
}

interface PPCListing {
  id: string;
  city: string;
  state: string;
  assumableRate: number;
  assumableMonthlyPayment: number;
  monthlySavings: number;
  beds: number;
  baths: number;
  sqft: number;
  loanType: string;
  photoUrl?: string;
}

function loadListings(): RawListing[] {
  const filePath = join(process.cwd(), 'public', 'data', 'listings.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as RawListing[];
}

export async function GET(req: NextRequest) {
  const variant = req.nextUrl.searchParams.get('variant') || 'general';
  const all = loadListings();

  let filtered = all.filter((l) => l.assumableRate <= 3.5);

  if (variant === 'va') {
    filtered = filtered.filter((l) => l.loanType === 'VA');
  }

  // Try progressively larger equity gap caps until we have 6
  for (const cap of [40000, 60000, 80000, 120000, 200000, Infinity]) {
    const pool = filtered.filter((l) => l.estimatedEquityGap <= cap);
    if (pool.length >= 6) {
      filtered = pool;
      break;
    }
  }

  // Sort by highest monthly savings descending
  filtered.sort(
    (a, b) =>
      (b.marketMonthlyPayment - b.assumableMonthlyPayment) -
      (a.marketMonthlyPayment - a.assumableMonthlyPayment)
  );

  const results: PPCListing[] = filtered.slice(0, 6).map((l) => ({
    id: l.id,
    city: l.city,
    state: l.state,
    assumableRate: l.assumableRate,
    assumableMonthlyPayment: l.assumableMonthlyPayment,
    monthlySavings: l.marketMonthlyPayment - l.assumableMonthlyPayment,
    beds: l.beds,
    baths: l.baths,
    sqft: l.sqft,
    loanType: l.loanType,
    photoUrl: l.photoUrls?.[0] || undefined,
  }));

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
  });
}
