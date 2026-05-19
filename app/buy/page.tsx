import type { Metadata } from 'next';
import BuyPageClient from './BuyPageClient';

export const metadata: Metadata = {
  title: 'Assumable Mortgage Homes Colorado Springs | Save $700–$1,400/Month',
  description:
    'Buy a home in Colorado Springs at rates as low as 2.5%. Assumable FHA & VA loans  -  save hundreds per month vs today\'s rates. Browse available homes.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Assumable Mortgage Homes Colorado Springs | Save $700–$1,400/Month',
    description:
      'Buy a home in Colorado Springs at rates as low as 2.5%. Assumable FHA & VA loans  -  save hundreds per month vs today\'s rates.',
    type: 'website',
    url: 'https://assumableguy.com/buy',
  },
  alternates: {
    canonical: 'https://assumableguy.com/buy',
  },
};

export default function BuyPage() {
  return <BuyPageClient />;
}
