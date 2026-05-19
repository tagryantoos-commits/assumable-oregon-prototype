import { Metadata } from 'next';
import SellerPPCPage from './SellerPPCPage';

export const metadata: Metadata = {
  title: 'Sell Your Home With an Assumable Mortgage | The Assumable Guy',
  description: 'Your 2-3% FHA or VA loan is a competitive advantage. Buyers will pay full price to assume your low rate. Get a free consultation with Colorado\'s assumable mortgage specialists.',
  robots: 'noindex, nofollow',
};

export default function SellAssumableHomePPC() {
  return <SellerPPCPage />;
}
