import type { Metadata } from 'next';
import Link from 'next/link';
import LeadCaptureForm from '../../../components/LeadCaptureForm';
import { allListings, formatPrice } from '../../../lib/listings';

export const metadata: Metadata = {
  title: 'Assumable Mortgages for Real Estate Investors in Colorado | The Assumable Guy',
  description:
    'Lock in 2-3% rates on investment properties through assumable mortgages. Cash flow analysis, equity gap strategies, and live Colorado listings for investors.',
  keywords:
    'assumable mortgage investment property, investor assumable mortgage, rental property assumable loan, cash flow assumable mortgage, real estate investing Colorado, sub-3% rate investment property',
  openGraph: {
    title: 'Assumable Mortgages for Real Estate Investors in Colorado',
    description:
      'Lock in 2-3% rates on investment properties through assumable mortgages. Cash flow analysis, equity gap strategies, and live Colorado listings.',
    url: 'https://assumableguy.com/guide/investor-assumable-mortgages',
    type: 'article',
    images: [{ url: 'https://assumableguy.com/ryan-headshot.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Assumable Mortgages for Real Estate Investors in Colorado',
    description:
      'Lock in 2-3% rates on investment properties. Cash flow analysis and live Colorado listings.',
    images: ['https://assumableguy.com/ryan-headshot.png'],
  },
  alternates: {
    canonical: 'https://assumableguy.com/guide/investor-assumable-mortgages',
  },
};

const tocItems = [
  { id: 'why-investors', label: 'Why Investors Are Sleeping on Assumable Mortgages' },
  { id: 'cash-flow-math', label: 'The Cash Flow Math' },
  { id: 'equity-gap-strategy', label: 'The Equity Gap Strategy for Investors' },
  { id: 'best-markets', label: 'Which Markets Have the Best Deals' },
  { id: 'fha-vs-va', label: 'FHA vs VA for Investors' },
  { id: 'finding-properties', label: 'Finding Assumable Investment Properties' },
  { id: 'live-listings', label: 'Live Colorado Listings for Investors' },
  { id: 'faq', label: 'FAQ' },
];

const investorFaqs = [
  {
    q: 'Can I assume a mortgage on a rental property?',
    a: 'Yes. If you assume a VA loan where the seller leaves their entitlement, there is no owner-occupancy requirement for you. FHA loans require owner-occupancy for at least one year  -  after that, you can rent it out. This makes FHA assumptions a great house-hack entry point: live in it for a year, then convert it to a rental with a sub-3% rate locked in.',
  },
  {
    q: 'How does an assumable mortgage affect my cash flow vs. a new investment loan?',
    a: 'The difference is massive. On a $400K property, a 2.5% assumed rate gives you a P&I payment of $1,580/mo. A new investment loan at 7.5% on the same amount is $2,797/mo. That\'s $1,217/mo in cash flow difference. With Colorado Springs rents averaging $1,800-$2,200, the assumed rate turns a break-even property into a strong cash-flowing asset.',
  },
  {
    q: 'What\'s the minimum down payment for assuming an investment property?',
    a: 'The "down payment" on an assumption is the equity gap  -  the difference between the home\'s value and the remaining loan balance. Some properties have equity gaps as low as $15K-$25K. You can cover this with cash, a HELOC from your existing portfolio, or a second mortgage through our partner lender with as little as 5% down on the gap.',
  },
  {
    q: 'Can I use a 1031 exchange with an assumable mortgage?',
    a: 'Yes. You can combine a 1031 exchange with an assumption. The exchange funds cover part or all of the equity gap, and you assume the existing low-rate loan. This lets you defer capital gains taxes while locking in a sub-3% rate on your replacement property. It\'s one of the most powerful strategies in our playbook.',
  },
  {
    q: 'How many assumable properties can I buy?',
    a: 'There\'s no hard limit on how many assumptions you can do. FHA has a 100-mile rule (you can\'t have two FHA loans within 100 miles), but you can mix FHA and VA assumptions across your portfolio. We have investors who\'ve assumed multiple properties at different rate tiers.',
  },
  {
    q: 'What are the risks of assuming a mortgage as an investor?',
    a: 'The main risks are the equity gap (you need capital or financing to bridge it), the 45-90 day timeline (longer than conventional closings), and the limited inventory (not every property has an assumable loan). The interest rate risk is essentially eliminated  -  you\'re locking in a rate that may never be available again. We help you evaluate each deal to ensure the numbers work.',
  },
];

const investorFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: investorFaqs.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
};

export default function InvestorAssumableMortgagesPage() {
  // All Colorado listings sorted by lowest rate, top 5
  const investorListings = [...allListings]
    .sort((a, b) => a.assumableRate - b.assumableRate)
    .slice(0, 5);

  return (
    <div>
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(investorFaqJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-brand-light text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            Investor Guide, Updated for 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-6">
            Assumable Mortgages for <span className="text-brand-light">Real Estate Investors</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            New investment loans are 7-8%. Existing assumable loans are 2-3%. The cash flow difference is staggering. Here&apos;s how smart investors are locking in rates that may never come back.
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

        {/* Why Investors Are Sleeping on Assumable Mortgages */}
        <section id="why-investors" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Why Investors Are Sleeping on Assumable Mortgages</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              I talk to real estate investors every week who are sitting on the sidelines because the numbers don&apos;t work at today&apos;s rates. A new investment property loan is running 7-8% right now. At that rate, most Colorado rentals barely break even  -  if they cash flow at all.
            </p>
            <p>
              Meanwhile, there are thousands of homes across Colorado with existing FHA and VA loans at 2-3%. <strong>Every FHA and VA loan is eligible for assumption. It&apos;s written into their loan docs.</strong> These aren&apos;t expired programs or loopholes. They&apos;re a feature of government-backed lending that most investors have never heard of.
            </p>
            <p>
              The difference in cash flow between a 2.5% assumed rate and a 7.5% new investment loan on a $400K property is over $1,200/month. That&apos;s the difference between a negative cash flow headache and a property that throws off $500+ every month after all expenses.
            </p>
            <p>
              We&apos;ve closed over 90 <Link href="/guide/assumable-mortgages" className="text-brand font-semibold hover:underline">assumption deals</Link> in Colorado. Investors are a growing share of our buyers because the math is simply too good to ignore. The window won&apos;t last forever  -  as these low-rate loans get paid down, refinanced, or sold traditionally, the inventory shrinks.
            </p>
          </div>
        </section>

        {/* The Cash Flow Math */}
        <section id="cash-flow-math" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">The Cash Flow Math</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              Let&apos;s run the numbers on a real scenario. Take a $400,000 rental property in Colorado Springs with a 2.5% FHA loan originated in 2021. Market rent is $2,000/month.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden my-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-6 py-4 font-semibold"></th>
                  <th className="text-center px-6 py-4 font-semibold text-slate-400">New Investment Loan @ 7.5%</th>
                  <th className="text-center px-6 py-4 font-semibold text-brand-light">Assumed FHA @ 2.5%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-3 font-medium text-gray-700">Loan Amount</td>
                  <td className="px-6 py-3 text-center text-gray-700">$320,000 (80% LTV)</td>
                  <td className="px-6 py-3 text-center text-gray-700">$365,000</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-700">Monthly P&amp;I</td>
                  <td className="px-6 py-3 text-center text-slate-600 font-bold">$2,238</td>
                  <td className="px-6 py-3 text-center text-brand font-bold">$1,442</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-medium text-gray-700">Taxes + Insurance + HOA</td>
                  <td className="px-6 py-3 text-center text-gray-700">$450</td>
                  <td className="px-6 py-3 text-center text-gray-700">$450</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-700">Total Monthly Cost</td>
                  <td className="px-6 py-3 text-center text-slate-600 font-bold">$2,688</td>
                  <td className="px-6 py-3 text-center text-brand font-bold">$1,892</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-medium text-gray-700">Rental Income</td>
                  <td className="px-6 py-3 text-center text-gray-700">$2,000</td>
                  <td className="px-6 py-3 text-center text-gray-700">$2,000</td>
                </tr>
                <tr className="bg-green-50">
                  <td className="px-6 py-3 font-medium text-gray-900">Monthly Cash Flow</td>
                  <td className="px-6 py-3 text-center text-slate-600 font-black text-lg">-$688</td>
                  <td className="px-6 py-3 text-center text-green-600 font-black text-lg">+$108</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              That&apos;s an $800/month swing. The new investment loan property <em>loses</em> nearly $700/month. The assumed property cash flows positive from day one. Factor in vacancy reserves and maintenance, and the assumed property still holds up. The 7.5% loan property is a money pit.
            </p>
            <p>
              And this doesn&apos;t even account for principal paydown, appreciation, or the tax benefits. At a 2.5% rate, a much larger portion of each payment goes toward principal versus interest, so you&apos;re building equity faster too.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>Colorado Springs rents:</strong> Single-family homes in the Springs are renting for $1,800-$2,200/month depending on size, location, and condition. Areas near Fort Carson, the west side, and Briargate consistently perform well. With an assumed 2-3% rate, most of these properties cash flow.
            </div>
          </div>
        </section>

        {/* The Equity Gap Strategy for Investors */}
        <section id="equity-gap-strategy" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">The Equity Gap Strategy for Investors</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              The <Link href="/blog/assumable-mortgage-equity-gap-colorado" className="text-brand font-semibold hover:underline">equity gap</Link>  -  the difference between the home&apos;s value and the remaining loan balance  -  is the main barrier for investors. But experienced investors have multiple tools to bridge it.
            </p>
            <h3 className="font-bold text-gray-900 text-lg mt-6 mb-3">Strategy 1: HELOC from Your Existing Portfolio</h3>
            <p>
              If you own other properties with equity, a HELOC at 8-9% on an existing property can fund the equity gap. Even at 9%, your blended rate across both loans is dramatically lower than a new 7.5% investment loan. And HELOCs have no prepayment penalty  -  pay it off as fast as you want.
            </p>
            <h3 className="font-bold text-gray-900 text-lg mt-6 mb-3">Strategy 2: Second Mortgage / Gap Loan</h3>
            <p>
              Our partner lenders offer second mortgages specifically designed for assumption equity gaps. Put as little as 5% down on the gap, and they finance the rest. Yes, the second mortgage rate is higher (8-10%), but the blended effective rate on the combined debt still beats a new investment loan by a wide margin.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-6">
              <h3 className="font-bold text-gray-900 mb-3">Blended Rate Example:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Assumed loan: $365K at 2.5%</span>
                  <span className="font-bold">$1,442/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gap loan: $30K at 9%</span>
                  <span className="font-bold">$241/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash to close: $5K</span>
                  <span></span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                  <span className="font-semibold text-gray-900">Total monthly</span>
                  <span className="font-black text-brand">$1,683/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Blended effective rate</span>
                  <span className="font-black text-brand">~3.0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New investment loan: $320K at 7.5%</span>
                  <span className="font-bold text-slate-600">$2,238/mo</span>
                </div>
              </div>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mt-6 mb-3">Strategy 3: 1031 Exchange + Assumption</h3>
            <p>
              Selling an appreciated investment property? Use 1031 exchange proceeds to cover the equity gap on an assumption. You defer your capital gains taxes <em>and</em> lock in a sub-3% rate on the replacement property. This is one of the most powerful wealth-building combos in real estate right now.
            </p>
            <h3 className="font-bold text-gray-900 text-lg mt-6 mb-3">Strategy 4: Seller Financing for the Gap</h3>
            <p>
              Some sellers  -  especially those PCSing and eager to close  -  will carry a note for part of the equity gap. The terms are negotiable. We&apos;ve structured seller-financed gap notes at 5-7% with 3-5 year balloons. It&apos;s not common, but when it works, your blended rate is even lower.
            </p>
          </div>
        </section>

        {/* Which Markets Have the Best Deals */}
        <section id="best-markets" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Which Markets Have the Best Deals</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              Not every Colorado market is created equal for assumable investing. Here&apos;s where we&apos;re seeing the most opportunity:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 my-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="text-green-600 font-black text-lg mb-2">Colorado Springs</div>
                <p className="text-gray-600 text-sm">
                  Highest concentration of VA loans thanks to Fort Carson, Peterson, and Schriever. Strong rental market ($1,800-$2,200/mo). More assumable inventory than any other Colorado market. <Link href="/colorado-springs" className="text-brand font-semibold hover:underline">See Colorado Springs listings →</Link>
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="text-green-600 font-black text-lg mb-2">Denver Metro</div>
                <p className="text-gray-600 text-sm">
                  Higher price points but also higher rents. FHA loans dominate the assumable inventory here. Good for investors targeting the $350K-$500K range with strong appreciation potential. <Link href="/denver" className="text-brand font-semibold hover:underline">See Denver listings →</Link>
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="text-blue-600 font-black text-lg mb-2">Fort Collins / Loveland</div>
                <p className="text-gray-600 text-sm">
                  College town rental demand plus growing tech sector. Smaller assumable inventory but the deals that do come up tend to have manageable equity gaps and solid rent-to-price ratios.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="text-blue-600 font-black text-lg mb-2">Pueblo</div>
                <p className="text-gray-600 text-sm">
                  Lowest price points in the state. Many properties under $300K with assumed rates in the 2s. Smaller equity gaps. Rents are lower ($1,200-$1,600/mo) but the entry cost is significantly less.
                </p>
              </div>
            </div>
            <p>
              We track <Link href="/homes" className="text-brand font-semibold hover:underline">every assumable listing across Colorado</Link>  -  over 800 active properties, updated daily. You can filter by city, loan type, rate, and equity gap to find the deals that match your investment criteria.
            </p>
          </div>
        </section>

        {/* FHA vs VA for Investors */}
        <section id="fha-vs-va" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">FHA vs VA for Investors</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              Both FHA and VA loans are assumable, but they have different rules that matter for investors. Let me break it down.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 my-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-brand font-black text-lg mb-2">FHA Assumptions</div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold mt-0.5">+</span>
                  <span>More inventory  -  FHA is the most common assumable loan type</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold mt-0.5">+</span>
                  <span>~90% acceptance rate when offers are competitive</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold mt-0.5">+</span>
                  <span>No seller entitlement concerns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">-</span>
                  <span><strong>Must owner-occupy for 1 year</strong>  -  then convert to rental (house hack path)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">-</span>
                  <span>Mortgage insurance (MIP) carries over from original loan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">-</span>
                  <span>100-mile rule: can&apos;t have two FHA loans within 100 miles</span>
                </li>
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-brand font-black text-lg mb-2">VA Assumptions</div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold mt-0.5">+</span>
                  <span><strong>No PMI</strong>  -  saves $200-$400/mo on a typical loan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold mt-0.5">+</span>
                  <span>Some of the lowest rates in our inventory (as low as 2.25%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold mt-0.5">+</span>
                  <span>Non-veterans can assume  -  no occupancy requirement for the buyer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">-</span>
                  <span>Seller must agree (entitlement concerns)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">-</span>
                  <span>Only 10-20% of VA sellers are open to non-veteran assumptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">-</span>
                  <span>0.5% VA funding fee on the assumption</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              <strong>For investors:</strong> If you&apos;re willing to live in the property for a year, FHA assumptions are the easiest path. Move in, assume the 2.5% loan, then convert to a rental after 12 months. You now have a cash-flowing rental with a rate most investors can only dream about.
            </p>
            <p>
              If you want a pure investment from day one with no occupancy requirement, target VA assumptions where the seller agrees to a non-veteran buyer. These are harder to find, but that&apos;s why you work with us  -  we maintain a list of VA &quot;hand raisers&quot; and can connect you directly.
            </p>
          </div>
        </section>

        {/* Finding Assumable Investment Properties */}
        <section id="finding-properties" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Finding Assumable Investment Properties</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              Here&apos;s what I tell investors to look for when evaluating an assumable property as a rental:
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold mt-0.5">1.</span>
                <span><strong>Low rate (sub-3.5%).</strong> The lower the rate, the more cash flow headroom you have. Our <Link href="/homes" className="text-brand font-semibold hover:underline">listings page</Link> lets you sort by rate.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold mt-0.5">2.</span>
                <span><strong>Manageable equity gap.</strong> Properties where the seller hasn&apos;t been in the home long (2-4 years) tend to have smaller gaps. Look for gaps under $50K if you&apos;re starting out.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold mt-0.5">3.</span>
                <span><strong>Strong rent-to-price ratio.</strong> Target properties where monthly rent is at least 0.5% of the purchase price. In Colorado Springs, that&apos;s achievable on homes under $400K.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold mt-0.5">4.</span>
                <span><strong>Good rental neighborhoods.</strong> Areas near bases, schools, and major employers have strong tenant demand. The west side of the Springs, Fountain, and Security-Widefield are solid markets.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold mt-0.5">5.</span>
                <span><strong>Loan type alignment.</strong> FHA if you&apos;ll house-hack, VA if you want a pure investment. Know which path you&apos;re taking before making offers.</span>
              </li>
            </ul>
            <p className="mt-4">
              <Link href="/blog/assumable-mortgage-real-estate-investor-colorado" className="text-brand font-semibold hover:underline">Full investor guide: buying assumable properties in Colorado →</Link>
            </p>
          </div>
        </section>

        {/* Live Colorado Listings for Investors */}
        <section id="live-listings" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Live Colorado Listings for Investors</h2>
          <p className="text-gray-700 mb-6">
            Here are the five lowest-rate assumable listings in Colorado right now. These update daily from our full inventory. Sort by rate to find the best cash flow opportunities.
          </p>
          {investorListings.length > 0 ? (
            <div className="space-y-4 mb-6">
              {investorListings.map((listing) => (
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
              <p className="text-gray-600">No listings available at the moment. Check back soon  -  inventory changes daily.</p>
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
              href="/calculator"
              className="inline-block bg-gray-100 text-gray-800 font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors text-center"
            >
              Run the Cash Flow Calculator →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {investorFaqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-200 pb-6">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-brand-dark to-brand rounded-3xl p-8 md:p-12 text-white text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Lock In a Sub-3% Rate on Your Next Investment?</h2>
          <p className="text-gray-200 mb-4 max-w-lg mx-auto">
            We&apos;ve helped investors assume properties across Colorado at rates that make the numbers actually work. Let&apos;s run yours.
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
            title="Get the Investor Assumable List"
            subtitle="800+ Colorado listings sorted by rate and cash flow potential. Updated daily."
            source="guide-investor-assumable-mortgages"
          />
        </section>
      </div>
    </div>
  );
}
