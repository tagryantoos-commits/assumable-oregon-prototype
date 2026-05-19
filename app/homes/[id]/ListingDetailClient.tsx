'use client';

import { useState, useEffect } from 'react';
import { Listing, formatPrice, calcSavingsVsConventional } from '../../../lib/listings';
import { trackMetaLead, trackMetaViewContent } from '../../../components/MetaPixel';
import { useUTMParams } from '../../../lib/useUTMParams';
import { trackActivity } from '../../../lib/tracking';

interface Props {
  listing: Listing;
}

export default function ListingDetailClient({ listing }: Props) {
  const utmParams = useUTMParams();
  const monthlySavings = calcSavingsVsConventional(listing);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fire ViewContent on property detail page load
  useEffect(() => {
    trackMetaViewContent({
      content_name: `${listing.address}, ${listing.city}`,
      content_category: `${listing.loanType} Assumable Mortgage`,
      content_ids: [listing.id],
      value: listing.price,
      currency: 'USD',
    });

    // Log to our own activity store (only fires for authenticated users;
    // dedupes to once per 30min per (user, listing) via sessionStorage).
    trackActivity('property_viewed', {
      listing_id: listing.id,
      address: `${listing.address}, ${listing.city}`,
      city: listing.city,
      price: listing.price,
      assumable_rate: listing.assumableRate,
      monthly_savings: monthlySavings,
    });
  }, [listing.id, listing.address, listing.city, listing.loanType, listing.price, listing.assumableRate, monthlySavings]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    timeline: 'asap',
    message: '',
  });

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
          listingId: listing.id,
          address: `${listing.address}, ${listing.city}`,
          price: listing.price,
          assumableRate: listing.assumableRate,
          source: 'listing_detail',
          formType: 'Form: Listing Inquiry',
          timestamp: new Date().toISOString(),
        }),
      });
      trackMetaLead({ em: formData.email, ph: formData.phone, fn: formData.name });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand to-brand text-white p-5">
        <div className="text-sm font-medium opacity-90 mb-1">This listing</div>
        <div className="text-2xl font-black">{formatPrice(listing.price)}</div>
        <div className="flex items-center gap-3 mt-2 text-sm">
          <span className="bg-white/20 px-2 py-0.5 rounded-full">{listing.assumableRate}% rate</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full">{listing.loanType}</span>
          {monthlySavings > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full">
              Save ${monthlySavings.toLocaleString()}/mo
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        {submitted ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">We got your request!</h3>
            <p className="text-gray-600 text-sm mb-3">
              The Assumable Guy team will reach out within 24 hours with full details on this property.
            </p>
            <p className="text-brand font-semibold text-sm">
              Or call now: <a href="tel:7196243472">(719) 624-3472</a>
            </p>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-gray-900 mb-1">Request a Tour or Talk With an Agent</h3>
            <p className="text-sm text-gray-500 mb-4">Schedule a showing or talk with our team</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Full Name *"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
              />
              <input
                type="email"
                placeholder="Email Address *"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                required
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
              />
              <select
                value={formData.timeline}
                onChange={e => setFormData({...formData, timeline: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light text-gray-700"
              >
                <option value="asap">Looking ASAP</option>
                <option value="1-3 months">1–3 months</option>
                <option value="3-6 months">3–6 months</option>
                <option value="6+ months">6+ months, just exploring</option>
              </select>
              <textarea
                placeholder="Any questions? (optional)"
                rows={2}
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light resize-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {loading ? 'Sending...' : 'Submit'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500 mb-2">Or reach us directly:</p>
              <a href="tel:7196243472" className="text-brand font-bold text-sm hover:text-brand-dark">
                📞 (719) 624-3472
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
