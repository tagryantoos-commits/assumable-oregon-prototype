import { Metadata } from 'next';
import Image from 'next/image';
import CourseWaitlistForm from './CourseWaitlistForm';

export const metadata: Metadata = {
  title: 'Assumable Mortgage Agent Training Course | The Assumable Guy',
  description:
    'Learn how to close assumable mortgage deals. 8-module course for licensed real estate agents. Templates, scripts, calculators included. From Ryan Thomson, 90+ assumable closings.',
  keywords: [
    'assumable mortgage agent training',
    'assumable mortgage course for agents',
    'how to close assumable mortgages',
    'assumable mortgage certification',
    'real estate agent assumable mortgage course',
  ],
  openGraph: {
    title: 'Master Assumable Mortgages. Close Deals Other Agents Can\'t.',
    description:
      'The only assumable mortgage training built by an agent who has closed 90+ of them. 8 modules, self-paced, includes templates and scripts.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://assumableguy.com/course',
  },
};

const modules = [
  {
    number: '01',
    title: 'Why Assumable Mortgages Matter Right Now',
    outcome: 'Explain the opportunity with specific numbers to any buyer or seller.',
  },
  {
    number: '02',
    title: 'The Mechanics of an Assumable Mortgage',
    outcome: 'Distinguish FHA, VA, and USDA assumptions from subject-to. Answer "is this legal?" confidently.',
  },
  {
    number: '03',
    title: 'Identifying Assumable Properties',
    outcome: 'Build a list of assumable properties in your market within 48 hours.',
  },
  {
    number: '04',
    title: 'The Math: Savings, Equity Gap, and Blended Rates',
    outcome: 'Show any buyer their exact savings on your phone, in the room, in five minutes.',
  },
  {
    number: '05',
    title: 'Working With Sellers',
    outcome: 'Handle VA entitlement conversations and get buy-in from listing agents who have never done this.',
  },
  {
    number: '06',
    title: 'The Assumption Process and Timeline',
    outcome: 'Set accurate timelines, manage servicer friction, and keep deals together.',
  },
  {
    number: '07',
    title: 'Financing the Equity Gap',
    outcome: 'Match buyers to the right equity gap solution and run blended payment math on the spot.',
  },
  {
    number: '08',
    title: 'Building Your Assumable Business',
    outcome: 'Operate as a genuine assumable mortgage specialist with a system for finding and closing deals.',
  },
];

const faqs = [
  {
    q: 'How long does the course take?',
    a: 'About 4 to 6 hours total, self-paced. Most agents finish it in a weekend. You can go module by module if you prefer.',
  },
  {
    q: 'Do I need to be in Colorado?',
    a: 'No. Assumable mortgages exist in every state. The principles, math, and process are the same everywhere. Colorado examples are used because that is where our team operates, but everything applies nationally.',
  },
  {
    q: 'Will I get templates and scripts?',
    a: 'Yes. Every module includes downloadable templates: offer clauses, seller scripts, equity gap calculators, servicer checklists, and client-facing comparison spreadsheets.',
  },
  {
    q: "What if I've never done an assumption before?",
    a: 'That is exactly who this is for. The course starts from zero. By Module 8, you will have a repeatable system for finding, closing, and marketing assumable deals.',
  },
  {
    q: 'Is there a certification?',
    a: "Agents who complete all 8 modules and pass the final assessment receive The Assumable Guy Agent Certification. Certified agents are eligible for referral partnerships in markets where we don't operate directly.",
  },
  {
    q: 'How much does it cost?',
    a: 'Pricing will be announced when enrollment opens. Join the waitlist to be first in line and get early-bird pricing.',
  },
];

