/**
 * Assumable Mortgage Report, PDF Generator
 *
 * Generates a branded PDF property report for any listing.
 * Used by:
 *   1. /api/report/[id] , website lead magnet download
 *   2. Slack bot         , agents request reports for their buyers
 *
 * Returns a Buffer containing the PDF.
 */

import PDFDocument from 'pdfkit';
import { Listing, calcConventionalMonthly, CONVENTIONAL_RATE } from './listings';

// ─── Brand constants ─────────────────────────────────────────────────────────
const BRAND_DARK = '#12395D';
const BRAND_LIGHT = '#7DB0DE';
const BRAND_BG = '#EDF4F9';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1a1a1a';
const TEXT_MED = '#4a4a4a';
const TEXT_LIGHT = '#777777';
const GREEN = '#0F7B3F';

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
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch {
    return null;
  }
}

function drawRow(doc: PDFKit.PDFDocument, y: number, w: number, h: number, bg: string, cells: { text: string; x: number; font: string; color: string }[]) {
  doc.rect(50, y, w, h).fill(bg);
  for (const cell of cells) {
    doc.fontSize(8.5).fill(cell.color).font(cell.font)
      .text(cell.text, cell.x, y + 5, { lineBreak: false });
  }
}

export async function generateReport(listing: Listing): Promise<Buffer> {
  const conventionalMonthly = calcConventionalMonthly(listing.price);
  const monthlySavings = Math.max(0, conventionalMonthly - listing.assumableMonthlyPayment);
  const annualSavings = monthlySavings * 12;
  const fiveYearSavings = monthlySavings * 60;

  const photoUrl = listing.photoUrls?.[0] || '';
  const photoBuffer = photoUrl ? await fetchImageBuffer(photoUrl) : null;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 0, bottom: 30, left: 50, right: 50 },
      info: {
        Title: `Assumable Mortgage Report, ${listing.address}, ${listing.city}`,
        Author: 'The Assumable Guy, Ryan Thomson, Keller Williams',
        Subject: 'Assumable Mortgage Property Analysis',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = 612;
    const contentW = pageW - 100;
    const col1 = 50;
    const col2 = 245;
    const col3 = 395;
    const rowH = 18;

    // ─── HEADER BAR ──────────────────────────────────────────────────
    doc.rect(0, 0, pageW, 55).fill(BRAND_DARK);
    doc.fontSize(18).fill(WHITE).font('Helvetica-Bold')
      .text('THE ASSUMABLE GUY', 50, 16, { lineBreak: false });
    doc.fontSize(8).fill(BRAND_LIGHT).font('Helvetica')
      .text('Assumable Mortgage Property Report', 50, 38, { lineBreak: false });
    doc.fontSize(8).fill(BRAND_LIGHT).font('Helvetica')
      .text('assumableguy.com', 50, 38, { width: contentW, align: 'right' });

    let y = 60;

    // ─── PROPERTY PHOTO ──────────────────────────────────────────────
    if (photoBuffer) {
      try {
        const imgH = 140;
        doc.image(photoBuffer, 50, y, { width: contentW, height: imgH, fit: [contentW, imgH] });
        // Rate badge
        const bx = pageW - 50 - 80;
        doc.rect(bx, y + 6, 72, 28).fill(GREEN);
        doc.fontSize(14).fill(WHITE).font('Helvetica-Bold')
          .text(fmtRate(listing.assumableRate), bx, y + 8, { width: 72, align: 'center' });
        doc.fontSize(7).fill(WHITE).font('Helvetica')
          .text(listing.loanType + ' LOAN', bx, y + 24, { width: 72, align: 'center' });
        y += imgH + 6;
      } catch {
        y += 4;
      }
    }

    // ─── ADDRESS & STATS ─────────────────────────────────────────────
    doc.fontSize(14).fill(TEXT_DARK).font('Helvetica-Bold')
      .text(listing.address, 50, y, { lineBreak: false });
    y += 16;
    doc.fontSize(9).fill(TEXT_MED).font('Helvetica')
      .text(`${listing.city}, ${listing.state} ${listing.zip}`, 50, y, { lineBreak: false });
    y += 12;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yearBuilt = (listing as any).yearBuilt;
    const stats = [
      `${listing.beds} Beds`, `${listing.baths} Baths`,
      `${listing.sqft.toLocaleString()} Sq Ft`,
      yearBuilt ? `Built ${yearBuilt}` : '',
    ].filter(Boolean).join('  |  ');
    doc.fontSize(8).fill(TEXT_LIGHT).font('Helvetica').text(stats, 50, y, { lineBreak: false });
    y += 11;
    doc.fontSize(12).fill(BRAND_DARK).font('Helvetica-Bold')
      .text(`List Price: ${fmt(listing.price)}`, 50, y, { lineBreak: false });
    y += 18;

    // ─── SAVINGS HIGHLIGHT BOX ───────────────────────────────────────
    const boxH = 44;
    doc.rect(50, y, contentW, boxH).fill(BRAND_BG);
    doc.rect(50, y, 4, boxH).fill(GREEN);
    doc.fontSize(22).fill(GREEN).font('Helvetica-Bold')
      .text(fmt(annualSavings), 64, y + 4, { lineBreak: false });
    doc.fontSize(9).fill(TEXT_DARK).font('Helvetica')
      .text(`estimated annual savings vs. a conventional loan  (${fmt(monthlySavings)}/month)`, 64, y + 28, { lineBreak: false });
    y += boxH + 10;

    // ─── PAYMENT COMPARISON TABLE ────────────────────────────────────
    doc.fontSize(11).fill(BRAND_DARK).font('Helvetica-Bold')
      .text('Payment Comparison', 50, y, { lineBreak: false });
    y += 16;

    // Header row
    doc.rect(col1, y, contentW, rowH).fill(BRAND_DARK);
    doc.fontSize(8).fill(WHITE).font('Helvetica-Bold');
    doc.text('', col1 + 6, y + 5, { lineBreak: false });
    doc.text('Assumable Loan', col2, y + 5, { lineBreak: false });
    doc.text('New Conventional', col3, y + 5, { lineBreak: false });
    y += rowH;

    const compRows = [
      ['Interest Rate', fmtRate(listing.assumableRate) + ' APR', fmtRate(CONVENTIONAL_RATE) + ' APR'],
      ['Monthly Payment (P&I)', fmt(listing.assumableMonthlyPayment), fmt(conventionalMonthly)],
      ['Monthly Savings', fmt(monthlySavings), '\u2014'],
      ['Annual Savings', fmt(annualSavings), '\u2014'],
      ['5-Year Savings', fmt(fiveYearSavings), '\u2014'],
    ];
    compRows.forEach((row, i) => {
      const bg = i % 2 === 0 ? '#F5F6F7' : WHITE;
      drawRow(doc, y, contentW, rowH, bg, [
        { text: row[0], x: col1 + 6, font: 'Helvetica', color: TEXT_DARK },
        { text: row[1], x: col2, font: 'Helvetica-Bold', color: GREEN },
        { text: row[2], x: col3, font: 'Helvetica', color: TEXT_MED },
      ]);
      y += rowH;
    });
    y += 8;

    // ─── LOAN DETAILS ────────────────────────────────────────────────
    doc.fontSize(11).fill(BRAND_DARK).font('Helvetica-Bold')
      .text('Loan Details', 50, y, { lineBreak: false });
    y += 16;

    const loanRows = [
      ['Loan Type', `${listing.loanType} (Assumable)`],
      ['Remaining Loan Balance', fmt(listing.remainingLoanBalance)],
      ['Estimated Equity Gap', fmt(listing.estimatedEquityGap)],
      ['Estimated Cash to Close', fmt(listing.cashToClose)],
      ['Annual Property Taxes', listing.annualTaxes > 0 ? fmt(listing.annualTaxes) : 'See county records'],
      ['HOA', listing.hoa > 0 ? `${fmt(listing.hoa)}/month` : 'None'],
    ];
    loanRows.forEach((row, i) => {
      const bg = i % 2 === 0 ? '#F5F6F7' : WHITE;
      drawRow(doc, y, contentW, rowH, bg, [
        { text: row[0], x: col1 + 6, font: 'Helvetica', color: TEXT_LIGHT },
        { text: row[1], x: col2, font: 'Helvetica-Bold', color: TEXT_DARK },
      ]);
      y += rowH;
    });
    y += 10;

    // ─── HOW ASSUMABLE MORTGAGES WORK ────────────────────────────────
    doc.fontSize(11).fill(BRAND_DARK).font('Helvetica-Bold')
      .text('How Assumable Mortgages Work', 50, y, { lineBreak: false });
    y += 15;

    const paragraphs = [
      `Every FHA and VA loan is assumable by law. When you buy a home with an assumable loan, you take over the seller's existing mortgage at their original interest rate. On this property, that means a ${fmtRate(listing.assumableRate)} rate instead of today's ${fmtRate(CONVENTIONAL_RATE)}. The difference is ${fmt(monthlySavings)} per month, or ${fmt(annualSavings)} per year.`,
      `The equity gap of ${fmt(listing.estimatedEquityGap)} is the difference between the home's price and the remaining loan balance. This is covered through cash, secondary financing, or a combination of both. The process takes 45-90 days. You apply with the current lender, they approve the transfer, and you step into the seller's loan with their rate and terms.`,
    ];

    doc.fontSize(8).fill(TEXT_MED).font('Helvetica');
    for (const para of paragraphs) {
      doc.text(para, 50, y, { width: contentW, lineGap: 1 });
      y = doc.y + 4;
    }
    y += 2;

    // ─── CTA BOX ─────────────────────────────────────────────────────
    doc.rect(50, y, contentW, 36).fill(BRAND_DARK);
    doc.fontSize(10).fill(WHITE).font('Helvetica-Bold')
      .text('Ready to run the numbers on this property?', 62, y + 6, { width: contentW - 24, lineBreak: false });
    doc.fontSize(8).fill(BRAND_LIGHT).font('Helvetica')
      .text('Contact Ryan Thomson at assumableguy.com or call/text to get started.  |  Ryan Thomson, Keller Williams', 62, y + 20, { width: contentW - 24, lineBreak: false });
    y += 42;

    // ─── COMPLIANCE FOOTER ───────────────────────────────────────────
    doc.fontSize(6).fill(TEXT_LIGHT).font('Helvetica');
    const disclosure = `Payment comparison based on list price of ${fmt(listing.price)}. Assumable ${listing.loanType} loan at ${fmtRate(listing.assumableRate)} APR. New conventional mortgage calculated at ${fmtRate(CONVENTIONAL_RATE)} APR, 30-year fixed, 5% down. Equity gap between loan balance and purchase price varies and must be covered by the buyer through cash or secondary financing. Qualification subject to lender approval. Not an offer to lend. Ryan Thomson, Keller Williams. Equal Housing Opportunity. Report generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. Data subject to change.`;
    doc.text(disclosure, 50, y, { width: contentW, lineGap: 1 });

    doc.end();
  });
}
