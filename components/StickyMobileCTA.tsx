'use client';

import Link from 'next/link';

export default function StickyMobileCTA({ listingCount }: { listingCount: number }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gray-900 border-t border-gray-700 p-3">
      <Link
        href="/homes"
        className="block w-full bg-brand hover:bg-brand-light text-white font-bold py-3 rounded-xl text-center transition-colors shadow-lg shadow-brand/30"
      >
        See All {listingCount} Colorado Listings →
      </Link>
    </div>
  );
}
