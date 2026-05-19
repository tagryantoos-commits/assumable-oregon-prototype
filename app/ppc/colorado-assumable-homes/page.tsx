import { Metadata } from 'next';
import PPCPage from '../PPCPage';

export const metadata: Metadata = {
  title: 'Colorado Homes With 2-3% Interest Rates Available Now | The Assumable Guy',
  description: '800+ Colorado homes with assumable 2-3% mortgages. Colorado Springs, Denver, Aurora, Parker. Save $900+/month. Get your free list today.',
  robots: 'noindex, nofollow',
};

export default function ColoradoAssumableHomesPPC() {
  return (
    <PPCPage
      headline="Colorado Homes With 2-3% Interest Rates Available Now"
      subheadline="Over 800 active Colorado listings with assumable mortgages at 2-4%. Colorado Springs, Denver, Aurora, Parker, Castle Rock. Updated daily."
      badge="📍 Colorado-Specific. 800+ Listings."
      formSource="ppc_colorado_assumable_homes"
      formTitle="Get the Full Colorado List"
      formSubtitle="800+ Colorado assumable listings with full loan details. Free, no obligation. We respond within minutes."
      heroVariant="geo"
      benefits={[
        { icon: '📍', title: '800+ Colorado Listings', desc: 'The most comprehensive database of assumable mortgage homes in Colorado. Verified rates, updated daily. CS, Denver, Aurora, Parker & more.' },
        { icon: '💰', title: 'Save $900-$1,100/Month', desc: 'On a $500K home: 3.25% = $2,176/mo. 6.80% = $3,260/mo. You save $1,084 every single month just by assuming the existing loan.' },
        { icon: '🏙️', title: 'Every Major Colorado Market', desc: 'Colorado Springs, Denver Metro, Aurora, Parker, Littleton, Castle Rock, Fountain, Monument, Pueblo. We cover the whole Front Range.' },
        { icon: '🤝', title: 'Local Expert, Fast Response', desc: 'Ryan Thomson is a licensed Colorado agent who specializes exclusively in assumable mortgages. We\'ve closed 90+ of these deals.' },
      ]}
      testimonials={[
        { quote: 'We were searching in Colorado Springs and had no idea about assumable loans. The Assumable Guy sent us a list of 47 homes in our budget, all under 3.5%. We closed 60 days later.', tag: '$812/mo saved', label: 'Couple, Colorado Springs' },
        { quote: 'Denver market is brutal. Found a Parker home at 2.75% through this team. Payment is $943 less than the identical house next door that sold at market rate.', tag: '$943/mo saved', label: 'Buyer, Parker CO' },
        { quote: 'Ryan knew every assumable listing in Aurora better than anyone. Fast, responsive, and actually delivered what he promised.', tag: '$750+/mo saved', label: 'Buyer, Aurora CO' },
      ]}
      cities={['Colorado Springs', 'Denver', 'Aurora', 'Parker', 'Littleton', 'Castle Rock', 'Fountain', 'Monument', 'Pueblo']}
    />
  );
}
