'use client';

import { useState } from 'react';
import Link from 'next/link';
import { allListings } from '../../lib/listings';

function calcMonthly(principal: number, ratePct: number, years = 30): number {
  if (!principal || ratePct <= 0) return 0;
  const r = ratePct / 100 / 12;
  const n = years * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calcTotalPaid(monthly: number, years: number): number {
  return monthly * years * 12;
}

function calcTotalPaidAfterNYears(monthly: number, years: number): number {
  return monthly * years * 12;
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

interface CalculatorClientProps {
  initialConvRate?: number;
}

export default function CalculatorClient({ initialConvRate = 6.65 }: CalculatorClientProps = {}) {
  const [homePrice, setHomePrice] = useState(450000);
  const [homePriceInput, setHomePriceInput] = useState('450000');
  const [assumableRate, setAssumableRate] = useState(2.75);
  const [assumableRateInput, setAssumableRateInput] = useState('2.75');
  const [assumableBalance, setAssumableBalance] = useState(350000);
  const [assumableBalanceInput, setAssumableBalanceInput] = useState('350000');
  const [downPct, setDownPct] = useState(5);
  const [downPctInput, setDownPctInput] = useState('5');
  const [convRate, setConvRate] = useState(initialConvRate);
  const [convRateInput, setConvRateInput] = useState(initialConvRate.toFixed(2));
  const [gapRate, setGapRate] = useState(8.5);
  const [gapRateInput, setGapRateInput] = useState('8.5');
  const [remainingYears, setRemainingYears] = useState(25);
  const [copied, setCopied] = useState(false);

  // Conventional (fresh 30-year loan)
  const convDown = homePrice * (downPct / 100);
  const convLoan = homePrice - convDown;
  const convMonthly = calcMonthly(convLoan, convRate);
  const convTotal = calcTotalPaid(convMonthly, 30);

  // Assumable (remaining term)
  const equityGap = homePrice - assumableBalance;
  const assumableMonthly = calcMonthly(assumableBalance, assumableRate, remainingYears);

  // Gap financing (new 30-year second mortgage)
  const gapDown = homePrice * (downPct / 100);
  const gapLoan = Math.max(0, equityGap - gapDown);
  const gapMonthly = gapLoan > 0 ? calcMonthly(gapLoan, gapRate) : 0;
  const totalAssumableMonthly = assumableMonthly + gapMonthly;

  // Total paid over respective terms
  const assumableTotalPaid = calcTotalPaid(assumableMonthly, remainingYears);
  const gapTotalPaid = calcTotalPaid(gapMonthly, 30);
  const totalAssumableTotal = assumableTotalPaid + gapTotalPaid;

  // Blended effective rate
  const totalLoanAmount = assumableBalance + gapLoan;
  const blendedRate = totalLoanAmount > 0
    ? (assumableBalance * assumableRate + gapLoan * gapRate) / totalLoanAmount
    : assumableRate;

  // Cash to close
  const closingCosts = homePrice * 0.02;
  const totalCashNeeded = gapDown + closingCosts;

  // Cash to close for conventional
  const convClosingCosts = convLoan * 0.02;
  const convCashNeeded = convDown + convClosingCosts;

  // Savings
  const monthlySavings = convMonthly - totalAssumableMonthly;
  const annualSavings = monthlySavings * 12;
  const lifetimeSavings = Math.max(0, convTotal - totalAssumableTotal);
  const assumableIsBetter = monthlySavings > 0;

  // 5-year and 10-year projections
  const savings5yr = Math.max(0, calcTotalPaidAfterNYears(convMonthly, 5) - calcTotalPaidAfterNYears(totalAssumableMonthly, 5));
  const savings10yr = Math.max(0, calcTotalPaidAfterNYears(convMonthly, 10) - calcTotalPaidAfterNYears(totalAssumableMonthly, 10));

  // Break-even: extra cash to close on assumable vs conventional
  const extraCashToClose = totalCashNeeded - convCashNeeded;
  const breakEvenMonths = monthlySavings > 0 && extraCashToClose > 0
    ? Math.ceil(extraCashToClose / monthlySavings)
    : 0;

  // Bar chart max
  const maxMonthly = Math.max(convMonthly, totalAssumableMonthly, 1);

  const handleShare = async () => {
    const text = assumableIsBetter
      ? `I could save ${fmt(monthlySavings)}/mo with an assumable mortgage at ${assumableRate.toFixed(2)}% (${blendedRate.toFixed(2)}% blended) vs ${convRate.toFixed(2)}%. That's ${fmt(lifetimeSavings)} in total savings. See for yourself: assumableguy.com/calculator`
      : `Comparing assumable vs conventional mortgages at assumableguy.com/calculator`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="pb-16 md:pb-0">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-black mb-4">
            Assumable Mortgage <span className="text-brand-light">Calculator</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Compare a conventional mortgage vs assuming an existing low-rate loan side by side. Adjust the sliders and watch the savings update instantly.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Inputs */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Adjust Your Scenario</h2>
            <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
              <SliderInput
                label="Home Price"
                value={homePrice}
                inputValue={homePriceInput}
                onSliderChange={(v) => { setHomePrice(v); setHomePriceInput(String(v)); }}
                onInputChange={(raw) => {
                  setHomePriceInput(raw);
                  const n = Number(raw.replace(/[^0-9.]/g, ''));
                  if (!isNaN(n) && n >= 100000 && n <= 2000000) setHomePrice(n);
                }}
                min={100000}
                max={2000000}
                step={5000}
                format={fmt}
                minLabel="$100K"
                maxLabel="$2M"
                prefix="$"
              />
              <SliderInput
                label="Down Payment"
                value={downPct}
                inputValue={downPctInput}
                onSliderChange={(v) => { setDownPct(v); setDownPctInput(String(v)); }}
                onInputChange={(raw) => {
                  setDownPctInput(raw);
                  const n = Number(raw.replace(/[^0-9.]/g, ''));
                  if (!isNaN(n) && n >= 3 && n <= 40) setDownPct(n);
                }}
                min={3}
                max={40}
                step={1}
                format={(v) => `${v}%`}
                minLabel="3%"
                maxLabel="40%"
                suffix="%"
              />
              <SliderInput
                label="Conventional Rate (30yr)"
                value={convRate}
                inputValue={convRateInput}
                onSliderChange={(v) => { setConvRate(v); setConvRateInput(v.toFixed(2)); }}
                onInputChange={(raw) => {
                  setConvRateInput(raw);
                  const n = Number(raw.replace(/[^0-9.]/g, ''));
                  if (!isNaN(n) && n >= 4 && n <= 10) setConvRate(n);
                }}
                min={4}
                max={10}
                step={0.05}
                format={(v) => `${v.toFixed(2)}%`}
                minLabel="4%"
                maxLabel="10%"
                suffix="%"
                decimals={2}
              />
              <SliderInput
                label="Assumable Rate"
                value={assumableRate}
                inputValue={assumableRateInput}
                onSliderChange={(v) => { setAssumableRate(v); setAssumableRateInput(v.toFixed(2)); }}
                onInputChange={(raw) => {
                  setAssumableRateInput(raw);
                  const n = Number(raw.replace(/[^0-9.]/g, ''));
                  if (!isNaN(n) && n >= 1 && n <= 5) setAssumableRate(n);
                }}
                min={1}
                max={5}
                step={0.05}
                format={(v) => `${v.toFixed(2)}%`}
                minLabel="1%"
                maxLabel="5%"
                suffix="%"
                decimals={2}
              />
              <SliderInput
                label="Assumable Remaining Balance"
                value={assumableBalance}
                inputValue={assumableBalanceInput}
                onSliderChange={(v) => { setAssumableBalance(v); setAssumableBalanceInput(String(v)); }}
                onInputChange={(raw) => {
                  setAssumableBalanceInput(raw);
                  const n = Number(raw.replace(/[^0-9.]/g, ''));
                  if (!isNaN(n) && n >= 50000 && n <= 1000000) setAssumableBalance(n);
                }}
                min={50000}
                max={1000000}
                step={5000}
                format={fmt}
                minLabel="$50K"
                maxLabel="$1M"
                prefix="$"
              />
              <SliderInput
                label="Years Remaining on Assumable"
                value={remainingYears}
                inputValue={String(remainingYears)}
                onSliderChange={(v) => setRemainingYears(v)}
                onInputChange={(raw) => {
                  const n = Number(raw.replace(/[^0-9]/g, ''));
                  if (!isNaN(n) && n >= 10 && n <= 30) setRemainingYears(n);
                }}
                min={10}
                max={30}
                step={1}
                format={(v) => `${v} yrs`}
                minLabel="10 yrs"
                maxLabel="30 yrs"
                suffix=" yrs"
              />
              <SliderInput
                label="Gap Financing Rate"
                value={gapRate}
                inputValue={gapRateInput}
                onSliderChange={(v) => { setGapRate(v); setGapRateInput(v.toFixed(2)); }}
                onInputChange={(raw) => {
                  setGapRateInput(raw);
                  const n = Number(raw.replace(/[^0-9.]/g, ''));
                  if (!isNaN(n) && n >= 5 && n <= 12) setGapRate(n);
                }}
                min={5}
                max={12}
                step={0.25}
                format={(v) => `${v.toFixed(2)}%`}
                minLabel="5%"
                maxLabel="12%"
                suffix="%"
                decimals={2}
              />
            </div>
          </div>

          {/* Blended Rate Highlight */}
          {gapLoan > 0 && (
            <div className="bg-gradient-to-r from-brand/10 to-brand-light/10 border-2 border-brand/30 rounded-2xl p-5 mb-8 text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Your Blended Effective Rate</div>
              <div className="text-4xl md:text-5xl font-black text-brand">{blendedRate.toFixed(2)}%</div>
              <div className="text-sm text-gray-500 mt-1">
                vs {convRate.toFixed(2)}% conventional (weighted average of {assumableRate.toFixed(2)}% assumed + {gapRate.toFixed(2)}% gap loan)
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
                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                    <span className="text-sm font-medium text-gray-700">Conventional @ {convRate.toFixed(2)}%</span>
                  </div>
                  <span className="text-lg font-black text-orange-500">{fmt(convMonthly)}/mo</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(convMonthly / maxMonthly) * 100}%` }}
                  />
                </div>
              </div>

              {/* Assumable bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand rounded-full" />
                    <span className="text-sm font-medium text-gray-700">
                      Assumable @ {assumableRate.toFixed(2)}%{gapLoan > 0 ? ` + gap loan` : ''}{' '}
                      {gapLoan > 0 && <span className="text-brand font-semibold">({blendedRate.toFixed(2)}% blended)</span>}
                    </span>
                  </div>
                  <span className="text-lg font-black text-brand">{fmt(totalAssumableMonthly)}/mo</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-light to-brand rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(totalAssumableMonthly / maxMonthly) * 100}%` }}
                  />
                </div>
              </div>

              {/* Savings indicator */}
              {assumableIsBetter ? (
                <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl py-3 px-4">
                  <span className="text-green-600 font-black text-xl">{fmt(monthlySavings)}</span>
                  <span className="text-green-700 text-sm font-medium">less per month with an assumable</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-xl py-3 px-4">
                  <span className="text-amber-700 text-sm font-medium">Adjust the rates or balance. Conventional comes out cheaper in this scenario</span>
                </div>
              )}
            </div>
          </div>

          {/* Two-panel comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Conventional Panel */}
            <div className={`bg-white rounded-2xl shadow-lg border p-6 ${!assumableIsBetter ? 'border-2 border-orange-400' : 'border-gray-200'}`}>
              {!assumableIsBetter && (
                <div className="absolute -top-3 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">BETTER DEAL</div>
              )}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900">Conventional Mortgage</h3>
              </div>
              <div className="space-y-4">
                <Row label="Interest Rate" value={`${convRate.toFixed(2)}%`} color="text-orange-500" />
                <Row label="Term" value="30 years" />
                <Row label="Down Payment" value={fmt(convDown)} sub={`${downPct}%`} />
                <Row label="Loan Amount" value={fmt(convLoan)} />
                {/* Spacer rows to align with assumable side */}
                <Row label="" value="" />
                {gapLoan > 0 && <Row label="" value="" />}
                <Row label="Monthly P&I" value={fmt(convMonthly)} color="text-orange-500" bold />
                <Row label="Total Paid (30yr)" value={fmt(convTotal)} />
              </div>
            </div>

            {/* Assumable Panel */}
            <div className={`bg-white rounded-2xl shadow-lg p-6 relative ${assumableIsBetter ? 'border-2 border-brand' : 'border border-gray-200'}`}>
              {assumableIsBetter && (
                <div className="absolute -top-3 right-4 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full">
                  BETTER DEAL
                </div>
              )}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-brand rounded-full" />
                <h3 className="text-lg font-bold text-gray-900">Assumable Mortgage</h3>
              </div>
              <div className="space-y-4">
                <Row label="Assumed Rate" value={`${assumableRate.toFixed(2)}%`} color="text-brand" />
                <Row label="Remaining Term" value={`${remainingYears} years`} />
                <Row label="Equity Gap" value={fmt(equityGap)} sub="Home price minus remaining balance" />
                <Row label="Assumed Loan P&I" value={fmt(assumableMonthly)} color="text-brand" sub={`${fmt(assumableBalance)} over ${remainingYears}yr`} />
                {gapLoan > 0 && (
                  <Row label={`Gap Financing (${gapRate.toFixed(2)}%)`} value={fmt(gapMonthly)} sub={`${fmt(gapLoan)} second loan · 30yr`} />
                )}
                {gapLoan > 0 && (
                  <Row label="Blended Effective Rate" value={`${blendedRate.toFixed(2)}%`} color="text-brand" />
                )}
                <Row label="Total Monthly P&I" value={fmt(totalAssumableMonthly)} color="text-brand" bold />
                <Row label="Total Paid" value={fmt(totalAssumableTotal)} sub={`Assumed: ${remainingYears}yr + Gap: 30yr`} />
              </div>
            </div>
          </div>

          {/* Cash to Close Comparison */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Cash to Close Comparison</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-semibold text-orange-500 mb-3 uppercase tracking-wide">Conventional</h4>
                <div className="space-y-3">
                  <Row label="Down Payment" value={fmt(convDown)} sub={`${downPct}% of ${fmt(homePrice)}`} />
                  <Row label="Estimated Closing Costs" value={fmt(convClosingCosts)} sub="~2% of loan amount" />
                  <div className="flex justify-between items-center py-3 border-t-2 border-orange-200">
                    <div className="text-sm font-bold text-gray-900">Total Cash Needed</div>
                    <div className="text-2xl font-black text-orange-500">{fmt(convCashNeeded)}</div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-brand mb-3 uppercase tracking-wide">Assumable</h4>
                <div className="space-y-3">
                  <Row label={`Down Payment (${downPct}% of purchase price)`} value={fmt(gapDown)} sub={`${downPct}% of ${fmt(homePrice)} purchase price`} />
                  <Row label="Estimated Closing Costs" value={fmt(closingCosts)} sub={`~2% of ${fmt(homePrice)} purchase price`} />
                  <div className="flex justify-between items-center py-3 border-t-2 border-brand/30">
                    <div className="text-sm font-bold text-gray-900">Total Cash Needed</div>
                    <div className="text-2xl font-black text-brand">{fmt(totalCashNeeded)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings over time */}
          {assumableIsBetter && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Savings Over Time</h2>
              <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">5 Years</div>
                  <div className="text-2xl font-black text-green-600">{fmt(savings5yr)}</div>
                  <div className="text-xs text-gray-400 mt-1">paid less</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">10 Years</div>
                  <div className="text-2xl font-black text-green-600">{fmt(savings10yr)}</div>
                  <div className="text-xs text-gray-400 mt-1">paid less</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Full Term</div>
                  <div className="text-2xl font-black text-green-600">{fmt(lifetimeSavings)}</div>
                  <div className="text-xs text-gray-400 mt-1">total savings</div>
                </div>
              </div>
              {/* Break-even */}
              {breakEvenMonths > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 text-center">
                  <strong>Break-even point:</strong> The assumable route may cost{' '}
                  <strong>{fmt(Math.abs(extraCashToClose))}</strong> more upfront to close.
                  At {fmt(monthlySavings)}/mo in savings, you break even in{' '}
                  <strong>{breakEvenMonths} months ({Math.ceil(breakEvenMonths / 12)} years)</strong>.
                </div>
              )}
              {(breakEvenMonths === 0 && extraCashToClose <= 0) && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 text-center">
                  <strong>Day 1 savings:</strong> The assumable path costs less to close <em>and</em> less per month.
                </div>
              )}
            </div>
          )}

          {/* Savings Summary */}
          {assumableIsBetter && (
            <div className="bg-gradient-to-r from-brand-dark to-brand rounded-2xl p-6 md:p-8 text-white mb-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold opacity-90 mb-2">Your Savings with an Assumable Mortgage</h3>
                {gapLoan > 0 && (
                  <div className="text-sm opacity-80">
                    Effective rate: <span className="font-bold text-white">{blendedRate.toFixed(2)}%</span> vs {convRate.toFixed(2)}% conventional
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl md:text-4xl font-black">{fmt(monthlySavings)}</div>
                  <div className="text-sm opacity-80 mt-1">per month</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-black">{fmt(annualSavings)}</div>
                  <div className="text-sm opacity-80 mt-1">per year</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-black">{fmt(lifetimeSavings)}</div>
                  <div className="text-sm opacity-80 mt-1">total interest saved</div>
                </div>
              </div>

              {/* Share button */}
              <div className="text-center mt-6">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  {copied ? (
                    <>
                      <span>✓</span>
                      Copied to Clipboard
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      Share Your Savings
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Gap financing note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-10 text-sm text-blue-800">
            <strong>Note:</strong> Even with a large equity gap, we have lenders who finance the gap with as little as 5% down on the purchase price.
            The gap financing is calculated above as a second loan at {gapRate.toFixed(2)}%. Your actual rate may vary.
            Closing costs are estimated at 2% of the purchase price and may differ based on your specific situation.
          </div>

          {/* CTAs */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Browse CTA */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center flex flex-col justify-center md:col-span-2">
              <div className="text-3xl mb-3">🏠</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">See Available Homes Now</h3>
              <p className="text-gray-500 text-sm mb-4">
                Browse {allListings.length}+ Colorado homes with assumable mortgages. Rates as low as 2.25%.
              </p>
              <Link
                href="/homes"
                className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Browse Listings →
              </Link>
            </div>
          </div>

          {/* SEO Content */}
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-gray max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How the Assumable Mortgage Calculator Works</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                This calculator compares two scenarios: buying a home with a brand new conventional mortgage at today&apos;s rates vs. assuming an existing low-rate mortgage from the seller. The difference between those two payments is your monthly savings.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you assume a mortgage, you take over the seller&apos;s existing loan balance, interest rate, and remaining term. The lender approves the transfer and the loan goes into your name. It&apos;s fully legal and lender-approved. FHA and VA loans are assumable by law.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Understanding the Equity Gap</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The equity gap is the difference between the home&apos;s current value and the remaining loan balance. If a home is worth $450K and the loan balance is $350K, the equity gap is $100K. That&apos;s what you need to bring to the table as the buyer.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You don&apos;t need $100K in cash, though. Most of our buyers use a combination of a small down payment (as low as 5% of the purchase price) and a second mortgage from our partner lender to cover the rest. The calculator above factors this in: it shows your assumed loan payment plus the gap financing payment as your total monthly cost.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Even with that second mortgage at a higher rate, the blended cost is almost always lower than a new conventional loan. That&apos;s the math that makes assumables work. <Link href="/guide/assumable-mortgages" className="text-brand font-semibold hover:underline">Read our full assumable mortgage guide</Link> for a deeper breakdown of the equity gap and your options.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">What Rates Are Available?</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Rates on assumable properties in our Colorado inventory range from 0.65% to 5.5%, with an average around 3.38%. The lowest rates are on VA loans originated during 2020-2021. FHA loans from the same period typically carry rates in the 2.5% to 3.5% range.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                We maintain a list of <Link href="/homes" className="text-brand font-semibold hover:underline">{allListings.length}+ assumable properties across Colorado</Link>, updated daily. Each listing includes the assumable rate, remaining balance, and estimated equity gap so you can run the numbers before you even schedule a showing.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Who Can Assume a Mortgage?</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Anyone who meets the lender&apos;s credit and income requirements can assume an FHA loan. VA loans are assumable by veterans and non-veterans alike, though the seller has to agree and the seller&apos;s VA entitlement stays tied up until the loan is paid off. <Link href="/va-loans" className="text-brand font-semibold hover:underline">Learn more about VA assumptions</Link>.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                The process takes 45-90 days and goes through the lender&apos;s full approval process. We handle over 90 assumption closings and work with dedicated assumption processors who keep the banks on track. <Link href="/blog" className="text-brand font-semibold hover:underline">Read more on our blog</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SliderInput({
  label,
  value,
  inputValue,
  onSliderChange,
  onInputChange,
  min,
  max,
  step,
  format,
  minLabel,
  maxLabel,
  prefix,
  suffix,
  decimals,
}: {
  label: string;
  value: number;
  inputValue: string;
  onSliderChange: (v: number) => void;
  onInputChange: (raw: string) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  minLabel: string;
  maxLabel: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm font-bold text-brand">{prefix}</span>}
          <input
            type="number"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onBlur={() => {
              // Snap to slider value on blur (in case of out-of-range input)
              onInputChange(decimals ? value.toFixed(decimals) : String(value));
            }}
            className="w-24 text-right text-sm font-bold text-brand border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            step={step}
            min={min}
            max={max}
          />
          {suffix && <span className="text-sm font-bold text-brand">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onSliderChange(Number(e.target.value))}
        className="w-full accent-brand"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  sub,
  color,
  bold,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center py-2 ${bold ? 'border-t border-gray-200 pt-3' : ''}`}>
      <div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
      <div className={`text-lg ${bold ? 'font-black' : 'font-bold'} ${color || 'text-gray-900'}`}>{value}</div>
    </div>
  );
}
