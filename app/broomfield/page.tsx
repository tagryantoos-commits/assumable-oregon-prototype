import { Metadata } from 'next';
import Link from 'next/link';
import { getListingsByCity, MARKET_RATE } from '../../lib/listings';
import { getFilteredListings } from '../../lib/getFilteredListings';
import ListingCardWrapper from '../ListingCardWrapper';
import MarketExpertForm from '../../components/MarketExpertForm';
import { getRelatedPostsForCity } from '../../lib/blog';

export function generateMetadata(): Metadata {
  const cityListings_meta = getListingsByCity('Broomfield');
  const count = cityListings_meta.length;
  const minRate = count > 0 ? Math.min(...cityListings_meta.map(l => l.assumableRate)).toFixed(2) : '2.50';
  const slug = 'broomfield';
  const cityName = 'Broomfield';

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

export default function BroomfieldPage() {
  const cityListings = getListingsByCity('Broomfield');
  const featured = getFilteredListings(cityListings, { limit: 6 });

  const avgSavings = cityListings.length > 0
    ? Math.round(cityListings.reduce((s, l) => s + l.monthlySavings, 0) / cityListings.length)
    : 950;
  const minRate = cityListings.length > 0
    ? Math.min(...cityListings.map(l => l.assumableRate)).toFixed(2)
    : '2.75';

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Assumable Mortgage Listings in Broomfield, CO',
    numberOfItems: cityListings.length,
    itemListElement: cityListings.slice(0, 10).map((listing, idx) => ({
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
              📍 Broomfield, CO
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Broomfield<br/>
              <span className="text-brand-light">Assumable Mortgages</span>
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              {cityListings.length} active listings in Broomfield with assumable mortgages.
              Rates starting at {minRate}%. Save an average of ${avgSavings.toLocaleString()}/month vs today&apos;s {MARKET_RATE}% rate.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center">
                <div className="text-2xl font-black text-brand-light">{cityListings.length}</div>
                <div className="text-xs text-gray-300">Active Listings</div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center">
                <div className="text-2xl font-black text-brand-light">{minRate}%</div>
                <div className="text-xs text-gray-300">Lowest Rate</div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center">
                <div className="text-2xl font-black text-brand-light">${avgSavings.toLocaleString()}</div>
                <div className="text-xs text-gray-300">Avg Monthly Savings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Broomfield Tech Hub: How to Afford Ownership Without a 7% Loan
          </h2>
          <div className="prose prose-gray max-w-none text-gray-600 text-sm leading-relaxed mb-8">
            <p>
              Broomfield is Colorado&apos;s fastest-growing city, positioned at the midpoint of the Denver–Boulder
              tech corridor. Corporations like Oracle, Vail Resorts, and dozens of others have headquarters
              here. Strong employment drives strong demand and home prices in the $500,000–$680,000 range.
              At {MARKET_RATE}% interest rates, even tech salaries feel the squeeze.
            </p>
            <p className="mt-3">
              The 2020–2022 buying wave in Broomfield was fueled heavily by FHA loans. Tech workers
              relocating from California and Texas who could qualify for high purchase prices with FHA&apos;s
              flexible terms. Those loans are fully assumable today. You don&apos;t need military service,
              just standard income and credit qualification.
            </p>
            <p className="mt-3">
              A $460,000 remaining FHA balance at 3.0% is $1,939/month. At {MARKET_RATE}%, it&apos;s $3,062/month.
              You save $1,123/month ($13,476/year) by targeting the right Broomfield listing. In a
              market driven by high earners who understand compound math, that number lands.
            </p>
          </div>

          {/* Featured Listings */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-gray-900">Top Broomfield Deals</h2>
              <Link href="/homes?city=Broomfield" className="text-brand hover:text-brand-dark text-sm font-semibold">
                See all {cityListings.length} →
              </Link>
            </div>
            <ListingCardWrapper listings={featured} />
          </div>

          <div className="text-center mb-12">
            <Link
              href="/homes?city=Broomfield"
              className="inline-block bg-brand hover:bg-brand text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-brand-200"
            >
              View All {cityListings.length} Broomfield Listings →
            </Link>
          </div>

          {/* Related Blog Posts */}
          <RelatedBlogPosts cityName="Broomfield" />

          {/* Lead form */}
          <div id="get-notified" className="bg-gradient-to-br from-gray-900 to-brand-dark rounded-3xl p-8 text-white">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Talk to an Assumable Mortgage Expert in Broomfield</h3>
              <p className="text-gray-300 text-sm">Fill out the form below and one of our agents will reach out to walk you through your options.</p>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <MarketExpertForm city="Broomfield" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function RelatedBlogPosts({ cityName }: { cityName: string }) {
  const relatedPosts = getRelatedPostsForCity(cityName, 5);
  if (relatedPosts.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Learn About Assumable Mortgages in {cityName}
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedPosts.map(post => (
          <Link key={post.slug} href={`/blog/${post.slug}`}
            className="block p-4 bg-white border border-gray-100 rounded-lg hover:border-brand-light transition-colors">
            <div className="text-sm text-brand font-medium mb-1">{post.date}</div>
            <div className="font-semibold text-gray-900">{post.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
