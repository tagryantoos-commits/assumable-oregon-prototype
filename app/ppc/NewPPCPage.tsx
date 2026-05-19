'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUTMParams } from '../../lib/useUTMParams';
import { createClient } from '../../lib/supabase/client';
import Image from 'next/image';

// ─── Types ───────────────────────────────────────────────────────────────────

type Variant = 'va' | 'general';

interface VariantConfig {
  variant: Variant;
  headline: string;
  subheadline: string;
  source: string;
}

const VARIANT_CONFIGS: Record<string, VariantConfig> = {
  va: {
    variant: 'va',
    headline: 'PCSing to Fort Carson? See homes for sale with 2-3% VA rates.',
    subheadline: 'We track 1,200+ assumable properties across Colorado. Updated daily.',
    source: 'PPC - Fort Carson VA Buyers',
  },
  general: {
    variant: 'general',
    headline: 'Homes for sale with 2-3% mortgage rates. See the list.',
    subheadline: '1,200+ assumable FHA and VA properties across Colorado. Updated daily.',
    source: 'PPC - Assumable Searchers',
  },
  lowrate: {
    variant: 'general',
    headline: 'Save $1,100+/month on your mortgage payments!',
    subheadline: 'Sellers can transfer their 2-3% mortgages to you. Find the properties where this is an option.',
    source: 'PPC - Low Rate Seekers',
  },
};

interface PPCListing {
  id: string;
  city: string;
  state: string;
  assumableRate: number;
  assumableMonthlyPayment: number;
  monthlySavings: number;
  beds: number;
  baths: number;
  sqft: number;
  loanType: string;
  photoUrl?: string;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// ─── Helper Components ───────────────────────────────────────────────────────

function ConsentLine() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 text-center">
      <p className="text-xs text-gray-400">
        We&apos;ll reach out to help you find the right property.{" "}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-0.5 text-gray-400 hover:text-gray-500 underline transition-colors"
        >
          Terms
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <path d="M5 7L1 3h8L5 7z"/>
          </svg>
        </button>
      </p>
      {open && (
        <div className="mt-2 text-left bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-500 space-y-2">
          <p>By submitting, you&apos;re giving us permission to contact you about assumable properties via phone, text, or email. You can opt out anytime. Just reply STOP or let us know.</p>
          <p>We don&apos;t sell your info. This isn&apos;t a loan application. Assumption is subject to lender approval.</p>
        </div>
      )}
    </div>
  );
}

