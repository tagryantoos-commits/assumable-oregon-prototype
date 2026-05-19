'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export function useSavedListings() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    fetch('/api/saved-listings')
      .then(r => r.json())
      .then(data => {
        setSavedIds(new Set(data.savedListingIds || []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn, authLoading]);

  const isSaved = useCallback(
    (id: string) => savedIds.has(id),
    [savedIds]
  );

  const toggle = useCallback(
    async (listingId: string) => {
      const action = savedIds.has(listingId) ? 'unsave' : 'save';

      // Optimistic update
      setSavedIds(prev => {
        const next = new Set(prev);
        if (action === 'save') next.add(listingId);
        else next.delete(listingId);
        return next;
      });

      try {
        await fetch('/api/saved-listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId, action }),
        });
      } catch {
        // Revert on failure
        setSavedIds(prev => {
          const next = new Set(prev);
          if (action === 'save') next.delete(listingId);
          else next.add(listingId);
          return next;
        });
      }
    },
    [savedIds]
  );

  return { savedIds, isSaved, toggle, loading, isRegistered: isLoggedIn };
}
