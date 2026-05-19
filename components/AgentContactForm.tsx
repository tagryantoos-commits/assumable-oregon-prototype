'use client';

import { useState } from 'react';
import { useUTMParams } from '../lib/useUTMParams';
import { trackMetaLead } from './MetaPixel';

export default function AgentContactForm({ source = 'homepage-talk-to-agent' }: { source?: string }) {
  const utmParams = useUTMParams();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
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
          type: 'buyer',
          formType: 'Form: Talk to Agent',
          timestamp: new Date().toISOString(),
        }),
      });
      trackMetaLead({ em: formData.email, ph: formData.phone, fn: formData.name });
      try { localStorage.setItem('tag_any_form_submitted', '1'); } catch {}
    } catch {
      try { localStorage.setItem('tag_any_form_submitted', '1'); } catch {}
      // still show success
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">We got your info!</h3>
        <p className="text-gray-500 text-sm">
          One of our assumable mortgage specialists will reach out within minutes.
        </p>
      </div>
    );
  }

  const inputClasses = 'w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Full Name"
          required
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className={inputClasses}
        />
        <input
          type="tel"
          placeholder="Phone Number"
          required
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
          className={inputClasses}
        />
      </div>
      <input
        type="email"
        placeholder="Email Address"
        required
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
        className={inputClasses}
      />
      <textarea
        placeholder="What are you looking for? (optional)"
        rows={3}
        value={formData.message}
        onChange={e => setFormData({ ...formData, message: e.target.value })}
        className={inputClasses + ' resize-none'}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-base shadow-lg"
      >
        {loading ? 'Sending...' : 'Connect Me with an Agent →'}
      </button>
      <p className="text-xs text-center text-gray-400">
        Free consultation. No obligation. We respond within minutes.
      </p>
    </form>
  );
}
