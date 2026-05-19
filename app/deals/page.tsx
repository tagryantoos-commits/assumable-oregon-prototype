import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import LeadCaptureForm from '../../components/LeadCaptureForm';

interface Deal {
  id: string;
  url: string;
  address: string;
  city: string;
  zip: string;
  assumableRate: number;
  listPrice: number;
  beds: number;
  baths: number;
  sqft: number;
  loanType: string;
  assumableMonthly?: number;
  marketMonthly?: number;
  monthlySavings?: number;
  remainingBalance?: number;
  equityGap?: number;
  daysOnMarket?: number;
  hoaMonthly?: number;
  annualTaxes?: number;
  estimatedRent?: number;
  cashFlow?: number;
  capRate?: number;
  dealScore: number;
  photoUrl?: string;
  mlsNumber?: string;
}

function loadJSON(filePath: string): Deal[] | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatPrice(n: number): string {
  return '$' + n.toLocaleString('en-US');
}

function formatRate(r: number): string {
  return r.toFixed(2) + '%';
}

function scoreBadge(score: number) {
  let bg: string, text: string, label: string;
  if (score >= 90) {
    bg = 'bg-amber-100 border-amber-300 text-amber-800';
    label = 'Elite Deal';
  } else if (score >= 80) {
    bg = 'bg-gray-100 border-gray-300 text-gray-700';
    label = 'Great Deal';
  } else {
    bg = 'bg-blue-50 border-blue-200 text-blue-700';
    label = 'Good Deal';
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${bg}`}>
      {score >= 90 ? '🏆' : score >= 80 ? '⭐' : '💎'} {score.toFixed(1)}: {label}
    </span>
  );
}

function InvestorDealCard({ deal }: { deal: Deal }) {
  const savings = deal.monthlySavings ?? (deal.marketMonthly ? Math.round(deal.marketMonthly * 0.35) : null);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
      {/* Photo or gradient */}
      <div className="relative h-48 sm:h-56">
        {deal.photoUrl ? (
          <img
            src={deal.photoUrl}
            alt={deal.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-dark to-brand" />
        )}
        {/* Rate badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow">
          <div className="text-2xl font-black text-brand">{formatRate(deal.assumableRate)}</div>
          <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{deal.loanType} Rate</div>
        </div>
        {/* Deal score */}
        <div className="absolute top-3 right-3">
          {scoreBadge(deal.dealScore)}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-lg mb-1">{deal.address}</h3>
        <p className="text-sm text-gray-500 mb-4">{deal.city}, CO {deal.zip}</p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center bg-gray-50 rounded-lg py-2">
            <div className="text-lg font-bold text-gray-900">{formatPrice(deal.listPrice)}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">List Price</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg py-2">
            <div className="text-lg font-bold text-gray-900">{deal.beds}/{deal.baths}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Beds/Baths</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg py-2">
            <div className="text-lg font-bold text-gray-900">{deal.sqft?.toLocaleString()}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Sqft</div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="space-y-2 mb-4">
          {savings != null && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly Savings vs. 6%+</span>
              <span className="text-sm font-bold text-green-600">
                {formatPrice(deal.monthlySavings ?? savings)}/mo
              </span>
            </div>
          )}
          {deal.cashFlow != null && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Est. Cash Flow</span>
              <span className={`text-sm font-bold ${deal.cashFlow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {deal.cashFlow >= 0 ? '+' : ''}{formatPrice(Math.round(deal.cashFlow))}/mo
              </span>
            </div>
          )}
          {deal.capRate != null && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cap Rate</span>
              <span className="text-sm font-bold text-gray-900">{deal.capRate.toFixed(1)}%</span>
            </div>
          )}
          {deal.equityGap != null && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Equity Gap</span>
              <span className="text-sm font-bold text-gray-900">{formatPrice(deal.equityGap)}</span>
            </div>
          )}
        </div>

        <a
          href={deal.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-colors"
        >
          View Full Listing →
        </a>
      </div>
    </div>
  );
}

