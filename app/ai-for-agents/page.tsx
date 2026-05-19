import { Metadata } from 'next';
import AIWaitlistForm from './AIWaitlistForm';

export const metadata: Metadata = {
  title: 'AI for Real Estate Agents | The Assumable Guy',
  description:
    '87% of brokerages use AI daily. Learn the AI stack Ryan Thomson built to go from social worker to running a national real estate brand. Course for licensed agents.',
  keywords: [
    'AI for real estate agents',
    'AI real estate course',
    'real estate AI tools',
    'AI marketing for agents',
    'real estate agent AI training',
  ],
  openGraph: {
    title: '87% of Brokerages Use AI Daily. What\'s Your Stack?',
    description:
      'The agents who adopt AI now will dominate the next decade. Learn the actual AI operating system behind The Assumable Guy brand.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://assumableguy.com/ai-for-agents',
  },
};

const stackItems = [
  {
    tool: 'Claude',
    use: 'Writes content in my voice. Blog posts, emails, SMS follow-ups, listing descriptions. Trained on how I actually talk.',
  },
  {
    tool: 'ElevenLabs',
    use: 'Cloned my voice. I record one take, and AI handles the rest. Voiceovers, audio content, phone greetings.',
  },
  {
    tool: 'HeyGen',
    use: 'AI avatar videos. I can publish video content without being on camera every single day.',
  },
  {
    tool: 'Automated Publishing',
    use: 'Content goes from draft to published across platforms without me touching it. Blog, social, email, all scheduled.',
  },
  {
    tool: 'AI Lead Follow-Up',
    use: 'New lead comes in, they get a text and a call within 60 seconds. Not from a VA. From AI, in my voice.',
  },
  {
    tool: 'Voice-Coded Website',
    use: 'The website you\'re on right now? Built with AI. Calculator, listings, lead capture, all of it.',
  },
  {
    tool: 'AI Deal Discovery',
    use: 'AI agents scan listings, filter assumable properties, and surface the best deals before anyone else sees them.',
  },
];

const missingItems = [
  {
    title: 'Content Output',
    before: '2-3 posts a week, maybe.',
    after: '30+ pieces of content a week across blog, social, video, and email. All in my voice.',
  },
  {
    title: 'Lead Follow-Up Speed',
    before: 'Call them back within a few hours if I remember.',
    after: '60-second response. Text, call, and email. Every single lead.',
  },
  {
    title: 'Deal Discovery',
    before: 'Manual MLS searches. Miss things constantly.',
    after: 'AI scans every new listing. Filters for assumable loans. Alerts me before the listing hits Zillow.',
  },
  {
    title: 'Education at Scale',
    before: 'One phone call at a time. Maybe a webinar.',
    after: 'Course content, AI-generated explainers, personalized follow-up sequences. Teach hundreds at once.',
  },
];

export default function AIForAgentsPage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-light rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-light rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-brand/20 border border-brand/30 text-brand-light text-sm font-medium px-3 py-1.5 rounded-full mb-6">
            For Licensed Real Estate Agents
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
            87% of Brokerages Use AI Daily.<br />
            <span className="text-brand-light">What&apos;s Your Stack?</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            The agents who adopt AI now will dominate the next decade. The ones who don&apos;t will wonder what happened.
          </p>
          <a
            href="#waitlist"
            className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg shadow-lg shadow-brand/30"
          >
            Join the Waitlist
          </a>
        </div>
      </section>

      {/* THE NUMBERS */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">The Numbers</h2>
          <div className="space-y-5 text-gray-600 text-lg leading-relaxed">
            <p>
              87% of real estate brokerages now use AI in their daily operations. Up from 45% just two years ago.
            </p>
            <p>
              But here&apos;s the problem: most agents use ChatGPT to write an email template, maybe generate a
              social caption, and call it a day. That&apos;s not an AI strategy. That&apos;s a toy.
            </p>
            <p>
              The agents pulling ahead aren&apos;t using one tool for one thing. They&apos;ve built systems.
              AI that writes in their voice. AI that follows up with leads faster than any human can.
              AI that finds deals, creates content, and runs marketing while they&apos;re on a listing appointment.
            </p>
            <p className="text-gray-900 font-semibold">
              That&apos;s the difference between using AI and having an AI stack.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-10">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-brand">87%</div>
              <div className="text-gray-500 text-sm mt-1">Brokerages Using AI Daily</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-brand">45%</div>
              <div className="text-gray-500 text-sm mt-1">Two Years Ago</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-brand">13%</div>
              <div className="text-gray-500 text-sm mt-1">Still Not Using AI</div>
            </div>
          </div>
        </div>
      </section>

      {/* RYAN'S AI STACK */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">My AI Stack</h2>
          <p className="text-gray-500 text-lg mb-10">
            I was a social worker making $35K a year. No tech background. No coding skills. I built all of this in under a year.
          </p>

          <div className="space-y-4">
            {stackItems.map((item) => (
              <div key={item.tool} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="text-brand font-black text-lg shrink-0 w-40">{item.tool}</div>
                  <p className="text-gray-600 leading-relaxed">{item.use}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-brand/5 border border-brand/20 rounded-2xl p-6">
            <p className="text-gray-700 leading-relaxed">
              None of this existed 18 months ago. I didn&apos;t hire a dev team or raise money. I learned the tools,
              connected them, and started publishing. The gap between agents who figure this out and agents who don&apos;t
              is going to be massive.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT YOU'RE MISSING WITHOUT AI */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">What You&apos;re Missing Without AI</h2>

          <div className="space-y-6">
            {missingItems.map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{item.title}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="text-red-500 font-bold text-xs uppercase tracking-wide mb-2">Without AI</div>
                    <p className="text-gray-600 text-sm">{item.before}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-brand/30">
                    <div className="text-brand font-bold text-xs uppercase tracking-wide mb-2">With AI</div>
                    <p className="text-gray-600 text-sm">{item.after}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE COURSE */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">The Course</h2>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5 text-gray-600 text-lg leading-relaxed">
            <p>
              This isn&apos;t &quot;how to use ChatGPT.&quot; You can Google that.
            </p>
            <p>
              This is the actual AI operating system I built to run a national real estate brand. The tools,
              the workflows, the prompts, the integrations. How I create 30+ pieces of content a week.
              How I follow up with every lead in under a minute. How I find deals before they hit the market.
            </p>
            <p>
              I&apos;m teaching the exact system, step by step, so you can build your own version of it.
              Doesn&apos;t matter if you&apos;re tech-savvy or not. I wasn&apos;t.
            </p>
            <p className="text-gray-900 font-semibold">
              The course is waitlist only right now. Join below and you&apos;ll be first to know when it opens.
            </p>
            <div className="pt-2">
              <a
                href="#waitlist"
                className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg shadow-lg shadow-brand/30"
              >
                Join the Waitlist
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / WAITLIST */}
      <section id="waitlist" className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Join the Waitlist</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Be the first to know when the AI course drops. Waitlist members get early access and priority pricing.
          </p>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <AIWaitlistForm />
          </div>
        </div>
      </section>
    </div>
  );
}
