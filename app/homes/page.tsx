import { Metadata } from 'next';
import { allListings, STATS } from '../../lib/listings';
import HomesClient from './HomesClient';

export const metadata: Metadata = {
  title: 'Browse Colorado Assumable Mortgages | The Assumable Guy',
  description: `Browse ${STATS.activeListings}+ Colorado homes with assumable mortgages at 1-4% rates. Filter by city, price, and rate. Save $500-$1,500/month.`,
};

interface Props {
  searchParams: Promise<{ city?: string }>;
}

export default async function HomesPage({ searchParams }: Props) {
  const params = await searchParams;
  const city = params?.city || '';

  return (
    <div>
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {city ? `${city} Assumable Mortgages` : 'Colorado Assumable Mortgage Listings'}
          </h1>
          <p className="text-gray-500 mt-1">
            {STATS.activeListings}+ active listings · Rates as low as 2.25% · Updated daily
          </p>
        </div>
      </div>

      <HomesClient listings={allListings} initialCity={city} />
    </div>
  );
}
