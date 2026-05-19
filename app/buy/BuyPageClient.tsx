'use client';

import { useState } from 'react';
import { trackMetaLead } from '../../components/MetaPixel';

// ─── Lead Form ────────────────────────────────────────────────────────────────

function LeadForm({ id = 'top', showBudget = true }: { id?: string; showBudget?: boolean }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', budget: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/ppc-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, formId: id, formType: 'Form: Buy Page' }),
      });
      if (!res.ok) throw new Error('api error');

      // Fire Google Ads conversion event
      if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'conversion', {
          send_to: 'AW-17997636825/EvE5CJ69yY8cENnJ-IVD',
          value: 50.0,
          currency: 'USD',
        });
      }
      // Fire Meta Pixel Lead event
      trackMetaLead({ em: form.email, ph: form.phone, fn: form.name });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="text-center py-8 px-4">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">You&rsquo;re in!</h3>
        <p className="text-gray-600 mb-4">
          Ryan Thomson will personally reach out within <strong>2 hours</strong> with available
          Colorado Springs homes at your rate.
        </p>
        <a
          href="tel:7196243472"
          className="inline-flex items-center gap-2 bg-brand text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-dark transition"
        >
          📞 Call Now: (719) 624-3472
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="text"
        placeholder="Full Name *"
        required
        value={form.name}
        onChange={set('name')}
        className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        type="email"
        placeholder="Email Address *"
        required
        value={form.email}
        onChange={set('email')}
        className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        type="tel"
        placeholder="Phone Number *"
        required
        value={form.phone}
        onChange={set('phone')}
        className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      {showBudget && (
        <select
          required
          value={form.budget}
          onChange={set('budget')}
          className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="">What&rsquo;s your budget? *</option>
          <option value="$200k–$300k">$200,000 – $300,000</option>
          <option value="$300k–$400k">$300,000 – $400,000</option>
          <option value="$400k–$500k">$400,000 – $500,000</option>
          <option value="$500k+">$500,000+</option>
        </select>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-brand text-white font-bold py-4 rounded-xl text-base hover:bg-brand-dark transition disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending…' : 'Show Me Available Homes →'}
      </button>
      {status === 'error' && (
        <p className="text-red-600 text-xs text-center">
          Something went wrong. Call us directly: (719) 624-3472
        </p>
      )}
      <p className="text-gray-400 text-xs text-center">
        Free. No obligation. We respond within 2 hours.
      </p>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BuyPageClient() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Do I need to be a veteran to assume a loan?',
      a: 'No! FHA assumable loans are available to ANY qualified buyer, no military service required. VA loans can also be assumed by non-veterans in many cases, though the seller\'s VA entitlement stays with the property. We\'ll help you navigate which loans work best for your situation.',
    },
    {
      q: "What's the catch?",
      a: "No catch. Assumable mortgages are a federally protected right on FHA and VA loans. The main consideration is the equity gap. You'll need to cover the difference between the home's current value and the remaining loan balance. This is often financed with a second mortgage, HELOC, or cash. We'll show you all your options.",
    },
    {
      q: 'How long does it take to close?',
      a: 'Typically 45–90 days. Assumptions take a bit longer than conventional purchases because the lender must formally approve the transfer. Our team has done 150+ of these and knows exactly how to push the paperwork through efficiently.',
    },
    {
      q: 'What is the equity gap?',
      a: "The equity gap is the difference between what the seller still owes on the loan and the home's purchase price. For example: home sells for $450K, seller's remaining loan balance is $320K. The equity gap is $130K. You cover this with cash, a second loan, or a HELOC. We have lender partners who specialize in bridging this gap.",
    },
  ];

  return (
    <div className="bg-white min-h-screen font-sans">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-gray-900 via-brand-dark to-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">

            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-brand/30 border border-brand/50 text-brand-light text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                📍 Colorado Springs · Fort Carson · Peterson · Schriever
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-4">
                Save $700–$1,400/Month on Your Mortgage in Colorado Springs
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Buy a home at the seller&rsquo;s original low interest rate (as low as 2.5%) instead of
                today&rsquo;s 6.8%.
              </p>

              {/* Rate visual (mobile hero) */}
              <div className="flex gap-3 mb-6 md:hidden">
                <div className="flex-1 bg-red-900/30 border border-red-700/40 rounded-xl p-4 text-center">
                  <div className="text-xs text-red-400 font-semibold mb-1">❌ Today&rsquo;s Rate</div>
                  <div className="text-xl font-black text-white">6.8%</div>
                  <div className="text-red-300 text-sm font-bold mt-1">$3,260/mo</div>
                </div>
                <div className="flex items-center text-gray-400 font-bold text-xl">vs</div>
                <div className="flex-1 bg-green-900/30 border border-green-700/40 rounded-xl p-4 text-center">
                  <div className="text-xs text-green-400 font-semibold mb-1">✅ Assumable Rate</div>
                  <div className="text-xl font-black text-white">3.25%</div>
                  <div className="text-green-300 text-sm font-bold mt-1">$2,176/mo</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>⭐⭐⭐⭐⭐</span>
                <span>150+ Colorado families helped</span>
              </div>
            </div>

            {/* Right: form */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Get Your Free Home List</h2>
              <p className="text-gray-500 text-sm mb-5">
                Colorado Springs assumable homes in your budget. Ryan responds within 2 hours.
              </p>
              <LeadForm id="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* ── RATE COMPARISON ──────────────────────────────────────────────── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              The Math Is Impossible to Ignore
            </h2>
            <p className="text-gray-500 mt-2 text-sm">Based on a $500,000 home purchase</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 items-center">
            {/* High rate card */}
            <div className="bg-white border-2 border-red-200 rounded-2xl p-6 text-center shadow-sm">
              <div className="text-4xl mb-2">😰</div>
              <div className="text-sm font-semibold text-red-600 mb-1">New Loan Today</div>
              <div className="text-4xl font-black text-red-600 mb-1">6.8%</div>
              <div className="text-2xl font-bold text-gray-900">$3,260</div>
              <div className="text-sm text-gray-500">per month</div>
            </div>

            {/* Savings badge */}
            <div className="text-center py-4">
              <div className="inline-block bg-brand text-white rounded-2xl px-6 py-4 shadow-xl">
                <div className="text-sm font-semibold mb-1">You Keep</div>
                <div className="text-3xl font-black">$1,084</div>
                <div className="text-sm opacity-80">every month</div>
              </div>
              <div className="mt-3 text-gray-500 text-xs">= $13,008/year · $390,240 over 30 years</div>
            </div>

            {/* Low rate card */}
            <div className="bg-white border-2 border-green-200 rounded-2xl p-6 text-center shadow-sm">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-sm font-semibold text-green-600 mb-1">Assumable Rate</div>
              <div className="text-4xl font-black text-green-600 mb-1">3.25%</div>
              <div className="text-2xl font-bold text-gray-900">$2,176</div>
              <div className="text-sm text-gray-500">per month</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-STEP PROCESS ───────────────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-2 text-sm">Three steps to locking in a rate that would otherwise be gone forever</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: '📋',
                title: 'Get Pre-Screened (Free)',
                desc: 'Fill out the form above. We do a soft credit pull. No impact to your score. Takes 5 minutes. You\'ll know your qualification range same day.',
              },
              {
                step: '02',
                icon: '🔍',
                title: 'Browse Homes With Assumable Loans',
                desc: 'Ryan personally sends you Colorado Springs homes with assumable FHA and VA loans in your budget. These don\'t appear on regular Zillow searches.',
              },
              {
                step: '03',
                icon: '🏡',
                title: 'Close at the Seller\'s Original Rate',
                desc: 'Our team handles every document. You lock in the seller\'s low rate permanently. 45–90 days to close. That payment is yours for life.',
              },
            ].map(item => (
              <div key={item.step} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-brand text-white rounded-xl text-2xl mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-brand mb-1 uppercase tracking-wide">Step {item.step}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────────── */}
      <section className="py-12 bg-brand">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-6 text-center text-white">
            <div>
              <div className="text-3xl md:text-4xl font-black mb-1">150+</div>
              <div className="text-sm text-brand-light opacity-90">Families Helped</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black mb-1">$48M+</div>
              <div className="text-sm text-brand-light opacity-90">Lifetime Savings</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black mb-1">#1</div>
              <div className="text-sm text-brand-light opacity-90">Colorado&rsquo;s Assumable Team</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between font-semibold text-gray-900 hover:bg-gray-50 transition"
                >
                  <span>{faq.q}</span>
                  <span className="text-brand text-xl ml-4">{faqOpen === i ? '−' : '+'}</span>
                </button>
                {faqOpen === i && (
                  <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM FORM ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50" id="get-started">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-gray-900 to-brand-dark rounded-3xl p-7 md:p-10 text-white">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🏡</div>
              <h2 className="text-2xl font-bold mb-2">Ready to Save $700–$1,400/Month?</h2>
              <p className="text-gray-300 text-sm">
                Fill out the form and Ryan Thomson will personally reach out with available Colorado
                Springs homes at low assumable rates.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <LeadForm id="bottom" />
            </div>
          </div>
        </div>
      </section>

      {/* ── STICKY MOBILE CTA ────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-brand shadow-2xl">
        <a
          href="#get-started"
          className="flex items-center justify-center gap-2 py-4 text-white font-bold text-base"
        >
          🏡 Show Me Available Homes →
        </a>
      </div>

      {/* ── MINIMAL FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-500 py-8 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs space-y-2">
          <p className="text-white font-semibold">
            The Assumable Guy · Ryan Thomson, Licensed CO Real Estate Agent · License #100092341
          </p>
          <p>
            <a href="tel:7196243472" className="hover:text-white">(719) 624-3472</a>
            {' · '}
            <a href="mailto:ryan@TheAssumableGuy.com" className="hover:text-white">ryan@TheAssumableGuy.com</a>
          </p>
          <p className="text-gray-600 leading-relaxed">
            The Assumable Guy is a licensed real estate brokerage in Colorado. Payment calculations are
            estimates based on loan balance and interest rate only and do not include taxes, insurance,
            HOA, or other costs. Individual savings will vary. Assumable mortgage availability is subject
            to lender approval and qualification. Not all FHA/VA loans are assumable. This is not legal
            or financial advice.
          </p>
          <p className="text-gray-600">© {new Date().getFullYear()} The Assumable Guy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
