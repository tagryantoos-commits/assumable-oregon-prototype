import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { STATS } from '../../lib/listings';

export const metadata: Metadata = {
  title: 'About The Assumable Guy | Ryan Thomson',
  description: 'Meet Ryan Thomson, Colorado\'s leading assumable mortgage specialist. Former social worker turned real estate investor. 100+ closings, $48M+ in buyer savings.',
  alternates: {
    canonical: 'https://assumableguy.com/about',
  },
};

export default function AboutPage() {
  return (
    <div>
      {/* HERO */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <Image
              src="/images/ryan-headshot.png"
              alt="Ryan Thomson, The Assumable Guy"
              width={200}
              height={200}
              className="rounded-full mx-auto border-4 border-brand-light shadow-lg shadow-brand/30"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            Ryan Thomson
          </h1>
          <p className="text-brand-light text-lg font-semibold mb-1">
            The Assumable Guy | Colorado Licensed Real Estate Agent
          </p>
          <p className="text-gray-400 text-sm mb-6">License #100092341</p>
          <p className="text-2xl md:text-3xl font-bold text-white italic">
            &ldquo;I eat, sleep, and breathe assumable mortgages.&rdquo;
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="bg-brand">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 gap-6 text-center text-white">
            <div>
              <div className="text-3xl font-black">100+</div>
              <div className="text-brand-100 text-sm">Closings</div>
            </div>
            <div>
              <div className="text-3xl font-black">$48M+</div>
              <div className="text-brand-100 text-sm">Savings Delivered</div>
            </div>
          </div>
        </div>
      </div>

      {/* STORY */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">The Story</h2>
        <div className="space-y-5 text-gray-600 leading-relaxed text-lg">
          <p>
            I started as a social worker making $35K a year. I knew I needed a different path to build wealth,
            so I found house hacking. I bought my first place, rented out rooms, and reinvested every dollar.
          </p>
          <p>
            That led me to assumable mortgages. Once I understood the math, I couldn&apos;t unsee it.
            I built a portfolio of 5 Colorado Springs properties through assumptions, locking in rates
            from a different era while everyone else was paying 6%+.
          </p>
          <p>
            Then I started helping other buyers do the same. I closed <strong>7+ assumptions in a single quarter,</strong> more than most agents close in a career. I realized this wasn&apos;t a side hustle. It was the future.
          </p>
          <p>
            Today I run a team of licensed Colorado agents. We work across all of real estate with a deep
            specialization in assumable transactions. Assumables are our edge, but we help buyers
            and sellers in every situation.
          </p>
          <p className="text-gray-900 font-semibold">
            The mission: make homeownership possible again by giving buyers access to the rates sellers
            locked in during 2019&ndash;2022.
          </p>
        </div>
      </section>

      {/* WHY ASSUMABLES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why We Specialize in Assumables</h2>
          <p className="text-gray-500 mb-10">Three reasons. That&apos;s it.</p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-brand text-4xl font-black mb-3">01</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">It&apos;s the best deal in real estate right now. Period.</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                When you can hand a buyer a 2.75% rate instead of 6.14%, everything else is noise.
                No other strategy delivers this kind of monthly savings.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-brand text-4xl font-black mb-3">02</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Most agents don&apos;t know how to do them.</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                That&apos;s our competitive advantage. The process is complex. Banks add friction, paperwork
                is different, timelines are longer. We&apos;ve built the systems to handle all of it.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-brand text-4xl font-black mb-3">03</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">The math speaks for itself.</h3>
              <div className="bg-gray-50 rounded-xl p-4 mt-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Assumed rate (2.75%)</span>
                  <span className="font-bold text-gray-900">$1,635/mo</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Today&apos;s rate (6.14%)</span>
                  <span className="font-bold text-gray-900">$2,432/mo</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                  <span className="text-brand font-bold">You save</span>
                  <span className="text-brand font-black text-lg">$797/mo</span>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-2">Based on $400K home, 30-year fixed</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Ready to Find Your Assumable Home?</h2>
          <p className="text-brand-100 mb-8 text-lg">
            Browse {STATS.activeListings}+ Colorado listings or get the full list with loan details sent to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/homes"
              className="bg-white text-brand font-bold px-8 py-4 rounded-xl hover:bg-brand-50 transition-colors"
            >
              See all homes &rarr;
            </Link>
            <Link
              href="/team"
              className="bg-brand text-white font-bold px-8 py-4 rounded-xl hover:bg-brand-dark transition-colors border border-brand-light"
            >
              Meet the Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
