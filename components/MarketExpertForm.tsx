'use client';

import { useState } from 'react';

const USER_TYPES = ['Buyer', 'Seller', 'Agent', 'Investor'] as const;
type UserType = typeof USER_TYPES[number];

interface MarketExpertFormProps {
  /** Display name of the city, e.g. "Colorado Springs" */
  city: string;
}

export default function MarketExpertForm({ city }: MarketExpertFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    userType: '' as UserType | '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Derive source/formType from city name
  const sourceKey = city.toLowerCase().replace(/\s+/g, '_');
  const source = `${sourceKey}_expert_form`;
  const formType = `Form: ${city} Expert Contact`;

  // Stable id prefix for labels
  const idPrefix = sourceKey.slice(0, 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `I am a: ${formData.userType}`,
          source,
          formType,
          timestamp: new Date().toISOString(),
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Form submit error:', err);
      // Still show success — lead may have gone through
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-gray-900 font-semibold text-lg">
          Thanks! One of our agents will be in touch within 1 business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name */}
      <div>
        <label htmlFor={`${idPrefix}-name`} className="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          required
          autoComplete="name"
          value={formData.name}
          onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          placeholder="Jane Smith"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor={`${idPrefix}-email`} className="block text-sm font-medium text-gray-700 mb-1">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id={`${idPrefix}-email`}
          type="email"
          required
          autoComplete="email"
          value={formData.email}
          onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          placeholder="jane@example.com"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor={`${idPrefix}-phone`} className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          id={`${idPrefix}-phone`}
          type="tel"
          required
          autoComplete="tel"
          value={formData.phone}
          onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          placeholder="(719) 555-0100"
        />
      </div>

      {/* I am a... */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">
          I am a... <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {USER_TYPES.map(type => (
            <label
              key={type}
              className={`flex items-center justify-center gap-2 border rounded-lg px-4 py-3 cursor-pointer text-sm font-medium transition-colors ${
                formData.userType === type
                  ? 'border-brand bg-brand/5 text-brand'
                  : 'border-gray-300 text-gray-700 hover:border-brand/50'
              }`}
            >
              <input
                type="radio"
                name={`${idPrefix}-userType`}
                value={type}
                required
                checked={formData.userType === type}
                onChange={() => setFormData(p => ({ ...p, userType: type }))}
                className="sr-only"
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand hover:bg-brand-dark text-white font-bold px-6 py-4 rounded-xl transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2"
      >
        {loading ? 'Sending...' : 'Connect with an Expert'}
      </button>
    </form>
  );
}
