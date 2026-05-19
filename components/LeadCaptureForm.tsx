'use client';

import { useState, useEffect } from 'react';
import { useUTMParams } from '../lib/useUTMParams';
import { useAuth } from '../lib/useAuth';
import { trackMetaLead } from './MetaPixel';

interface LeadCaptureFormProps {
  title?: string;
  subtitle?: string;
  source?: string;
  compact?: boolean;
}

export default function LeadCaptureForm({ 
  title = 'Get the Full Colorado List',
  subtitle = '802 active assumable listings, updated daily',
  source = 'homepage',
  compact = false 
}: LeadCaptureFormProps) {
  const utmParams = useUTMParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'buyer',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pre-fill from Supabase profile if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        type: user.userType || prev.type,
      }));
    }
  }, [user]);

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
          formType: 'Form: Inline CTA',
          timestamp: new Date().toISOString(),
        }),
      });
      trackMetaLead({ em: formData.email, ph: formData.phone, fn: formData.name });
      try { localStorage.setItem('tag_any_form_submitted', '1'); } catch {}
      setSubmitted(true);
    } catch {
      try { localStorage.setItem('tag_any_form_submitted', '1'); } catch {}
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re on the list!</h3>
        <p className="text-gray-600 mb-2">
          Check your email. The Assumable Guy team will send you the full Colorado assumable listings within minutes.
        </p>
        <p className="text-brand font-semibold">
          Want to talk now? Call (719) 624-3472
        </p>
      </div>
    );
  }

  return (
    <div>
      {!compact && (
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-2">{subtitle}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
        {/* Honeypot, hidden from humans, bots fill it, server silently rejects */}
        <input type="text" name="website" style={{display:'none'}} tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <div className={compact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
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
            placeholder="Phone Number"
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-light"
          />
          <select
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light text-gray-700"
          >
            <option value="buyer">I&apos;m a Buyer</option>
            <option value="agent">I&apos;m an Agent</option>
            <option value="investor">I&apos;m an Investor</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand hover:bg-brand disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-base shadow-lg shadow-brand-200"
        >
          {loading ? 'Sending...' : 'Get the Full Colorado List →'}
        </button>
        <p className="text-xs text-center text-gray-400">
          Free. No spam. We personally respond within 24 hours.
        </p>
        <p className="text-xs text-center text-gray-400 leading-relaxed">
          By submitting, you consent to be contacted by The Assumable Guy via phone, text, and email regarding assumable mortgage properties. Message &amp; data rates may apply. Reply STOP to opt out.
        </p>
      </form>
    </div>
  );
}
