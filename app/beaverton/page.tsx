import { Metadata } from 'next';
import Link from 'next/link';
import { getListingsByCity } from '../../lib/listings';
import { getFilteredListings } from '../../lib/getFilteredListings';
import ListingCardWrapper from '../ListingCardWrapper';

export function generateMetadata(): Metadata {
  const listings = getListingsByCity('Beaverton');
  const count = listings.length;
  const ratesWithValues = listings.map(l => l.assumableRate).filter(r => r > 0);
  const minRate = ratesWithValues.length > 0 ? Math.min(...ratesWithValues).toFixed(2) : '2.90';
  return {
    title: `Beaverton OR Assumable Mortgages | ${count} Homes | ${minRate}% Rate | The Assumable Guy`,
    description: `Browse ${count} assumable mortgage listings in Beaverton, OR. Rates as low as ${minRate}%. FHA and VA loans available. Save hundreds per month vs 6.9% market rates.`,
    alternates: { canonical: `https://assumable-oregon-prototype.vercel.app/beaverton` },
  };
}

export default function BeavertonPage() {
  const listings = getListingsByCity('Beaverton');
  const featured = getFilteredListings(listings, { limit: 6, minPrice: 0 });
  const showAll = featured.length > 0 ? featured : listings;

  const ratesWithValues = listings.map(l => l.assumableRate).filter(r => r > 0);
  const avgRate = ratesWithValues.length > 0
    ? (ratesWithValues.reduce((s, r) => s + r, 0) / ratesWithValues.length).toFixed(2)
    : 'N/A';
  const savingsListings = listings.filter(l => l.monthlySavings > 0);
  const avgSavings = savingsListings.length > 0
    ? Math.round(savingsListings.reduce((s, l) => s + l.monthlySavings, 0) / savingsListings.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Assumable Mortgages in Beaverton, Oregon
          </h1>
          <p className="text-xl text-slate-600 mb-3">
            Browse {listings.length} assumable mortgage listings in Beaverton, OR. Average assumable rate: {avgRate}%. Average monthly savings: ${avgSavings.toLocaleString()}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link href="/homes" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-center">
              Browse All Oregon & PNW Listings
            </Link>
          </div>
        </div>

        <div id="listings">
          <ListingCardWrapper listings={showAll} />
        </div>
      </section>
    </div>
  );
}
