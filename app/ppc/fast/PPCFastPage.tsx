'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { trackMetaLead } from '../../../components/MetaPixel';



export default function PPCFastPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const utmRef = useRef({ utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '', gclid: '', landing_url: '' });

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    utmRef.current = {
      utm_source: sp.get('utm_source') || '',
      utm_medium: sp.get('utm_medium') || '',
      utm_campaign: sp.get('utm_campaign') || '',
      utm_term: sp.get('utm_term') || '',
      utm_content: sp.get('utm_content') || '',
      gclid: sp.get('gclid') || '',
      landing_url: window.location.href,
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'ppc_fast_variant',
          type: 'buyer',
          formType: 'Form: PPC Fast Variant',
          timestamp: new Date().toISOString(),
          ...utmRef.current,
        }),
      });
    } catch {
      // still redirect
    } finally {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'conversion', {
          send_to: 'AW-17997636825/EvE5CJ69yY8cENnJ-IVD',
          value: 50.0,
          currency: 'USD',
        });
      }
      trackMetaLead({ em: formData.email, ph: formData.phone, fn: formData.name });
      setLoading(false);
      const firstName = formData.name.split(' ')[0];
      setTimeout(() => {
        window.location.href = `/ppc/thank-you?name=${encodeURIComponent(firstName)}`;
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Brand bar */}
      <div className="bg-brand py-2.5 px-4 flex items-center justify-between">
        <span className="text-white font-black text-lg tracking-tight">The Assumable Guy</span>
        <a href="tel:7196243472" className="text-white font-semibold text-sm hover:text-brand-light flex items-center gap-1.5">
          📞 <span className="hidden sm:inline">(719) 624-3472</span><span className="sm:hidden">Call Now</span>
        </a>
      </div>

      {/* Hero + Form */}
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-brand/20 border border-brand/30 text-brand-light text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Colorado&apos;s #1 Assumable Mortgage Team
          </div>
          <h1 className="text-3xl font-black text-white leading-tight mb-3">
            Save $1,084/Month.<br />Same House.
          </h1>
          <p className="text-gray-400 text-sm">
            Assume a 2-3% mortgage instead of paying 6.8%. Get the free list of available homes.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl mb-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Full Name"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-light"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-light"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
            />
            <input
              type="tel"
              placeholder="Phone"
              required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-light"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
            />
            <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg py-2 px-3">
              <span className="text-green-500">🔥</span>
              <span className="font-medium">Only 47 assumable homes left in CO Springs</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-lg shadow-lg"
            >
              {loading ? 'Sending...' : 'Get the Free List →'}
            </button>
            <p className="text-xs text-center text-gray-400">Free. No spam. Ryan responds personally.</p>
          </form>
        </div>

        {/* Single testimonial */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 mb-6">
          <p className="text-white text-sm leading-relaxed mb-3">&ldquo;$15K down on a $385K home at 2.65%. My payment is $943/month less than my neighbor.&rdquo;</p>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Investor, Colorado Springs</span>
            <span className="bg-brand/20 text-brand-light font-bold text-xs px-3 py-1 rounded-full border border-brand/30">$943/mo saved</span>
          </div>
        </div>

        {/* Agent trust */}
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand">
            <Image src="/images/ryan-headshot.png" alt="Ryan Thomson" width={40} height={40} className="w-full h-full object-cover object-top" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Ryan Thomson</div>
            <div className="text-xs text-gray-400">Licensed CO Agent · 90+ Closings</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-yellow-400 text-xs">★★★★★</span>
              <span className="text-xs text-gray-500">5.0 on Google</span>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal footer */}
      <footer className="text-center py-6 text-xs text-gray-600 px-4">
        <p>The Assumable Guy · Ryan Thomson · CO License #100092341 · (719) 624-3472</p>
        <p className="mt-1">Payment estimates only. Subject to lender approval. © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
