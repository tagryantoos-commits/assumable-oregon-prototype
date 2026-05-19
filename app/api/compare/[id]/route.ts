export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { getListingById } from '../../../../lib/listings';
import { generateCompareReport } from '../../../../lib/generateCompareReport';
import { getAuthenticatedEmail } from '../../../../lib/apiAuth';

/**
 * GET /api/compare/[id]?gap=95&down=5
 *
 * Generates a PDF comparing assumable mortgage + gap financing vs conventional.
 * Requires authentication (Supabase session, tag3_user cookie, or X-API-Key).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getAuthenticatedEmail(req);
  if (!email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;
  const listing = getListingById(id);

  if (!listing) {
    return NextResponse.json({ error: `Listing not found: ${id}` }, { status: 404 });
  }

  const gapDownDollars = req.nextUrl.searchParams.get('gapDown');
  let gapLoanPct: number;

  if (gapDownDollars) {
    // Convert dollar amount to percentage
    const equityGap = listing.estimatedEquityGap || (listing.price - listing.remainingLoanBalance);
    if (equityGap <= 0) {
      gapLoanPct = 0;
    } else {
      const downOnGap = Math.min(Number(gapDownDollars), equityGap);
      gapLoanPct = Math.max(0, Math.round(((equityGap - downOnGap) / equityGap) * 100));
    }
  } else {
    gapLoanPct = Number(req.nextUrl.searchParams.get('gap') || '95');
  }

  const downPct = Number(req.nextUrl.searchParams.get('down') || '5');
  const download = req.nextUrl.searchParams.get('download') === '1';

  try {
    const pdfBuffer = await generateCompareReport(listing, { gapLoanPct, downPct });
    const filename = `Loan-Comparison-${listing.address.replace(/\s+/g, '-')}-${listing.city}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[COMPARE] PDF generation failed:', err);
    return NextResponse.json({ error: 'Failed to generate comparison report' }, { status: 500 });
  }
}
