import { Metadata } from 'next';
import Link from 'next/link';
import { getListingsByCity, MARKET_RATE } from '../../lib/listings';
import { getFilteredListings } from '../../lib/getFilteredListings';
import ListingCardWrapper from '../ListingCardWrapper';
import { getRelatedPostsForCity } from '../../lib/blog';
import MarketExpertForm from '../../components/MarketExpertForm';

export function generateMetadata(): Metadata {
  const puebloListings = getListingsByCity('Pueblo');
  const count = puebloListings.length;
  const minRate = count > 0 
    ? Math.min(...puebloListings.map(l => l.assumableRate)).toFixed(2) 
    : '2.50';
  const slug = 'pueblo-colorado';
  const cityName = 'Pueblo';

  return {
    title: `${cityName} Assumable Mortgages | ${count}+ Homes | ${minRate}% Rate | The Assumable Guy`,
    description: `Browse ${count} assumable mortgage listings in ${cityName}, CO. Rates as low as ${minRate}%. Save $400-$1,000/month vs new loans at 6.5%. FHA & VA loans available.`,
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

export default function PuebloPage() {
  const puebloListings = getListingsByCity('Pueblo');
  const featured = getFilteredListings(puebloListings, { limit: 6 });

  const avgSavings = puebloListings.length > 0
    ? Math.round(puebloListings.reduce((s, l) => s + l.monthlySavings, 0) / puebloListings.length)
    : 750;
  const minRate = puebloListings.length > 0
    ? Math.min(...puebloListings.map(l => l.assumableRate)).toFixed(2)
    : '2.50';

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Assumable Mortgage Listings in Pueblo, CO',
    numberOfItems: puebloListings.length,
    itemListElement: puebloListings.slice(0, 10).map((listing, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `https://assumableguy.com/homes/${listing.id}`,
      name: `${listing.address}, ${listing.city} - ${listing.assumableRate}% ${listing.loanType}`,
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
              📍 Pueblo, CO
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Pueblo<br/>
              <span className="text-brand-light">Assumable Mortgages</span>
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              {puebloListings.length} active listings in Pueblo with assumable mortgages.
              Rates starting at {minRate}%. Save an average of ${avgSavings.toLocaleString()}/month vs today's {MARKET_RATE}% rate.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center">
                <div className="text-2xl font-black text-brand-light">{puebloListings.length}</div>
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
            Why Pueblo Buyers Choose Assumable Mortgages
          </h2>
          <div className="prose prose-gray max-w-none text-gray-600 text-sm leading-relaxed mb-8">
            <p>
              Pueblo offers one of Colorado's most accessible markets for assumable mortgages. With median home prices lower than Denver or Colorado Springs, and a strong inventory of FHA and VA loans from the 2020-2022 boom, Pueblo is ideal for first-time buyers, families, and investors looking to lock in historically low rates.
            </p>
            <p className="mt-3">
              The Pueblo area is home to Colorado State University-Pueblo, the University of Southern Colorado, and major employers like Pueblo Community College and St. Mary-Corwin Medical Center. The city's working-class roots and steady blue-collar employment make it a stable market with genuine buyer demand from families who value affordability without sacrificing quality of life.
            </p>
            <p className="mt-3">
              The math is compelling: on a $300,000 remaining loan balance at {minRate}%, vs a new {MARKET_RATE}% loan, you save ${avgSavings} every single month. That's real money that stays in your pocket - $900+ per year, or $27,000+ over 30 years.
            </p>
          </div>

          {/* Featured Listings */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-gray-900">Top Pueblo Deals</h2>
              <Link href="/homes?city=Pueblo" className="text-brand hover:text-brand-dark text-sm font-semibold">
                See all {puebloListings.length} →
              </Link>
            </div>
            <ListingCardWrapper listings={featured} />
          </div>

          <div className="text-center mb-12">
            <Link
              href="/homes?city=Pueblo"
              className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-brand/20"
            >
              View All {puebloListings.length} Pueblo Listings →
            </Link>
          </div>

          {/* Related Blog Posts */}
          <RelatedBlogPosts cityName="Pueblo" />

          {/* Expert Contact Form */}
          <div id="get-notified" className="bg-gradient-to-br from-gray-900 to-brand-dark rounded-3xl p-8 text-white mt-12">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Talk to an Assumable Mortgage Expert in Pueblo</h3>
              <p className="text-gray-300 text-sm">Fill out the form below and one of our agents will reach out to walk you through your options.</p>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <MarketExpertForm city="Pueblo" />
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
