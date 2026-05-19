'use client';

import { useState } from 'react';
import { useUTMParams } from '../../lib/useUTMParams';


function SellerLeadForm({ source, variant }: { source: string; variant: 'hero' | 'bottom' }) {
  const utmParams = useUTMParams();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...utmParams,
          source,
          type: 'seller',
          formType: 'Form: Seller Valuation Request',
          propertyAddress: formData.address,
          timestamp: new Date().toISOString(),
        }),
      });
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('trackCustom', 'SellerInquiry');
      }
    } catch {
      // still show success
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className={`text-xl font-bold mb-2 ${variant === 'hero' ? 'text-white' : 'text-white'}`}>
          We got your request!
        </h3>
        <p className={`text-sm ${variant === 'hero' ? 'text-gray-300' : 'text-brand-light'}`}>
          Ryan will personally review your property and reach out within minutes with your assumable valuation.
        </p>
      </div>
    );
  }

  const inputClasses = 'w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-light';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="text"
          placeholder="Full Name"
          required
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className={inputClasses}
          style={{ color: '#111827', backgroundColor: '#ffffff' }}
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="Email Address"
          required
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          className={inputClasses}
          style={{ color: '#111827', backgroundColor: '#ffffff' }}
        />
      </div>
      <div>
        <input
          type="tel"
          placeholder="Phone Number"
          required
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
          className={inputClasses}
          style={{ color: '#111827', backgroundColor: '#ffffff' }}
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="Property Address (optional)"
          value={formData.address}
          onChange={e => setFormData({ ...formData, address: e.target.value })}
          className={inputClasses}
          style={{ color: '#111827', backgroundColor: '#ffffff' }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-base shadow-lg"
      >
        {loading ? 'Sending...' : 'Get My Free Valuation →'}
      </button>
      <p className="text-xs text-center text-gray-400">
        Free. No obligation. We respond within minutes.
      </p>
    </form>
  );
}

export default function SellPageClient() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-dark via-brand-dark to-brand text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-brand-light text-sm font-medium px-3 py-1.5 rounded-full mb-6">
                <span>For Sellers with Low-Rate Loans</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                List as Assumable.<br />
                <span className="text-brand-light">Sell for More.</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-xl mb-6">
                Buyers who can assume your low-rate mortgage will pay <strong className="text-white">more</strong> for your home than buyers who need a new loan at 6.5%+.
              </p>
              <div className="flex items-center gap-4 justify-center lg:justify-start text-sm text-gray-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-green-400">✓</span> 90+ Closings
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-green-400">✓</span> Free Valuation
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-green-400">✓</span> No Obligation
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Get a Free Assumable Valuation</h3>
              <p className="text-gray-500 text-sm mb-4">Find out what your home is really worth with its low-rate advantage.</p>
              <SellerLeadForm source="sell-page-hero" variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* The Math */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-4">
            Why Buyers Pay More for Assumable Homes
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-8">
            When a buyer can assume your 3% rate instead of borrowing at 6.5%+, their monthly payment drops dramatically. That savings translates into a higher purchase price.
          </p>
          <p className="text-gray-700 text-center max-w-2xl mx-auto mb-12 text-lg leading-relaxed">
            <strong>An assumable mortgage allows a buyer to take over the seller&apos;s existing loan balance, terms, and interest rate with lender approval.</strong> Every FHA and VA loan is eligible for assumption. For sellers, this means your low-rate mortgage from 2019-2022 is a competitive advantage that attracts more buyers and commands a premium price.
          </p>

          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 md:p-10 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Example: $400,000 Home with a 3% Assumable Loan
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">New Loan at 6.5%</div>
                <div className="text-3xl font-black text-gray-900">$2,528<span className="text-base font-normal text-gray-500">/mo</span></div>
                <div className="text-sm text-gray-500 mt-1">$400k loan · 30yr · 6.5%</div>
              </div>
              <div className="bg-brand-50 rounded-xl p-5 border border-brand-200">
                <div className="text-sm font-semibold text-brand uppercase tracking-wide mb-2">Assumed Loan at 3%</div>
                <div className="text-3xl font-black text-brand-dark">$1,686<span className="text-base font-normal text-brand">/mo</span></div>
                <div className="text-sm text-brand mt-1">$400k loan · 28yr remaining · 3%</div>
              </div>
            </div>
            <div className="mt-6 bg-brand-dark text-white rounded-xl p-5 text-center">
              <div className="text-sm font-semibold text-brand-light mb-1">Monthly Savings for the Buyer</div>
              <div className="text-3xl font-black">$842/month</div>
              <p className="text-brand-light text-sm mt-2">
                That&apos;s $10,100/year. Buyers will pay a premium for your home to lock that in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 text-center">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="text-4xl md:text-5xl font-black text-brand mb-2">23%</div>
              <div className="text-gray-600 font-medium">Faster sales for assumable listings</div>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="text-4xl md:text-5xl font-black text-brand mb-2">90+</div>
              <div className="text-gray-600 font-medium">Assumable closings by our team</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Three steps to selling your home for top dollar using its assumable advantage.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-brand text-white rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4">1</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">We List Your Home</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We market your home highlighting the assumable rate as the headline feature. This attracts a pool of motivated buyers other agents miss.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-brand text-white rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4">2</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Buyers From Our Network</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We have a database of qualified buyers specifically looking for assumable mortgages. They come to us, not the other way around.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-brand text-white rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4">3</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Match, Negotiate, Close</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We handle the assumption paperwork, gap financing coordination, and lender approval process. You get a premium price with less hassle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA with Form */}
      <section className="bg-gradient-to-br from-brand-dark to-brand py-16 md:py-20">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Ready to See What Your Home Is Really Worth?
          </h2>
          <p className="text-brand-light text-lg mb-8 max-w-xl mx-auto">
            Get a free valuation that factors in your assumable rate advantage. Most sellers are surprised how much more their home is worth.
          </p>
          <div className="bg-white rounded-2xl p-6">
            <SellerLeadForm source="sell-page-bottom" variant="bottom" />
          </div>
          <div className="mt-6">
            <a
              href="tel:7196243472"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              📞 Or call (719) 624-3472
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