function PrimaryBuyerCard({ deal }: { deal: Deal }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col sm:flex-row">
      {/* Photo */}
      <div className="sm:w-48 h-40 sm:h-auto flex-shrink-0">
        {deal.photoUrl ? (
          <img src={deal.photoUrl} alt={deal.address} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-dark to-brand min-h-[10rem]" />
        )}
      </div>
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-gray-900">{deal.address}</h3>
            <p className="text-xs text-gray-500">{deal.city}, CO {deal.zip}</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-brand">{formatRate(deal.assumableRate)}</div>
            <div className="text-[10px] text-gray-500">{deal.loanType}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-gray-700 mb-3">
          <span>{formatPrice(deal.listPrice)}</span>
          <span>{deal.beds}bd / {deal.baths}ba</span>
          <span>{deal.sqft?.toLocaleString()} sqft</span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm mb-3">
          {deal.monthlySavings != null && (
            <div>
              <span className="text-gray-500">Savings: </span>
              <span className="font-bold text-green-600">{formatPrice(deal.monthlySavings)}/mo</span>
            </div>
          )}
          {deal.equityGap != null && (
            <div>
              <span className="text-gray-500">Equity Gap: </span>
              <span className="font-bold text-gray-900">{formatPrice(deal.equityGap)}</span>
            </div>
          )}
        </div>
        <a
          href={deal.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:text-brand-dark font-semibold text-sm"
        >
          View Listing →
        </a>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Deals of the Week | The Assumable Guy',
  description: 'Hand-picked assumable mortgage deals in Colorado Springs, scored daily by our AI deal scanner. Investor and primary buyer picks updated every day.',
  alternates: {
    canonical: 'https://assumableguy.com/deals',
  },
};

export default function DealsPage() {
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const investorDeals = loadJSON(path.join(dataDir, 'top-investor-deals.json'));
  const rawListings = loadJSON(path.join(dataDir, 'listings.json'));
  // Normalize listings.json schema to match Deal interface
  const allListings = rawListings?.map(l => ({
    ...l,
    listPrice: (l as unknown as Record<string, number>).price ?? l.listPrice,
    equityGap: (l as unknown as Record<string, number>).estimatedEquityGap ?? l.equityGap,
    photoUrl: ((l as unknown as Record<string, string[]>).photoUrls)?.[0] ?? l.photoUrl,
  })) ?? null;

  const hasInvestorDeals = investorDeals && investorDeals.length > 0;

  // Top 3 primary buyer deals: lowest rate first, then lowest equity gap
  const primaryDeals = allListings
    ? [...allListings]
        .filter(d => d.equityGap != null && d.equityGap > 0 && d.assumableRate < 4)
        .sort((a, b) => a.assumableRate - b.assumableRate || (a.equityGap ?? 0) - (b.equityGap ?? 0))
        .slice(0, 3)
    : null;

  return (
    <div className="pb-16 md:pb-0">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-light rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-light rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-brand/20 border border-brand/30 text-brand-light text-sm font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-brand-light rounded-full animate-pulse" />
            Updated Daily
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4">
            This Week&apos;s Best<br />
            <span className="text-brand-light">Assumable Deals</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Hand-picked by our AI deal scanner. Updated daily. Colorado Springs.
          </p>
        </div>
      </section>

      {/* TOP 5 INVESTOR DEALS */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Top 5 Investor Deals</h2>
            <p className="text-gray-500 mt-1">Ranked by deal score: best cash flow, cap rate, and assumable rate</p>
          </div>

          {hasInvestorDeals ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {investorDeals.slice(0, 5).map(deal => (
                <InvestorDealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pipeline Running...</h3>
              <p className="text-gray-500">Our deal scanner is crunching today&apos;s numbers. Check back shortly.</p>
            </div>
          )}
        </div>
      </section>

      {/* TOP PRIMARY BUYER DEALS */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Best Deals for Primary Buyers</h2>
            <p className="text-gray-500 mt-1">Lowest rates, smallest equity gaps, perfect for your next home</p>
          </div>

          {primaryDeals && primaryDeals.length > 0 ? (
            <div className="space-y-4">
              {primaryDeals.map(deal => (
                <PrimaryBuyerCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pipeline Running...</h3>
              <p className="text-gray-500">Our deal scanner is crunching today&apos;s numbers. Check back shortly.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA - DEAL ALERTS */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 to-brand-dark rounded-3xl p-8 md:p-12 text-white">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🔔</div>
              <h2 className="text-3xl font-bold mb-2">Want Personalized Deal Alerts?</h2>
              <p className="text-gray-300">
                Get the best assumable deals delivered to your inbox, filtered to your criteria. Free, no obligation.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <LeadCaptureForm compact source="deals_page_alerts" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
