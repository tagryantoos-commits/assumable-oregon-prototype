import { Metadata } from 'next';
import Link from 'next/link';
import { getListingsByCity, MARKET_RATE } from '../../lib/listings';
import { getFilteredListings } from '../../lib/getFilteredListings';
import ListingCardWrapper from '../ListingCardWrapper';
import MarketExpertForm from '../../components/MarketExpertForm';
import { getRelatedPostsForCity } from '../../lib/blog';

export function generateMetadata(): Metadata {
  const cityListings = getListingsByCity('Longmont');
  const count = cityListings.length;
  const minRate = count > 0 ? Math.min(...cityListings.map(l => l.assumableRate)).toFixed(2) : '2.25';
  const slug = 'longmont';
  const cityName = 'Longmont';

  return {
    title: `${cityName} Assumable Mortgages | ${count}+ Homes | ${minRate}% Rate | The Assumable Guy`,
    description: `Browse ${count} assumable mortgage listings in ${cityName}, CO. Rates as low as ${minRate}%. Save $500-$1,200/month vs new loans at 6.5%. FHA & VA loans available.`,
    alternates: { canonical: `https://assumableguy.com/${slug}` },
    openGraph: {
      title: `${cityName} Assumable Mortgages | ${minRate}% Rate | The Assumable Guy`,
      description: `${count} homes in ${cityName} with assumable loans. Rates from ${minRate}%. Save hundreds per month.`,
      type: 'website',
      url: `https://assumableguy.com/${slug}`,
      images: [{ url: 'https://assumableguy.com/images/ryan-headshot.png', width: 1200, height: 630, alt: `${cityName} Assumable Mortgages` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cityName} Assumable Mortgages | ${minRate}% Rate`,
      description: `${count} homes with assumable loans in ${cityName}. Rates from ${minRate}%.`,
      images: ['https://assumableguy.com/images/ryan-headshot.png'],
    },
  };
}

export default function LongmontPage() {
  const longmontListings = getListingsByCity('Longmont');
  const featured = getFilteredListings(longmontListings, { limit: 6 });

  const avgRate = longmontListings.length > 0
    ? (longmontListings.reduce((s, l) => s + l.assumableRate, 0) / longmontListings.length).toFixed(2)
    : '3.1';
  const avgSavings = longmontListings.length > 0
    ? Math.round(longmontListings.reduce((s, l) => s + l.monthlySavings, 0) / longmontListings.length)
    : 650;
  const minRate = longmontListings.length > 0
    ? Math.min(...longmontListings.map(l => l.assumableRate)).toFixed(2)
    : '2.25';

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Assumable Mortgage Listings in Longmont, CO',
    numberOfItems: longmontListings.length,
    itemListElement: longmontListings.slice(0, 10).map((listing, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `https://assumableguy.com/homes/${listing.id}`,
      name: `${listing.address}, ${listing.city}: ${listing.assumableRate}% ${listing.loanType}`,
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-brand-dark text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold text-brand-light uppercase tracking-widest mb-3">
              📍 Longmont, CO
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Longmont<br/>
              <span className="text-brand-light">Assumable Mortgages</span>
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              {longmontListings.length} active listings in Longmont with assumable mortgages.
              Rates starting at {minRate}%. Save an average of ${avgSavings.toLocaleString()}/month vs today&apos;s {MARKET_RATE}% rate.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-xl">📊</span>
                <span className="font-semibold">{longmontListings.length} Active Listings</span>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-xl">💰</span>
                <span className="font-semibold">Avg ${avgSavings.toLocaleString()}/mo savings</span>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-xl">📈</span>
                <span className="font-semibold">Rates from {minRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Longmont Section */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Why Assumable Mortgages Work in Longmont
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Boulder County Market</h3>
              <p className="text-gray-700">
                Longmont&apos;s position in Boulder County attracts affluent buyers from the tech corridor who need creative financing. Assumable mortgages bridge the down payment gap while securing favorable rates locked in from 2019-2022 purchases.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Strong FHA & VA Inventory</h3>
              <p className="text-gray-700">
                The area near Vance Brand Municipal Airport and proximity to military communities created a robust inventory of FHA and VA loans from 2019-2022. These assumable loans offer substantial monthly savings and flexible qualification requirements.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Tech Corridor Access</h3>
              <p className="text-gray-700">
                Close to Boulder&apos;s technology sector, Longmont attracts remote workers and tech professionals who value the community&apos;s affordability while maintaining access to career opportunities.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Average Savings: ${avgSavings.toLocaleString()}/month</h3>
              <p className="text-gray-700">
                With current market rates around {MARKET_RATE}%, assumable mortgages in Longmont average {avgRate}%. That&apos;s real money in your pocket every month for the life of the loan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Listings in Longmont</h2>
          <p className="text-gray-600 mb-8">
            Below are the listings with the highest monthly savings. Sorted by how much you can save every month.
          </p>
          <ListingCardWrapper listings={featured} />
          <div className="text-center">
            <Link
              href="/search?city=Longmont"
              className="inline-block bg-brand text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-dark transition-colors"
            >
              View All {longmontListings.length} Longmont Listings
            </Link>
          </div>
        </div>
      </section>

      {/* Lead Capture */}
      <section className="py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-brand to-brand-dark text-white rounded-2xl p-8 md:p-12">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Talk to an Assumable Mortgage Expert in Longmont</h2>
              <p className="text-brand-light text-sm">Fill out the form below and one of our agents will reach out to walk you through your options.</p>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <MarketExpertForm city="Longmont" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Assumable Mortgages FAQ</h2>
          <div className="space-y-6">
            <details className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <summary className="cursor-pointer font-bold text-gray-900 text-lg">
                What is an assumable mortgage?
              </summary>
              <p className="text-gray-700 mt-4">
                An assumable mortgage allows a buyer to take over the seller&apos;s existing loan instead of getting a new one. You inherit their interest rate, remaining balance, and loan terms. This is particularly valuable when rates have risen since the original loan was issued.
              </p>
            </details>
            <details className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <summary className="cursor-pointer font-bold text-gray-900 text-lg">
                Which loans are assumable?
              </summary>
              <p className="text-gray-700 mt-4">
                FHA and VA loans are assumable. Conventional loans typically are not. In Longmont, many homes purchased between 2019-2022 have FHA or VA loans with rates between 2-4%, well below today&apos;s market rates.
              </p>
            </details>
            <details className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <summary className="cursor-pointer font-bold text-gray-900 text-lg">
                How much can I save?
              </summary>
              <p className="text-gray-700 mt-4">
                Savings depend on the rate difference and loan balance. In Longmont, buyers are typically saving ${avgSavings.toLocaleString()}/month by assuming a loan at {avgRate}% instead of getting a new mortgage at {MARKET_RATE}%.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
