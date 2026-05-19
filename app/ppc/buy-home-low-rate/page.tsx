import { Metadata } from 'next';
import NewPPCPage from '../NewPPCPage';

export const metadata: Metadata = {
  title: 'Buy a Home at 2-3% Interest Rate | The Assumable Guy',
  description: "Don't settle for 6.8% rates. Buy a Colorado home with an assumable 2-3% mortgage. Real homes. Real low rates. Get matched free today.",
  robots: 'noindex, nofollow',
};

export default function BuyHomeLowRatePPC() {
  return <NewPPCPage variantKey="lowrate" />;
}
