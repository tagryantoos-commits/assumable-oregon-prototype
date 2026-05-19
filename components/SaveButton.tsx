'use client';

import { useAuth } from '../lib/useAuth';

interface Props {
  listingId: string;
  isSaved: boolean;
  onToggle: (id: string) => void;
  onRequireAuth?: () => void;
  className?: string;
}

export default function SaveButton({ listingId, isSaved, onToggle, onRequireAuth, className = '' }: Props) {
  const { isLoggedIn } = useAuth();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isLoggedIn) {
      onRequireAuth?.();
      return;
    }

    onToggle(listingId);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
        isSaved
          ? 'bg-red-500 text-white scale-110'
          : 'bg-white/80 text-gray-400 hover:text-red-400 hover:bg-white'
      } shadow-md ${className}`}
      aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isSaved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={isSaved ? 0 : 2}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
