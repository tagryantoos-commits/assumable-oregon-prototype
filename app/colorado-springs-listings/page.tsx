import { Metadata } from 'next';
import Link from 'next/link';
import { getListingsByCity, MARKET_RATE, formatPrice } from '../../lib/listings';
import { getFilteredListings } from '../../lib/getFilteredListings';
import ListingCardWrapper from '../ListingCardWrapper';
import LeadCaptureForm from '../../components/LeadCaptureForm';

export const metadata: Metadata = {
  title: 'Colorado Springs Assumable Mortgage Homes | The Assumable Guy',
  description:
    'Browse every Colorado Springs home with an assumable mortgage. Rates from 2.2%. Save $400-$1,200/month vs today\'s rates. Updated daily.',
  alternates: {
    canonical: 'https://assumableguy.com/colorado-springs-listings',
  },
};

export default function ColoradoSpringsListingsPage() {
  const listings = getFilteredListings(getListingsByCity('Colorado Springs'));

  const minRate = listings.length
    ? Math.min(...listings.map((l) => l.assumableRate)).toFixed(2)
    : '2.20';
  const avgSavings = listings.length
    ? Math.round(listings.reduce((s, l) => s + l.monthlySavings, 0) / listings.length)
    : 650;
  const totalSavings = listings.reduce((s, l) => s + l.monthlySavings, 0);
  const vaCount = listings.filter((l) => l.loanType === 'VA').length;
  const fhaCount = listings.filter((l) => l.loanType === 'FHA').length;
  const under400k = listings.filter((l) => l.price <= 400000).length;
  const subThreePct = listings.filter((l) => l.assumableRate < 3).length;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#12395d] to-[#0562b5] text-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-4">
                <span className="text-yellow-400">📍</span> Colorado Springs, CO
              </div>
              <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
                {listings.length} Homes with<br />
                <span className="text-yellow-400">Assumable Mortgages</span>
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed max-w-xl">
                Stop paying 7% when sellers are offering {minRate}%. Every listing below lets you
                step into an existing low-rate loan and keep it for the life of your mortgage.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-center">
                <div className="text-3xl font-black text-yellow-400">{listings.length}</div>
                <div className="text-xs text-blue-200 mt-1">Active Listings</div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-center">
                <div className="text-3xl font-black text-yellow-400">{minRate}%</div>
                <div className="text-xs text-blue-200 mt-1">Lowest Rate</div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-center">
                <div className="text-3xl font-black text-yellow-400">${avgSavings.toLocaleString()}</div>
                <div className="text-xs text-blue-200 mt-1">Avg Monthly Savings</div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-center">
                <div className="text-3xl font-black text-yellow-400">{subThreePct}</div>
                <div className="text-xs text-blue-200 mt-1">Listings Under 3%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick filter pills */}
      <section className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Quick filters:</span>
          <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap">
            🏅 VA Loans ({vaCount})
          </span>
          <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap">
            🏠 FHA Loans ({fhaCount})
          </span>
          <span className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap">
            💰 Under $400K ({under400k})
          </span>
          <span className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap">
            ⭐ Under 3% Rate ({subThreePct})
          </span>
          <Link
            href="/contact"
            className="ml-auto inline-flex items-center gap-1.5 bg-[#12395d] text-white rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap hover:bg-[#0562b5] transition-colors"
          >
            Talk to Ryan
          </Link>
        </div>
      </section>

      {/* Why section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="text-3xl mb-3">🎖️</div>
            <h3 className="font-bold text-gray-900 mb-2">Military Hub</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Fort Carson, Peterson, Schriever, and the Air Force Academy surround Colorado Springs.
              Thousands of VA loans are assumable by anyone, you don&apos;t need to be a veteran.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="text-3xl mb-3">📉</div>
            <h3 className="font-bold text-gray-900 mb-2">Real Savings</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              These {listings.length} listings save buyers a combined ${Math.round(totalSavings / 1000)}K/month
              vs getting a new loan today. That&apos;s ${Math.round(totalSavings * 12 / 1000)}K+ per year staying
              in buyers&apos; pockets.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="text-3xl mb-3">🔑</div>
            <h3 className="font-bold text-gray-900 mb-2">How It Works</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              The seller transfers their existing loan (rate, balance, and terms) directly into your name.
              The lender approves you. You pay the equity gap. You keep their rate for life.
            </p>
          </div>
        </div>

        {/* Listings header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              All {listings.length} Colorado Springs Listings
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Sorted by lowest rate first. Updated daily from the MLS.
            </p>
          </div>
          <Link
            href="/contact"
            className="hidden sm:inline-flex items-center gap-2 bg-[#12395d] text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-[#0562b5] transition-colors"
          >
            Get Help Finding the Right One
          </Link>
        </div>

        {/* Listings grid */}
        {listings.length > 0 ? (
          <ListingCardWrapper listings={listings} />
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium">No listings found right now.</p>
            <p className="text-sm mt-2">Check back soon or contact Ryan directly.</p>
          </div>
        )}
      </section>

      {/* Lead capture */}
      <section className="bg-[#12395d] py-14 mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white mb-3">
              Found Something You Like?
            </h2>
            <p className="text-blue-200 text-lg">
              Ryan will walk you through the assumption process, run the numbers, and help you
              move fast before someone else grabs it.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl">
            <LeadCaptureForm source="colorado-springs-listings" />
          </div>
        </div>
      </section>

      {/* FAQ / Education */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Colorado Springs Assumable Mortgage FAQ
        </h2>
        <div className="space-y-6">
          {[
            {
              q: 'Can I assume a VA loan if I\'m not a veteran?',
              a: 'Yes. VA loans are assumable by any qualified buyer, veteran or not. The seller\'s VA entitlement stays tied up until the loan is paid off, but the buyer does not need to be a veteran.',
            },
            {
              q: 'How long does an assumption take in Colorado Springs?',
              a: 'FHA assumptions typically take 45-60 days. VA assumptions can run 45-90 days depending on the servicer. ServiceMac, Pentagon Federal, and some others are faster. USAA and Navy Federal are slower.',
            },
            {
              q: 'What\'s the equity gap and how do I cover it?',
              a: 'The equity gap is the difference between the home\'s purchase price and the remaining loan balance. You cover it with cash, a second mortgage (HELOC or gap loan), or a gift. Ryan works with lenders who specialize in gap financing.',
            },
            {
              q: 'Are there military-specific assumable deals near Fort Carson?',
              a: 'Fort Carson is surrounded by assumable VA loans in zip codes 80913, 80916, 80911, and 80925. These are some of the best assumptions in the city. Veterans leaving often have 2-4% VA loans.',
            },
            {
              q: 'What does it cost to work with Ryan?',
              a: 'Ryan is a licensed Colorado real estate agent and earns a standard buyer\'s agent commission paid by the seller. There\'s no out-of-pocket cost to work with him as your buyer\'s agent.',
            },
          ].map((item) => (
            <div key={item.q} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">{item.q}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Ryan Thomson | The Assumable Guy | CO License #100092341 | (719) 624-3472
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <Link href="/#how-it-works" className="text-[#0562b5] hover:underline">How Assumptions Work</Link>
            <Link href="/blog" className="text-[#0562b5] hover:underline">Free Resources</Link>
            <Link href="/contact" className="text-[#0562b5] hover:underline">Contact Ryan</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
