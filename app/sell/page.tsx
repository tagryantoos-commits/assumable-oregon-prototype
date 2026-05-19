import { Metadata } from 'next';
import SellPageClient from './SellPageClient';

export const metadata: Metadata = {
  title: 'Sell Your Assumable Home for More | The Assumable Guy',
  description: 'Your low-rate mortgage is a selling superpower. Buyers pay more for homes they can assume at 2-4%. List with Colorado\'s #1 assumable mortgage team.',
  openGraph: {
    title: 'List as Assumable. Sell for More.',
    description: 'Buyers who can assume your low-rate mortgage will pay more for your home than buyers who need a new loan at 6.5%+.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://assumableguy.com/sell',
  },
};

const sellFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why should I list my home as assumable?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Listing your home as assumable attracts buyers who are willing to pay a premium for your low interest rate. When a buyer can assume your 3% mortgage instead of getting a new loan at 6.5%+, their monthly payment drops by $500 to $1,500. That savings translates directly into a higher purchase price for your home. Assumable listings also sell 23% faster on average.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which mortgage types can be listed as assumable?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Every FHA and VA loan is eligible for assumption. USDA loans are also assumable with lender approval. Conventional loans (Fannie Mae, Freddie Mac) are generally not assumable due to due-on-sale clauses. If you have an FHA or VA loan with a rate between 2% and 4% from the 2019-2022 era, your mortgage is a major selling asset.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens to my VA entitlement if a buyer assumes my loan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'If the buyer is a veteran and substitutes their own entitlement, you get yours back immediately. If the buyer is not a veteran, your entitlement stays tied to the property until the loan is paid off. However, you retain partial entitlement based on the county loan limit minus the original loan amount. For example, in El Paso County with an $806,500 limit and a $350,000 original loan, you would retain $456,500 in remaining entitlement.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the assumable home selling process work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The process has three steps: First, we list your home highlighting the assumable rate as the headline feature to attract qualified buyers. Second, we match you with buyers from our database who are specifically looking for assumable mortgages. Third, we handle the assumption paperwork, gap financing coordination, and lender approval process. The closing takes 45 to 90 days.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does it cost to sell my home as assumable?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Standard real estate commission applies, paid at closing. There is no upfront cost to the seller. The assumption processor fee is typically around $750 per side or 1% of the purchase price. The premium buyers pay for your low-rate mortgage often more than offsets any additional costs compared to a traditional sale.',
      },
    },
  ],
};

export default function SellPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sellFaqJsonLd) }}
      />
      <SellPageClient />
    </>
  );
}
