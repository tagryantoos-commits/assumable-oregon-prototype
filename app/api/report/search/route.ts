export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { allListings } from '../../../../lib/listings';
import { getAuthenticatedEmail } from '../../../../lib/apiAuth';

/**
 * GET /api/report/search?q=langdale
 *
 * Search listings by address, city, or zip.
 * Requires authentication (Supabase session, tag3_user cookie, or X-API-Key).
 */
export async function GET(req: NextRequest) {
  const email = await getAuthenticatedEmail(req);
  if (!email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q')?.toLowerCase().trim();

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters', results: [] },
      { status: 400 }
    );
  }

  const matches = allListings
    .filter((l) => {
      const haystack = `${l.address} ${l.city} ${l.zip}`.toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, 10)
    .map((l) => ({
      id: l.id,
      slug: l.slug,
      address: l.address,
      city: l.city,
      state: l.state,
      zip: l.zip,
      price: l.price,
      assumableRate: l.assumableRate,
      loanType: l.loanType,
      remainingLoanBalance: l.remainingLoanBalance,
      estimatedEquityGap: l.estimatedEquityGap,
      monthlySavings: l.monthlySavings,
      reportUrl: `https://assumableguy.com/api/report/${l.id}?download=1`,
      compareUrl: `https://assumableguy.com/api/compare/${l.id}?download=1`,
      listingUrl: `https://assumableguy.com/homes/${l.slug}`,
    }));

  return NextResponse.json({
    query: q,
    count: matches.length,
    results: matches,
  });
}
