import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Meet the Team | The Assumable Guy',
  description: 'Colorado\'s real estate team specializing in assumable mortgages. Led by Ryan Thomson, serving buyers and sellers statewide.',
  alternates: {
    canonical: 'https://assumableguy.com/team',
  },
};

const agents = [
  { name: 'David King', photo: '/images/team/david.jpg', title: 'Buyer\'s Agent', focus: 'Denver, CO' },
  { name: 'Ian Jimeno', photo: '/images/team/ian.jpg', title: 'Buyer\'s Agent', focus: 'Denver, CO' },
  { name: 'Bryon Franklin', photo: '/images/team/bryon.jpg', title: 'Buyer\'s Agent', focus: 'Colorado Springs, CO' },
  { name: 'Jhoselyn Solano', photo: '/images/team/joselyn.jpg', title: 'Buyer\'s Agent', focus: 'Colorado Springs, CO' },
];

export default function TeamPage() {
  return (
    <div>
      {/* HERO */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Meet the <span className="text-brand-light">Team</span>
          </h1>
          <p className="text-gray-300 text-xl max-w-2xl mx-auto">
            Colorado&apos;s real estate team specializing in assumable mortgages.
            We generate the leads. We know the process. We close the deals.
          </p>
        </div>
      </section>

      {/* RYAN - FEATURED */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="bg-brand p-10 flex flex-col justify-center text-white">
              <div className="mb-6">
                <Image
                  src="/images/ryan-headshot.png"
                  alt="Ryan Thomson, The Assumable Guy"
                  width={160}
                  height={160}
                  className="rounded-full border-4 border-white/30 shadow-lg object-cover"
                  priority
                />
              </div>
              <div className="inline-block bg-brand text-brand-100 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 w-fit">
                Team Lead
              </div>
              <h2 className="text-3xl font-black mb-1">Ryan Thomson</h2>
              <p className="text-brand-200 font-semibold mb-4">The Assumable Guy &middot; CO License #100092341</p>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="text-2xl font-black">100+</div>
                  <div className="text-brand-200 text-sm">Closings</div>
                </div>
                <div>
                  <div className="text-2xl font-black">$48M+</div>
                  <div className="text-brand-200 text-sm">Buyer Savings</div>
                </div>
              </div>
            </div>
            <div className="p-10 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">The guy who started it all</h3>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>
                  Started as a social worker. Found house hacking. Built a 5-property Colorado portfolio
                  using assumable mortgages. Became obsessed with the math and never looked back.
                </p>
                <p>
                  Closed 7+ assumable transactions in a single quarter, more than most agents close in a career.
                  Then built his own team.
                </p>
                <p className="text-gray-900 font-semibold">
                  Now leads a Colorado team specializing in assumable mortgages. We work with buyers and sellers
                  across all of real estate, with assumables as our core expertise.
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/about"
                  className="bg-brand hover:bg-brand text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
                >
                  Full Story &rarr;
                </Link>
                <a
                  href="mailto:ryan@theassumableguy.com"
                  className="border border-gray-200 hover:border-brand-light text-gray-700 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
                >
                  Contact Ryan
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABBY - OPS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Image
            src="/images/team/abby.jpg"
            alt="Abby Lee, Operations Manager"
            width={72}
            height={72}
            className="w-16 h-16 rounded-full object-cover object-top flex-shrink-0 border-2 border-gray-200"
          />
          <div>
            <div className="inline-block bg-gray-200 text-gray-600 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
              Operations
            </div>
            <h3 className="text-xl font-bold text-gray-900">Abby Lee</h3>
            <p className="text-brand font-semibold text-sm mb-2">Operations Manager</p>
            <p className="text-gray-500 text-sm leading-relaxed">
              Keeps the whole machine running. Transaction coordination, systems, scheduling,
              and making sure every client gets a smooth experience from first contact to close.
            </p>
          </div>
        </div>
      </section>

      {/* AGENTS GRID */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Licensed Agents</h2>
        <p className="text-gray-500 mb-8">All trained in assumable mortgage transactions. Covering Colorado&apos;s key markets.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <div key={agent.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
              <Image
                src={agent.photo}
                alt={agent.name}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2 border-brand-100"
              />
              <div>
                <h3 className="font-bold text-gray-900">{agent.name}</h3>
                <p className="text-brand text-sm font-semibold">{agent.title}</p>
                <p className="text-gray-400 text-sm">{agent.focus}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RECRUITMENT PITCH */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-brand-light font-bold text-sm uppercase tracking-widest mb-3">Are You an Agent?</div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            We generate the leads.<br />You close the deals.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            We&apos;re building a national real estate team with a specialization in assumable mortgages.
            If you&apos;re a licensed Colorado agent who wants a full pipeline and a niche most agents
            don&apos;t know about, we should talk.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
            <div className="bg-gray-800 rounded-xl p-5">
              <div className="text-brand-light text-2xl mb-1">📥</div>
              <h4 className="text-white font-bold mb-1">Inbound Leads</h4>
              <p className="text-gray-400 text-sm">We run the marketing. You focus on buyers who are already interested.</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-5">
              <div className="text-brand-light text-2xl mb-1">🎓</div>
              <h4 className="text-white font-bold mb-1">Full Training</h4>
              <p className="text-gray-400 text-sm">We&apos;ll teach you everything about assumable transactions. Process, lender contacts, scripts.</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-5">
              <div className="text-brand-light text-2xl mb-1">🏔️</div>
              <h4 className="text-white font-bold mb-1">Expanding Market</h4>
              <p className="text-gray-400 text-sm">Colorado first, then national. Get in early and grow with the team.</p>
            </div>
          </div>
          <a
            href="mailto:ryan@TheAssumableGuy.com?subject=Agent%20Inquiry%2C%20The%20Assumable%20Guy"
            className="inline-block bg-brand hover:bg-brand-light text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg"
          >
            Apply to Join the Team &rarr;
          </a>
        </div>
      </section>
    </div>
  );
}
