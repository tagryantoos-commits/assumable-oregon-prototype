import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import RecruitingForm from './RecruitingForm'

export const metadata: Metadata = {
  title: 'Join Our Team | The Assumable Guy',
  description:
    'Join The Assumable Guy real estate team. We have more leads than agents. Get 8+ motivated buyer leads per week, full training on assumable mortgages, and a clear path to your first closing.',
  alternates: {
    canonical: 'https://assumableguy.com/join-our-team',
  },
}

const offers = [
  {
    title: '8+ Motivated Buyer Leads Weekly',
    description:
      'We generate more assumable mortgage buyer leads than we can handle. You will never run out of people to call.',
  },
  {
    title: '50/50 Split on Team Leads, 90/10 on Yours',
    description:
      'Generous split on the leads we hand you, and keep almost everything on deals you bring in yourself.',
  },
  {
    title: 'Full Training Program',
    description:
      'Learn assumable mortgages inside and out, a niche most agents don\'t even know exists. Become the expert in your market.',
  },
  {
    title: 'UME Projects as Assumption Partner',
    description:
      'Our assumption partner has a 100% close track record. When your deal gets to the finish line, it crosses it.',
  },
  {
    title: 'CRM, AI Assistant & Operational Support',
    description:
      'We provide the tech stack, the systems, and the back-office support so you can focus on selling.',
  },
  {
    title: 'Clear 30-60-90 Day Path',
    description:
      'A structured ramp-up plan so you know exactly what to do from day one through your first closing and beyond.',
  },
]

const stats = [
  { value: '90+', label: 'Assumable Deals Closed' },
  { value: '8+', label: 'Buyer Leads Per Week' },
  { value: '4', label: 'Agents on Team' },
  { value: '7', label: 'Markets Expanding' },
]

const requirements = [
  'Active Colorado real estate license, Front Range area',
  'Full-time commitment with 6+ closings (or strong corporate background)',
  'Ready to join Keller Williams',
  'Hungry, coachable, and ready to own a niche',
]

export default function JoinOurTeamPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Image
            src="/images/ryan-headshot.png"
            alt="Ryan Thomson"
            width={200}
            height={200}
            className="rounded-full mx-auto mb-8"
          />
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            We Have More Leads Than Agents
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Join The Assumable Guy team and get 8+ motivated buyer leads per
            week from day one.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-brand py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-black mb-1">{stat.value}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What We Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div
                key={offer.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {offer.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {offer.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We're Looking For */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            Who We&apos;re Looking For
          </h2>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <ul className="space-y-4">
              {requirements.map((req) => (
                <li key={req} className="flex items-start gap-3">
                  <span className="text-brand font-bold text-lg mt-0.5">
                    &#10003;
                  </span>
                  <span className="text-gray-600 leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Apply Now
          </h2>
          <p className="text-gray-600 leading-relaxed text-center mb-10 max-w-xl mx-auto">
            Fill out the form below and Ryan will personally review your
            application within 24-48 hours.
          </p>
          <RecruitingForm />
        </div>
      </section>

      {/* Alternative CTA */}
      <section className="bg-brand py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prefer to Talk First?
          </h2>
          <p className="text-white/80 leading-relaxed mb-8 max-w-xl mx-auto">
            Book a 15-minute call with Ryan directly. No pressure, just a
            conversation about whether the team is the right fit.
          </p>
          <Link
            href="https://calendly.com/your-real-estate-agent-ryan/15min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-brand font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors text-lg"
          >
            Book a Call with Ryan
          </Link>
        </div>
      </section>
    </main>
  )
}
