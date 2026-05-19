'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { trackMetaLead } from '../../components/MetaPixel';
import { useUTMParams, UTMParams } from '../../lib/useUTMParams';



interface Benefit {
  icon: string;
  title: string;
  desc: string;
}

interface Testimonial {
  quote: string;
  tag: string;
  label: string;
}

interface PPCPageProps {
  headline: string;
  subheadline: string;
  badge: string;
  formSource: string;
  formTitle: string;
  formSubtitle: string;
  heroVariant: 'primary' | 'blue' | 'dark' | 'geo';
  benefits: Benefit[];
  testimonials: Testimonial[];
  vaSpecific?: boolean;
  cities?: string[];
}



function LeadForm({ source, title, subtitle, ctaText = 'Get Started Free →', utmParams }: {
  source: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  utmParams: UTMParams;
}) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source,
          type: 'buyer',
          formType: 'Form: PPC Landing Page',
          timestamp: new Date().toISOString(),
          ...utmParams,
        }),
      });
    } catch {
      // still show success
    } finally {
      // Fire Google Ads conversion event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'conversion', {
          send_to: 'AW-17997636825/EvE5CJ69yY8cENnJ-IVD',
          value: 50.0,
          currency: 'USD',
        });
      }
      // Fire Meta Pixel Lead event
      trackMetaLead({ em: formData.email, ph: formData.phone, fn: formData.name });
      setLoading(false);
      // Redirect to thank-you page with name
      const firstName = formData.name.split(' ')[0];
      setTimeout(() => {
        window.location.href = `/ppc/thank-you?name=${encodeURIComponent(firstName)}`;
      }, 500);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-4">{subtitle}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="ppc-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            id="ppc-name"
            type="text"
            placeholder="e.g. John Smith"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-light"
            style={{ color: '#111827', backgroundColor: '#ffffff', caretColor: '#111827' }}
          />
        </div>
        <div>
          <label htmlFor="ppc-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            id="ppc-email"
            type="email"
            placeholder="e.g. john@email.com"
            required
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-light"
            style={{ color: '#111827', backgroundColor: '#ffffff', caretColor: '#111827' }}
          />
        </div>
        <div>
          <label htmlFor="ppc-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            id="ppc-phone"
            type="tel"
            placeholder="e.g. (719) 555-1234"
            required
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-light"
            style={{ color: '#111827', backgroundColor: '#ffffff', caretColor: '#111827' }}
          />
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg py-2 px-3 mb-2">
          <span className="text-green-500">🔥</span>
          <span className="font-medium">Only 47 assumable homes left in Colorado Springs</span>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-base shadow-lg"
        >
          {loading ? 'Sending...' : ctaText}
        </button>
        <p className="text-xs text-center text-gray-400">
          Free. No spam. We personally respond within minutes.{' '}
          <button type="button" onClick={() => setShowTerms(!showTerms)} className="underline hover:text-gray-600">Terms</button>
        </p>
        {showTerms && (
          <p className="text-xs text-center text-gray-400 leading-relaxed mt-1">
            By submitting, you consent to be contacted by The Assumable Guy via phone, text, and email regarding assumable mortgage properties. Message &amp; data rates may apply. Reply STOP to opt out.
          </p>
        )}
      </form>
    </div>
  );
}

const heroGradients: Record<string, string> = {
  primary: 'from-gray-900 via-gray-800 to-brand-dark',
  blue: 'from-blue-950 via-blue-900 to-brand-dark',
  dark: 'from-gray-950 via-gray-900 to-gray-800',
  geo: 'from-green-950 via-gray-900 to-brand-dark',
};


