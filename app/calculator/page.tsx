import type { Metadata } from 'next';
import CalculatorClient from './CalculatorClient';
import { getMarketRate } from '../../lib/marketRate';

export const metadata: Metadata = {
  title: 'Assumable Mortgage Calculator | The Assumable Guy',
  description:
    'Compare assumable vs conventional mortgages side by side. See monthly savings, lifetime savings, and equity gap financing options. Colorado assumable mortgage experts.',
  keywords:
    'assumable mortgage calculator, mortgage savings calculator, assumable vs conventional, FHA assumable loan calculator, VA assumable mortgage calculator',
  alternates: {
    canonical: 'https://assumableguy.com/calculator',
  },
};

const calculatorFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much can I save with an assumable mortgage?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On a $500,000 loan, assuming a 3.25% interest rate instead of getting a new loan at 6.80% saves $1,084 per month. That is $13,008 per year and approximately $390,000 in total interest over 30 years. Savings vary by property, but typical buyers save between $500 and $1,500 per month compared to current market rates.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the equity gap in an assumable mortgage?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The equity gap is the difference between the home\'s current market value and the remaining loan balance. For example, if a home is worth $450,000 and the assumable loan balance is $350,000, the equity gap is $100,000. Buyers cover this gap with cash, gift funds, a HELOC on another property, or a second mortgage. Most buyers use as little as 5% down on the equity gap with the rest financed through a partner lender.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a blended rate on an assumable mortgage with a second mortgage?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A blended rate is the effective combined interest rate when you have both an assumed first mortgage at a low rate and a second mortgage at a higher rate to cover the equity gap. For example, a $400,000 assumed loan at 2.5% plus a $75,000 second mortgage at 9% results in a blended effective rate of approximately 3.53%. Even with the higher-rate second mortgage, the total monthly payment is still significantly lower than a single new loan at 6.8%.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does an assumable mortgage calculator work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An assumable mortgage calculator compares two scenarios: buying a home with a new conventional mortgage at current market rates versus assuming the seller\'s existing low-rate loan. It calculates monthly principal and interest payments for both options, factors in equity gap financing with a second mortgage, and shows the monthly, annual, and lifetime savings from choosing the assumable option.',
      },
    },
    {
      '@type': 'Question',
      name: 'What interest rates are available on assumable mortgages in Colorado?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Assumable mortgage rates in Colorado range from 0.65% to 5.5%, with an average around 3.38%. The lowest rates are found on VA loans originated during 2020-2021. FHA loans from the same period typically carry rates between 2.5% and 3.5%. There are currently 800+ assumable properties available across Colorado.',
      },
    },
  ],
};

export default async function CalculatorPage() {
  const marketRate = await getMarketRate();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorFaqJsonLd) }}
      />
      <CalculatorClient initialConvRate={marketRate} />
    </>
  );
}
