'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { allListings } from '../../lib/listings';
import { useSavedListings } from '../../lib/useSavedListings';
import ListingCard from '../../components/ListingCard';

export default function SavedClient() {
  const router = useRouter();
  const { savedIds, isSaved, toggle, loading, isRegistered } = useSavedListings();

  const savedListings = useMemo(() => {
    return allListings.filter(l => savedIds.has(l.id));
  }, [savedIds]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-gray-400">
        Loading your saved listings...
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Register to Save Listings</h2>
        <p className="text-gray-500 mb-6">
          Create a free account to save properties and share your favorites with your agent.
        </p>
        <Link
          href="/homes"
          className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          Browse Homes to Get Started
        </Link>
      </div>
    );
  }

  if (savedListings.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-5xl mb-4">&#10084;&#65039;</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Saved Listings Yet</h2>
        <p className="text-gray-500 mb-6">
          Browse homes and tap the heart icon to save properties you like. Your agent will be notified.
        </p>
        <Link
          href="/homes"
          className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          Browse Homes →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-sm text-gray-600 mb-6">
        <strong>{savedListings.length}</strong> saved listing{savedListings.length !== 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {savedListings.map(listing => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onGetDetails={(l) => router.push(`/homes/${l.id}`)}
            isSaved={isSaved(listing.id)}
            onToggleSave={toggle}
          />
        ))}
      </div>
    </div>
  );
}