function SmartStickyCTA({ scrollToForm }: { scrollToForm: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const topForm = document.getElementById("ppc-form");
      const bottomForm = document.getElementById("ppc-form-bottom");

      function isInViewport(el: Element | null): boolean {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      }

      const eitherFormVisible = isInViewport(topForm) || isInViewport(bottomForm);
      const scrolledPastTopForm = topForm
        ? topForm.getBoundingClientRect().bottom < 0
        : false;

      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        setVisible(!eitherFormVisible);
      } else {
        setVisible(scrolledPastTopForm && !eitherFormVisible);
      }
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  function scrollToNearest() {
    const topForm = document.getElementById("ppc-form");
    const bottomForm = document.getElementById("ppc-form-bottom");
    if (!topForm || !bottomForm) { scrollToForm(); return; }
    const topDist = Math.abs(topForm.getBoundingClientRect().top);
    const bottomDist = Math.abs(bottomForm.getBoundingClientRect().top);
    const target = topDist <= bottomDist ? topForm : bottomForm;
    target.scrollIntoView({ behavior: "smooth" });
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <button
        onClick={scrollToNearest}
        className="w-full bg-[#1D5C96] text-white font-bold text-base py-4 px-6 shadow-2xl hover:bg-[#174a7a] transition-colors"
        style={{ minHeight: 56 }}
      >
        See All 1,200+ Properties →
      </button>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function NewPPCPage({ variantKey }: { variantKey: string }) {
  const config = VARIANT_CONFIGS[variantKey] || VARIANT_CONFIGS.general;
  const utm = useUTMParams();

  const [listings, setListings] = useState<PPCListing[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  function validateEmail(val: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function validatePhone(val: string): boolean {
    const digits = val.replace(/\D/g, '');
    if (digits.length < 10) return false;
    const fake = ['0000000000','1111111111','2222222222','3333333333','4444444444',
                  '5555555555','6666666666','7777777777','8888888888','9999999999',
                  '5555551234','5555550100'];
    return !fake.includes(digits.slice(-10));
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetch(`/api/ppc-listings?variant=${config.variant}`)
      .then((r) => r.json())
      .then((data: PPCListing[]) => setListings(data))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [config.variant]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailOk = validateEmail(email);
    const phoneOk = validatePhone(phone);
    setEmailError(emailOk ? '' : 'Please enter a valid email');
    setPhoneError(phoneOk ? '' : 'Please enter a valid phone number');
    if (!name.trim() || !emailOk || !phoneOk) return;
    setSubmitting(true);

    try {
      await fetch('/api/ppc-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          source: config.source,

          formType: `Form: PPC - ${config.source.replace('PPC - ', '')}`,
          ...utm,
        }),
      });

      // Auto-register PPC leads via Supabase Auth so they bypass the gate on /homes
      try {
        const supabase = createClient();
        const [firstName, ...rest] = name.trim().split(' ');
        const lastName = rest.join(' ');
        await supabase.auth.signUp({
          email: email.trim(),
          password: crypto.randomUUID().slice(0, 16),
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              phone: phone.trim(),
              user_type: 'buyer',
            },
          },
        });
        // FUB + Telegram notification (fire-and-forget)
        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName,
            lastName,
            email: email.trim(),
            phone: phone.trim(),
            userType: 'buyer',
          }),
        }).catch(() => {});
      } catch {}

      // Fire Meta Pixel Lead event
      console.log('>>> ABOUT TO FIRE META PIXEL LEAD');
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead');
        console.log('>>> META PIXEL LEAD FIRED SUCCESSFULLY');
      } else {
        console.error('>>> META PIXEL LEAD SKIPPED: fbq not loaded');
      }

      // Fire Google Ads conversion, wait for it to send before navigating
      if (typeof window !== 'undefined' && window.gtag) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 1500); // safety timeout
          window.gtag!('event', 'conversion', {
            send_to: 'AW-17997636825/EvE5CJ69yY8cENnJ-IVD',
            value: 50.0,
            currency: 'USD',
            event_callback: () => {
              clearTimeout(timeout);
              resolve();
            },
          });
        });
      } else {
        console.error('>>> GOOGLE ADS CONVERSION SKIPPED: gtag not loaded. Check NEXT_PUBLIC_GADS_ID env var.');
      }

      window.location.href = 'https://assumableguy.com/homes';
    } catch {
      setSubmitting(false);
    }
  }

  const scrollToForm = () => {
    document.getElementById('ppc-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const visibleListings = isMobile ? listings.slice(0, 3) : listings;

  return (
    <div className="min-h-screen bg-white font-sans pb-20 md:pb-0">
      {/* ─── Section 1: Hero with Form Above the Fold ─── */}
      <section className="bg-white px-4 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="mx-auto max-w-6xl md:grid md:grid-cols-2 md:gap-12 items-center">
          {/* Left Column: Headline */}
          <div className="mb-10 md:mb-0">
            <p className="uppercase tracking-wide text-xs font-semibold text-[#1D5C96] mb-3">
              The Assumable Guy &middot; Colorado
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              {config.headline}
            </h1>
            <p className="text-lg text-gray-600 mb-4">{config.subheadline}</p>
            <div className="flex items-center gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 20 20" fill="#F59E0B">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-sm text-gray-600">
                Colorado&apos;s only team closing assumable deals every week
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Image
                src="/images/ryan-headshot.png"
                alt="Ryan Thomson"
                width={48}
                height={48}
                className="rounded-full object-cover border-2 border-[#1D5C96]"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">Ryan Thomson</p>
                <p className="text-xs text-gray-500">Licensed CO Agent &middot; The Assumable Guy</p>
              </div>
            </div>
          </div>

          {/* Right Column: Form Card */}
          <div id="ppc-form" className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">See Available Properties</h2>
            <p className="text-sm text-gray-500 mb-6">100% free. No sales pressure, ever.</p>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Your Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5C96] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                    onBlur={() => setEmailError(email && !validateEmail(email) ? 'Please enter a valid email' : '')}
                    required
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5C96] focus:border-transparent ${emailError ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Phone <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    placeholder="(719) 487-2200"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(''); }}
                    onBlur={() => setPhoneError(phone && !validatePhone(phone) ? 'Please enter a valid phone number' : '')}
                    required
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5C96] focus:border-transparent ${phoneError ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                </div>
                <button
                  type="submit"
                  disabled={submitting || !name.trim() || !validateEmail(email) || !validatePhone(phone)}
                  className="w-full bg-[#1D5C96] hover:bg-[#174a7a] text-white font-bold text-base py-4 rounded-xl transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending\u2026' : 'See All Properties \u2192'}
                </button>
                <ConsentLine />
              </form>
          </div>
        </div>
      </section>

      {/* ─── Section 2: Property Cards ─── */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Live Assumable Properties</h2>
            <p className="text-gray-500 text-sm">Rates under 3.5% &middot; Highest savings first &middot; Updated daily</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(isMobile ? 3 : 6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-2xl" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="text-lg">
                We&apos;re updating our list right now. Enter your info above and we&apos;ll send
                you the latest properties.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleListings.map((l) => (
                <div
                  key={l.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer border border-gray-100"
                >
                  {/* Photo */}
                  <div className="relative h-48 w-full bg-gray-100">
                    {l.photoUrl ? (
                      <Image
                        src={l.photoUrl}
                        alt={l.city}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                    )}
                    {/* Rate badge */}
                    <span className="absolute bottom-3 left-3 bg-[#1D5C96] text-white text-sm font-bold px-3 py-1 rounded-full shadow">
                      {l.assumableRate.toFixed(2)}% rate
                    </span>
                    {/* Loan type badge */}
                    <span
                      className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full ${
                        l.loanType === 'VA'
                          ? 'bg-blue-600 text-white'
                          : 'bg-orange-500 text-white'
                      }`}
                    >
                      {l.loanType}
                    </span>
                  </div>
                  {/* Card body */}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {l.city}, {l.state}
                    </p>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-extrabold text-gray-900">
                        ${l.assumableMonthlyPayment.toLocaleString()}/mo
                      </span>
                      <span className="text-xs text-gray-400">assumed payment</span>
                    </div>
                    {l.monthlySavings > 0 && (
                      <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200 mb-3">
                        &#8595; Save ${l.monthlySavings.toLocaleString()}/mo vs. today&apos;s rates
                      </div>
                    )}
                    <div className="border-t border-gray-100 pt-3">
                      <span className="text-xs text-gray-500">
                        {l.beds} bd &middot; {l.baths} ba &middot; {l.sqft?.toLocaleString()} sqft
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Repeat CTA */}
          <div className="mt-10 text-center">
            <button
              onClick={scrollToForm}
              className="bg-[#1D5C96] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#174a7a] transition-colors text-base"
            >
              See All 1,200+ Properties &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* ─── Section 3: Stats Bar ─── */}
      <section className="bg-white px-4 py-12 border-t border-b border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          <div>
            <p className="text-4xl font-extrabold text-[#1D5C96] mb-1">1,200+</p>
            <p className="text-sm text-gray-500 font-medium">Assumable Properties Tracked</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-[#1D5C96] mb-1">2-3%</p>
            <p className="text-sm text-gray-500 font-medium">Average Assumed Rate</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-[#1D5C96] mb-1">$1,000+</p>
            <p className="text-sm text-gray-500 font-medium">Average Monthly Savings</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-[#1D5C96] mb-1">5.0 &#9733;</p>
            <p className="text-sm text-gray-500 font-medium">Google Review Rating</p>
          </div>
        </div>
      </section>

      {/* ─── Section 4: Testimonials ─── */}
      <section className="bg-gray-50 px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">Real Results From Real Buyers</h2>
        <div className="md:grid md:grid-cols-2 gap-6 max-w-4xl mx-auto space-y-6 md:space-y-0">
          {/* Testimonial 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="text-5xl text-[#1D5C96] font-serif leading-none mb-3">&ldquo;</div>
            <p className="text-gray-700 text-base leading-relaxed mb-4 italic">
              Jeremy put $15K down on a $380K property and locked in a 2.65% rate. His payment is over $900/month less than his neighbor who bought the same month.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1D5C96] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                J
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Jeremy</p>
                <p className="text-xs text-gray-500">Colorado Springs &middot; First-Time Buyer</p>
              </div>
            </div>
          </div>
          {/* Testimonial 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="text-5xl text-[#1D5C96] font-serif leading-none mb-3">&ldquo;</div>
            <p className="text-gray-700 text-base leading-relaxed mb-4 italic">
              Ben and Liz put $16K down on a $430,000 home at 2.99%. They would have needed $80K+ to get the same payment on a new loan.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1D5C96] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                B&amp;L
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Ben &amp; Liz</p>
                <p className="text-xs text-gray-500">Colorado &middot; Primary Residence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 5: How It Works ─── */}
      <section className="bg-white px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-[#1D5C96] text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-4">
              1
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">Browse the Properties</p>
            <p className="text-sm text-gray-500">
              See real homes with 2-3% rates, monthly payment, and savings &mdash; no registration required.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-[#1D5C96] text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-4">
              2
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">Tell Us What You Like</p>
            <p className="text-sm text-gray-500">
              Pick the properties that interest you. We&apos;ll pull the full loan details and equity info.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-[#1D5C96] text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-4">
              3
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">We Handle Everything</p>
            <p className="text-sm text-gray-500">
              From offer to close, we manage the assumption process. Average close: 45-90 days.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Section 6: Bottom Form ─── */}
      <section className="bg-gray-50 px-4 py-16">
        <div id="ppc-form-bottom" className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Ready to See the Properties?</h2>
          <p className="text-sm text-gray-500 mb-6">100% free. No sales pressure, ever.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Your Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Alex Johnson" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5C96] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
              <input type="email" placeholder="alex@example.com" value={email} onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }} onBlur={() => setEmailError(email && !validateEmail(email) ? "Please enter a valid email" : "")} required className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5C96] focus:border-transparent ${emailError ? "border-red-400" : "border-gray-200"}`} />
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Phone <span className="text-red-500">*</span></label>
              <input type="tel" placeholder="(719) 487-2200" value={phone} onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(""); }} onBlur={() => setPhoneError(phone && !validatePhone(phone) ? "Please enter a valid phone number" : "")} required className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5C96] focus:border-transparent ${phoneError ? "border-red-400" : "border-gray-200"}`} />
              {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
            </div>
            <button type="submit" disabled={submitting || !name.trim() || !validateEmail(email) || !validatePhone(phone)} className="w-full bg-[#1D5C96] hover:bg-[#174a7a] text-white font-bold text-base py-4 rounded-xl transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? "Sending…" : "See All Properties →"}
            </button>
            <ConsentLine />
          </form>
        </div>
      </section>

      {/* ─── Section 7: Footer ─── */}
      <footer className="bg-[#1D5C96] px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Image
            src="/images/ryan-headshot.png"
            alt="Ryan Thomson"
            width={80}
            height={80}
            className="rounded-full mx-auto mb-4 border-4 border-white object-cover"
          />
          <p className="text-white text-xl font-bold mb-1">Ryan Thomson</p>
          <p className="text-blue-100 text-sm mb-4">The Assumable Guy &middot; Licensed Colorado Agent</p>
          <a
            href="tel:7196243472"
            className="text-blue-100 text-sm hover:text-white transition-colors"
          >
            (719) 624-3472
          </a>
          <p className="text-blue-200 text-xs mt-6">
            Loan assumption subject to lender approval. Rates vary by property. Results not guaranteed.
          </p>
        </div>
      </footer>

      {/* ─── Smart Sticky CTA ─── */}
      <SmartStickyCTA scrollToForm={scrollToForm} />
    </div>
  );
}
