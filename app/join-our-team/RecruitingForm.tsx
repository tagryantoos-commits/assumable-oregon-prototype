'use client'

import { useState } from 'react'


export default function RecruitingForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    market: '',
    license: '',
    experience: '',
    brokerage: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `Recruiting Lead - Market: ${formData.market}, License: ${formData.license}, Experience: ${formData.experience}, Brokerage: ${formData.brokerage}`,
          source: 'join-our-team',
          formType: 'recruiting',
        }),
      })
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('trackCustom', 'AgentRecruit')
      }
      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 max-w-lg mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Application Received!
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Thanks for your interest in joining The Assumable Guy team. Ryan
            will review your application and reach out within 24-48 hours.
          </p>
        </div>
      </div>
    )
  }

  const inputClasses =
    'w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-light focus:border-brand-light'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className={inputClasses}
          placeholder="Your full name"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={inputClasses}
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            className={inputClasses}
            placeholder="(555) 555-5555"
          />
        </div>
      </div>

      <div>
        <label htmlFor="market" className="block text-sm font-semibold text-gray-700 mb-1">
          Market
        </label>
        <select
          id="market"
          name="market"
          required
          value={formData.market}
          onChange={handleChange}
          className={inputClasses}
        >
          <option value="">Select your market</option>
          <option value="Colorado Springs">Colorado Springs</option>
          <option value="Denver">Denver</option>
          <option value="Aurora">Aurora</option>
          <option value="Fort Collins">Fort Collins</option>
          <option value="Pueblo">Pueblo</option>
          <option value="Boulder">Boulder</option>
          <option value="Castle Rock">Castle Rock</option>
          <option value="Parker">Parker</option>
          <option value="Greeley">Greeley</option>
          <option value="Loveland">Loveland</option>
          <option value="Longmont">Longmont</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="license" className="block text-sm font-semibold text-gray-700 mb-1">
            License Number
          </label>
          <input
            type="text"
            id="license"
            name="license"
            required
            value={formData.license}
            onChange={handleChange}
            className={inputClasses}
            placeholder="CO license #"
          />
        </div>
        <div>
          <label htmlFor="experience" className="block text-sm font-semibold text-gray-700 mb-1">
            Experience Level
          </label>
          <select
            id="experience"
            name="experience"
            required
            value={formData.experience}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="">Select experience</option>
            <option value="0-5 closings">0-5 closings</option>
            <option value="6-20 closings">6-20 closings</option>
            <option value="21-50 closings">21-50 closings</option>
            <option value="50+ closings">50+ closings</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="brokerage" className="block text-sm font-semibold text-gray-700 mb-1">
          Current Brokerage
        </label>
        <input
          type="text"
          id="brokerage"
          name="brokerage"
          value={formData.brokerage}
          onChange={handleChange}
          className={inputClasses}
          placeholder="Your current brokerage (if any)"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand text-white font-bold py-4 rounded-xl hover:bg-brand-dark transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  )
}
