import listingsData from '../public/data/listings.json';

export interface Listing {
  id: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  assumableRate: number;
  remainingLoanBalance: number;
  assumableMonthlyPayment: number;
  marketMonthlyPayment: number;
  monthlySavings: number;
  estimatedEquityGap: number;
  cashToClose: number;
  loanType: string;
  beds: number;
  baths: number;
  sqft: number;
  annualTaxes: number;
  hoa: number;
  photoUrls: string[];
  description: string;
  daysOnMarket: number;
  sourceUrl: string;
  latitude: number;
  longitude: number;
  sourceMls?: string;
  listingAgentName?: string;
  listingOfficeName?: string;
}

export const allListings: Listing[] = listingsData as Listing[];

export function getListingById(id: string): Listing | undefined {
  return allListings.find(l => l.id === id || l.slug === id);
}

export function getListingsByCity(city: string): Listing[] {
  return allListings.filter(l => l.city.toLowerCase() === city.toLowerCase());
}

export function getCities(): string[] {
  const cities = [...new Set(allListings.map(l => l.city))];
  return cities.sort();
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export function formatPrice(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export function calcMonthlyPayment(principal: number, ratePct: number, years = 30): number {
  if (!principal || !ratePct || ratePct <= 0) return 0;
  const r = ratePct / 100 / 12;
  const n = years * 12;
  return Math.round(principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

export function getPhotoUrl(listing: Listing, index = 0): string {
  if (listing.photoUrls && listing.photoUrls.length > index) {
    return listing.photoUrls[index];
  }
  // Fallback placeholder based on city
  return `https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80`;
}

export const MARKET_RATE = 6.9;
export const CONVENTIONAL_RATE = 6.5;
export const CONVENTIONAL_DOWN_PCT = 0.05;

export function calcConventionalMonthly(listPrice: number): number {
  const loanAmount = listPrice * (1 - CONVENTIONAL_DOWN_PCT);
  return calcMonthlyPayment(loanAmount, CONVENTIONAL_RATE);
}

export function calcSavingsVsConventional(listing: Listing): number {
  const conventional = calcConventionalMonthly(listing.price);
  return Math.max(0, conventional - listing.assumableMonthlyPayment);
}

export function sortListingsDefault(listings: Listing[]): Listing[] {
  // Rates in the 2s and 3s (< 4%) float to top, then sort by smallest equity gap within each tier
  return [...listings].sort((a, b) => {
    const aTier = a.assumableRate < 4.0 ? 0 : 1;
    const bTier = b.assumableRate < 4.0 ? 0 : 1;
    if (aTier !== bTier) return aTier - bTier;
    return a.estimatedEquityGap - b.estimatedEquityGap;
  });
}

export const STATS = {
  totalClosings: 100,
  lifetimeSavings: 48000000,
  avgMonthlySavings: 748,
  activeListings: allListings.length,
};
