import { Metadata } from 'next';
import Link from 'next/link';
import { allListings, STATS, formatCurrency, formatPrice, getPhotoUrl, MARKET_RATE } from '../lib/listings';
import { getFilteredListings } from '../lib/getFilteredListings';
import { getMarketRate } from '../lib/marketRate';

export const metadata: Metadata = {
  title: 'Oregon & PNW Assumable Mortgages | Rates as Low as 2.6% | The Assumable Guy',
  description: `Browse ${STATS.activeListings} Oregon & Washington homes with assumable FHA & VA mortgages. Lock in rates as low as 2.6% instead of today's 6.9%. Save $500-$1,500/month. Portland, Vancouver, Beaverton & more.`,
  alternates: {
    canonical: 'https://assumable-oregon-prototype.vercel.app',
  },
  openGraph: {
    title: 'Oregon & PNW Assumable Mortgages | Rates as Low as 2.6% | The Assumable Guy',
    description: `Browse ${STATS.activeListings} Oregon & Washington homes with assumable FHA & VA mortgages. Save $500-$1,500/month vs today's rates.`,
    type: 'website',
    url: 'https://assumable-oregon-prototype.vercel.app',
    images: [{ url: 'https://assumableguy.com/images/ryan-headshot.png', width: 1200, height: 630, alt: 'The Assumable Guy - Oregon PNW Assumable Mortgages' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oregon & PNW Assumable Mortgages | Rates as Low as 2.6%',
    description: `Save $500-$1,500/month with an assumable mortgage. Browse ${STATS.activeListings} Oregon & Washington homes.`,
    images: ['https://assumableguy.com/images/ryan-headshot.png'],
  },
};
import LeadCaptureForm from '../components/LeadCaptureForm';
import ListingCardWrapper from './ListingCardWrapper';
import PaymentCalculator from '../components/PaymentCalculator';
import FAQAccordion from '../components/FAQAccordion';
import StickyMobileCTA from '../components/StickyMobileCTA';
import AgentContactForm from '../components/AgentContactForm';

const faqItems = [
  {
    q: 'What is an assumable mortgage?',
    a: 'An assumable mortgage lets you take over the seller\u2019s existing loan, including their interest rate. Instead of getting a new loan at today\u2019s 6%+ rates, you step into their 2-3% rate. Fully legal, lender-approved, loan transferred into your name.',
  },
  {
    q: 'Which loans are assumable?',
    a: 'FHA, VA, and USDA loans are all assumable by law. That covers millions of homes. Conventional loans generally are not assumable. About 1 in 5 homes on the market right now has an assumable loan attached.',
  },
  {
    q: 'Do I have to be a veteran to assume a VA loan?',
    a: 'No. Non-veterans can assume VA loans. The seller leaves their VA entitlement with the property. About 10-20% of VA sellers say yes to non-veteran assumptions, and we maintain a list of those \u2018hand raisers\u2019 so you don\u2019t have to guess.',
  },
  {
    q: 'What\u2019s the equity gap and how do I cover it?',
    a: 'The equity gap is the difference between the home\u2019s price and the remaining loan balance. Basically what the seller has already paid down. You cover this at closing. Options: cash savings, gift funds, HELOC, personal line of credit, or our partner lender who puts up the rest if you bring 5% down.',
  },
  {
    q: 'How long does the process take?',
    a: '45-90 days on average, a bit longer than a normal closing. Some servicers move faster (30 days is possible). The bank will add friction because they\u2019d rather get the low-rate loan off their books. That\u2019s why we use assumption processors who know how to push it through.',
  },
  {
    q: 'How much can I actually save?',
    a: 'On a $400,000 home: a 2.75% assumed rate = $1,635/month. Today\u2019s 6.14% rate on the same home = $2,432/month. That\u2019s $797/month less, $9,564/year, $287,000 over 30 years. Run the numbers for yourself with the calculator above.',
  },
  {
    q: 'What does it cost to work with you?',
    a: 'Nothing out of pocket in most cases. We get paid by the seller (standard real estate commission) and succeed about 90% of the time in getting the seller to cover our fee. You pay closing costs ($3,000-$5,000 typical) and the equity gap. That\'s it.',
  },
  {
    q: 'Do I need a down payment for an assumable mortgage?',
    a: 'Not a traditional down payment, but you do need to cover the equity gap. If a home is worth $400K and the remaining loan is $300K, you need $100K to bridge that gap through cash, a second mortgage, or other financing.',
  },
  {
    q: 'Is this too good to be true?',
    a: 'Rates were declining for 40 years. Assumables became irrelevant. People forgot they existed. Then rates shot up and suddenly these 2-3% loans from 2019-2022 are worth their weight in gold. They were always there. The comeback tour is just getting started.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
};

export default async function HomePage() {
  const featured = getFilteredListings(allListings, { limit: 6 });
  const marketRate = await getMarketRate();

  const cities = ['Portland', 'Vancouver', 'Beaverton', 'Ridgefield', 'Silverlake', 'Gresham'];

  return (
    <div className="pb-16 md:pb-0">
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-light rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-light rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-brand/20 border border-brand/30 text-brand-light text-sm font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-brand-light rounded-full animate-pulse" />
              {STATS.activeListings}+ Active Oregon & PNW Listings
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
              Oregon &amp; PNW<br/>
              <span className="text-brand-light">Assumable Mortgage</span><br/>
              Experts
            </h1>

            <p className="text-xl text-gray-300 mb-8">
              Save <strong className="text-white">$1,100+ per month</strong> on your next home by assuming an existing low-rate mortgage
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/homes"
                className="bg-brand hover:bg-brand-light text-white font-bold px-6 py-4 rounded-xl text-center transition-colors shadow-lg shadow-brand/30"
              >
                Browse {STATS.activeListings} Listings →
              </Link>
              <Link
                href="#talk-to-agent"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-4 rounded-xl text-center transition-colors"
              >
                Talk to an Agent
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-black text-brand-light">{STATS.activeListings}+</div>
                <div className="text-xs text-gray-400">Active Listings</div>
              </div>
              <div>
                <div className="text-2xl font-black text-brand-light">{STATS.totalClosings}+</div>
                <div className="text-xs text-gray-400">Closings</div>
              </div>
              <div>
                <div className="text-2xl font-black text-brand-light">${STATS.avgMonthlySavings}+</div>
                <div className="text-xs text-gray-400">Avg Monthly Savings</div>
              </div>
              <div>
                <div className="text-2xl font-black text-brand-light">{formatCurrency(STATS.lifetimeSavings)}</div>
                <div className="text-xs text-gray-400">Lifetime Buyer Savings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* URGENCY BAR */}
      <div className="bg-brand-dark py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-brand-light text-sm font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-light" />
          </span>
          <span>🌲 {allListings.length} assumable homes available in Oregon &amp; Washington right now</span>
        </div>
      </div>

      {/* SAVINGS CALCULATOR */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">See Your Savings</h2>
            <p className="text-gray-500 mt-2">Adjust the sliders to calculate your personal monthly savings</p>
          </div>
          <PaymentCalculator initialMarketRate={marketRate} />
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Listings</h2>
              <p className="text-gray-500 mt-1">Hand-picked deals with the best savings</p>
            </div>
            <Link href="/homes" className="text-brand hover:text-brand-dark font-semibold text-sm hidden sm:block">
              View all {STATS.activeListings} listings →
            </Link>
          </div>
          <ListingCardWrapper listings={featured} />
          <div className="text-center mt-8">
            <Link
              href="/homes"
              className="inline-block bg-brand hover:bg-brand text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-brand-200"
            >
              Browse All {STATS.activeListings} Oregon &amp; PNW Listings →
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-2">Three steps to a lower mortgage payment</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: '🔍',
                title: 'Browse Assumable Homes',
                desc: 'Filter by city, rate, and monthly payment. We update daily.',
              },
              {
                step: '02',
                icon: '📋',
                title: 'Connect with one of our agents',
                desc: "We'll walk you through the entire process",
              },
              {
                step: '03',
                icon: '🏡',
                title: 'You Close at the Low Rate',
                desc: 'Step into a 2-3% mortgage from 2020. Live the payment difference every month.',
              },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-100 text-brand rounded-2xl text-2xl mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-brand mb-1">STEP {item.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BROWSE BY CITY */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Browse by City</h2>
            <p className="text-gray-500 mt-2">Assumable listings across Oregon &amp; Washington</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {cities.map(city => {
              const count = allListings.filter(l => l.city === city).length;
              return (
                <Link
                  key={city}
                  href={`/homes?city=${encodeURIComponent(city)}`}
                  className="text-center bg-white border border-gray-100 hover:border-brand-200 hover:shadow-md rounded-xl p-4 transition-all"
                >
                  <div className="text-2xl mb-1">📍</div>
                  <div className="font-semibold text-gray-900 text-sm">{city}</div>
                  <div className="text-xs text-brand font-medium mt-0.5">{count} listings</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">Real Buyers. Real Savings.</h2>
            <p className="text-gray-400 mt-2">Here&apos;s what our clients are doing with assumable mortgages</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {(() => {
              const MALE_TOPS = 'shortFlat,shortRound,shortWaved,shortCurly,theCaesar,sides';
              const MALE_FACIAL = 'beardLight,beardMedium,beardMajestic';
              const FEMALE_TOPS = 'straight01,straight02,bob,bigHair,curly,curvy,longButNotTooLong';

              const maleAvatar = (seed: string, bg: string) =>
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&radius=50&top=${MALE_TOPS}&facialHair=${MALE_FACIAL}&facialHairProbability=100&mouth=default,smile,twinkle&eyebrows=default,defaultNatural,raisedExcited`;

              const femaleAvatar = (seed: string, bg: string) =>
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&radius=50&top=${FEMALE_TOPS}&facialHairProbability=0&mouth=smile,twinkle,default&eyebrows=default,defaultNatural`;

              const testimonials = [
                {
                  avatars: [maleAvatar('Jeremy-Investor-CS-v3', 'b6e3f4')],
                  name: 'Jeremy',
                  descriptor: 'Investor, Portland',
                  quote: 'Jeremy put $15,000 down on a Portland home at a 2.65% rate. His payment is $943/month less than his neighbor who bought the same month with a new loan.',
                  savings: '$943/mo saved',
                },
                {
                  avatars: [
                    maleAvatar('Ben-CS-v2', 'c0aede'),
                    femaleAvatar('Liz-CS-v2', 'ffdfbf'),
                  ],
                  name: 'Ben & Liz',
                  descriptor: 'Couple, Vancouver, WA',
                  quote: 'Ben and Liz closed on a $420,000 home in Vancouver. $18,000 down. 2.99% rate. They asked us the same question everyone asks: is this real?',
                  savings: '$812/mo saved',
                },
                {
                  avatars: [maleAvatar('Marcus-FTB-v3', 'ffd5dc')],
                  name: 'Marcus',
                  descriptor: 'First-Time Buyer',
                  quote: 'First-time buyer, $65,000 salary, assumed a VA loan in Portland. Under market payment, positive cash flow from day one.',
                  savings: '$700+/mo saved',
                },
              ];

              return testimonials.map((t, i) => (
                <div key={i} className="bg-gray-800 rounded-2xl p-6 border border-gray-700 flex flex-col hover:border-brand/40 transition-colors">
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-4">
                    <span className="text-yellow-400 text-lg tracking-wider">★★★★★</span>
                    <span className="ml-2 text-xs text-gray-400 font-medium">Verified client</span>
                  </div>
                  {/* Quote */}
                  <p className="text-white text-sm leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
                  {/* Footer: avatar(s) + name + savings */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={`flex ${t.avatars.length > 1 ? '-space-x-3' : ''}`}>
                        {t.avatars.map((src, ai) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={ai}
                            src={src}
                            alt={`${t.name} avatar`}
                            className="w-11 h-11 rounded-full border-2 border-gray-700 bg-gray-900"
                            loading="lazy"
                          />
                        ))}
                      </div>
                      <div>
                        <div className="text-white text-sm font-semibold">{t.name}</div>
                        <div className="text-gray-400 text-xs">{t.descriptor}</div>
                      </div>
                    </div>
                    <div className="bg-brand/20 text-brand-light font-bold text-xs px-3 py-1.5 rounded-full border border-brand/30">
                      {t.savings}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-gray-500 mt-2">Everything you need to know about assumable mortgages</p>
          </div>
          <FAQAccordion items={faqItems} />
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">The Math Is Pretty Clear</h2>
            <p className="text-gray-500 mt-2">Based on $400K home. Actual savings vary by property.</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand text-white">
                  <th className="text-left px-5 py-4 font-semibold"></th>
                  <th className="text-center px-5 py-4 font-semibold">Assumable Mortgage</th>
                  <th className="text-center px-5 py-4 font-semibold">New Loan at 6.5% (5% down)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Interest Rate', assumable: '2.75%', market: '6.14%', highlight: false },
                  { label: 'Monthly Payment', assumable: '$1,635', market: '$2,432', highlight: false },
                  { label: 'Monthly Savings', assumable: '$797', market: 'N/A', highlight: true },
                  { label: 'Annual Savings', assumable: '$9,564', market: 'N/A', highlight: true },
                  { label: '30-Year Savings', assumable: '$287,000', market: 'N/A', highlight: true },
                  { label: 'Down Payment', assumable: 'Equity gap (often under $30K)', market: '5% = $20,000', highlight: false },
                ].map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{row.label}</td>
                    <td className={`px-5 py-3.5 text-center ${row.highlight ? 'font-bold text-brand' : 'text-gray-700'}`}>
                      {row.assumable}
                    </td>
                    <td className="px-5 py-3.5 text-center text-gray-500">{row.market}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            We currently have {allListings.length} of these in Oregon &amp; Washington
          </p>
          <p className="text-center text-xs text-brand font-medium mt-2">
            Even if the equity gap is large, we have lenders who will loan the gap if you put down 5%.
          </p>
        </div>
      </section>

      {/* TALK TO AN AGENT */}
      <section id="talk-to-agent" className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 to-brand-dark rounded-3xl p-8 md:p-12 text-white">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">💬</div>
              <h2 className="text-3xl font-bold mb-2">Ready to Take the Next Step?</h2>
              <p className="text-gray-300">
                Talk to one of our assumable mortgage specialists. We&apos;ll walk you through the process, answer your questions, and help you find the right home.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <AgentContactForm source="homepage-talk-to-agent" />
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-16 bg-brand">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Ready to Save on Your Next Home?</h2>
          <p className="text-brand-100 mb-6 text-lg">
            Browse {STATS.activeListings}+ Oregon &amp; PNW assumable listings or call us directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/homes"
              className="bg-white text-brand font-bold px-8 py-4 rounded-xl hover:bg-brand-50 transition-colors"
            >
              Browse Listings →
            </Link>
            <a
              href="tel:7196243472"
              className="bg-brand text-white font-bold px-8 py-4 rounded-xl hover:bg-brand-dark transition-colors border border-brand-light"
            >
              📞 (719) 624-3472
            </a>
          </div>
        </div>
      </section>

      {/* STICKY MOBILE CTA */}
      <StickyMobileCTA listingCount={allListings.length} />
    </div>
  );
}
