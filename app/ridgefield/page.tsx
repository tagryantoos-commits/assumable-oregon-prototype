import { Metadata } from 'next';
import Link from 'next/link';
import { getListingsByCity } from '../../lib/listings';
import ListingCardWrapper from '../ListingCardWrapper';

export function generateMetadata(): Metadata {
  const listings = getListingsByCity('Ridgefield');
  const count = listings.length;
  const ratesWithValues = listings.map(l => l.assumableRate).filter(r => r > 0);
  const minRate = ratesWithValues.length > 0 ? Math.min(...ratesWithValues).toFixed(2) : '2.80';
  return {
    title: `Ridgefield WA Assumable Mortgages | ${count} Homes | ${minRate}% Rate | The Assumable Guy`,
    description: `Browse ${count} assumable mortgage listings in Ridgefield, WA. Rates as low as ${minRate}%. FHA and VA loans available.`,
    alternates: { canonical: `https://assumable-oregon-prototype.vercel.app/ridgefield` },
  };
}

export default function RidgefieldPage() {
  const listings = getListingsByCity('Ridgefield');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Assumable Mortgages in Ridgefield, Washington
          </h1>
          <p className="text-xl text-slate-600 mb-6">
            Browse {listings.length} assumable mortgage listings in Ridgefield, WA — a growing community north of Vancouver with low-rate FHA and VA assumable loans available.
          </p>
          <Link href="/homes" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition inline-block">
            Browse All Oregon & PNW Listings
          </Link>
        </div>

        <div id="listings">
          <ListingCardWrapper listings={listings} />
        </div>
      </section>
    </div>
  );
}
