'use client';

import { useSavedListings } from '../lib/useSavedListings';
import SaveButton from './SaveButton';

export default function SaveButtonDetail({ listingId }: { listingId: string }) {
  const { isSaved, toggle } = useSavedListings();

  return (
    <SaveButton
      listingId={listingId}
      isSaved={isSaved(listingId)}
      onToggle={toggle}
      className=""
    />
  );
}
