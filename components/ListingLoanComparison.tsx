'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Listing, formatPrice } from '../lib/listings';

function calcMonthly(principal: number, ratePct: number, years = 30): number {
  if (!principal || ratePct <= 0) return 0;
  const r = ratePct / 100 / 12;
  const n = years * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
const CONV_RATE = 6.5;
const GAP_RATE = 8.5;

interface Props {
  listing: Listing;
}

export default function ListingLoanComparison({ listing }: Props) {
  const equityGap = listing.estimatedEquityGap || (listing.price - listing.remainingLoanBalance);
  const fivePercentOfPrice = Math.round(listing.price * 0.05);

  // Edge case: equity gap is less than 5% of purchase price, no gap financing needed
  const noGapFinancing = equityGap <= fivePercentOfPrice;

  const minDown = fivePercentOfPrice;
  const maxDown = Math.round(equityGap);

  const [downAmount, setDownAmount] = useState(noGapFinancing ? maxDown : minDown);

  const effectiveDown = noGapFinancing ? maxDown : Math.max(minDown, Math.min(downAmount, maxDown));

  // Gap financing
  const gapLoan = Math.max(0, equityGap - effectiveDown);
  const gapMonthly = gapLoan > 0 ? calcMonthly(gapLoan, GAP_RATE) : 0;

  // Assumable loan payment
  const assumableMonthly = calcMonthly(listing.remainingLoanBalance, listing.assumableRate);

  // Total monthly
  const totalMonthly = assumableMonthly + gapMonthly;

  // Blended rate
  const totalLoan = listing.remainingLoanBalance + gapLoan;
  const blendedRate = totalLoan > 0
    ? ((listing.assumableRate * listing.remainingLoanBalance) + (GAP_RATE * gapLoan)) / totalLoan
    : listing.assumableRate;

  // Conventional comparison (5% down on purchase price)
  const convDown = listing.price * 0.05;
  const convLoan = listing.price - convDown;
  const convMonthly = calcMonthly(convLoan, CONV_RATE);

  // Savings
  const monthlySavings = Math.max(0, convMonthly - totalMonthly);
  const annualSavings = monthlySavings * 12;
  const lifetimeSavings = monthlySavings * 360;

  // Bar chart max
  const maxMonthly = Math.max(convMonthly, totalMonthly, 1);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
      {/* Payment Calculator Header */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Payment Calculator</h3>

        {/* Big monthly payment */}
        <div className="mb-1">
          <span className="text-4xl font-black text-brand">{fmt(totalMonthly)}</span>
          <span className="text-lg text-gray-400 ml-1">per month</span>
        </div>

        {noGapFinancing ? (
          /* No gap financing needed */
          <div className="mb-5">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-green-600 font-bold text-sm">No secondary financing needed</span>
              </div>
              <p className="text-xs text-green-700">
                The equity gap on this property ({fmt(equityGap)}) is less than 5% of the purchase price ({fmt(fivePercentOfPrice)}). Your down payment covers the full gap with no second mortgage required.
              </p>
            </div>
            <div className="flex items-center justify-between py-2.5 mt-3 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Down payment</span>
              <span className="text-sm font-bold text-brand">{fmt(equityGap)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Effective rate</span>
              <span className="text-sm font-bold text-brand">{listing.assumableRate}% vs {CONV_RATE}%</span>
            </div>
          </div>
        ) : (
          /* Normal: slider + gap financing */
          <>
            <p className="text-xs text-gray-500 mb-6">
              In an assumption, your down payment covers the seller&apos;s equity. You&apos;ll need at least 5% of the purchase price in cash, and the rest can be covered with secondary financing.
            </p>

            {/* Slider */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">How much can you bring down?</span>
                <span className="text-sm font-bold text-brand">{fmt(effectiveDown)}</span>
              </div>
              <input
                type="range"
                min={minDown}
                max={maxDown}
                step={100}
                value={downAmount}
                onChange={e => setDownAmount(Number(e.target.value))}
                className="w-full accent-brand"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{fmt(minDown)}</span>
                <span>{fmt(maxDown)}</span>
              </div>
            </div>

            {/* Secondary financing line */}
            {gapLoan > 0 && (
              <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">Secondary Financing</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{GAP_RATE}% Rate</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{fmt(gapLoan)}</span>
              </div>
            )}

            {/* Blended rate */}
            <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Blended rate</span>
              <span className="text-sm font-bold text-brand">{blendedRate.toFixed(2)}% vs {CONV_RATE}%</span>
            </div>
          </>
        )}
      </div>

      {/* Bar chart comparison */}
      <div className="px-6 pb-5 pt-2 bg-gray-50 border-t border-gray-100">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Monthly Payment Comparison</div>
        <div className="space-y-3">
          {/* Conventional bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full" />
                <span className="text-xs font-medium text-gray-600">Conventional @ {CONV_RATE}%</span>
              </div>
              <span className="text-xs font-black text-slate-500">{fmt(convMonthly)}/mo</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-slate-300 to-slate-400 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(convMonthly / maxMonthly) * 100}%` }}
              />
            </div>
          </div>

          {/* Assumable bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand rounded-full" />
                <span className="text-xs font-medium text-gray-600">
                  Assumable @ {listing.assumableRate}%{gapLoan > 0 ? ' + gap' : ''}
                </span>
              </div>
              <span className="text-xs font-black text-brand">{fmt(totalMonthly)}/mo</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-light to-brand rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(totalMonthly / maxMonthly) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Savings callout */}
        {monthlySavings > 0 && (
          <div className="mt-3 flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-lg py-2 px-3">
            <span className="text-green-600 font-black text-base">{fmt(monthlySavings)}</span>
            <span className="text-green-700 text-xs font-medium">less per month</span>
          </div>
        )}
      </div>

      {/* Savings strip */}
      <div className="bg-gradient-to-r from-brand-dark to-brand px-6 py-3">
        <div className="grid grid-cols-3 gap-3 text-center text-white">
          <div>
            <div className="text-base font-black">{fmt(monthlySavings)}</div>
            <div className="text-xs opacity-80">per month</div>
          </div>
          <div>
            <div className="text-base font-black">{fmt(annualSavings)}</div>
            <div className="text-xs opacity-80">per year</div>
          </div>
          <div>
            <div className="text-base font-black">{fmt(lifetimeSavings)}</div>
            <div className="text-xs opacity-80">over 30 years</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
        <Link
          href={`/compare/${listing.id}`}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          See Full Loan Breakdown →
        </Link>
      </div>
    </div>
  );
}
