import { Metadata } from 'next';
import Link from 'next/link';
import { getListingsByCity } from '../../lib/listings';
import { getFilteredListings } from '../../lib/getFilteredListings';
import ListingCardWrapper from '../ListingCardWrapper';
import { getRelatedPostsForCity } from '../../lib/blog';
import MarketExpertForm from '../../components/MarketExpertForm';

export function generateMetadata(): Metadata {
  const cityListings = getListingsByCity('Colorado Springs');
  const count = cityListings.length;
  const minRate = count > 0 ? Math.min(...cityListings.map(l => l.assumableRate)).toFixed(2) : '2.25';
  const slugStr = 'colorado-springs';
  const cityName = 'Colorado Springs';

  return {
    title: `${cityName} Assumable Mortgages | ${count}+ Homes | ${minRate}% Rate | The Assumable Guy`,
    description: `Browse ${count} assumable mortgage listings in ${cityName}, CO. Rates as low as ${minRate}%. Save $500-$1,400/month vs new loans at 6.5%. FHA and VA loans available.`,
    alternates: { canonical: `https://assumableguy.com/${slugStr}` },
    openGraph: {
      title: `${cityName} Assumable Mortgages | ${minRate}% Rate | The Assumable Guy`,
      description: `${count} homes in ${cityName} with assumable loans. Rates from ${minRate}%. Save hundreds per month.`,
      type: 'website',
      url: `https://assumableguy.com/${slugStr}`,
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

export default function ColoradoSpringsPage() {
  const csListings = getListingsByCity('Colorado Springs');
  const featured = getFilteredListings(csListings, { limit: 6 });

  const avgRate = csListings.length > 0
    ? (csListings.reduce((sum, l) => sum + l.assumableRate, 0) / csListings.length).toFixed(2)
    : '2.75';

  const avgSavings = csListings.length > 0
    ? Math.round(csListings.reduce((sum, l) => sum + l.monthlySavings, 0) / csListings.length)
    : 800;

  const relatedPosts = getRelatedPostsForCity('Colorado Springs');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
              Assumable Mortgages in Colorado Springs, Colorado
            </h1>
            <p className="text-xl text-slate-600 mb-4">
              Home to Fort Carson and NORAD, Colorado Springs has a strong military community with many VA assumable loans available. With median home prices rising, the savings from assuming a low-rate mortgage are significant for buyers in the Springs.
            </p>
            <p className="text-lg text-slate-600 mb-8">
              Current assumable rates in Colorado Springs average {avgRate}%. That means buyers could save approximately ${avgSavings}/month compared to new mortgages at 6.5%.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#listings"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-center"
              >
                View Available Listings
              </Link>
              <Link
                href="/blog"
                className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition text-center"
              >
                Learn About Assumptions
              </Link>
            </div>
          </div>
          <div className="bg-slate-100 rounded-lg p-8 h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl font-bold text-blue-600 mb-2">{csListings.length}+</p>
              <p className="text-xl text-slate-700 mb-6">Assumable Listings</p>
              <p className="text-4xl font-bold text-slate-900 mb-2">{avgRate}%</p>
              <p className="text-lg text-slate-600 mb-6">Average Assumable Rate</p>
              <p className="text-3xl font-bold text-green-600">${avgSavings}/mo</p>
              <p className="text-lg text-slate-600">Average Savings vs Market</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded mb-16">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Why Colorado Springs for Assumable Mortgages</h3>
          <ul className="text-slate-700 space-y-2">
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Strong military presence with many VA loan borrowers. Fort Carson and NORAD create steady VA assumable inventory</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>One of Colorado&apos;s fastest growing cities with rising demand for affordable homeownership</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Many FHA assumable mortgages accessible to first-time buyers with minimal qualification</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Assuming a loan at 2.75% vs current 6.5% rates saves $800+ per month on a typical home</span>
            </li>
          </ul>
        </div>

        <div id="listings" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Featured Colorado Springs Listings</h2>
          <ListingCardWrapper listings={featured} />
          {csListings.length > 6 && (
            <div className="mt-8 text-center">
              <Link
                href="/homes?city=Colorado Springs"
                className="px-6 py-3 bg-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-300 transition inline-block"
              >
                View All {csListings.length} Colorado Springs Listings
              </Link>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">How Assumable Mortgages Work in Colorado Springs</h2>
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">What is an assumable mortgage?</h3>
                <p>An assumable mortgage lets a buyer take over the seller&apos;s existing loan at the original interest rate. You pay the seller for their equity and assume the remaining balance.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Why Colorado Springs buyers benefit</h3>
                <p>With current rates around 6.5%, assuming a loan at 2-3% saves hundreds of dollars per month. On a $400,000 home, that is $800-$1,200 in monthly savings.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">FHA and VA loans</h3>
                <p>Colorado Springs has significant FHA and VA assumable inventory thanks to its military community. VA loans can also be assumed by non-veterans in many cases.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Get qualified</h3>
                <p>Lenders verify income, credit, and ability to assume the loan. The process is typically faster than a traditional mortgage application.</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-100 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Typical Colorado Springs Savings Example</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Home Price</p>
                <p className="text-2xl font-bold text-slate-900">$475,000</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-slate-600 mb-1">New Mortgage at 6.5%</p>
                <p className="text-2xl font-bold text-slate-900">$3,089/month</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Assumable at 2.75%</p>
                <p className="text-2xl font-bold text-green-600">$1,927/month</p>
              </div>
              <div className="border-t pt-4 bg-green-50 p-4 rounded">
                <p className="text-sm text-slate-600 mb-1">Your Monthly Savings</p>
                <p className="text-3xl font-bold text-green-600">$1,162/month</p>
                <p className="text-xs text-slate-600 mt-2">That&apos;s $13,944 per year</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Colorado Springs Real Estate Market</h2>
            <p className="text-slate-700 mb-4">
              Colorado Springs has experienced steady growth over the past decade, driven by military installations, a thriving tech sector, and quality of life that attracts families from across the country.
            </p>
            <p className="text-slate-700 mb-4">
              The median home price in Colorado Springs is around $475,000, with properties ranging from starter homes near Peterson Space Force Base to mountain-view estates in the Broadmoor area. Many established neighborhoods feature homes with assumable mortgages at rates well below current market conditions.
            </p>
            <Link
              href="/about"
              className="text-blue-600 font-semibold hover:text-blue-700"
            >
              Learn more about The Assumable Guy&apos;s process
            </Link>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Colorado Springs Real Estate Insights</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.slice(0, 3).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block p-6 bg-white border border-slate-200 rounded-lg hover:shadow-lg transition"
                >
                  <h3 className="font-semibold text-slate-900 mb-2 hover:text-blue-600">{post.title}</h3>
                  <p className="text-sm text-slate-600 mb-4">{post.description}</p>
                  <p className="text-xs text-slate-500">{new Date(post.date).toLocaleDateString()}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div id="get-notified" className="bg-gradient-to-br from-gray-900 to-brand-dark rounded-3xl p-8 text-white">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">Talk to an Assumable Mortgage Expert in Colorado Springs</h3>
            <p className="text-gray-300 text-sm">Fill out the form below, or reach us directly.</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-5 mt-4 text-sm">
              <a href="tel:7196243472" className="inline-flex items-center gap-2 text-brand-light hover:text-white font-semibold">
                <span>📞</span> (719) 624-3472
              </a>
              <span className="hidden sm:inline text-gray-500">·</span>
              <a href="mailto:ryan@TheAssumableGuy.com" className="inline-flex items-center gap-2 text-brand-light hover:text-white font-semibold">
                <span>✉️</span> ryan@TheAssumableGuy.com
              </a>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6">
            <MarketExpertForm city="Colorado Springs" />
          </div>
        </div>
      </section>
    </div>
  );
}
