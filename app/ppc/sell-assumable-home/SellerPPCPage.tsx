'use client';

import { useState } from 'react';
import { useUTMParams } from '../../../lib/useUTMParams';

export default function SellerPPCPage() {
  const utmParams = useUTMParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    message: '',
  });
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
          type: 'seller',
          source: 'PPC - Seller Landing Page',
          formType: 'Form: Seller PPC',
          timestamp: new Date().toISOString(),
        }),
      });
      if (typeof window !== 'undefined' && typeof (window as unknown as Record<string, unknown>).fbq === 'function') {
        ((window as unknown) as { fbq: (...args: string[]) => void }).fbq('trackCustom', 'SellerInquiry');
      }
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">We got your info!</h2>
          <p className="text-gray-600 mb-4">The Assumable Guy team will reach out within 24 hours to discuss your home and how to sell it with your assumable mortgage advantage.</p>
          <p className="text-brand font-semibold">Or call now: (719) 624-3472</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1D5C96] to-[#0f3a5e] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Your 2-3% Mortgage Rate Is a Selling Superpower
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-6">
            Buyers will pay full price, or more, to assume your low FHA or VA rate. Let us show you how much your rate is really worth.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-blue-200">
            <span className="flex items-center gap-1">✓ Free consultation</span>
            <span className="flex items-center gap-1">✓ 90+ closings completed</span>
            <span className="flex items-center gap-1">✓ Colorado&apos;s #1 assumable mortgage team</span>
          </div>
        </div>
      </section>

      {/* Value Prop */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Selling With an Assumable Mortgage Gets You More</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-bold text-gray-900 mb-2">Higher Offers</h3>
              <p className="text-sm text-gray-600">Buyers saving $1,000+/month on their mortgage will compete harder for your home.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-bold text-gray-900 mb-2">Larger Buyer Pool</h3>
              <p className="text-sm text-gray-600">Your home appeals to buyers who can&apos;t afford today&apos;s 6-7% rates but can afford your 2-3% rate.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="font-bold text-gray-900 mb-2">We Handle Everything</h3>
              <p className="text-sm text-gray-600">90+ assumable closings. We know the process, the lenders, and the pitfalls. You just sell.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Get a Free Assumable Sale Consultation</h2>
          <p className="text-gray-500 text-center mb-6">Tell us about your home and we&apos;ll show you what your low rate is worth to buyers.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="website" style={{display:'none'}} tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <input
              type="text"
              placeholder="Full Name *"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
            <input
              type="email"
              placeholder="Email Address *"
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
            <input
              type="tel"
              placeholder="Phone Number *"
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
            <input
              type="text"
              placeholder="Property Address"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
            <textarea
              placeholder="Tell us about your situation (optional)"
              rows={3}
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1D5C96] hover:bg-[#174a7a] disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-base"
            >
              {loading ? 'Sending...' : 'Get My Free Consultation →'}
            </button>
            <p className="text-xs text-center text-gray-400">
              Free. No obligation. We personally respond within 24 hours.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
