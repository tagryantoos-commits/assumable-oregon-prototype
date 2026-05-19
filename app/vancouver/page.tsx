import { Metadata } from 'next';
import Link from 'next/link';
import { getListingsByCity } from '../../lib/listings';
import { getFilteredListings } from '../../lib/getFilteredListings';
import ListingCardWrapper from '../ListingCardWrapper';

export function generateMetadata(): Metadata {
  const listings = getListingsByCity('Vancouver');
  const count = listings.length;
  const ratesWithValues = listings.map(l => l.assumableRate).filter(r => r > 0);
  const minRate = ratesWithValues.length > 0 ? Math.min(...ratesWithValues).toFixed(2) : '2.80';
  return {
    title: `Vancouver WA Assumable Mortgages | ${count} Homes | ${minRate}% Rate | The Assumable Guy`,
    description: `Browse ${count} assumable mortgage listings in Vancouver, WA. Rates as low as ${minRate}%. Save hundreds per month vs new loans at 6.9%. FHA and VA loans available.`,
    alternates: { canonical: `https://assumable-oregon-prototype.vercel.app/vancouver` },
  };
}

export default function VancouverPage() {
  const listings = getListingsByCity('Vancouver');
  const featured = getFilteredListings(listings, { limit: 6, minPrice: 0 });
  const showAll = featured.length > 0 ? featured : listings.slice(0, 6);

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
            Assumable Mortgages in Vancouver, Washington
          </h1>
          <p className="text-xl text-slate-600 mb-3">
            Browse {listings.length} assumable mortgage listings in Vancouver, WA — just across the Columbia River from Portland. Average assumable rate: {avgRate}%.
          </p>
          <p className="text-lg text-slate-600 mb-6">
            Save approximately ${avgSavings.toLocaleString()}/month compared to new loans at current market rates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="#listings" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-center">
              View Available Listings
            </Link>
            <Link href="/homes" className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition text-center">
              Browse All Oregon & PNW Listings
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-12 max-w-xl">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <div className="text-2xl font-bold text-blue-600">{listings.length}</div>
            <div className="text-xs text-slate-500 mt-1">Active Listings</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <div className="text-2xl font-bold text-blue-600">{avgRate}%</div>
            <div className="text-xs text-slate-500 mt-1">Avg. Rate</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <div className="text-2xl font-bold text-blue-600">${avgSavings}/mo</div>
            <div className="text-xs text-slate-500 mt-1">Avg. Savings</div>
          </div>
        </div>

        <div id="listings">
          <ListingCardWrapper listings={showAll} />
        </div>

        {listings.length > 6 && (
          <div className="text-center mt-8">
            <Link href={`/homes?city=${encodeURIComponent('Vancouver')}`} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
              View All {listings.length} Vancouver Listings
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
