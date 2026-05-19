import type { Metadata } from 'next';
import Link from 'next/link';
import LeadCaptureForm from '../../components/LeadCaptureForm';

export const metadata: Metadata = {
  title: 'VA Assumable Mortgages in Colorado | Military Families | The Assumable Guy',
  description:
    'Military families near Fort Carson, Peterson SFB, Schriever SFB, and Buckley SFB: assume a VA loan at 2-3% rates. Non-veterans can assume VA loans too. Browse 800+ Colorado listings.',
  keywords:
    'VA assumable mortgage Colorado, assume VA loan, Fort Carson assumable homes, VA loan assumption, military assumable mortgage, Peterson SFB homes, VA entitlement assumption',
  openGraph: {
    title: 'VA Assumable Mortgages in Colorado | The Assumable Guy',
    description:
      'Assume a VA loan at 2-3% rates. Non-veterans welcome. 90+ closings completed across Colorado.',
    url: 'https://assumableguy.com/va-loans',
    type: 'website',
  },
  alternates: {
    canonical: 'https://assumableguy.com/va-loans',
  },
};

const bases = [
  {
    name: 'Fort Carson',
    location: 'Colorado Springs',
    description:
      'The biggest military installation on the Front Range. PCS moves create a steady flow of VA sellers looking for qualified assumption buyers. We track every assumable listing near post.',
    listings: '200+',
  },
  {
    name: 'Peterson SFB',
    location: 'Colorado Springs',
    description:
      'Space Force and NORAD families PCSing out often prefer assumptions over traditional sales. Faster closings, no appraisal drama, and the buyer gets a killer rate.',
    listings: '150+',
  },
  {
    name: 'Schriever SFB',
    location: 'Colorado Springs',
    description:
      'Space operations personnel rotate frequently. Many bought at 2-3% rates in 2020-2022 and are open to assumption offers when PCS orders come through.',
    listings: '80+',
  },
  {
    name: 'Buckley SFB',
    location: 'Aurora',
    description:
      'Aurora and the surrounding Denver metro area have hundreds of VA loans from the low-rate era. Buckley families moving out are prime assumption candidates.',
    listings: '120+',
  },
];

const faqs = [
  {
    q: 'Can non-veterans assume VA loans?',
    a: 'Yes. VA loans are assumable by anyone, veteran or not. The seller\'s VA entitlement stays with the property until the loan is paid off or the buyer (if they\'re a veteran) substitutes their own entitlement. About 10-20% of VA sellers say yes to non-veteran assumptions.',
  },
  {
    q: 'What is the equity gap and how do I cover it?',
    a: 'The equity gap is the difference between the home\'s value and the remaining loan balance. If a home is worth $500K and the loan balance is $400K, you need to cover $100K. Options: cash, gift funds, HELOC on another property, or a second mortgage through our partner lender (as little as 5% down on the gap).',
  },
  {
    q: 'How long does a VA assumption take?',
    a: 'Plan for 45-90 days. Some servicers can close in 30. It\'s longer than a traditional purchase, but the rate savings more than make up for the wait. We use assumption processors who know how to push things through efficiently.',
  },
  {
    q: 'Does the seller lose their VA entitlement?',
    a: 'It depends. If the buyer is a veteran and substitutes their entitlement, the seller gets theirs back immediately. If the buyer is not a veteran, the seller\'s entitlement stays tied to the property until the loan is paid off. But the seller retains partial entitlement based on the county loan limit minus the original loan amount.',
  },
  {
    q: 'Is there a credit score minimum for VA assumptions?',
    a: 'There\'s no hard minimum credit score. The lender looks at the reason behind your score, not just the number. Late payments from a medical emergency are treated differently than chronic overspending. A soft credit pull during pre-qualification won\'t impact your score.',
  },
  {
    q: 'What are the closing costs?',
    a: 'Expect $5,000 to $10,000 in closing costs, plus the assumption processor fee (around $750 per side or 1% of purchase price). Still far less than what you\'d pay in extra interest on a 6.5%+ conventional loan.',
  },
  {
    q: 'Do I need to live in the home?',
    a: 'If the seller leaves their VA entitlement with the property and you\'re not substituting your own, there\'s no VA occupancy requirement for you. You could use it as an investment property immediately. If you\'re a veteran substituting entitlement, you need to move in within 60 days.',
  },
];

const vaFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    ...faqs.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
    {
      '@type': 'Question',
      name: 'What is a VA assumable mortgage?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A VA assumable mortgage allows a buyer to take over a veteran seller\'s existing VA loan balance, terms, and interest rate with lender approval. Every VA loan is assumable by law. Non-veterans can assume VA loans too  -  the buyer does not need to be a veteran. The loan is legally transferred into the buyer\'s name through the lender\'s full approval process.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much can I save by assuming a VA loan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On a $500,000 VA loan at 3.25%, the monthly payment is $2,176. A new loan at 6.80% on the same amount would cost $3,260 per month. That is $1,084 per month in savings, $13,008 per year, and approximately $390,000 over the life of the loan. VA assumptions also have no PMI, saving an additional $200 to $400 per month.',
      },
    },
  ],
};

