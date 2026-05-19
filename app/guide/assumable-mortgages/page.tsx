import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'The Complete Guide to Assumable Mortgages (2026) | The Assumable Guy',
  description:
    'Everything you need to know about assumable mortgages: FHA, VA, USDA loans, how the process works, the equity gap, timeline, pros and cons. 3000+ word guide from Colorado\'s assumable mortgage experts.',
  keywords:
    'assumable mortgage, what is an assumable mortgage, assumable mortgage guide, how do assumable mortgages work, FHA assumable loan, VA assumable mortgage, USDA assumable loan, assumable mortgage 2026',
  openGraph: {
    title: 'The Complete Guide to Assumable Mortgages (2026)',
    description:
      'Everything you need to know about assuming a mortgage in 2026. FHA, VA, USDA loans explained. From Colorado\'s only team built exclusively around assumable mortgages.',
    url: 'https://assumableguy.com/guide/assumable-mortgages',
    type: 'article',
  },
};

const tocItems = [
  { id: 'what-is', label: 'What is an Assumable Mortgage?' },
  { id: 'which-loans', label: 'Which Loans Are Assumable?' },
  { id: 'how-it-works', label: 'How the Process Works' },
  { id: 'equity-gap', label: 'The Equity Gap Explained' },
  { id: 'the-math', label: 'The Math' },
  { id: 'fha-assumptions', label: 'FHA Assumptions' },
  { id: 'va-assumptions', label: 'VA Assumptions' },
  { id: 'pros-and-cons', label: 'Pros and Cons' },
  { id: 'faq', label: 'FAQ' },
];

const guideFaqs = [
  {
    q: 'What is an assumable mortgage?',
    a: 'An assumable mortgage allows a buyer to take over the seller\'s existing loan balance, terms, and interest rate with lender approval. The loan is legally transferred into the buyer\'s name. FHA, VA, and USDA loans are all assumable by law. Conventional loans generally are not assumable due to due-on-sale clauses.',
  },
  {
    q: 'Which loans are assumable?',
    a: 'Every FHA loan, every VA loan, and every USDA loan is eligible for assumption. These are government-backed loans with assumability written directly into the loan documents. Conventional loans (Fannie Mae, Freddie Mac) have a due-on-sale clause and are generally not assumable.',
  },
  {
    q: 'What is the equity gap in an assumable mortgage?',
    a: 'The equity gap is the difference between the home\'s current value and the remaining loan balance. For example, if a home is worth $500,000 and the loan balance is $400,000, the equity gap is $100,000. Buyers cover this with cash, gift funds, a HELOC, or a second mortgage. Most buyers use a combination of 5% down and a second mortgage through a partner lender.',
  },
  {
    q: 'How much can I save with an assumable mortgage?',
    a: 'On a $500,000 loan, assuming a 3.25% rate instead of getting a new loan at 6.80% saves $1,084 per month, $13,008 per year, and approximately $390,000 in lifetime interest. Actual savings vary by property, but typical buyers save $500 to $1,500 per month.',
  },
  {
    q: 'How long does the assumable mortgage process take?',
    a: 'The assumption process takes 45 to 90 days on average, a bit longer than a traditional closing. Some loan servicers can close in as few as 30 days. Using an assumption processor  -  a third-party specialist who manages the lender paperwork  -  significantly speeds up the timeline.',
  },
  {
    q: 'Do I need to be a veteran to assume a VA loan?',
    a: 'No. Non-veterans can assume VA loans. The seller\'s VA entitlement stays with the property until the loan is paid off or a veteran buyer substitutes their own entitlement. About 10-20% of VA sellers agree to non-veteran assumptions.',
  },
  {
    q: 'Is an assumable mortgage the same as subject-to?',
    a: 'No. An assumable mortgage goes through the lender\'s full approval process and the loan is legally transferred into the buyer\'s name. Subject-to means taking over payments without lender approval  -  the loan stays in the seller\'s name, and the lender can call it due if they find out. Assumptions are fully legal and lender-approved.',
  },
  {
    q: 'What credit score do I need for an assumable mortgage?',
    a: 'FHA assumptions typically require a credit score of 580 or higher, the same as originating an FHA loan. VA assumptions have no hard minimum credit score  -  lenders look at the story behind the score rather than just the number.',
  },
];

const guideFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: guideFaqs.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
};

export default function AssumableMortgageGuidePage() {
  return (
    <div>
      {/* FAQ Schema for AEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideFaqJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-brand-light text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            Complete Guide, Updated for 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-6">
            The Complete Guide to <span className="text-brand-light">Assumable Mortgages</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            How to take over a seller&apos;s 2-3% mortgage instead of getting a new loan at 6.5%+. Everything from the basics to the closing table.
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

        {/* What is an Assumable Mortgage? */}
        <section id="what-is" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">What is an Assumable Mortgage?</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              <strong>An assumable mortgage is a type of home loan that allows a buyer to take over the seller&apos;s existing mortgage balance, interest rate, and remaining loan terms with lender approval.</strong> Instead of originating a new mortgage at current market rates, the buyer steps into the seller&apos;s existing loan. The loan is legally transferred into the buyer&apos;s name through the lender&apos;s full underwriting and approval process.
            </p>
            <p>
              Every FHA loan, every VA loan, and every USDA loan is eligible for assumption  -  assumability is written directly into these government-backed loan documents. Conventional loans (Fannie Mae, Freddie Mac) are generally not assumable due to due-on-sale clauses.
            </p>
            <p>
              An assumable mortgage lets the seller of a property transfer the loan balance, terms, and interest rate into the buyer&apos;s name. The lender is involved in the entire process. This is a fully legal, lender-approved transaction.
            </p>
            <p>
              That&apos;s the key distinction from &quot;subject-to&quot; deals, where you take over payments without telling the lender and hope nobody notices. Assumable mortgages go through the lender&apos;s full approval process. The loan ends up in the buyer&apos;s name. Clean, legal, and you keep your peace of mind.
            </p>
            <p>
              So why does this matter right now? Because millions of homeowners locked in rates between 2% and 4% during 2019-2022. With rates sitting around 6.5% to 7% today, those old loans are worth a fortune. Instead of getting a new loan at today&apos;s rates, you can step into the seller&apos;s shoes and take over their 2-3% rate.
            </p>
            <p>
              Mortgage rates have been declining for 40 years before the recent spike. Assumable mortgages were popular in the 1980s when rates hit 16%. Then rates kept falling, assumables became irrelevant, and everyone forgot about them. Like Blockbuster or frosted tips. But they&apos;ve always been there, written into certain loan documents. They&apos;ve just been waiting for the comeback tour.
            </p>
          </div>
        </section>

        {/* Which Loans Are Assumable? */}
        <section id="which-loans" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Which Loans Are Assumable?</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed mb-6">
            <p>
              Not every mortgage is assumable. Conventional loans (Fannie Mae, Freddie Mac) have a &quot;due-on-sale&quot; clause that lets the lender demand full payoff when the property transfers. So those are out.
            </p>
            <p>
              Government-backed loans are a different story. The assumability is written directly into the loan documents.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="text-green-600 font-black text-lg mb-1">FHA Loans</div>
              <div className="text-green-700 text-xs font-semibold mb-2">ASSUMABLE</div>
              <p className="text-gray-600 text-sm">
                All FHA loans are assumable. They make up the majority of assumption transactions. Acceptance rate is around 90% when the offer is competitive and there are no competing offers.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="text-green-600 font-black text-lg mb-1">VA Loans</div>
              <div className="text-green-700 text-xs font-semibold mb-2">ASSUMABLE</div>
              <p className="text-gray-600 text-sm">
                All VA loans are assumable, and non-veterans can assume them. About 10-20% of VA sellers are open to non-vet assumptions. <Link href="/va-loans" className="text-brand font-semibold hover:underline">Full VA guide here</Link>.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="text-green-600 font-black text-lg mb-1">USDA Loans</div>
              <div className="text-green-700 text-xs font-semibold mb-2">ASSUMABLE</div>
              <p className="text-gray-600 text-sm">
                USDA loans are assumable with lender approval. Less common than FHA and VA but the same concept applies. Buyer must meet USDA eligibility requirements.
              </p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="text-slate-600 font-black text-lg mb-1">Conventional Loans</div>
            <div className="text-red-700 text-xs font-semibold mb-2">NOT ASSUMABLE</div>
            <p className="text-gray-600 text-sm">
              Conventional loans have a due-on-sale clause. The lender can call the full loan balance due when ownership transfers. There are narrow exceptions (death, divorce, transfer to a trust), but for practical purposes, conventional loans aren&apos;t assumable.
            </p>
          </div>
        </section>

        {/* How the Process Works */}
        <section id="how-it-works" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">How the Process Works</h2>
          <p className="text-gray-700 mb-6">
            The process takes 45-90 days on average. A little longer than a normal closing, but well worth it for the rate savings. Some servicers can do it in 30 days. Here&apos;s the typical flow:
          </p>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Find an Assumable Listing', desc: 'We maintain a list of 800+ assumable properties across Colorado, updated daily. You can also browse our listings at assumableguy.com/homes. We flag which ones are FHA, VA, or USDA, and which VA sellers are open to non-veteran buyers.' },
              { step: 2, title: 'Get Pre-Qualified', desc: 'Soft credit pull (won\'t impact your score). We look at income, credit history, and the equity gap coverage plan. Pre-qual is good for about 6 months.' },
              { step: 3, title: 'Make an Offer', desc: 'We submit a purchase agreement just like a traditional sale. The difference is the financing contingency specifies assumption instead of a new loan. I recommend full-price offers on assumables. The seller is giving up a lot (their rate, their entitlement on VA loans). Going in low is short-sighted.' },
              { step: 4, title: 'Assumption Application', desc: 'The buyer applies with the seller\'s current loan servicer. This is where an assumption processor is critical. These third-party mediators know how to give the bank what they need and keep things moving. I don\'t do any of these without them.' },
              { step: 5, title: 'Underwriting and Approval', desc: 'The bank reviews the buyer\'s financials. Credit, income verification, the usual. The bank will ask for paperwork over and over. Things you\'ve already given them. It gets a little annoying, but stay on top of it.' },
              { step: 6, title: 'Closing', desc: 'Once approved, you close just like a traditional purchase. Title transfer, funds disbursed, keys handed over. The loan is now in the buyer\'s name at the original rate and terms.' },
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
            <strong>About the banks:</strong> The banks are adding friction to this process on purpose. They&apos;ve got a 2% interest rate loan on their books. If they make it difficult for you to assume it, that home gets sold the traditional way, the loan comes off their books, and they can reloan that money at 6.5%+. They&apos;d much rather do that. That&apos;s why assumption processors are worth every penny.
          </div>
          <p className="text-gray-700 text-sm mt-4">
            <Link href="/blog/how-long-does-assumption-process-take" className="text-brand font-semibold hover:underline">How long does the assumption process really take? →</Link>
          </p>
        </section>

        {/* The Equity Gap Explained */}
        <section id="equity-gap" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">The Equity Gap Explained</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              <strong>The equity gap is the difference between a home&apos;s current market value and the remaining assumable loan balance.</strong> It represents the seller&apos;s equity in the property and is the amount the buyer must cover at closing. Buyers typically cover the equity gap with cash savings, gift funds, a HELOC on another property, or a second mortgage. Most buyers put as little as 5% down on the equity gap and finance the rest through a partner lender.
            </p>
            <p>
              In other words, the equity gap is basically the equity the seller has in the property. And that&apos;s what you need to bring to the table.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-6">
              <h3 className="font-bold text-gray-900 mb-3">Example:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Home Value</span>
                  <span className="font-bold">$525,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining Loan Balance</span>
                  <span className="font-bold">$500,000</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                  <span className="text-gray-900 font-semibold">Equity Gap (what you bring)</span>
                  <span className="font-black text-brand">$25,000</span>
                </div>
              </div>
            </div>
            <p>
              $25K on a $525K home. That&apos;s less than 5% down. Not bad.
            </p>
            <p>
              But equity gaps vary. Some properties have $20K gaps. Others have $150K. It depends on how much the seller has paid down and how much the home has appreciated.
            </p>
            <h3 className="font-bold text-gray-900 text-lg mt-6 mb-3">How to Cover the Equity Gap</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold mt-0.5">1.</span>
                <span><strong>Cash savings.</strong> The simplest route if you&apos;ve got it.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold mt-0.5">2.</span>
                <span><strong>Gift from family or friends.</strong> FHA allows gift funds for the gap.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold mt-0.5">3.</span>
                <span><strong>HELOC on another property.</strong> Lower rate than a personal loan.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold mt-0.5">4.</span>
                <span><strong>Loan from a retirement account.</strong> You&apos;re borrowing from yourself.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold mt-0.5">5.</span>
                <span><strong>Second mortgage through our partner lender.</strong> Put 5% down on the gap, the lender covers the rest up to 80-90% LTV. This is the most common option our buyers use.</span>
              </li>
            </ul>
            <p className="mt-4">
              <Link href="/calculator" className="text-brand font-semibold hover:underline">Use our calculator</Link> to model different equity gap scenarios and see your blended rate with a second mortgage.
            </p>
            <p className="mt-2">
              <Link href="/blog/assumable-mortgage-equity-gap-colorado" className="text-brand font-semibold hover:underline">Deep dive: understanding the equity gap →</Link>
            </p>
          </div>
        </section>

        {/* The Math */}
        <section id="the-math" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">The Math</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              <strong>On a $500,000 loan, a 3.25% assumed rate results in a monthly payment of $2,176. The same loan at today&apos;s 6.80% rate costs $3,260 per month  -  a difference of $1,084 every month, $13,008 per year, and approximately $390,000 in total interest savings over 30 years.</strong>
            </p>
            <p>
              Let me show you what this looks like with real numbers. $500K loan, 3.25% assumed rate vs. 6.80% new conventional loan.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden my-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-6 py-4 font-semibold"></th>
                  <th className="text-center px-6 py-4 font-semibold text-slate-400">New @ 6.80%</th>
                  <th className="text-center px-6 py-4 font-semibold text-brand-light">Assumed @ 3.25%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-3 font-medium text-gray-700">Monthly P&amp;I</td>
                  <td className="px-6 py-3 text-center text-slate-600 font-bold">$3,260</td>
                  <td className="px-6 py-3 text-center text-brand font-bold">$2,176</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-700">Monthly Savings</td>
                  <td className="px-6 py-3 text-center text-gray-400">--</td>
                  <td className="px-6 py-3 text-center text-green-600 font-bold">$1,084</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-medium text-gray-700">Annual Savings</td>
                  <td className="px-6 py-3 text-center text-gray-400">--</td>
                  <td className="px-6 py-3 text-center text-green-600 font-bold">$13,008</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-700">5-Year Interest Paid</td>
                  <td className="px-6 py-3 text-center text-slate-600 font-bold">~$165,000</td>
                  <td className="px-6 py-3 text-center text-brand font-bold">~$77,000</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-medium text-gray-700">Lifetime Interest Savings</td>
                  <td className="px-6 py-3 text-center text-gray-400">--</td>
                  <td className="px-6 py-3 text-center text-green-600 font-black text-lg">~$390,000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              $390,000 less interest paid over 30 years. That&apos;s not a rounding error. That&apos;s a life-changing number.
            </p>
            <h3 className="font-bold text-gray-900 text-lg mt-6 mb-3">The Blended Rate (Even With a Second Mortgage)</h3>
            <p>
              People say &quot;well that second mortgage is going to be like 8% to 10%.&quot; Yeah, but let&apos;s run the numbers.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">$500K home, $400K loan at 2.5%</span><span className="font-bold">$1,580/mo</span></div>
                <div className="flex justify-between"><span className="text-gray-600">$75K second mortgage at 9%</span><span className="font-bold">$603/mo</span></div>
                <div className="flex justify-between"><span className="text-gray-600">$25K cash to close</span><span></span></div>
                <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                  <span className="font-semibold text-gray-900">Total monthly payment</span>
                  <span className="font-black text-brand">$2,184/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Blended effective rate</span>
                  <span className="font-black text-brand">3.53%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New $475K loan at 6.80%</span>
                  <span className="font-bold text-slate-600">$3,100+/mo</span>
                </div>
              </div>
            </div>
            <p>
              Even with that 9% second mortgage, you&apos;re saving $900+/month. And there&apos;s no prepayment penalty on second mortgages, so you can pay it off early.
            </p>
            <p>
              <Link href="/blog/assumable-mortgage-vs-conventional-math-2026" className="text-brand font-semibold hover:underline">See the full math comparison: assumable vs conventional in 2026 →</Link>
            </p>
            <p>
              <Link href="/calculator" className="text-brand font-semibold hover:underline">Model your own scenario with our calculator →</Link>
            </p>
          </div>
        </section>

        {/* FHA Assumptions */}
        <section id="fha-assumptions" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">FHA Assumptions</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              FHA loans are the bread and butter of the assumption world. They make up the majority of our closings. Here&apos;s what you need to know.
            </p>
            <p>
              The buyer needs to meet FHA credit and income requirements. That means a credit check, income verification, and debt-to-income analysis. No surprises there. The acceptance rate on FHA assumptions is around 90% when the offer is competitive and there are no competing offers.
            </p>
            <p>
              One thing to know: if you want to own multiple FHA properties, they need to be at least 100 miles apart. So if you already have an FHA loan in Colorado Springs, you can&apos;t assume another FHA within 100 miles. But a VA or USDA assumption would work.
            </p>
            <p>
              FHA assumptions do come with mortgage insurance (MIP). This carries over from the original loan. Depending on when the seller originated the loan, it may be for the life of the loan or it may drop off after a certain equity threshold. Your assumption processor will clarify this during the application.
            </p>
            <p>
              The closing costs are typically $5,000-$10,000 plus the assumption processor fee. The processor runs about $750 per side or 1% of the purchase price. Worth every penny for keeping the process on track.
            </p>
            <p className="mt-4">
              <Link href="/blog/fha-loan-assumption-process-step-by-step" className="text-brand font-semibold hover:underline">Read our step-by-step FHA assumption guide →</Link>
              {' · '}
              <Link href="/blog/fha-assumable-mortgage-checklist-colorado-buyers" className="text-brand font-semibold hover:underline">FHA assumption checklist for Colorado buyers →</Link>
            </p>
          </div>
        </section>

        {/* VA Assumptions */}
        <section id="va-assumptions" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">VA Assumptions</h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              VA loans come with a massive perk that most people miss: they&apos;re assumable by anyone. You don&apos;t need to be a veteran to assume a VA loan.
            </p>
            <p>
              The catch is the seller needs to agree. Their VA entitlement stays tied to the property if the buyer doesn&apos;t substitute their own entitlement. About 10-20% of VA sellers are open to letting a non-veteran assume their loan. We call these &quot;hand raisers&quot; and maintain a private list of them across the Colorado Front Range.
            </p>
            <p>
              VA assumptions have no PMI. No minimum credit score (it&apos;s the reason behind the score that matters, not the number itself). And some of the lowest rates in our inventory, going as low as 2.25%.
            </p>
            <p>
              The VA actually sent a circular to lenders reminding them they must allow assumptions or risk losing the ability to service VA loans. The government is on the buyer&apos;s side here.
            </p>
            <p>
              If the buyer is a veteran, they can substitute their own entitlement, and the seller gets theirs back immediately. If the buyer is not a veteran, the seller retains partial entitlement based on the county loan limit minus the original loan amount. For El Paso County with an $806,500 limit and a $350K original loan, that leaves $456,500 in remaining entitlement.
            </p>
            <p>
              <Link href="/va-loans" className="text-brand font-semibold hover:underline">Read our full VA assumable mortgage guide →</Link>
            </p>
            <p className="mt-2">
              <Link href="/blog/va-loan-assumption-process-colorado" className="text-brand font-semibold hover:underline">VA loan assumption process in Colorado →</Link>
              {' · '}
              <Link href="/blog/can-non-veterans-assume-va-loans" className="text-brand font-semibold hover:underline">Can non-veterans assume VA loans? →</Link>
            </p>
          </div>
        </section>

        {/* Pros and Cons */}
        <section id="pros-and-cons" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Pros and Cons</h2>
          <p className="text-gray-700 mb-6">
            I want to be transparent about this. Assumable mortgages aren&apos;t perfect for everyone. Here&apos;s the honest breakdown.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <h3 className="font-bold text-green-800 mb-4 text-lg">The Upside</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Lock in a 2-4% rate while everyone else pays 6.5%+. Monthly savings of $500-$1,500.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>No PMI on VA assumptions. That alone saves $200-$400/month.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Lifetime interest savings of $100K-$400K depending on the loan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Lower closing costs than originating a brand new loan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>No appraisal required in many cases (saves $500-$800 and avoids appraisal risk).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Fully legal. Lender involved the whole way. Not subject-to.</span>
                </li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="font-bold text-red-800 mb-4 text-lg">The Downside</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span>Longer timeline: 45-90 days vs. 30 days for conventional. You need patience.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span>The equity gap can be large. If the seller has $100K+ in equity, you need a plan to cover it.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span>Banks add friction on purpose. They&apos;d rather you get a new 6.5% loan. Expect paperwork requests and delays.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span>Limited inventory. Not every home has an FHA, VA, or USDA loan. You&apos;re shopping a subset of the market.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span>Many agents don&apos;t understand assumptions. That&apos;s why working with a specialist matters.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span>VA entitlement stays tied if buyer is non-veteran. Some sellers won&apos;t agree to this.</span>
                </li>
              </ul>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-6">
            The downsides are real. This can be a pain in the ass and requires paperwork. But when you&apos;re saving $1,000+/month? Most of our buyers think it&apos;s worth the extra effort. We&apos;ve closed 90+ of these and haven&apos;t had a buyer who got into the process fail to close.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: 'Can anyone assume a mortgage?', a: 'Anyone can assume an FHA loan as long as they meet the credit and income requirements. VA loans can be assumed by anyone too, but the seller has to agree (especially for non-veterans). USDA loans require the buyer to meet USDA eligibility.' },
              { q: 'What credit score do I need?', a: 'FHA assumptions typically require 580+ (same as originating an FHA loan). VA assumptions have no hard minimum. It\'s the story behind your credit that matters.' },
              { q: 'How much does it cost?', a: 'Plan for $5,000-$10,000 in closing costs plus the assumption processor fee ($750/side or ~1% of purchase price). Still far less than the extra interest you\'d pay on a new high-rate loan.' },
              { q: 'Can I use an assumable mortgage as an investment?', a: 'Yes, in certain cases. If you assume a VA loan where the seller leaves their entitlement, there\'s no occupancy requirement for you. FHA requires owner-occupancy for at least one year. After that, you can rent it out.' },
              { q: 'What if the deal falls through?', a: 'It can happen. The bank can deny the assumption if the buyer doesn\'t qualify. Your earnest money is typically protected by the financing contingency, same as a traditional purchase.' },
              { q: 'Do I need a real estate agent who specializes in assumptions?', a: 'You don\'t have to, but I\'d strongly recommend it. Most agents have never done one. They don\'t know the timeline, the paperwork, or how to deal with the servicers. We eat, sleep, and breathe these.' },
              { q: 'Is subject-to the same as assumable?', a: 'No. Subject-to means taking over payments without the lender\'s involvement or approval. The loan stays in the seller\'s name. If the lender finds out, they can call the loan due. Assumable mortgages go through full lender approval. The loan transfers to the buyer\'s name. Keep it legal, keep it clean.' },
              { q: 'How do I find assumable homes?', a: 'We maintain a list of 800+ assumable properties across Colorado, updated daily. Browse listings at assumableguy.com/homes or sign up to get the full list sent to your email.' },
              { q: 'Can I refinance later?', a: 'Yes. You can refinance at any time. But why would you refinance out of a 2.5% rate? The second mortgage (gap loan) can be refinanced or paid off early with no prepayment penalty. Most buyers pay down the second and keep the assumed first.' },
              { q: 'What happens to my rate if interest rates drop?', a: 'Your assumed rate stays the same. It\'s locked for the life of the loan. If rates somehow drop below your assumed rate (unlikely to go below 2-3% anytime soon), you could refinance then.' },
            ].map((faq, i) => (
              <div key={i} className="border-b border-gray-200 pb-6">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-brand-dark to-brand rounded-3xl p-8 md:p-12 text-white text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Find an Assumable Home?</h2>
          <p className="text-gray-200 mb-6 max-w-lg mx-auto">
            Browse 800+ Colorado listings with assumable mortgages. Rates as low as 2.25%. Updated daily.
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

        {/* Browse CTA */}
        <section className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-200 text-center">
          <div className="text-3xl mb-3">🏠</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">See Available Colorado Homes</h3>
          <p className="text-gray-500 mb-6">Browse assumable listings updated daily.</p>
          <Link
            href="/homes"
            className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-8 py-4 rounded-xl transition-colors"
          >
            Browse Listings
          </Link>
        </section>
      </div>
    </div>
  );
}
