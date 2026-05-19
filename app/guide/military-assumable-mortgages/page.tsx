import type { Metadata } from 'next';
import Link from 'next/link';
import LeadCaptureForm from '../../../components/LeadCaptureForm';
import { allListings, formatPrice } from '../../../lib/listings';

export const metadata: Metadata = {
  title: 'Assumable Mortgages for Military Families in Colorado Springs | The Assumable Guy',
  description:
    'Fort Carson and Colorado Springs military families: save $500-$1,500/mo by assuming a VA loan at 2-3% instead of today\'s 6%+ rates. Complete guide from Colorado\'s assumable mortgage experts.',
  keywords:
    'military assumable mortgage, VA loan assumption, Fort Carson housing, Colorado Springs military, PCS move Colorado, VA assumable mortgage military, veteran home buying',
  openGraph: {
    title: 'Assumable Mortgages for Military Families in Colorado Springs',
    description:
      'Fort Carson and Colorado Springs military families: save $500-$1,500/mo by assuming a VA loan at 2-3% instead of today\'s 6%+ rates.',
    url: 'https://assumableguy.com/guide/military-assumable-mortgages',
    type: 'article',
    images: [{ url: 'https://assumableguy.com/ryan-headshot.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Assumable Mortgages for Military Families in Colorado Springs',
    description:
      'Save $500-$1,500/mo by assuming a VA loan at 2-3% instead of today\'s 6%+ rates.',
    images: ['https://assumableguy.com/ryan-headshot.png'],
  },
  alternates: {
    canonical: 'https://assumableguy.com/guide/military-assumable-mortgages',
  },
};

const tocItems = [
  { id: 'military-advantage', label: 'Why Military Families Have a Unique Advantage' },
  { id: 'va-assumptions-explained', label: 'VA Loan Assumptions Explained' },
  { id: 'math-buyers', label: 'The Math for Military Buyers' },
  { id: 'math-sellers', label: 'The Math for Military Sellers' },
  { id: 'fort-carson-listings', label: 'Fort Carson Area Listings' },
  { id: 'process', label: 'The Process (Step by Step)' },
  { id: 'non-veteran-buyers', label: 'Non-Veteran Buyers: Yes, You Can Assume a VA Loan' },
  { id: 'faq', label: 'FAQ' },
];

const militaryFaqs = [
  {
    q: 'Can I assume a VA loan if I\'m PCSing to Fort Carson?',
    a: 'Absolutely. If you\'re PCSing to Fort Carson, Peterson, or Schriever, you can assume an existing VA loan in the Colorado Springs area. If you\'re a veteran, you can substitute your own entitlement, which frees up the seller\'s entitlement immediately. If you\'re not a veteran, you can still assume the loan  -  the seller just needs to agree.',
  },
  {
    q: 'What happens to the seller\'s VA entitlement when I assume their loan?',
    a: 'If the buyer is a veteran and substitutes their own entitlement, the seller gets theirs back immediately and can use it for their next home. If the buyer is not a veteran, the seller\'s entitlement stays tied to the property until the loan is paid off or refinanced. However, most sellers still have remaining entitlement based on the county loan limit minus their original loan amount.',
  },
  {
    q: 'How long does a VA loan assumption take during a PCS move?',
    a: 'The assumption process takes 45-90 days on average. We recommend starting the process as soon as you get PCS orders. Some servicers can close in 30 days. Using an assumption processor  -  which we include on every deal  -  keeps the timeline tight.',
  },
  {
    q: 'Do I need a VA funding fee when assuming a VA loan?',
    a: 'Yes, there is a VA funding fee of 0.5% of the loan balance on assumptions. That\'s significantly less than the 1.25-3.3% funding fee on a new VA loan. On a $400K loan, that\'s $2,000 vs. $5,000-$13,200. Disabled veterans are exempt from the funding fee entirely.',
  },
  {
    q: 'Can my spouse assume a VA loan if I\'m deployed?',
    a: 'Yes. A spouse can assume a VA loan with proper power of attorney documentation. We\'ve helped several families close assumptions while the service member was deployed. The process requires some extra paperwork but is absolutely doable.',
  },
  {
    q: 'What if I already have a VA loan on another property?',
    a: 'You may still have enough remaining entitlement to assume another VA loan, depending on the loan amounts and county limits. For El Paso County with an $806,500 limit, if your existing VA loan is $350K, you have roughly $456,500 in remaining entitlement. We can run the numbers for your specific situation.',
  },
];

const militaryFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: militaryFaqs.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
};

export default function MilitaryAssumableMortgagesPage() {
  // Filter Colorado Springs VA listings, sort by lowest rate, take top 5
  const csVaListings = allListings
    .filter(l => l.city.toLowerCase().includes('colorado springs') && l.loanType.toLowerCase().includes('va'))
    .sort((a, b) => a.assumableRate - b.assumableRate)
    .slice(0, 5);

  return (
    <div>
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(militaryFaqJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-brand-light text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            Military Families Guide, Updated for 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-6">
            Assumable Mortgages for <span className="text-brand-light">Military Families</span> in Colorado Springs
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Fort Carson, Peterson, Schriever  -  if you&apos;re PCSing to the Springs or stationed here already, your next home might come with a 2-3% rate attached. Here&apos;s how.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Table of Contents */}
        <nav className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-12">
          <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">In This Guide</h2>
          <ol className="space-y-2">
            {tocItems.map((item, i) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-brand hover:text-brand-dark text-sm font-medium flex items-center gap-2">
                  <span className="text-gray-400 text-xs w-5">{i + 1}.</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Why Military Families Have a Unique Advantage */}
        <section id="military-advantage" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Why Military Families Have a Unique Advantage</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              I&apos;ve closed over 90 assumption deals in Colorado, and military families are consistently the best-positioned buyers in this market. Here&apos;s why.
            </p>
            <p>
              <strong>PCS creates constant turnover.</strong> Fort Carson alone has roughly 25,000 active-duty soldiers, plus Peterson Space Force Base and Schriever Space Force Base. Every year, thousands of families get orders and need to sell. Many of those homes have VA loans originated in 2019-2022 at rates between 2.25% and 3.5%. When those families PCS out, those low-rate loans become available to you.
            </p>
            <p>
              <strong>Every VA loan is eligible for assumption.</strong> It&apos;s written into the loan documents. The VA actually sent a circular to lenders in 2023 reminding them they must process assumptions or risk losing their ability to service VA loans. The government is on your side here.
            </p>
            <p>
              Colorado Springs is one of the highest-concentration military markets in the country. That means more VA loans, more PCS turnover, and more assumable inventory than almost anywhere else. We maintain the largest list of <Link href="/homes" className="text-brand font-semibold hover:underline">assumable properties in Colorado</Link>, and the Springs consistently has the most VA listings.
            </p>
            <p>
              Whether you&apos;re an E-5 PCSing to Carson or an O-4 at Peterson, the math works the same way: assume a 2.75% VA loan instead of getting a new one at 6.5%, and you&apos;ll save $500-$1,500 every single month. That&apos;s BAH money that stays in your pocket.
            </p>
          </div>
        </section>

        {/* VA Loan Assumptions Explained */}
        <section id="va-assumptions-explained" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">VA Loan Assumptions Explained</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              A <Link href="/guide/assumable-mortgages" className="text-brand font-semibold hover:underline">VA loan assumption</Link> lets you take over the seller&apos;s existing VA mortgage  -  same balance, same interest rate, same terms. The loan is legally transferred into your name through the lender&apos;s full approval process. This is not subject-to. It&apos;s fully legal and lender-approved.
            </p>
            <p>
              <strong>How entitlement works:</strong> This is the part that confuses people, so let me break it down clearly.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 my-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="text-green-600 font-black text-lg mb-2">Veteran Buyer</div>
                <p className="text-gray-600 text-sm">
                  If you&apos;re a veteran or active duty, you can substitute your own VA entitlement. The seller gets their entitlement back immediately and can use it for their next home at the new duty station. This is the cleanest scenario and the easiest sell for VA sellers.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="text-blue-600 font-black text-lg mb-2">Non-Veteran Buyer</div>
                <p className="text-gray-600 text-sm">
                  Non-veterans can absolutely assume VA loans. The seller&apos;s entitlement stays tied to the property until the loan is paid off. But most sellers still have remaining entitlement  -  in El Paso County with an $806,500 limit, a $400K original loan leaves $406,500 in remaining entitlement.
                </p>
              </div>
            </div>
            <p>
              <strong>No PMI. Ever.</strong> VA assumptions carry no private mortgage insurance. On a $450K loan, that alone saves you $200-$400/month compared to an FHA or conventional loan.
            </p>
            <p>
              The VA funding fee on an assumption is just 0.5% of the loan balance  -  far less than the 1.25-3.3% on a new VA loan origination. Disabled veterans are exempt entirely.
            </p>
            <p>
              <Link href="/blog/va-loan-assumption-process-colorado" className="text-brand font-semibold hover:underline">Full VA assumption process in Colorado →</Link>
              {' · '}
              <Link href="/blog/can-non-veterans-assume-va-loans" className="text-brand font-semibold hover:underline">Can non-veterans assume VA loans? →</Link>
            </p>
          </div>
        </section>

        {/* The Math for Military Buyers */}
        <section id="math-buyers" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">The Math for Military Buyers</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              Let me show you what this looks like with real numbers. Take a $450,000 home near Fort Carson with a VA loan originated in 2021 at 2.75%.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden my-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-6 py-4 font-semibold"></th>
                  <th className="text-center px-6 py-4 font-semibold text-slate-400">New Conventional @ 6.5%</th>
                  <th className="text-center px-6 py-4 font-semibold text-brand-light">Assumed VA @ 2.75%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-3 font-medium text-gray-700">Loan Amount</td>
                  <td className="px-6 py-3 text-center text-gray-700">$427,500</td>
                  <td className="px-6 py-3 text-center text-gray-700">$410,000</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-700">Monthly P&amp;I</td>
                  <td className="px-6 py-3 text-center text-slate-600 font-bold">$2,703</td>
                  <td className="px-6 py-3 text-center text-brand font-bold">$1,674</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-medium text-gray-700">Monthly Savings</td>
                  <td className="px-6 py-3 text-center text-gray-400">--</td>
                  <td className="px-6 py-3 text-center text-green-600 font-bold">$1,029</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-700">Annual Savings</td>
                  <td className="px-6 py-3 text-center text-gray-400">--</td>
                  <td className="px-6 py-3 text-center text-green-600 font-bold">$12,348</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-medium text-gray-700">PMI / MIP</td>
                  <td className="px-6 py-3 text-center text-slate-600 font-bold">$200-$350/mo</td>
                  <td className="px-6 py-3 text-center text-green-600 font-bold">$0</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-700">30-Year Interest Savings</td>
                  <td className="px-6 py-3 text-center text-gray-400">--</td>
                  <td className="px-6 py-3 text-center text-green-600 font-black text-lg">~$330,000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              That&apos;s over $1,000/month back in your pocket. For an E-6 with a BAH of around $2,100 in Colorado Springs, that&apos;s the difference between your housing allowance barely covering your mortgage and having $1,000+ left over every month.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>The equity gap:</strong> On this example, the remaining loan balance is $410K on a $450K home  -  that&apos;s a $40K equity gap. Many military families cover this with savings, gift funds, or our partner lender&apos;s second mortgage program (as little as 5% down on the gap). <Link href="/blog/assumable-mortgage-equity-gap-colorado" className="text-brand font-semibold hover:underline">Learn more about the equity gap →</Link>
            </div>
            <p>
              <Link href="/blog/va-loan-assumption-benefits-colorado-springs-military-buyers" className="text-brand font-semibold hover:underline">See the full math for military buyers →</Link>
              {' · '}
              <Link href="/blog/assumable-mortgage-vs-conventional-math-2026" className="text-brand font-semibold hover:underline">Assumable vs conventional in 2026 →</Link>
            </p>
          </div>
        </section>

        {/* The Math for Military Sellers */}
        <section id="math-sellers" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">The Math for Military Sellers</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              If you&apos;re PCSing out of the Springs and sitting on a 2-3% VA loan, your low rate is a weapon. Here&apos;s why.
            </p>
            <p>
              <strong>Your rate attracts more buyers.</strong> When you list your home as assumable, you&apos;re not just selling a house  -  you&apos;re selling a 2.75% mortgage. In a market where everyone else is paying 6.5%+, that&apos;s a massive differentiator. We consistently see assumable listings get more showings, faster offers, and higher sale prices than comparable non-assumable homes.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-6">
              <h3 className="font-bold text-gray-900 mb-3">Seller Example:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Your home&apos;s value</span>
                  <span className="font-bold">$450,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your VA loan balance (2.75%)</span>
                  <span className="font-bold">$410,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Buyer&apos;s monthly savings vs. new loan</span>
                  <span className="font-bold text-green-600">$1,029/mo</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                  <span className="text-gray-600">Buyer&apos;s lifetime savings</span>
                  <span className="font-black text-brand">~$330,000</span>
                </div>
              </div>
            </div>
            <p>
              That $330K in lifetime savings creates a buyer willing to pay full asking price  -  or even above. We&apos;ve seen assumable properties sell at a premium because the rate is worth more than any concession.
            </p>
            <p>
              For veterans with entitlement concerns: if the buyer is also a veteran and substitutes their entitlement, yours is freed up immediately for your next duty station purchase. And if the buyer is non-veteran, you likely still have remaining entitlement available.
            </p>
            <p>
              <Link href="/blog/fort-carson-military-homeowners-sell-assumable-va-loan" className="text-brand font-semibold hover:underline">Guide for Fort Carson sellers →</Link>
            </p>
          </div>
        </section>

        {/* Fort Carson Area Listings */}
        <section id="fort-carson-listings" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Fort Carson Area VA Listings</h2>
          <p className="text-gray-700 mb-6">
            Here are some of the lowest-rate VA assumable listings in the Colorado Springs area right now. These update daily from our full inventory.
          </p>
          {csVaListings.length > 0 ? (
            <div className="space-y-4 mb-6">
              {csVaListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/homes/${listing.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-brand hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-gray-900">{listing.address}</div>
                      <div className="text-gray-500 text-sm">{listing.city}, {listing.state} {listing.zip} · {listing.beds}bd / {listing.baths}ba · {listing.sqft.toLocaleString()} sqft</div>
                    </div>
                    <div className="text-right">
                      <div className="text-brand font-black text-lg">{listing.assumableRate}% rate</div>
                      <div className="text-gray-600 text-sm">{formatPrice(listing.price)} · Save {formatPrice(listing.monthlySavings)}/mo</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center mb-6">
              <p className="text-gray-600">No VA listings in Colorado Springs at the moment. Check back soon  -  inventory changes daily.</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/homes"
              className="inline-block bg-brand text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors text-center"
            >
              Browse All Listings →
            </Link>
            <Link
              href="/colorado-springs"
              className="inline-block bg-gray-100 text-gray-800 font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors text-center"
            >
              Colorado Springs Page →
            </Link>
          </div>
        </section>

        {/* The Process */}
        <section id="process" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">The Process (Step by Step)</h2>
          <p className="text-gray-700 mb-6">
            The assumption process takes 45-90 days. A bit longer than a traditional closing, but our team handles the heavy lifting. Here&apos;s the timeline:
          </p>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Get PCS Orders (or Decide to Buy)', desc: 'As soon as you know you\'re coming to the Springs  -  or if you\'re already stationed here and renting  -  reach out. We\'ll send you the full list of assumable VA properties in the area and start narrowing down options.' },
              { step: 2, title: 'Pre-Qualification', desc: 'Soft credit pull that won\'t impact your score. We look at income (including BAH), credit history, and your equity gap coverage plan. Pre-qual is good for about 6 months.' },
              { step: 3, title: 'Find Your Home and Make an Offer', desc: 'We help you identify the best assumable VA listings near your base. Offers on assumables specify assumption financing instead of a new loan. I recommend full-price offers  -  the seller is giving up their rate.' },
              { step: 4, title: 'Assumption Application', desc: 'You apply with the seller\'s current loan servicer. Our assumption processor handles all communication with the bank, tracks documents, and keeps the timeline moving. This is the part where most people without a specialist get stuck.' },
              { step: 5, title: 'Underwriting and Approval', desc: 'The bank reviews your financials  -  credit, income verification, DTI ratio. They\'ll ask for paperwork you\'ve already sent them. It gets repetitive. Stay on top of it and let our processor push things along.' },
              { step: 6, title: 'Closing', desc: 'Title transfers, funds are disbursed, you get the keys. The loan is now in your name at the original rate and terms. If you\'re a veteran who substituted entitlement, the seller\'s entitlement is freed up the same day.' },
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {s.step}
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6 text-sm text-blue-800">
            <strong>Deployed or TDY?</strong> We&apos;ve helped families close assumptions while the service member was deployed. Power of attorney, remote signing, video walkthroughs  -  we make it work. Don&apos;t let a deployment stop you from locking in a sub-3% rate.
          </div>
        </section>

        {/* Non-Veteran Buyers */}
        <section id="non-veteran-buyers" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Non-Veteran Buyers: Yes, You Can Assume a VA Loan</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              This is one of the biggest misconceptions I run into. <strong>You do not need to be a veteran to assume a VA loan.</strong> The VA explicitly allows it. Any creditworthy buyer can assume a VA mortgage with the seller&apos;s agreement.
            </p>
            <p>
              About 10-20% of VA sellers are open to non-veteran assumptions. We call these &quot;hand raisers&quot; and maintain a private list of them across the Colorado Front Range. The key hesitation for sellers is entitlement  -  their entitlement stays tied to the property if the buyer doesn&apos;t substitute their own. But as I explained above, most sellers still have remaining entitlement available.
            </p>
            <p>
              Non-veteran buyers still get no PMI on the assumed VA loan. Same rate. Same terms. The only difference is the 0.5% funding fee on the assumption (veterans who are disabled may be exempt) and the entitlement dynamic with the seller.
            </p>
            <p>
              If you&apos;re a military spouse, a civilian working near a base, or anyone else  -  don&apos;t count yourself out. Some of our best deals have been non-veteran assumptions on VA loans with rates in the low 2s.
            </p>
            <p>
              <Link href="/blog/can-non-veterans-assume-va-loans" className="text-brand font-semibold hover:underline">Full guide: Can non-veterans assume VA loans? →</Link>
              {' · '}
              <Link href="/blog/va-assumable-mortgage-colorado-springs-military-buyers" className="text-brand font-semibold hover:underline">VA assumable mortgages for Colorado Springs buyers →</Link>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {militaryFaqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-200 pb-6">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-brand-dark to-brand rounded-3xl p-8 md:p-12 text-white text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">PCSing to the Springs? Let&apos;s Find Your Rate.</h2>
          <p className="text-gray-200 mb-4 max-w-lg mx-auto">
            We&apos;ve helped dozens of military families assume VA loans at 2-3%. Colorado&apos;s only team built exclusively around assumable mortgages.
          </p>
          <p className="text-white font-bold text-lg mb-6">
            Call or text: (719) 624-3472
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/homes"
              className="inline-block bg-white text-brand font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Browse Listings →
            </Link>
            <Link
              href="/calculator"
              className="inline-block bg-white/10 border border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors"
            >
              Run the Calculator
            </Link>
          </div>
        </section>

        {/* Lead Form */}
        <section className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-200">
          <LeadCaptureForm
            title="Get the Colorado Springs Military Assumable List"
            subtitle="VA listings near Fort Carson, Peterson, and Schriever. Updated daily."
            source="guide-military-assumable-mortgages"
          />
        </section>
      </div>
    </div>
  );
}
