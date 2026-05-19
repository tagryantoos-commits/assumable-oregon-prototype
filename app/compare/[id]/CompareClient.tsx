'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Listing, formatPrice } from '../../../lib/listings';
import LeadCaptureForm from '../../../components/LeadCaptureForm';

function calcMonthly(principal: number, ratePct: number, years = 30): number {
  if (!principal || ratePct <= 0) return 0;
  const r = ratePct / 100 / 12;
  const n = years * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calcTotalInterest(principal: number, ratePct: number, years = 30): number {
  const monthly = calcMonthly(principal, ratePct, years);
  return monthly * years * 12 - principal;
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

const CONV_RATE = 6.5;
const GAP_RATE = 8.5;

interface Props {
  listing: Listing;
}

export default function CompareClient({ listing }: Props) {
  const equityGap = listing.estimatedEquityGap || (listing.price - listing.remainingLoanBalance);
  const fivePercentOfPrice = Math.round(listing.price * 0.05);

  // Edge case: equity gap <= 5% of purchase price, no gap financing needed
  const noGapFinancing = equityGap <= fivePercentOfPrice;

  const minDown = fivePercentOfPrice;
  const maxDown = Math.round(equityGap);

  const [downAmount, setDownAmount] = useState(noGapFinancing ? maxDown : minDown);
  const [gapRate, setGapRate] = useState(GAP_RATE);
  const [downloading, setDownloading] = useState(false);

  const effectiveDown = noGapFinancing ? maxDown : Math.max(minDown, Math.min(downAmount, maxDown));
  const downPctOfPrice = listing.price > 0 ? Math.round((effectiveDown / listing.price) * 100) : 0;

  // Conventional (5% down on purchase price)
  const convDown = listing.price * 0.05;
  const convLoan = listing.price - convDown;
  const convMonthly = calcMonthly(convLoan, CONV_RATE);
  const convInterest = calcTotalInterest(convLoan, CONV_RATE);

  // Assumable
  const assumableMonthly = calcMonthly(listing.remainingLoanBalance, listing.assumableRate);

  // Gap financing
  const gapDown = effectiveDown;
  const gapLoan = Math.max(0, equityGap - gapDown);
  const gapMonthly = gapLoan > 0 ? calcMonthly(gapLoan, gapRate) : 0;
  const gapInterest = gapLoan > 0 ? calcTotalInterest(gapLoan, gapRate) : 0;
  const totalAssumableMonthly = assumableMonthly + gapMonthly;
  const totalAssumableInterest = calcTotalInterest(listing.remainingLoanBalance, listing.assumableRate) + gapInterest;

  // Savings
  const monthlySavings = Math.max(0, convMonthly - totalAssumableMonthly);
  const annualSavings = monthlySavings * 12;
  const lifetimeSavings = monthlySavings * 360;
  const interestSaved = Math.max(0, convInterest - totalAssumableInterest);

  // Bar chart max
  const maxMonthly = Math.max(convMonthly, totalAssumableMonthly, 1);

  // Blended rate
  const totalLoan = listing.remainingLoanBalance + gapLoan;
  const blendedRate = totalLoan > 0
    ? ((listing.assumableRate * listing.remainingLoanBalance) + (gapRate * gapLoan)) / totalLoan
    : listing.assumableRate;

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const gapPct = equityGap > 0 ? Math.round((gapLoan / equityGap) * 100) : 0;
      const downPctForApi = listing.price > 0 ? Math.round((effectiveDown / listing.price) * 100) : 5;
      const res = await fetch(`/api/compare/${listing.id}?gap=${gapPct}&down=${downPctForApi}&download=1`);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Loan-Comparison-${listing.address.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Property quick stats */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <Stat label="List Price" value={formatPrice(listing.price)} />
            <Stat label="Assumable Rate" value={`${listing.assumableRate}%`} color="text-brand" />
            <Stat label="Remaining Balance" value={formatPrice(listing.remainingLoanBalance)} />
            <Stat label="Equity Gap" value={formatPrice(equityGap)} />
            <Stat label="Loan Type" value={listing.loanType} badge />
          </div>
        </div>

        {noGapFinancing ? (
          /* No gap financing needed */
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h2 className="text-lg font-bold text-green-800 mb-2">No Secondary Financing Needed</h2>
              <p className="text-sm text-green-700 mb-4">
                The equity gap on this property ({fmt(equityGap)}) is less than 5% of the purchase price ({fmt(fivePercentOfPrice)}). Your down payment covers the full gap with no second mortgage required.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500">Down Payment</div>
                  <div className="text-lg font-bold text-brand">{fmt(equityGap)}</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500">Effective Rate</div>
                  <div className="text-lg font-bold text-brand">{listing.assumableRate}%</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500">vs Conventional</div>
                  <div className="text-lg font-bold text-slate-500">{CONV_RATE}%</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Normal: sliders */
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Adjust Your Scenario</h2>
            <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
              <SliderInput
                label="Down Payment"
                value={downAmount}
                onChange={setDownAmount}
                min={minDown}
                max={maxDown}
                step={100}
                format={(v) => fmt(v)}
                minLabel={fmt(minDown)}
                maxLabel={fmt(maxDown)}
              />
              <SliderInput
                label="Gap Financing Rate"
                value={gapRate}
                onChange={setGapRate}
                min={5}
                max={10}
                step={0.25}
                format={(v) => `${v.toFixed(2)}%`}
                sub="Second mortgage rate on the equity gap"
                minLabel="5%"
                maxLabel="10%"
              />

              {/* Fixed values display */}
              <div className="flex items-center gap-6 md:col-span-2 text-sm">
                <div>
                  <span className="text-gray-500">Conventional Rate: </span>
                  <span className="font-bold text-slate-500">{CONV_RATE}% (30yr fixed)</span>
                </div>
                <div>
                  <span className="text-gray-500">Assumable Rate: </span>
                  <span className="font-bold text-brand">{listing.assumableRate}% ({listing.loanType})</span>
                </div>
                <div>
                  <span className="text-gray-500">Blended Rate: </span>
                  <span className="font-bold text-brand">{blendedRate.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visual Comparison Bar Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Monthly Payment Comparison</h2>
          <div className="space-y-6">
            {/* Conventional bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-400 rounded-full" />
                  <span className="text-sm font-medium text-gray-700">New Conventional @ {CONV_RATE}%</span>
                </div>
                <span className="text-lg font-black text-slate-500">{fmt(convMonthly)}/mo</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-slate-300 to-slate-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(convMonthly / maxMonthly) * 100}%` }}
                />
              </div>
            </div>

            {/* Assumable bar (stacked: assumable + gap) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-brand rounded-full" />
                  <span className="text-sm font-medium text-gray-700">
                    Assumable @ {listing.assumableRate}%{gapLoan > 0 ? ` + gap loan` : ''}
                  </span>
                </div>
                <span className="text-lg font-black text-brand">{fmt(totalAssumableMonthly)}/mo</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                <div className="h-full flex rounded-full overflow-hidden transition-all duration-500 ease-out"
                  style={{ width: `${(totalAssumableMonthly / maxMonthly) * 100}%` }}>
                  <div
                    className="h-full bg-gradient-to-r from-brand-light to-brand"
                    style={{ width: `${totalAssumableMonthly > 0 ? (assumableMonthly / totalAssumableMonthly) * 100 : 100}%` }}
                  />
                  {gapMonthly > 0 && (
                    <div
                      className="h-full bg-brand-200"
                      style={{ width: `${(gapMonthly / totalAssumableMonthly) * 100}%` }}
                    />
                  )}
                </div>
              </div>
              {gapLoan > 0 && (
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-brand rounded-full" />
                    Assumed loan: {fmt(assumableMonthly)}/mo
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-brand-200 rounded-full" />
                    Gap financing: {fmt(gapMonthly)}/mo
                  </div>
                </div>
              )}
            </div>

            {/* Savings indicator */}
            {monthlySavings > 0 && (
              <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl py-3 px-4">
                <span className="text-green-600 font-black text-xl">{fmt(monthlySavings)}</span>
                <span className="text-green-700 text-sm font-medium">less per month with the assumable</span>
              </div>
            )}
          </div>
        </div>

        {/* Savings Summary */}
        <div className="bg-gradient-to-r from-brand-dark to-brand rounded-2xl p-6 md:p-8 text-white mb-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold opacity-90 mb-1">Your Savings on This Property</h3>
            <p className="text-sm opacity-70">
              {listing.address}, {listing.city} &middot; {listing.assumableRate}% {listing.loanType} vs {CONV_RATE}% conventional
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-black">{fmt(monthlySavings)}</div>
              <div className="text-sm opacity-80 mt-1">per month</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black">{fmt(annualSavings)}</div>
              <div className="text-sm opacity-80 mt-1">per year</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black">{fmt(lifetimeSavings)}</div>
              <div className="text-sm opacity-80 mt-1">over 30 years</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black">{fmt(interestSaved)}</div>
              <div className="text-sm opacity-80 mt-1">interest saved</div>
            </div>
          </div>

          {/* Share / Download PDF button */}
          <div className="text-center mt-6">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60"
            >
              {downloading ? (
                <>Generating PDF...</>
              ) : (
                <>&#128196; Share This Comparison</>
              )}
            </button>
          </div>
        </div>

        {/* Gap financing note */}
        {!noGapFinancing && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-10 text-sm text-blue-800">
            <strong>How gap financing works:</strong> The equity gap ({fmt(equityGap)}) is the difference between the home price and the remaining loan balance. You cover this with a down payment ({fmt(gapDown)}, {downPctOfPrice}% of purchase price) and a second mortgage for the rest ({fmt(gapLoan)} at {gapRate}%). Even with two payments, the blended cost is typically much lower than a new conventional loan. We work with lenders who specialize in assumption gap financing.
          </div>
        )}

        {/* CTAs */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Back to listing */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center flex flex-col justify-center">
            <div className="text-3xl mb-3">&#127968;</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Back to This Listing</h3>
            <p className="text-gray-500 text-sm mb-4">
              View photos, details, and request a showing for {listing.address}.
            </p>
            <Link
              href={`/homes/${listing.id}`}
              className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              View Listing Details
            </Link>
          </div>

          {/* Lead capture */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">&#128200;</div>
              <h3 className="text-xl font-bold text-gray-900">Interested in This Home?</h3>
              <p className="text-gray-500 text-sm mt-1">Get full loan details and schedule a showing. Free, no obligation.</p>
            </div>
            <LeadCaptureForm compact source="compare_page" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* --- Sub-components --- */

function Stat({ label, value, color, badge }: { label: string; value: string; color?: string; badge?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      {badge ? (
        <span className={`inline-block text-sm font-bold px-2.5 py-0.5 rounded-full ${
          value === 'VA' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
        }`}>{value}</span>
      ) : (
        <div className={`text-lg font-bold ${color || 'text-gray-900'}`}>{value}</div>
      )}
    </div>
  );
}

function SliderInput({
  label, value, onChange, min, max, step, format, sub, minLabel, maxLabel,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; format: (v: number) => string;
  sub?: string; minLabel: string; maxLabel: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-brand">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-brand"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
