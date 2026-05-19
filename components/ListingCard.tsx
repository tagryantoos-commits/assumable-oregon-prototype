'use client';

import { useState } from 'react';
import { Listing, formatPrice, formatCurrency, getPhotoUrl, calcSavingsVsConventional, calcConventionalMonthly } from '../lib/listings';
import { formatEquityGapLabel } from '../lib/getFilteredListings';
import SaveButton from './SaveButton';

interface ListingCardProps {
  listing: Listing;
  onGetDetails?: (listing: Listing) => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onRequireAuth?: () => void;
}

export default function ListingCard({ listing, onGetDetails, isSaved, onToggleSave, onRequireAuth }: ListingCardProps) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = imgError ? '/placeholder-home.svg' : getPhotoUrl(listing);

  const savings = calcSavingsVsConventional(listing);
  const conventionalMonthly = calcConventionalMonthly(listing.price);
  const totalSavings = savings * 360;
  const savingsColor = savings > 500 ? 'text-brand' : savings > 200 ? 'text-brand' : 'text-brand-light';

  return (
    <div className="listing-card-hover bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      {/* Photo */}
      <div className="relative">
        <div
          className="cursor-pointer"
          onClick={() => onGetDetails?.(listing)}
        >
          <div className="relative h-52 bg-gray-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={listing.address}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          </div>
        </div>
        {/* Rate Badge - top center over image */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-brand text-white font-black text-lg px-3 py-1 rounded-xl shadow-lg">
          {listing.assumableRate}%
        </div>
        {/* Save Button */}
        {onToggleSave && (
          <SaveButton
            listingId={listing.id}
            isSaved={!!isSaved}
            onToggle={onToggleSave}
            onRequireAuth={onRequireAuth}
            className="absolute top-3 right-3 z-10"
          />
        )}
        {/* Loan Type Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            listing.loanType === 'VA' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {listing.loanType}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-xl font-bold text-gray-900">{formatPrice(listing.price)}</div>
            <div className="text-sm text-gray-500">{listing.address}</div>
            <div className="text-sm text-gray-500">{listing.city}, {listing.state} {listing.zip}</div>
          </div>
        </div>

        {/* Beds/Baths/Sqft */}
        <div className="flex gap-3 text-sm text-gray-600 my-3 border-y border-gray-50 py-2">
          <span>🛏 {listing.beds > 0 ? listing.beds : '?'} bed</span>
          <span>🚿 {listing.baths > 0 ? listing.baths : '?'} bath</span>
          {listing.sqft > 0 && <span>📐 {listing.sqft.toLocaleString()} sqft</span>}
        </div>

        {/* Savings highlight */}
        {savings > 0 && (
          <div className="bg-brand-50 rounded-lg px-3 py-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Monthly savings vs 6.5%</span>
              <span className={`font-bold text-sm ${savingsColor}`}>
                ${savings.toLocaleString()}/mo
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">Total savings (30yr)</span>
              <span className="font-bold text-sm text-brand">
                ${totalSavings.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              ${listing.assumableMonthlyPayment.toLocaleString()}/mo vs ${conventionalMonthly.toLocaleString()}/mo (5% down)
            </div>
          </div>
        )}

        {/* Gap financing note */}
        {listing.estimatedEquityGap > 50000 && (
          <div className="text-xs text-brand font-medium mb-3">
            Gap financing available. Ask us.
          </div>
        )}

        {/* Remaining Balance */}
        <div className="text-xs text-gray-500 mb-3">
          {(() => {
            const { label, isZeroGap } = formatEquityGapLabel(listing.estimatedEquityGap);
            return (
              <>
                Remaining loan: {formatCurrency(listing.remainingLoanBalance)} &middot;{' '}
                <span className={isZeroGap ? 'text-blue-600 font-medium' : ''}>
                  {label}
                </span>
              </>
            );
          })()}
        </div>

        {/* CTA */}
        <button
          onClick={() => onGetDetails?.(listing)}
          className="w-full bg-brand hover:bg-brand text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          Get Loan Details &rarr;
        </button>
      </div>
    </div>
  );
}
