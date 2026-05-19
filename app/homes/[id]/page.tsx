import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { allListings, getListingById, formatPrice, calcMonthlyPayment, MARKET_RATE, calcConventionalMonthly, calcSavingsVsConventional } from '../../../lib/listings';
import ListingDetailClient from './ListingDetailClient';
import ListingLoanComparison from '../../../components/ListingLoanComparison';
import SaveButtonDetail from '../../../components/SaveButtonDetail';
import PhotoGallery from '../../../components/PhotoGallery';

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
  const photoUrl = listing.photoUrls?.[0] || 'https://assumableguy.com/images/ryan-headshot.png';
  const sqftStr = listing.sqft > 0 ? `, ${listing.sqft.toLocaleString()} sqft` : '';

  return {
    title: `${listing.address}, ${listing.city} | ${listing.assumableRate}% Assumable ${listing.loanType} | The Assumable Guy`,
    description: `${listing.beds}bd/${listing.baths}ba${sqftStr} at ${listing.assumableRate}% assumable rate. Save $${savings.toLocaleString()}/mo vs 6.5% conventional. ${listing.city}, CO. ${listing.loanType} loan${listing.remainingLoanBalance > 0 ? ', $' + Math.round(listing.remainingLoanBalance / 1000) + 'K balance' : ''}.`,
    alternates: { canonical: `https://assumableguy.com/homes/${listing.id}` },
    openGraph: {
      title: `${listing.address} | ${listing.assumableRate}% ${listing.loanType} Assumable`,
      description: `Save $${savings.toLocaleString()}/mo. ${listing.beds}bd/${listing.baths}ba in ${listing.city}. ${listing.assumableRate}% assumable ${listing.loanType} loan.`,
      type: 'website',
      url: `https://assumable-oregon-prototype.vercel.app/homes/${listing.id}`,
      images: [{ url: 'https://assumableguy.com/images/ryan-headshot.png', width: 800, height: 600, alt: `${listing.address} - Assumable ${listing.loanType} at ${listing.assumableRate}%` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${listing.address} | ${listing.assumableRate}% Assumable`,
      description: `Save $${savings.toLocaleString()}/mo vs 6.5% rates. ${listing.beds}bd/${listing.baths}ba in ${listing.city}.`,
      images: [photoUrl],
    },
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const listing = getListingById(id);

  if (!listing) notFound();

  const marketPayment = calcMonthlyPayment(listing.remainingLoanBalance, MARKET_RATE);
  const conventionalMonthly = calcConventionalMonthly(listing.price);
  const savingsVsConventional = calcSavingsVsConventional(listing);
  const totalSavings = savingsVsConventional * 360;
  const photoUrl = listing.photoUrls?.[0] || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80';

  const listingSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${listing.address}, ${listing.city}, ${listing.state}`,
    description: `${listing.beds}bd/${listing.baths}ba home with ${listing.assumableRate}% assumable ${listing.loanType} loan. Save $${savingsVsConventional.toLocaleString()}/mo vs 6.5% conventional.`,
    url: `https://assumable-oregon-prototype.vercel.app/homes/${listing.id}`,
    image: '/placeholder-home.svg',
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Interest Rate', value: `${listing.assumableRate}%` },
      { '@type': 'PropertyValue', name: 'Loan Type', value: listing.loanType },
      { '@type': 'PropertyValue', name: 'Bedrooms', value: listing.beds },
      { '@type': 'PropertyValue', name: 'Bathrooms', value: listing.baths },
      { '@type': 'PropertyValue', name: 'Square Feet', value: listing.sqft },
      { '@type': 'PropertyValue', name: 'Monthly Payment', value: `$${listing.assumableMonthlyPayment.toLocaleString()}` },
      { '@type': 'PropertyValue', name: 'Remaining Balance', value: `$${listing.remainingLoanBalance.toLocaleString()}` },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema) }}
      />
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span>/</span>
        <Link href="/homes" className="hover:text-brand">Listings</Link>
        <span>/</span>
        <Link href={`/homes?city=${encodeURIComponent(listing.city)}`} className="hover:text-brand">{listing.city}</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate max-w-xs">{listing.address}</span>
      </nav>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: Photos + Details */}
        <div className="lg:col-span-3">
          {/* Photo Gallery */}
          <PhotoGallery
            photos={listing.photoUrls}
            address={listing.address}
            loanType={listing.loanType}
            assumableRate={listing.assumableRate}
          />

          {/* Key Info */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{listing.address}</h1>
              <SaveButtonDetail listingId={listing.id} />
            </div>
            <p className="text-gray-500 mb-4">{listing.city}, {listing.state} {listing.zip}</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-xl p-3">
                <div className="text-xl font-bold text-gray-900">{listing.beds}</div>
                <div className="text-xs text-gray-500">Bedrooms</div>
              </div>
              <div className="bg-white rounded-xl p-3">
                <div className="text-xl font-bold text-gray-900">{listing.baths}</div>
                <div className="text-xs text-gray-500">Bathrooms</div>
              </div>
              <div className="bg-white rounded-xl p-3">
                <div className="text-xl font-bold text-gray-900">{listing.sqft > 0 ? listing.sqft.toLocaleString() : 'N/A'}</div>
                <div className="text-xs text-gray-500">Sq Ft</div>
              </div>
            </div>
          </div>

          {/* Loan Comparison Calculator */}
          <ListingLoanComparison listing={listing} />

          {/* Loan Details */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🏦 Loan Details</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <dt className="text-gray-500 text-xs">List Price</dt>
                <dd className="font-bold text-gray-900 mt-0.5">{formatPrice(listing.price)}</dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <dt className="text-gray-500 text-xs">Assumable Rate</dt>
                <dd className="font-bold text-brand mt-0.5">{listing.assumableRate}%</dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <dt className="text-gray-500 text-xs">Remaining Balance</dt>
                <dd className="font-bold text-gray-900 mt-0.5">{formatPrice(listing.remainingLoanBalance)}</dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <dt className="text-gray-500 text-xs">Loan Type</dt>
                <dd className="font-bold text-gray-900 mt-0.5">{listing.loanType}</dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <dt className="text-gray-500 text-xs">Est. Equity Gap</dt>
                <dd className="font-bold text-gray-900 mt-0.5">
                  {listing.remainingLoanBalance > listing.price
                    ? <span className="text-amber-600 text-xs">Contact us</span>
                    : formatPrice(listing.estimatedEquityGap)}
                </dd>
              </div>
              {listing.annualTaxes > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <dt className="text-gray-500 text-xs">Annual Taxes</dt>
                  <dd className="font-bold text-gray-900 mt-0.5">{formatPrice(listing.annualTaxes)}</dd>
                </div>
              )}
              {listing.hoa > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <dt className="text-gray-500 text-xs">HOA/mo</dt>
                  <dd className="font-bold text-gray-900 mt-0.5">{formatPrice(listing.hoa)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">About This Home</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {listing.description.replace(/\r\n?/g, '\n')}
              </p>
            </div>
          )}

          {/* MLS Credit / Disclaimer */}
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 leading-relaxed">
            {listing.listingAgentName && (
              <p className="mb-1">
                <span className="font-semibold">Listing Agent:</span> {listing.listingAgentName}
                {listing.listingOfficeName && <span> · {listing.listingOfficeName}</span>}
              </p>
            )}
            {listing.sourceMls && (
              <p className="mb-1">
                <span className="font-semibold">Data Source:</span>{' '}
                {listing.sourceMls === 'recolorado' ? 'REcolorado MLS' : listing.sourceMls === 'PPMLS' ? 'Pikes Peak MLS (PPMLS)' : listing.sourceMls}
              </p>
            )}
            <p>
              Listing information is deemed reliable but not guaranteed. All data provided by the MLS and is subject to change. The Assumable Guy is not the listing agent for this property. Contact us to connect with the listing agent and explore assumable financing options.
            </p>
          </div>
        </div>

        {/* Right: Lead Form */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <ListingDetailClient listing={listing} />
          </div>
        </div>
      </div>
    </div>
  );
}
