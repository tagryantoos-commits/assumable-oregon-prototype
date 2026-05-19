import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import sellerData from '../../../data/seller-analysis.json';

type SellerEntry = {
  token: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  first_name: string;
  last_name: string;
  loan_type: string;
  interest_rate: number;
  loan_balance: number | null;
  estimated_value: number | null;
  mailing_address: string;
};

type DataMap = Record<string, SellerEntry>;

const data = sellerData as DataMap;

export async function generateStaticParams() {
  return Object.keys(data).map((token) => ({ token }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const entry = data[token];
  if (!entry) return { title: 'Analysis Not Found' };

  return {
    title: `Your Home at ${entry.address} | Assumable Loan Analysis`,
    description: `See exactly what your ${(entry.interest_rate * 100).toFixed(1)}% ${entry.loan_type} loan is worth to your next buyer.`,
    robots: { index: false, follow: false },
  };
}

function calcMonthlyPayment(balance: number, annualRate: number): number {
  const r = annualRate / 12;
  return (balance * r) / (1 - Math.pow(1 + r, -360));
}

function calcMaxLoan(monthlyPayment: number, annualRate: number): number {
  const r = annualRate / 12;
  return (monthlyPayment / r) * (1 - Math.pow(1 + r, -360));
}

function formatDollars(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function formatPct(n: number): string {
  return (n * 100).toFixed(2).replace(/\.?0+$/, '') + '%';
}

const MARKET_RATE = 0.068;
const BUYER_BUDGET = 2600;

export default async function SellerAnalysisPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const entry = data[token];

  if (!entry) {
    notFound();
  }

  const {
    first_name,
    address,
    loan_type,
    interest_rate,
    loan_balance,
    estimated_value,
  } = entry;

  const balance = loan_balance ?? 300000;
  const rate = interest_rate;

  // Core math
  const monthlyAtTheirRate = calcMonthlyPayment(balance, rate);
  const monthlyAtMarket = calcMonthlyPayment(balance, MARKET_RATE);
  const monthlySavings = monthlyAtMarket - monthlyAtTheirRate;

  // Assumable premium: how much more a buyer can pay because of rate savings
  const maxLoanAtMarket = calcMaxLoan(BUYER_BUDGET, MARKET_RATE);
  const maxLoanAtTheirRate = calcMaxLoan(BUYER_BUDGET, rate);
  const assumablePremium = maxLoanAtTheirRate - maxLoanAtMarket;

  // Total interest savings over loan life
  const totalPaymentsAtMarket = monthlyAtMarket * 360;
  const totalPaymentsAtTheirRate = monthlyAtTheirRate * 360;
  const totalInterestSavings = totalPaymentsAtMarket - totalPaymentsAtTheirRate;

  const rateDisplay = formatPct(rate);
  const marketRateDisplay = formatPct(MARKET_RATE);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-br from-brand-dark via-brand-dark to-brand text-white py-10 md:py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-brand-light text-sm font-semibold px-3 py-1.5 rounded-full mb-5">
            <span>Personalized Analysis for {first_name}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Your Home at{' '}
            <span className="text-brand-light">{address}</span>
            {' '}Has a Hidden Advantage
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
            Here is what your {rateDisplay} {loan_type} loan means for your sale
          </p>
        </div>
      </header>

      {/* Highlight Banner */}
      <div className="bg-brand text-white py-4 px-4 text-center">
        <p className="text-lg font-bold">
          Your assumable loan could add an estimated{' '}
          <span className="text-yellow-300 text-2xl">{formatDollars(assumablePremium)}</span>
          {' '}to your sale price
        </p>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        {/* Side-by-Side Comparison */}
        <section>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 text-center">
            The Numbers
          </h2>
          <p className="text-gray-500 text-center mb-6">
            Based on your {formatDollars(balance)} remaining loan balance
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Their rate */}
            <div className="bg-brand-50 border-2 border-brand rounded-xl p-5 text-center">
              <div className="text-sm font-semibold text-brand-dark uppercase tracking-wide mb-2">
                Your Loan ({loan_type})
              </div>
              <div className="text-4xl font-black text-brand mb-1">
                {rateDisplay}
              </div>
              <div className="text-gray-700 font-medium">
                {formatDollars(monthlyAtTheirRate)}/mo
              </div>
            </div>

            {/* Market rate */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5 text-center">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                New Mortgage Today
              </div>
              <div className="text-4xl font-black text-gray-400 mb-1">
                {marketRateDisplay}
              </div>
              <div className="text-gray-500 font-medium">
                {formatDollars(monthlyAtMarket)}/mo
              </div>
            </div>
          </div>

          {/* Savings callout */}
          <div className="bg-gray-900 text-white rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-1">Buyer saves</p>
            <div className="text-5xl font-black text-green-400 mb-1">
              {formatDollars(monthlySavings)}/month
            </div>
            <p className="text-gray-300">
              and can pay{' '}
              <span className="text-yellow-300 font-bold text-xl">{formatDollars(assumablePremium)} more</span>
              {' '}for your home
            </p>
          </div>
        </section>

        {/* Three Key Numbers */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">
            Why Buyers Pay More for Your Home
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl font-black text-brand mb-1">
                {formatDollars(monthlySavings)}
              </div>
              <div className="text-sm text-gray-600">monthly savings vs. a new loan</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl font-black text-brand mb-1">
                {formatDollars(assumablePremium)}
              </div>
              <div className="text-sm text-gray-600">estimated assumable premium</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl font-black text-brand mb-1">
                {formatDollars(totalInterestSavings)}
              </div>
              <div className="text-sm text-gray-600">total interest savings over loan life</div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-gray-50 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-black text-gray-900 mb-4">How the Premium Works</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            When a buyer assumes your {loan_type} loan at {rateDisplay}, their monthly payment
            is {formatDollars(monthlyAtTheirRate)} instead of {formatDollars(monthlyAtMarket)}
            on a new mortgage. That is {formatDollars(monthlySavings)} freed up every month.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Because payments are lower, a buyer can stretch their purchase budget further.
            A buyer with a {formatDollars(BUYER_BUDGET)}/month payment budget can borrow{' '}
            {formatDollars(maxLoanAtTheirRate)} at your rate vs.{' '}
            {formatDollars(maxLoanAtMarket)} at {marketRateDisplay}.
            That gap -- {formatDollars(assumablePremium)} -- is what your assumable loan can add
            to your final sale price.
          </p>
        </section>

        {/* Estimated value if available */}
        {estimated_value && (
          <section className="border border-brand-100 bg-brand-50 rounded-2xl p-6">
            <h2 className="text-xl font-black text-brand-dark mb-2">Your Property Value</h2>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <div className="text-sm text-brand-dark font-medium">Estimated Value (AVM)</div>
                <div className="text-3xl font-black text-brand">{formatDollars(estimated_value)}</div>
              </div>
              <div className="text-gray-500 text-sm">
                With an assumable {loan_type} at {rateDisplay}, your effective market value
                could be as high as{' '}
                <span className="font-bold text-brand-dark">
                  {formatDollars(estimated_value + assumablePremium)}
                </span>{' '}
                when marketed correctly to assumable-aware buyers.
              </div>
            </div>
          </section>
        )}

        {/* Credibility Bar */}
        <section className="border-y border-gray-200 py-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-brand font-bold text-lg">150+</span>
              <span>assumable closings</span>
            </div>
            <div className="w-px h-5 bg-gray-300 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="text-brand font-bold text-lg">$48M+</span>
              <span>in buyer savings</span>
            </div>
            <div className="w-px h-5 bg-gray-300 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="text-brand font-bold text-lg">#1</span>
              <span>assumable specialist in Colorado</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-5 pb-4">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">
            Want to know exactly what this means for your sale?
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Book a free 15-minute call. We will walk through your specific loan,
            your pricing strategy, and what assumable-aware buyers are paying
            right now in your area.
          </p>

          <a
            href="https://calendly.com/your-real-estate-agent-ryan/15min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-brand text-white font-bold px-8 py-4 rounded-xl hover:bg-brand-dark transition-colors text-lg shadow-md"
          >
            Book a Free 15-Min Call
          </a>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-700">
            <a
              href="tel:+17196243472"
              className="flex items-center gap-2 hover:text-brand transition-colors font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 011 1V20a1 1 0 01-1 1C9.61 21 3 14.39 3 6a1 1 0 011-1h3.5a1 1 0 011 1c0 1.36.27 2.67.76 3.88a1 1 0 01-.25 1.11l-2.39 2.8z"/>
              </svg>
              (719) 624-3472
            </a>
            <span className="hidden sm:block text-gray-300">|</span>
            <a
              href="mailto:ryan@TheAssumableGuy.com"
              className="flex items-center gap-2 hover:text-brand transition-colors font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              ryan@TheAssumableGuy.com
            </a>
          </div>
        </section>

      </main>

      {/* Footer note */}
      <footer className="bg-gray-50 border-t border-gray-200 py-6 px-4">
        <p className="text-xs text-gray-400 text-center max-w-2xl mx-auto">
          This analysis is based on your recorded loan data and current market rates.
          Actual results may vary. Ryan Thomson | The Assumable Guy | Colorado Licensed Real Estate Agent
        </p>
      </footer>
    </div>
  );
}
