'use client';

import { useState } from 'react';


export default function CourseWaitlistForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
          type: 'agent',
          source: 'course-waitlist',
          formType: 'Form: Course Waitlist',
          timestamp: new Date().toISOString(),
        }),
      });
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('trackCustom', 'CourseWaitlist');
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
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re on the waitlist.</h3>
        <p className="text-gray-600 mb-2">
          We&apos;ll email you as soon as enrollment opens.
        </p>
        <p className="text-brand font-semibold">
          Questions? Call (719) 624-3472
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      {/* Honeypot */}
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
        placeholder="Phone (optional)"
        value={formData.phone}
        onChange={e => setFormData({...formData, phone: e.target.value})}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-light"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-base shadow-lg shadow-brand-200"
      >
        {loading ? 'Sending...' : 'Join the Waitlist'}
      </button>
      <p className="text-xs text-center text-gray-400">
        Free to join. We&apos;ll notify you when enrollment opens.
      </p>
    </form>
  );
}
