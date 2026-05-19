import { Metadata } from 'next';
import { allListings, formatPrice } from '../../../lib/listings';
import { getFilteredListings } from '../../../lib/getFilteredListings';
import ThankYouClient from './ThankYouClient';

export const metadata: Metadata = {
  title: "You're In! | The Assumable Guy",
  robots: 'noindex, nofollow',
};

const topListings = getFilteredListings(allListings, { limit: 15 })
  .map(l => ({
    id: l.id,
    city: l.city,
    rate: l.assumableRate,
    monthlySavings: l.monthlySavings,
    price: formatPrice(l.price),
    loanType: l.loanType,
    beds: l.beds,
    baths: l.baths,
    address: l.address,
  }));

export default function ThankYouPage() {
  return <ThankYouClient listings={topListings} />;
}