export default function CoursePage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-light rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-light rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-brand/20 border border-brand/30 text-brand-light text-sm font-medium px-3 py-1.5 rounded-full mb-6">
            For Licensed Real Estate Agents
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
            Master Assumable Mortgages.<br />
            <span className="text-brand-light">Close Deals Other Agents Can&apos;t.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            The only training course built by an agent who has closed 90+ assumable mortgage transactions. 8 modules. Self-paced. Everything you need to become the assumable expert in your market.
          </p>
          <a
            href="#waitlist"
            className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg shadow-lg shadow-brand/30"
          >
            Join the Waitlist
          </a>
        </div>
      </section>

      {/* THE OPPORTUNITY */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">The Opportunity</h2>
          <div className="space-y-5 text-gray-600 text-lg leading-relaxed">
            <p>
              There are roughly 12 million assumable mortgages in the United States right now. FHA and VA loans
              originated between 2019 and 2022, locked in at rates between 2% and 4%.
            </p>
            <p>
              With conventional rates sitting above 6%, these loans are worth their weight in gold to buyers.
              And most agents have no idea how to work them.
            </p>
            <p>
              The agents who figure this out first will close deals nobody else can touch. They&apos;ll attract
              buyers who are priced out of conventional financing. They&apos;ll have a skill set that separates
              them from every other agent in their market.
            </p>
            <p className="text-gray-900 font-semibold">
              That&apos;s what this course gives you.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-10">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-brand">12M+</div>
              <div className="text-gray-500 text-sm mt-1">Assumable Mortgages in the US</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-brand">2-4%</div>
              <div className="text-gray-500 text-sm mt-1">Average Locked-In Rates</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-brand">90%</div>
              <div className="text-gray-500 text-sm mt-1">Of Agents Don&apos;t Know This</div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU'LL LEARN */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">What You&apos;ll Learn</h2>
            <p className="text-gray-500 text-lg">8 modules. Everything from the basics to building your business.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {modules.map((mod) => (
              <div key={mod.number} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="text-brand text-2xl font-black shrink-0 w-10">{mod.number}</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{mod.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{mod.outcome}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURSE DETAILS */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Course Details</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="text-brand font-bold text-sm uppercase tracking-wide mb-2">Format</div>
              <div className="text-gray-900 font-semibold text-lg">Self-Paced Video</div>
              <p className="text-gray-500 text-sm mt-1">Watch on your schedule. Rewatch as many times as you want.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="text-brand font-bold text-sm uppercase tracking-wide mb-2">Length</div>
              <div className="text-gray-900 font-semibold text-lg">4 to 6 Hours Total</div>
              <p className="text-gray-500 text-sm mt-1">Most agents finish in a weekend.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="text-brand font-bold text-sm uppercase tracking-wide mb-2">Includes</div>
              <div className="text-gray-900 font-semibold text-lg">Templates, Scripts, Calculators</div>
              <p className="text-gray-500 text-sm mt-1">Offer clauses, seller scripts, equity gap spreadsheets, servicer checklists.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="text-brand font-bold text-sm uppercase tracking-wide mb-2">Price</div>
              <div className="text-gray-900 font-semibold text-lg">Coming Soon</div>
              <p className="text-gray-500 text-sm mt-1">Join the waitlist for early-bird pricing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT RYAN */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Who Built This Course</h2>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="md:flex gap-8 items-start">
              <div className="shrink-0 mb-6 md:mb-0">
                <Image
                  src="/images/ryan-headshot.png"
                  alt="Ryan Thomson - The Assumable Guy"
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full object-cover"
                />
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p className="text-lg">
                  <strong className="text-gray-900">Ryan Thomson</strong> is the founder of The Assumable Guy and Colorado&apos;s
                  top assumable mortgage team. 90+ assumable closings. $25M+ in transactions. More assumptions closed
                  per quarter than most agents close in a career.
                </p>
                <p>
                  Before real estate, Ryan spent seven years as a social worker making $35K a year. He house hacked
                  his way to 5 properties in Colorado Springs, converted garages into apartments, basements into Airbnbs,
                  and figured out how to build wealth without a trust fund.
                </p>
                <p>
                  When rates shot up in 2022 and house hacking stopped penciling, Ryan went all in on assumable
                  mortgages. He built the systems, closed the deals, and proved the model. Now he&apos;s expanding
                  nationally and teaching other agents how to do the same thing.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="bg-brand/10 text-brand font-bold text-sm px-4 py-2 rounded-lg">90+ Closings</div>
                  <div className="bg-brand/10 text-brand font-bold text-sm px-4 py-2 rounded-lg">$25M+ Transactions</div>
                  <div className="bg-brand/10 text-brand font-bold text-sm px-4 py-2 rounded-lg">#1 CO Assumable Team</div>
                  <div className="bg-brand/10 text-brand font-bold text-sm px-4 py-2 rounded-lg">Expanding Nationally</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">What Clients Say</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="text-brand text-2xl mb-3">&ldquo;</div>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ryan walked us through the entire assumption process. We locked in a 2.75% rate and our payment is
                $800 less per month than what we would have paid with a conventional loan. Nobody else even mentioned
                this was possible.
              </p>
              <div className="text-gray-900 font-semibold text-sm">Colorado Springs Buyer</div>
              <div className="text-gray-400 text-xs">Assumed a VA loan, 2.75% rate</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="text-brand text-2xl mb-3">&ldquo;</div>
              <p className="text-gray-600 leading-relaxed mb-4">
                We put $16K down on a $430,000 property and got a 2.99% rate. Our agent before Ryan told us we
                couldn&apos;t afford anything in this market. Turns out we just needed an agent who knew what he was doing.
              </p>
              <div className="text-gray-900 font-semibold text-sm">Ben and Liz</div>
              <div className="text-gray-400 text-xs">$430K home, 2.99% assumed rate</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="text-brand text-2xl mb-3">&ldquo;</div>
              <p className="text-gray-600 leading-relaxed mb-4">
                I&apos;m an investor. Ryan&apos;s team found me a property with a 2.65% rate. I put $35K down and
                my tenants are paying down $12K in principal per year. The returns on this are better than anything
                else I&apos;ve seen in real estate.
              </p>
              <div className="text-gray-900 font-semibold text-sm">Colorado Investor</div>
              <div className="text-gray-400 text-xs">Investment property, 2.65% rate</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="text-brand text-2xl mb-3">&ldquo;</div>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ryan&apos;s team closed our assumption in 38 days. The bank was difficult. The processor handled
                everything. We saved over $200,000 in interest compared to what we were quoted for a conventional loan.
              </p>
              <div className="text-gray-900 font-semibold text-sm">Denver Metro Buyer</div>
              <div className="text-gray-400 text-xs">FHA assumption, closed in 38 days</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / WAITLIST */}
      <section id="waitlist" className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Join the Waitlist</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Be the first to know when enrollment opens. Early waitlist members get priority access and early-bird pricing.
          </p>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <CourseWaitlistForm />
          </div>
        </div>
      </section>
    </div>
  );
}
