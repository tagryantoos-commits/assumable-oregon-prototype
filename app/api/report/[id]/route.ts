export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { getListingById } from '../../../../lib/listings';
import { generateReport } from '../../../../lib/generateReport';
import { getAuthenticatedEmail } from '../../../../lib/apiAuth';

/**
 * GET /api/report/[id]
 *
 * Generates and returns a PDF Assumable Mortgage Report for a listing.
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
    return NextResponse.json(
      { error: `Listing not found: ${id}` },
      { status: 404 }
    );
  }

  try {
    const pdfBuffer = await generateReport(listing);

    const download = req.nextUrl.searchParams.get('download') === '1';
    const filename = `Assumable-Mortgage-Report-${listing.address.replace(/\s+/g, '-')}-${listing.city}.pdf`;

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
    console.error('[REPORT] PDF generation failed:', err);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
