'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ListingCard from '../components/ListingCard';
import AuthGate from '../components/AuthGate';
import { Listing } from '../lib/listings';
import { useAuth } from '../lib/useAuth';

export default function ListingCardWrapper({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingListing, setPendingListing] = useState<Listing | null>(null);

  const handleGetDetails = useCallback((listing: Listing) => {
    if (isLoggedIn) {
      router.push(`/homes/${listing.id}`);
    } else {
      setPendingListing(listing);
      setGateOpen(true);
    }
  }, [isLoggedIn, router]);

  const handleGateUnlock = useCallback(() => {
    setGateOpen(false);
    if (pendingListing) {
      router.push(`/homes/${pendingListing.id}`);
      setPendingListing(null);
    }
  }, [pendingListing, router]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map(listing => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onGetDetails={handleGetDetails}
          />
        ))}
      </div>
      {gateOpen && (
        <AuthGate
          onUnlock={handleGateUnlock}
          onClose={() => { setGateOpen(false); setPendingListing(null); }}
          listing={pendingListing ? {
            id: pendingListing.id,
            address: pendingListing.address,
            city: pendingListing.city,
            state: pendingListing.state,
            assumable_rate: pendingListing.assumableRate,
            price: pendingListing.price,
          } : undefined}
        />
      )}
    </>
  );
}
