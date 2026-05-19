'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

interface ListingCard {
  id: string;
  city: string;
  rate: number;
  monthlySavings: number;
  price: string;
  loanType: string;
  beds: number;
  baths: number;
  address: string;
}

function ThankYouContent({ listings }: { listings: ListingCard[] }) {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* MINI BRAND BAR */}
      <div className="bg-brand py-2.5 px-4 flex items-center justify-between max-w-full">
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-lg tracking-tight">The Assumable Guy</span>
        </div>
        <a
          href="tel:7196243472"
          className="text-white font-semibold text-sm hover:text-brand-light transition-colors flex items-center gap-1.5"
        >
          📞 <span className="hidden sm:inline">(719) 624-3472</span><span className="sm:hidden">Call Now</span>
        </a>
      </div>

      {/* HERO */}
      <div className="bg-white border-b border-gray-200 py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            {name ? `Thanks, ${name}! 🎉` : "You're in! 🎉"}
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            We&apos;re pulling together a personalized list of assumable homes for you. Expect a text from us within minutes.
          </p>
        </div>
      </div>

      {/* LISTINGS PREVIEW */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Top Assumable Listings Right Now</h2>
          <p className="text-gray-500 text-sm">Sorted by highest monthly savings. Click any listing for full details.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/homes/${listing.id}`}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-brand/30 transition-all group"
            >
              {/* Rate badge */}
              <div className="bg-gradient-to-r from-brand to-brand-dark px-4 py-2.5 flex items-center justify-between">
                <span className="text-white font-bold text-sm">{listing.rate}% Rate</span>
                <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {listing.loanType}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-gray-900 text-lg group-hover:text-brand transition-colors">
                      {listing.price}
                    </div>
                    <div className="text-gray-500 text-sm">{listing.city}</div>
                  </div>
                  <div className="bg-brand-50 border border-brand-200 rounded-lg px-3 py-1.5 text-right">
                    <div className="text-brand-dark font-bold text-sm">Save ${listing.monthlySavings.toLocaleString()}</div>
                    <div className="text-brand text-xs">/month</div>
                  </div>
                </div>

                <div className="text-gray-400 text-xs mb-3 truncate">{listing.address}</div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{listing.beds} bed</span>
                  <span className="text-gray-300">·</span>
                  <span>{listing.baths} bath</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div className="bg-gray-900 py-12 px-4 text-center">
        <div className="max-w-lg mx-auto">
          <div className="text-3xl mb-3">📞</div>
          <h3 className="text-xl font-bold text-white mb-2">Questions? Call Ryan directly.</h3>
          <a
            href="tel:7196243472"
            className="inline-block bg-brand hover:bg-brand-dark text-white font-bold py-3 px-8 rounded-xl transition-colors text-lg mt-2"
          >
            (719) 624-3472
          </a>
          <p className="text-gray-500 text-xs mt-4">
            The Assumable Guy · Ryan Thomson, Licensed CO Real Estate Agent · License #100092341
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouClient({ listings }: { listings: ListingCard[] }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <ThankYouContent listings={listings} />
    </Suspense>
  );
}
