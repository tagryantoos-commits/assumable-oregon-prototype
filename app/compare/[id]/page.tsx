import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { allListings, getListingById, formatPrice, calcSavingsVsConventional } from '../../../lib/listings';
import CompareClient from './CompareClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return allListings.slice(0, 500).map(l => ({ id: l.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = getListingById(id);
  if (!listing) return { title: 'Listing Not Found' };

  const savings = calcSavingsVsConventional(listing);

  return {
    title: `Loan Comparison: ${listing.address}, ${listing.city} | ${listing.assumableRate}% vs 6.5% | The Assumable Guy`,
    description: `Full loan breakdown for ${listing.address}. Assumable ${listing.loanType} at ${listing.assumableRate}% saves $${savings.toLocaleString()}/mo vs a new 6.5% conventional mortgage. See the math.`,
    alternates: { canonical: `https://assumableguy.com/compare/${listing.id}` },
    openGraph: {
      title: `${listing.address} | ${listing.assumableRate}% vs 6.5% Loan Comparison`,
      description: `Save $${savings.toLocaleString()}/mo by assuming this ${listing.loanType} loan at ${listing.assumableRate}%.`,
      type: 'website',
      url: `https://assumableguy.com/compare/${listing.id}`,
    },
  };
}

export default async function ComparePage({ params }: Props) {
  const { id } = await params;
  const listing = getListingById(id);
  if (!listing) notFound();

  return (
    <div className="pb-16 md:pb-0">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-400 mb-4 flex items-center gap-1">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/homes" className="hover:text-white">Listings</Link>
            <span>/</span>
            <Link href={`/homes/${listing.id}`} className="hover:text-white">{listing.address}</Link>
            <span>/</span>
            <span className="text-white font-medium">Loan Comparison</span>
          </nav>
          <h1 className="text-2xl md:text-4xl font-black mb-2">
            Loan Comparison: <span className="text-brand-light">{listing.assumableRate}% vs 6.5%</span>
          </h1>
          <p className="text-gray-300 text-base max-w-2xl">
            {listing.address}, {listing.city}, {listing.state} {listing.zip} &middot; {listing.beds}bd/{listing.baths}ba &middot; {formatPrice(listing.price)}
          </p>
        </div>
      </section>

      <CompareClient listing={listing} />
    </div>
  );
}