export default function VALoansPage() {
  return (
    <div>
      {/* FAQ Schema for AEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vaFaqJsonLd) }}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-blue-950 to-brand-dark text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-light rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-light rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-brand-light text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                VA Assumable Loans in Colorado
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-6">
                Military Families: Assume a VA Loan at <span className="text-brand-light">2-3% Rates</span>
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                VA loans are assumable by law. That means a buyer can take over the seller&apos;s loan balance, terms, and interest rate. The lender is involved the entire time. It&apos;s fully legal, fully above board, and it saves buyers $800 to $1,200 per month compared to today&apos;s rates.
              </p>

              {/* Savings callout */}
              <div className="bg-white/10 border border-white/20 rounded-2xl p-5 mb-8">
                <div className="text-xs font-semibold text-brand-light uppercase tracking-widest mb-3">
                  The $500K VA Loan Example
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-500/20 rounded-xl p-3 text-center border border-red-400/20">
                    <div className="text-xs text-red-300 mb-1">New Loan @ 6.80%</div>
                    <div className="text-2xl font-black text-white">$3,260</div>
                    <div className="text-xs text-gray-400">/month</div>
                  </div>
                  <div className="bg-brand/30 rounded-xl p-3 text-center border border-brand/30">
                    <div className="text-xs text-brand-light mb-1">Assumed VA @ 3.25%</div>
                    <div className="text-2xl font-black text-brand-light">$2,176</div>
                    <div className="text-xs text-gray-400">/month</div>
                  </div>
                </div>
                <div className="text-center mt-3 text-white font-bold">
                  You save <span className="text-green-400 text-xl">$1,084/month</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-sm text-gray-300">
                  <span className="text-green-400">✓</span> 90+ Closings
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-300">
                  <span className="text-green-400">✓</span> $25M+ Buyer Savings
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-300">
                  <span className="text-green-400">✓</span> Licensed CO Agent
                </div>
              </div>
            </div>

            {/* Lead Form */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl" id="get-started">
              <LeadCaptureForm
                title="Get VA Assumable Listings"
                subtitle="We track every VA assumable near Colorado military bases"
                source="va-loans-page"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The VA Advantage */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">The VA Advantage</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              <strong>A VA assumable mortgage allows a buyer  -  veteran or non-veteran  -  to take over a seller&apos;s existing VA home loan, including the interest rate, remaining balance, and loan terms, with lender approval.</strong> Every VA loan written in the last several decades is assumable by law. It&apos;s baked into the loan documents. Non-veterans can assume VA loans too  -  no military service is required for the buyer.
            </p>
            <p>
              About 10-20% of VA sellers are open to letting a non-veteran buyer assume their loan. We call them &quot;hand raisers.&quot; We maintain a private list of these sellers across the Colorado Front Range. You won&apos;t find this on Zillow.
            </p>
            <p>
              VA assumptions come with some serious perks beyond the rate. No PMI, ever. That alone saves $200 to $400 per month on a typical Colorado home. Rates on our current VA inventory go as low as 2.25%. And the lender is involved the whole way, so everything stays clean and legal. This is not &quot;subject-to.&quot;
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-brand-50 rounded-xl p-5 text-center border border-brand-100">
              <div className="text-3xl font-black text-brand">$0</div>
              <div className="text-sm text-gray-600 mt-1">PMI. Ever.</div>
            </div>
            <div className="bg-brand-50 rounded-xl p-5 text-center border border-brand-100">
              <div className="text-3xl font-black text-brand">2.25%</div>
              <div className="text-sm text-gray-600 mt-1">Lowest VA Rate in Inventory</div>
            </div>
            <div className="bg-brand-50 rounded-xl p-5 text-center border border-brand-100">
              <div className="text-3xl font-black text-brand">10-20%</div>
              <div className="text-sm text-gray-600 mt-1">VA Sellers Open to Non-Vets</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Math */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Run the Numbers</h2>
          <p className="text-gray-600 mb-8">
            Let me show you what it looks like on a $500K home. Same property, two completely different financial outcomes.
          </p>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-6 py-4 font-semibold"></th>
                  <th className="text-center px-6 py-4 font-semibold text-red-300">New Loan @ 6.80%</th>
                  <th className="text-center px-6 py-4 font-semibold text-brand-light">VA Assumed @ 3.25%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-3 font-medium text-gray-700">Monthly Payment (P&amp;I)</td>
                  <td className="px-6 py-3 text-center text-red-600 font-bold">$3,260</td>
                  <td className="px-6 py-3 text-center text-brand font-bold">$2,176</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-700">Monthly Savings</td>
                  <td className="px-6 py-3 text-center text-gray-400">baseline</td>
                  <td className="px-6 py-3 text-center text-green-600 font-bold">$1,084/mo</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-medium text-gray-700">Annual Savings</td>
                  <td className="px-6 py-3 text-center text-gray-400">baseline</td>
                  <td className="px-6 py-3 text-center text-green-600 font-bold">$13,008/yr</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-700">First 5 Years Interest</td>
                  <td className="px-6 py-3 text-center text-red-600 font-bold">$165,000</td>
                  <td className="px-6 py-3 text-center text-brand font-bold">$77,000</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-medium text-gray-700">Lifetime Interest Savings</td>
                  <td className="px-6 py-3 text-center text-gray-400">baseline</td>
                  <td className="px-6 py-3 text-center text-green-600 font-black text-lg">~$390,000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            What would you do with an extra $13K a year? <Link href="/calculator" className="text-brand font-semibold hover:underline">Run your own numbers with our calculator</Link>.
          </p>
        </div>
      </section>

      {/* Colorado Military Bases */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Colorado Military Bases</h2>
          <p className="text-gray-600 mb-8">
            PCS sellers are prime assumption candidates. They bought at 2-3% rates, they&apos;re moving on orders, and many would rather have a smooth assumption close than deal with traditional sale headaches. We track every assumable listing near these installations.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {bases.map((base) => (
              <div key={base.name} className="bg-gray-50 rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{base.name}</h3>
                    <div className="text-sm text-brand font-medium">{base.location}</div>
                  </div>
                  <div className="bg-brand-50 text-brand text-xs font-bold px-3 py-1 rounded-full border border-brand-200">
                    {base.listings} nearby
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{base.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VA Entitlement Explained */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">VA Entitlement: What Happens to the Seller&apos;s?</h2>
          <div className="space-y-6 text-gray-700">
            <p>
              This is the part that confuses a lot of people (and a lot of agents, if I&apos;m being real). So let me break it down simply.
            </p>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Scenario 1: Buyer is a Veteran</h3>
              <p className="text-sm leading-relaxed">
                If the buyer has their own VA entitlement, they can substitute it for the seller&apos;s. The seller gets their entitlement back immediately. Clean swap. The buyer now has a VA loan in their name at the original rate. Both parties walk away happy.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Scenario 2: Buyer is Not a Veteran</h3>
              <p className="text-sm leading-relaxed">
                The seller&apos;s entitlement stays tied to the property until the loan is paid off. But the seller doesn&apos;t lose all their buying power. VA entitlement is based on county loan limits. Example: El Paso County limit is $806,500. If the original loan was $350K, the seller retains $456,500 in remaining entitlement. Enough for another purchase.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">One-Time Restoration</h3>
              <p className="text-sm leading-relaxed">
                Veterans also have a one-time restoration option. If the assumed loan gets paid off (buyer refinances or sells), the seller can apply for a one-time entitlement restoration. This is separate from the substitution path and gives sellers another way to get their full entitlement back.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Don&apos;t get too bogged down in this. We walk every seller and buyer through the entitlement math during the process. <Link href="/sell" className="text-brand font-semibold hover:underline">Sellers: learn more about your options</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Real Buyers. Real Savings.</h2>
            <p className="text-gray-400 mt-2 text-sm">Here&apos;s what our clients are doing with VA assumable mortgages</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <p className="text-white text-sm leading-relaxed mb-4">
                &ldquo;Jeremy put $15K down on a $385K home at 2.65%. His payment is $943/month less than his neighbor who bought the same month at market rate.&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div className="text-gray-400 text-xs">Fort Carson Area Buyer</div>
                <div className="bg-brand/20 text-brand-light font-bold text-xs px-3 py-1.5 rounded-full border border-brand/30">
                  $943/mo saved
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <p className="text-white text-sm leading-relaxed mb-4">
                &ldquo;Non-veteran, assumed a VA loan in Colorado Springs. $18K down on a $420K home. 2.99% rate. I asked Ryan: is this real? It really is.&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div className="text-gray-400 text-xs">Civilian Buyer, VA Assumption</div>
                <div className="bg-brand/20 text-brand-light font-bold text-xs px-3 py-1.5 rounded-full border border-brand/30">
                  $812/mo saved
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <p className="text-white text-sm leading-relaxed mb-4">
                &ldquo;First-time buyer on a $65K salary. Assumed a VA loan in Colorado Springs. Payment is under market from day one. I didn&apos;t think I could afford a house out here.&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div className="text-gray-400 text-xs">First-Time Buyer</div>
                <div className="bg-brand/20 text-brand-light font-bold text-xs px-3 py-1.5 rounded-full border border-brand/30">
                  $700+/mo saved
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">VA Assumption FAQ</h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-200 pb-6">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-8">
            Got more questions? <Link href="/blog" className="text-brand font-semibold hover:underline">Read our blog</Link> or <Link href="/guide/assumable-mortgages" className="text-brand font-semibold hover:underline">check out the full assumable mortgage guide</Link>.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-br from-gray-900 via-blue-950 to-brand-dark">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to Assume a VA Loan?</h2>
            <p className="text-gray-300">
              Fill out the form and Ryan Thomson will personally reach out with VA assumable listings near your base.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl">
            <LeadCaptureForm
              title="Get VA Listings Near Your Base"
              subtitle="Updated daily. We respond within minutes."
              source="va-loans-page-bottom"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
