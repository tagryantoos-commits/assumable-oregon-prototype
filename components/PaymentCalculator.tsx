'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { calcMonthlyPayment, MARKET_RATE } from '../lib/listings';
import { trackActivity } from '../lib/tracking';

interface PaymentCalculatorProps {
  initialMarketRate?: number;
}

export default function PaymentCalculator({ initialMarketRate = MARKET_RATE }: PaymentCalculatorProps = {}) {
  const [homePrice, setHomePrice] = useState(450000);
  const [yourRate, setYourRate] = useState(initialMarketRate);
  const [assumableRate] = useState(2.75);
  const [downPct, setDownPct] = useState(10);

  const loanAmount = homePrice * (1 - downPct / 100);
  const marketPayment = calcMonthlyPayment(loanAmount, yourRate);
  const assumablePayment = calcMonthlyPayment(loanAmount, assumableRate);
  const monthlySavings = Math.max(0, marketPayment - assumablePayment);
  const annualSavings = monthlySavings * 12;
  const fiveYearSavings = monthlySavings * 60;

  // Debounced activity event: fires 2s after the user stops adjusting sliders,
  // and only once per session per the dedupe window in lib/tracking.ts.
  const fireRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (fireRef.current) clearTimeout(fireRef.current);
    fireRef.current = setTimeout(() => {
      trackActivity('calculator_used', {
        price: homePrice,
        assumable_rate: assumableRate,
        monthly_savings: Math.round(monthlySavings),
      });
    }, 2000);
    return () => { if (fireRef.current) clearTimeout(fireRef.current); };
  }, [homePrice, yourRate, assumableRate, downPct, monthlySavings]);

  const formatK = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
      <h3 className="text-xl font-bold text-gray-900 mb-1">💰 Mortgage Savings Calculator</h3>
      <p className="text-sm text-gray-500 mb-6">See exactly how much you&apos;d save with an assumable mortgage</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Sliders */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Home Price</label>
              <span className="text-sm font-bold text-brand">${homePrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={150000}
              max={1200000}
              step={5000}
              value={homePrice}
              onChange={e => setHomePrice(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>$150K</span>
              <span>$1.2M</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Current rate</label>
              <span className="text-sm font-bold text-orange-500">{yourRate.toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min={4}
              max={9}
              step={0.1}
              value={yourRate}
              onChange={e => setYourRate(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>4%</span>
              <span>9%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Down Payment</label>
              <span className="text-sm font-bold text-gray-700">{downPct}% (${(homePrice * downPct / 100).toLocaleString()})</span>
            </div>
            <input
              type="range"
              min={3}
              max={40}
              step={1}
              value={downPct}
              onChange={e => setDownPct(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>3%</span>
              <span>40%</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-gray-50 rounded-xl p-5 flex flex-col justify-center">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <div className="text-sm font-medium text-gray-700">New Loan at {yourRate}%</div>
                <div className="text-xs text-gray-500">Market rate today</div>
              </div>
              <div className="text-lg font-bold text-orange-500">${marketPayment.toLocaleString()}/mo</div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <div className="text-sm font-medium text-gray-700">Assumable Loan at {assumableRate}%</div>
                <div className="text-xs text-gray-500">Available right now</div>
              </div>
              <div className="text-lg font-bold text-brand">${assumablePayment.toLocaleString()}/mo</div>
            </div>

            <div className="bg-brand rounded-xl p-4 text-white text-center mt-2">
              <div className="text-sm font-medium opacity-90 mb-1">You Save Every Single Month</div>
              <div className="text-4xl font-black">${monthlySavings.toLocaleString()}</div>
              <div className="text-sm opacity-90 mt-2 grid grid-cols-2 gap-2">
                <div>
                  <div className="font-bold">{formatK(annualSavings)}</div>
                  <div className="text-xs opacity-75">per year</div>
                </div>
                <div>
                  <div className="font-bold">{formatK(fiveYearSavings)}</div>
                  <div className="text-xs opacity-75">over 5 years</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
