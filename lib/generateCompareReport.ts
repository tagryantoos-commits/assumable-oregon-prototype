/**
 * Assumable vs Conventional Comparison Report, PDF Generator
 *
 * Generates a branded PDF showing side-by-side comparison of assumable mortgage
 * (with gap financing) vs conventional mortgage. Includes full savings breakdown.
 *
 * Used by:
 *   1. /api/compare/[id] , API endpoint
 *   2. Slack bot          , agents request comparison PDFs for buyers
 *
 * Returns a Buffer containing the PDF.
 */

import PDFDocument from 'pdfkit';
import { Listing, CONVENTIONAL_RATE } from './listings';

// ─── Constants ───────────────────────────────────────────────────────────────
const GAP_RATE = 8.5; // Current gap/second mortgage rate
const BRAND_DARK = '#12395D';
const BRAND_LIGHT = '#7DB0DE';
const BRAND_BG = '#EDF4F9';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1a1a1a';
const TEXT_MED = '#4a4a4a';
const TEXT_LIGHT = '#777777';
const GREEN = '#0F7B3F';
const RED = '#C0392B';

function calcMonthly(principal: number, ratePct: number, years = 30): number {
  if (!principal || ratePct <= 0) return 0;
  const r = ratePct / 100 / 12;
  const n = years * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function fmtRate(n: number): string {
  return n.toFixed(2) + '%';
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export interface CompareOptions {
  gapLoanPct: number; // What % of equity gap is financed (e.g. 95 = 5% down on gap)
  downPct?: number;   // Conventional down payment % (default 5)
}

function drawRow(
  doc: PDFKit.PDFDocument, y: number, w: number, h: number, bg: string,
  cells: { text: string; x: number; font: string; color: string }[]
) {
  doc.rect(50, y, w, h).fill(bg);
  for (const cell of cells) {
    doc.fontSize(8.5).fill(cell.color).font(cell.font)
      .text(cell.text, cell.x, y + 5, { lineBreak: false });
  }
}

export async function generateCompareReport(
  listing: Listing,
  options: CompareOptions = { gapLoanPct: 95 }
): Promise<Buffer> {
  const downPct = options.downPct ?? 5;
  const gapFinancePct = options.gapLoanPct;

  // ─── Conventional math ─────────────────────────────────────────────
  const convDown = listing.price * (downPct / 100);
  const convLoan = listing.price - convDown;
  const convMonthly = calcMonthly(convLoan, CONVENTIONAL_RATE);
  const convTotal = convMonthly * 360;

  // ─── Assumable math ────────────────────────────────────────────────
  const equityGap = listing.estimatedEquityGap || (listing.price - listing.remainingLoanBalance);
  const gapDown = equityGap * ((100 - gapFinancePct) / 100);
  const gapLoan = equityGap - gapDown;
  const assumableMonthly = calcMonthly(listing.remainingLoanBalance, listing.assumableRate);
  const gapMonthly = gapLoan > 0 ? calcMonthly(gapLoan, GAP_RATE) : 0;
  const totalAssumableMonthly = assumableMonthly + gapMonthly;
  const totalAssumableTotal = totalAssumableMonthly * 360;

  // ─── Blended rate ──────────────────────────────────────────────────
  const totalBorrowed = listing.remainingLoanBalance + gapLoan;
  const blendedRate = totalBorrowed > 0
    ? ((listing.remainingLoanBalance * listing.assumableRate) + (gapLoan * GAP_RATE)) / totalBorrowed
    : listing.assumableRate;

  // ─── Savings ───────────────────────────────────────────────────────
  const monthlySavings = Math.max(0, convMonthly - totalAssumableMonthly);
  const annualSavings = monthlySavings * 12;
  const fiveYearSavings = monthlySavings * 60;
  const lifetimeSavings = convTotal - totalAssumableTotal;

  const photoUrl = listing.photoUrls?.[0] || '';
  const photoBuffer = photoUrl ? await fetchImageBuffer(photoUrl) : null;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 0, bottom: 30, left: 50, right: 50 },
      info: {
        Title: `Loan Comparison, ${listing.address}, ${listing.city}`,
        Author: 'The Assumable Guy, Ryan Thomson, Keller Williams',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = 612;
    const contentW = pageW - 100;
    const col1 = 50;
    const colMid = 280;
    const colRight = 430;
    const rowH = 17;

    // ─── HEADER ──────────────────────────────────────────────────────
    doc.rect(0, 0, pageW, 50).fill(BRAND_DARK);
    doc.fontSize(16).fill(WHITE).font('Helvetica-Bold')
      .text('THE ASSUMABLE GUY', 50, 14, { lineBreak: false });
    doc.fontSize(8).fill(BRAND_LIGHT).font('Helvetica')
      .text('Loan Comparison Report', 50, 34, { lineBreak: false });
    doc.fontSize(8).fill(BRAND_LIGHT).font('Helvetica')
      .text('assumableguy.com', 50, 34, { width: contentW, align: 'right' });

    let y = 58;

    // ─── PROPERTY SUMMARY (compact) ──────────────────────────────────
    if (photoBuffer) {
      try {
        doc.image(photoBuffer, 50, y, { width: 120, height: 80, fit: [120, 80] });
        // Property info to the right of photo
        doc.fontSize(13).fill(TEXT_DARK).font('Helvetica-Bold')
          .text(listing.address, 180, y + 2, { lineBreak: false });
        doc.fontSize(9).fill(TEXT_MED).font('Helvetica')
          .text(`${listing.city}, ${listing.state} ${listing.zip}`, 180, y + 18, { lineBreak: false });
        doc.fontSize(9).fill(TEXT_LIGHT).font('Helvetica')
          .text(`${listing.beds} Beds | ${listing.baths} Baths | ${listing.sqft.toLocaleString()} Sq Ft`, 180, y + 32, { lineBreak: false });
        doc.fontSize(11).fill(BRAND_DARK).font('Helvetica-Bold')
          .text(fmt(listing.price), 180, y + 48, { lineBreak: false });
        // Rate badge
        doc.fontSize(9).fill(GREEN).font('Helvetica-Bold')
          .text(`${fmtRate(listing.assumableRate)} ${listing.loanType}`, 180, y + 64, { lineBreak: false });
        y += 88;
      } catch {
        y += 4;
      }
    } else {
      doc.fontSize(13).fill(TEXT_DARK).font('Helvetica-Bold')
        .text(`${listing.address}, ${listing.city}`, 50, y, { lineBreak: false });
      y += 18;
      doc.fontSize(11).fill(BRAND_DARK).font('Helvetica-Bold')
        .text(`${fmt(listing.price)} | ${fmtRate(listing.assumableRate)} ${listing.loanType}`, 50, y, { lineBreak: false });
      y += 22;
    }

    // ─── SAVINGS HIGHLIGHT ───────────────────────────────────────────
    const boxH = 40;
    doc.rect(50, y, contentW, boxH).fill(BRAND_BG);
    doc.rect(50, y, 4, boxH).fill(GREEN);
    doc.fontSize(20).fill(GREEN).font('Helvetica-Bold')
      .text(`${fmt(monthlySavings)}/mo savings`, 64, y + 4, { lineBreak: false });
    doc.fontSize(9).fill(TEXT_DARK).font('Helvetica')
      .text(`even with secondary financing at ${fmtRate(GAP_RATE)}  |  Blended rate: ${fmtRate(blendedRate)}  |  ${fmt(annualSavings)}/year`, 64, y + 26, { lineBreak: false });
    y += boxH + 10;

    // ─── SIDE-BY-SIDE COMPARISON TABLE ───────────────────────────────
    doc.fontSize(11).fill(BRAND_DARK).font('Helvetica-Bold')
      .text('Side-by-Side Comparison', 50, y, { lineBreak: false });
    y += 16;

    // Header row
    doc.rect(col1, y, contentW, rowH + 2).fill(BRAND_DARK);
    doc.fontSize(8).fill(WHITE).font('Helvetica-Bold');
    doc.text('', col1 + 6, y + 5, { lineBreak: false });
    doc.text('Conventional Loan', colMid, y + 5, { lineBreak: false });
    doc.text('Assumable + Gap Loan', colRight, y + 5, { lineBreak: false });
    y += rowH + 2;

    const compRows: [string, string, string, boolean?][] = [
      ['Interest Rate', `${fmtRate(CONVENTIONAL_RATE)} (30yr fixed)`, `${fmtRate(listing.assumableRate)} assumed + ${fmtRate(GAP_RATE)} gap`],
      ['Down Payment', `${fmt(convDown)} (${downPct}%)`, `${fmt(gapDown)} (${100 - gapFinancePct}% of gap)`],
      ['Primary Loan', fmt(convLoan), fmt(listing.remainingLoanBalance)],
      ['Second Mortgage', '\u2014', gapLoan > 0 ? fmt(gapLoan) : '\u2014'],
      ['Primary P&I', fmt(convMonthly), fmt(assumableMonthly)],
      ['Gap Loan P&I', '\u2014', gapLoan > 0 ? fmt(gapMonthly) : '\u2014'],
      ['Total Monthly P&I', fmt(convMonthly), fmt(totalAssumableMonthly), true],
      ['Blended Effective Rate', fmtRate(CONVENTIONAL_RATE), fmtRate(blendedRate), true],
    ];

    compRows.forEach((row, i) => {
      const isBold = row[3];
      const bg = isBold ? '#E8F5E9' : i % 2 === 0 ? '#F5F6F7' : WHITE;
      drawRow(doc, y, contentW, rowH, bg, [
        { text: row[0], x: col1 + 6, font: isBold ? 'Helvetica-Bold' : 'Helvetica', color: TEXT_DARK },
        { text: row[1], x: colMid, font: 'Helvetica', color: RED },
        { text: row[2], x: colRight, font: 'Helvetica-Bold', color: GREEN },
      ]);
      y += rowH;
    });
    y += 10;

    // ─── SAVINGS BREAKDOWN (same 3-col layout) ────────────────────
    doc.fontSize(11).fill(BRAND_DARK).font('Helvetica-Bold')
      .text('Your Savings Breakdown', 50, y, { lineBreak: false });
    y += 16;

    const savingsRows: [string, string][] = [
      ['Monthly Savings', fmt(monthlySavings)],
      ['Annual Savings', fmt(annualSavings)],
      ['5-Year Savings', fmt(fiveYearSavings)],
      ['Lifetime Savings (30yr)', fmt(lifetimeSavings)],
    ];

    savingsRows.forEach((row, i) => {
      const bg = i % 2 === 0 ? '#E8F5E9' : '#F0FAF0';
      drawRow(doc, y, contentW, rowH, bg, [
        { text: row[0], x: col1 + 6, font: 'Helvetica', color: TEXT_DARK },
        { text: row[1], x: colRight, font: 'Helvetica-Bold', color: GREEN },
      ]);
      y += rowH;
    });
    y += 10;

    // ─── ASSUMABLE LOAN STRUCTURE (same 3-col layout) ────────────
    doc.fontSize(11).fill(BRAND_DARK).font('Helvetica-Bold')
      .text('Assumable Loan Structure', 50, y, { lineBreak: false });
    y += 16;

    const structRows: [string, string][] = [
      ['Loan Type', `${listing.loanType} (Assumable)`],
      ['Assumed Balance', fmt(listing.remainingLoanBalance)],
      ['Assumed Rate', `${fmtRate(listing.assumableRate)} APR`],
      ['Equity Gap', fmt(equityGap)],
      ['Gap Financed', gapLoan > 0 ? `${fmt(gapLoan)} at ${fmtRate(GAP_RATE)}` : 'Covered by down payment'],
      ['Buyer Down Payment', fmt(gapDown)],
      ['Cash to Close', fmt(gapDown)],
    ];

    structRows.forEach((row, i) => {
      const bg = i % 2 === 0 ? '#F5F6F7' : WHITE;
      drawRow(doc, y, contentW, rowH, bg, [
        { text: row[0], x: col1 + 6, font: 'Helvetica', color: TEXT_LIGHT },
        { text: row[1], x: colRight, font: 'Helvetica-Bold', color: TEXT_DARK },
      ]);
      y += rowH;
    });
    y += 10;

    // ─── HOW IT WORKS (brief) ────────────────────────────────────────
    doc.fontSize(9).fill(BRAND_DARK).font('Helvetica-Bold')
      .text('How This Works', 50, y, { lineBreak: false });
    y += 12;

    doc.fontSize(7.5).fill(TEXT_MED).font('Helvetica');
    const explanation = `The buyer assumes the seller's existing ${listing.loanType} loan at ${fmtRate(listing.assumableRate)} and takes a second mortgage of ${fmt(gapLoan)} at ${fmtRate(GAP_RATE)} to cover the equity gap. Even with the higher-rate second mortgage, the blended effective rate is ${fmtRate(blendedRate)}, saving ${fmt(monthlySavings)}/month vs a conventional loan at ${fmtRate(CONVENTIONAL_RATE)}. The process takes 45-90 days through the existing lender.`;
    doc.text(explanation, 50, y, { width: contentW, lineGap: 1 });
    y = doc.y + 6;

    // ─── CTA ─────────────────────────────────────────────────────────
    doc.rect(50, y, contentW, 32).fill(BRAND_DARK);
    doc.fontSize(10).fill(WHITE).font('Helvetica-Bold')
      .text('Ready to move forward on this property?', 62, y + 5, { lineBreak: false });
    doc.fontSize(8).fill(BRAND_LIGHT).font('Helvetica')
      .text('Contact your agent at The Assumable Guy  |  assumableguy.com  |  (719) 624-3472', 62, y + 18, { lineBreak: false });
    y += 38;

    // ─── COMPLIANCE ──────────────────────────────────────────────────
    doc.fontSize(5.5).fill(TEXT_LIGHT).font('Helvetica');
    const disclosure = `Comparison based on list price of ${fmt(listing.price)}. Assumable ${listing.loanType} loan at ${fmtRate(listing.assumableRate)} APR. Gap financing at ${fmtRate(GAP_RATE)} APR, 30-year term. Conventional mortgage at ${fmtRate(CONVENTIONAL_RATE)} APR, 30-year fixed, ${downPct}% down. Actual gap financing rates may vary. Equity gap must be covered by buyer through cash or secondary financing. Qualification subject to lender approval. Not an offer to lend. Ryan Thomson, Keller Williams. Equal Housing Opportunity. Report generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. Data subject to change.`;
    doc.text(disclosure, 50, y, { width: contentW, lineGap: 1 });

    doc.end();
  });
}