export default function PPCPage({
  headline,
  subheadline,
  badge,
  formSource,
  formTitle,
  formSubtitle,
  heroVariant,
  benefits,
  testimonials,
  vaSpecific,
  cities,
}: PPCPageProps) {
  const gradient = heroGradients[heroVariant];
  const utmParams = useUTMParams();


  return (
    <div className="min-h-screen bg-white">

      {/* MINI BRAND BAR */}
      <div className="bg-brand py-2.5 px-4 flex items-center justify-between max-w-full">
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-lg tracking-tight">The Assumable Guy</span>
        </div>
        <a
          href="tel:7196243472"
          className="text-white font-semibold text-sm hover:text-brand-light transition-colors flex items-center gap-1.5"
        >
          📞 <span className="hidden sm:inline">(719) 624-3472</span><span className="sm:hidden">Call Now</span>
        </a>
      </div>

      {/* HERO */}
      <section className={`relative bg-gradient-to-br ${gradient} text-white overflow-hidden`}>
        {/* Decorative blobs */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-light rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-light rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* FORM: shows first on mobile, second on desktop */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl order-first lg:order-last">
              <LeadForm
                source={formSource}
                title={formTitle}
                subtitle={formSubtitle}
                utmParams={utmParams}
              />

              {/* Agent trust card */}
              <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-brand">
                  <Image
                    src="/images/ryan-headshot.png"
                    alt="Ryan Thomson"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Ryan Thomson</div>
                  <div className="text-xs text-gray-500">Licensed CO Real Estate Agent · License #100092341</div>
                  <div className="text-xs text-gray-500">(719) 624-3472</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-yellow-400 text-xs">★★★★★</span>
                    <span className="text-xs text-gray-500">5.0 on Google</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Powered by</span>
                <span className="text-xs font-bold tracking-tight" style={{ color: '#E2001A' }}>Keller Williams</span>
              </div>
            </div>

            {/* COPY: shows second on mobile, first on desktop */}
            <div className="order-last lg:order-first">
              <div className="inline-flex items-center gap-2 bg-brand/20 border border-brand/30 text-brand-light text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {badge}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-5">
                {headline}
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                {subheadline}
              </p>

              {/* Savings callout */}
              <div className="bg-white/10 border border-white/20 rounded-2xl p-5 mb-6 hidden lg:block">
                <div className="text-xs font-semibold text-brand-light uppercase tracking-widest mb-3">
                  💡 The $500K Example
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-500/20 rounded-xl p-3 text-center border border-red-400/20">
                    <div className="text-xs text-red-300 mb-1">New Loan @ 6.80%</div>
                    <div className="text-2xl font-black text-white">$3,260</div>
                    <div className="text-xs text-gray-400">/month</div>
                  </div>
                  <div className="bg-brand/30 rounded-xl p-3 text-center border border-brand/30">
                    <div className="text-xs text-brand-light mb-1">Assumed @ 3.25%</div>
                    <div className="text-2xl font-black text-brand-light">$2,176</div>
                    <div className="text-xs text-gray-400">/month</div>
                  </div>
                </div>
                <div className="text-center mt-3 text-white font-bold">
                  You save <span className="text-green-400 text-xl">$1,084/month</span>
                </div>
              </div>

              {/* Trust signals */}
              <p className="text-gray-300 text-sm italic mb-4 hidden lg:block">
                Colorado&apos;s only real estate team built exclusively around assumable mortgages. 90+ closings, $25M+ saved for buyers just like you.
              </p>
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

          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <div className="bg-gray-50 border-y border-gray-200 py-4">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-black text-brand">90+</div>
            <div className="text-xs text-gray-500">Closings Completed</div>
          </div>
          <div>
            <div className="text-2xl font-black text-brand">$25M+</div>
            <div className="text-xs text-gray-500">Total Buyer Savings</div>
          </div>
          <div>
            <div className="text-2xl font-black text-brand">800+</div>
            <div className="text-xs text-gray-500">CO Listings Available</div>
          </div>
        </div>
      </div>

      {/* BENEFITS */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Why Buyers Choose Assumable Mortgages</h2>
            <p className="text-gray-500 mt-2 text-sm">The math doesn&apos;t lie. Neither do our clients.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="text-3xl flex-shrink-0">{b.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VA-SPECIFIC SECTION */}
      {vaSpecific && (
        <section className="py-14 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-br from-blue-900 to-brand-dark rounded-3xl p-8 text-white text-center">
              <div className="text-4xl mb-3">🎖️</div>
              <h2 className="text-2xl font-bold mb-3">The VA Loan Secret Most Buyers Miss</h2>
              <p className="text-gray-300 text-sm leading-relaxed mb-5 max-w-xl mx-auto">
                VA loans are assumable by <strong className="text-white">anyone</strong>, veteran or not. The seller&apos;s VA entitlement transfers with the property. About 10-20% of VA sellers are open to non-veteran assumptions. We maintain a private list of those sellers. You won&apos;t find this list on Zillow.
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="font-black text-brand-light text-lg">$0</div>
                  <div className="text-xs text-gray-300">PMI Ever</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="font-black text-brand-light text-lg">2%</div>
                  <div className="text-xs text-gray-300">Min Rate</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="font-black text-brand-light text-lg">100%</div>
                  <div className="text-xs text-gray-300">Legal</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CITIES (geo page) */}
      {cities && cities.length > 0 && (
        <section className="py-14 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Where We Work in Colorado</h2>
              <p className="text-gray-500 mt-2 text-sm">Active assumable listings across the Front Range</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {cities.map(city => (
                <div key={city} className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 rounded-full px-4 py-2 text-sm font-medium text-brand">
                  📍 {city}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="py-14 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Real Buyers. Real Savings.</h2>
            <p className="text-gray-400 mt-2 text-sm">Here&apos;s what our clients are doing with assumable mortgages</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <p className="text-white text-sm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="text-gray-400 text-xs">{t.label}</div>
                  <div className="bg-brand/20 text-brand-light font-bold text-xs px-3 py-1.5 rounded-full border border-brand/30">
                    {t.tag}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM LEAD FORM */}
      <section className="py-16 bg-white" id="get-started">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-gray-900 to-brand-dark rounded-3xl p-7 md:p-10 text-white">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🏡</div>
              <h2 className="text-2xl font-bold mb-2">Ready to Save $900+/Month?</h2>
              <p className="text-gray-300 text-sm">
                Fill out the form and Ryan Thomson will personally reach out with available assumable listings.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <LeadForm
                source={`${formSource}_bottom`}
                title="Get Started Free"
                subtitle="Free. No obligation. We respond within minutes."
                ctaText="Get Started Free →"
                utmParams={utmParams}
              />
            </div>
          </div>
        </div>
      </section>

      {/* STICKY MOBILE CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-brand shadow-2xl">
        <a
          href="#get-started"
          onClick={(e) => {
            e.preventDefault();
            const form = document.getElementById('get-started');
            if (form) {
              form.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center justify-center gap-2 py-4 text-white font-bold text-base"
        >
          🏡 Get Started Free - Save $900+/Mo →
        </a>
      </div>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-8 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs space-y-2">
          <p className="text-white font-semibold">The Assumable Guy · Ryan Thomson, Licensed CO Real Estate Agent · License #100092341</p>
          <p>
            <a href="tel:7196243472" className="hover:text-white">(719) 624-3472</a>
            {' · '}
            <a href="mailto:ryan@TheAssumableGuy.com" className="hover:text-white">ryan@TheAssumableGuy.com</a>
            {' · '}
            <a href="https://assumableguy.com" className="hover:text-white">assumableguy.com</a>
          </p>
          <p className="text-gray-600 leading-relaxed">
            The Assumable Guy is a licensed real estate brokerage in Colorado. Payment calculations are estimates based on loan balance and interest rate only and do not include taxes, insurance, HOA, or other costs. Individual savings will vary. Assumable mortgage availability is subject to lender approval and qualification. Not all FHA/VA loans are assumable. This is not legal or financial advice.
          </p>
          <p className="text-gray-600">© {new Date().getFullYear()} The Assumable Guy. All rights reserved.</p>
        </div>
      </footer>



    </div>
  );
}
