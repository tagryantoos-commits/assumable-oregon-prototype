'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Listing, getCities, formatPrice, formatCurrency, calcSavingsVsConventional } from '../../lib/listings';
import { getFilteredListings } from '../../lib/getFilteredListings';
import ListingCard from '../../components/ListingCard';
import AuthGate from '../../components/AuthGate';
import { useSavedListings } from '../../lib/useSavedListings';
import { useAuth } from '../../lib/useAuth';

const ListingsMap = dynamic(() => import('../../components/ListingsMap'), { ssr: false });

const ITEMS_PER_PAGE = 24;

interface HomesClientProps {
  listings: Listing[];
  initialCity?: string;
}

export default function HomesClient({ listings, initialCity }: HomesClientProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [selectedCity, setSelectedCity] = useState(initialCity || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [minBeds, setMinBeds] = useState('');
  const [loanType, setLoanType] = useState('');
  const [sortBy, setSortBy] = useState('best_deals');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingListing, setPendingListing] = useState<Listing | null>(null);
  const { isSaved, toggle: toggleSave } = useSavedListings();

  const handleCardClick = useCallback((listing: Listing) => {
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

  const cities = useMemo(() => {
    const all = [...new Set(listings.map(l => l.city))].sort();
    return all;
  }, [listings]);

  const filtered = useMemo(() => {
    let result = [...listings];

    if (searchQuery.trim()) {
      const terms = searchQuery.toLowerCase().trim().split(/\s+/);
      result = result.filter(l => {
        const haystack = `${l.address} ${l.city} ${l.state} ${l.zip} ${l.description || ''} ${l.loanType}`.toLowerCase();
        return terms.every(term => haystack.includes(term));
      });
    }
    if (selectedCity) result = result.filter(l => l.city === selectedCity);
    if (minPrice) result = result.filter(l => l.price >= Number(minPrice));
    if (maxPrice) result = result.filter(l => l.price <= Number(maxPrice));
    if (maxRate) result = result.filter(l => l.assumableRate <= Number(maxRate));
    if (minBeds) result = result.filter(l => l.beds >= Number(minBeds));
    if (loanType) result = result.filter(l => l.loanType === loanType);

    if (sortBy === 'best_deals') {
      // Best Deals = featured-eligible listings first (bucketed interleave,
      // 2s before 3s, tight gaps), then the rest of the catalog below them.
      // This way the browse page still shows the full inventory — featured
      // homes just float to the top.
      const featured = getFilteredListings(result, {
        minPrice: (minPrice || maxPrice) ? 0 : undefined,
        maxRate: maxRate ? 10 : undefined,
      });
      const featuredIds = new Set(featured.map(l => l.id));
      const rest = result
        .filter(l => !featuredIds.has(l.id))
        .sort((a, b) => b.monthlySavings - a.monthlySavings);
      result = [...featured, ...rest];
    }
    else if (sortBy === 'savings') result.sort((a, b) => calcSavingsVsConventional(b) - calcSavingsVsConventional(a));
    else if (sortBy === 'rate') result.sort((a, b) => a.assumableRate - b.assumableRate);
    else if (sortBy === 'price_asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'newest') result.sort((a, b) => a.daysOnMarket - b.daysOnMarket);

    return result;
  }, [listings, searchQuery, selectedCity, minPrice, maxPrice, maxRate, minBeds, loanType, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setMinPrice('');
    setMaxPrice('');
    setMaxRate('');
    setMinBeds('');
    setLoanType('');
    setPage(1);
  };

  const avgSavings = filtered.length > 0
    ? Math.round(filtered.reduce((s, l) => s + l.monthlySavings, 0) / filtered.length)
    : 0;

  return (
    <>
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Keyword Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search address, city, zip..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light bg-white w-52"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* View Toggle */}
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-brand text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                  viewMode === 'map'
                    ? 'bg-brand text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Map
              </button>
            </div>

            {/* City */}
            <select
              value={selectedCity}
              onChange={e => { setSelectedCity(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light bg-white"
            >
              <option value="">All Cities</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Max Rate */}
            <select
              value={maxRate}
              onChange={e => { setMaxRate(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light bg-white"
            >
              <option value="">Any Rate</option>
              <option value="2">Under 2%</option>
              <option value="3">Under 3%</option>
              <option value="3.5">Under 3.5%</option>
              <option value="4">Under 4%</option>
            </select>

            {/* Min Beds */}
            <select
              value={minBeds}
              onChange={e => { setMinBeds(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light bg-white"
            >
              <option value="">Any Beds</option>
              <option value="1">1+ Beds</option>
              <option value="2">2+ Beds</option>
              <option value="3">3+ Beds</option>
              <option value="4">4+ Beds</option>
            </select>

            {/* Loan Type */}
            <select
              value={loanType}
              onChange={e => { setLoanType(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light bg-white"
            >
              <option value="">All Loan Types</option>
              <option value="FHA">FHA Only</option>
              <option value="VA">VA Only</option>
            </select>

            {/* Price Range */}
            <select
              value={`${minPrice}-${maxPrice}`}
              onChange={e => {
                const [min, max] = e.target.value.split('-');
                setMinPrice(min || '');
                setMaxPrice(max || '');
                setPage(1);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light bg-white"
            >
              <option value="-">Any Price</option>
              <option value="-300000">Under $300K</option>
              <option value="-400000">Under $400K</option>
              <option value="-500000">Under $500K</option>
              <option value="400000-600000">$400K–$600K</option>
              <option value="600000-">$600K+</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light bg-white ml-auto"
            >
              <option value="best_deals">Best Deals</option>
              <option value="savings">Most Savings</option>
              <option value="rate">Lowest Rate</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>

            {(searchQuery || selectedCity || maxRate || minBeds || loanType || minPrice || maxPrice) && (
              <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-500 underline ml-1">
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        <ListingsMap listings={filtered} onGetDetails={handleCardClick} />
      ) : (
        <>
          {/* Results summary */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-gray-600">
                <strong>{filtered.length}</strong> listings found
                {avgSavings > 0 && (
                  <span className="ml-2 text-brand font-medium">
                    · Avg savings: ${avgSavings.toLocaleString()}/mo
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
            </div>
          </div>

          {/* Listings grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            {paginated.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p>No listings match your filters. Try adjusting your search.</p>
                <button onClick={clearFilters} className="mt-3 text-brand underline">Clear all filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {paginated.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onGetDetails={handleCardClick}
                    isSaved={isSaved(listing.id)}
                    onToggleSave={toggleSave}
                    onRequireAuth={() => { setPendingListing(listing); setGateOpen(true); }}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:border-brand-light transition-colors"
                >
                  ← Prev
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    const pageNum = page <= 4
                      ? i + 1
                      : page >= totalPages - 3
                        ? totalPages - 6 + i
                        : page - 3 + i;
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          pageNum === page
                            ? 'bg-brand text-white'
                            : 'border border-gray-200 hover:border-brand-light text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:border-brand-light transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </>
      )}

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
