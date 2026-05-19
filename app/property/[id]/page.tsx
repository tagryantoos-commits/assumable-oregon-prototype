import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

import { deriveFigures, formatCurrency } from "./_lib/math";
import { getProperty, getComparisonRate, hashIp, logPageView } from "./_lib/data";
import AssumableStamp from "./_components/AssumableStamp";
import InterestGapChart from "./_components/InterestGapChart";
import HardTruthReveal from "./_components/HardTruthReveal";
import CtaForm from "./_components/CtaForm";
import EhoLogo from "./_components/EhoLogo";

// Fonts — bold serif for display, clean sans for body, mono for eyebrow labels.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Your Listing Expired. It Shouldn't Have.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

// This page must always run dynamically — every visit logs a page_view row.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickUtm(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export default async function PropertyLandingPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);

  const [property, comparisonRate] = await Promise.all([
    getProperty(id),
    getComparisonRate(),
  ]);

  if (!property) {
    notFound();
  }

  // Page view tracking — non-blocking from the user's perspective; but we
  // await briefly so the row always lands before the response streams.
  try {
    const h = await headers();
    const userAgent = h.get("user-agent");
    const referrer = h.get("referer");
    const fwd = h.get("x-forwarded-for") || "";
    const ip = fwd.split(",")[0]?.trim() || h.get("x-real-ip");
    await logPageView(property, {
      userAgent,
      referrer,
      ipHash: hashIp(ip || null),
      utmSource: pickUtm(sp, "utm_source"),
      utmMedium: pickUtm(sp, "utm_medium"),
      utmCampaign: pickUtm(sp, "utm_campaign"),
      utmContent: pickUtm(sp, "utm_content"),
    });
  } catch (e) {
    // Never block render on tracking
    console.error("[landing] tracking failed:", e);
  }

  const f = deriveFigures(
    property.original_loan_amount,
    property.assumable_rate,
    comparisonRate,
  );

  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip}`;

  return (
    <main
      className={`${fraunces.variable} ${inter.variable} ${mono.variable} bg-bg text-cream min-h-screen`}
    >
      {/* SECTION 1 — HERO */}
      <section className="px-6 sm:px-10 pt-20 pb-32 sm:pt-32 sm:pb-48 max-w-5xl mx-auto">
        <div className="text-center font-mono text-accent text-sm sm:text-base md:text-lg lg:text-xl tracking-[0.25em] sm:tracking-[0.3em] uppercase mb-12 sm:mb-16 leading-[1.9] break-words">
          <p>
            Listing Expired — {property.address.toUpperCase()},{" "}
            {property.city.toUpperCase()} {property.state} {property.zip}
          </p>
          <p className="opacity-80">
            Assumable {property.loan_type} Loan — Approximately{" "}
            {Number(property.assumable_rate).toFixed(2)}%
          </p>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light leading-[1.05] sm:leading-[0.95] tracking-tight break-words">
          Your home has the{" "}
          <em className="text-accent not-italic">
            <span className="italic font-medium">one feature</span>
          </em>{" "}
          the market is starving for.
        </h1>
        <div className="mt-12 sm:mt-16 max-w-xl text-cream/75 space-y-2 text-base sm:text-lg leading-relaxed">
          <p>And nobody told the buyers about it.</p>
          <p>That&rsquo;s why it didn&rsquo;t sell. Here&rsquo;s why it still can.</p>
        </div>
        <p className="font-mono text-xs tracking-[0.3em] text-cream/45 uppercase mt-20 sm:mt-28">
          Scroll ↓
        </p>
      </section>

      {/* SECTION 2 — THE ASSET */}
      <section className="px-6 sm:px-10 py-24 sm:py-36 max-w-5xl mx-auto border-t border-cream/10">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase mb-3">
          01 / The Asset on Your Books
        </p>
        <p className="font-mono text-xs tracking-[0.25em] text-cream/55 uppercase mb-10 sm:mb-14">
          The asset most sellers don&rsquo;t know they&rsquo;re sitting on
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl font-light leading-tight max-w-3xl">
          Your home has an{" "}
          <em className="text-accent not-italic italic font-medium">
            assumable mortgage
          </em>
          .
        </h2>
        <p className="font-serif text-2xl sm:text-3xl font-light leading-snug mt-4 max-w-3xl text-cream/85">
          That means the buyer can take over your low interest rate.
        </p>

        <div className="my-16 sm:my-24">
          <AssumableStamp rate={property.assumable_rate} />
        </div>

        <p className="font-mono text-xs tracking-[0.25em] text-cream/55 uppercase max-w-2xl mx-auto text-center">
          In a {comparisonRate}% market, this generates a lot of interest from buyers.
        </p>
      </section>

      {/* SECTION 3 — BUYING POWER */}
      <section className="px-6 sm:px-10 py-24 sm:py-36 max-w-5xl mx-auto border-t border-cream/10">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase mb-3">
          02 / Why Your Buyer Pool Just Tripled
        </p>
        <p className="font-mono text-xs tracking-[0.25em] text-cream/55 uppercase mb-10 sm:mb-14">
          Same monthly payment, what a buyer can afford
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl font-light leading-tight max-w-3xl">
          Your home unlocks{" "}
          <span className="text-accent font-medium">{formatCurrency(f.buyingPowerDelta)} more</span>{" "}
          of buying power.
        </h2>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <div className="bg-[#1a4673] border border-cream/10 rounded-lg p-6 sm:p-8">
            <p className="font-mono text-[10px] tracking-[0.2em] text-cream/55 uppercase mb-3">
              Every other listing · {comparisonRate}% loan
            </p>
            <p className="font-serif text-3xl sm:text-4xl text-cream/80">
              {formatCurrency(f.buyingPowerAtMarket)}
            </p>
          </div>
          <div className="bg-[#1a4673] border border-accent/30 rounded-lg p-6 sm:p-8">
            <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase mb-3">
              Your listing · {property.assumable_rate}% assumable
            </p>
            <p className="font-serif text-3xl sm:text-4xl text-accent">
              {formatCurrency(property.original_loan_amount)}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — MONTHLY PAYMENT COMPARISON */}
      <section className="px-6 sm:px-10 py-24 sm:py-36 max-w-5xl mx-auto border-t border-cream/10">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase mb-3">
          03 / What Buyers See, Monthly
        </p>
        <p className="font-mono text-xs tracking-[0.25em] text-cream/55 uppercase mb-10 sm:mb-14">
          What a buyer pays each month: principal &amp; interest
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1a4673] border border-cream/10 rounded-lg p-8 sm:p-10">
            <p className="font-mono text-[10px] tracking-[0.2em] text-cream/55 uppercase mb-6">
              Every other listing · {comparisonRate}%
            </p>
            <p className="font-serif text-6xl sm:text-7xl font-light text-cream/85">
              {comparisonRate}%
            </p>
            <p className="text-cream/55 text-sm mt-2">
              Interest rate · 30-year fixed
            </p>
            <div className="mt-10 pt-6 border-t border-cream/10">
              <p className="font-mono text-[10px] tracking-[0.2em] text-cream/55 uppercase mb-2">
                Monthly payment
              </p>
              <p className="font-serif text-3xl sm:text-4xl text-cream/85">
                {formatCurrency(f.newLoanPayment)}
                <span className="text-cream/55 text-base">/mo</span>
              </p>
            </div>
          </div>

          <div className="bg-[#1a4673] border border-accent/40 rounded-lg p-8 sm:p-10 relative">
            <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase mb-6">
              Your home
            </p>
            <p className="font-serif text-6xl sm:text-7xl font-light text-accent">
              {property.assumable_rate}%
            </p>
            <p className="text-cream/55 text-sm mt-2">
              Interest rate · 30-year fixed
            </p>
            <div className="mt-10 pt-6 border-t border-accent/20">
              <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase mb-2">
                Monthly payment
              </p>
              <p className="font-serif text-3xl sm:text-4xl text-accent">
                {formatCurrency(f.assumablePayment)}
                <span className="text-accent/65 text-base">/mo</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — 30-YEAR INTEREST GAP */}
      <section className="px-6 sm:px-10 py-24 sm:py-36 max-w-5xl mx-auto border-t border-cream/10">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase mb-3">
          04 / The 30-Year Gap
        </p>
        <p className="font-mono text-xs tracking-[0.25em] text-cream/55 uppercase mb-10 sm:mb-14">
          Interest paid · cumulative
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl font-light leading-tight max-w-2xl mb-12">
          Watch the gap grow over 30 years.
        </h2>

        <InterestGapChart
          originalLoanAmount={property.original_loan_amount}
          assumableRate={property.assumable_rate}
          comparisonRate={comparisonRate}
        />

        <div className="mt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-t border-cream/10 pt-8">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-cream/55 uppercase">
              Year 30 / 30
            </p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-cream/55 uppercase mt-2">
              Gap total
            </p>
          </div>
          <p className="font-serif text-5xl sm:text-7xl font-light text-accent">
            {formatCurrency(f.lifetimeInterestGap)}
          </p>
        </div>
        <div className="mt-6 flex items-center gap-6 text-xs font-mono uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2 text-cream/65">
            <span className="inline-block w-3 h-[2px] bg-[#1d5c96]" />{comparisonRate}%
          </span>
          <span className="flex items-center gap-2 text-cream/65">
            <span className="inline-block w-3 h-[2px] bg-[#7db0de]" />{property.assumable_rate}%
          </span>
        </div>
      </section>

      {/* SECTION 6 — SPEED TO SALE (static) */}
      <section className="px-6 sm:px-10 py-24 sm:py-36 max-w-5xl mx-auto border-t border-cream/10">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase mb-3">
          05 / Speed to Sale
        </p>
        <p className="font-mono text-xs tracking-[0.25em] text-cream/55 uppercase mb-10 sm:mb-14">
          Days on market · expired vs. assumable
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl font-light leading-tight max-w-3xl mb-12">
          When buyers find out it&rsquo;s assumable, your home{" "}
          <span className="text-[#7eb47e] italic">sells in less than half the time.</span>
        </h2>

        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-mono text-[10px] tracking-[0.2em] text-cream/65 uppercase">
                Average listing in your area
              </span>
              <span className="text-cream/85 font-medium">47 days</span>
            </div>
            <div className="w-full h-3 bg-[#1a4673] rounded-full overflow-hidden">
              <div
                className="h-full bg-cream/30"
                style={{ width: `${(47 / 60) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">
                Listings marketed as assumable
              </span>
              <span className="text-accent font-medium">18 days</span>
            </div>
            <div className="w-full h-3 bg-[#1a4673] rounded-full overflow-hidden">
              <div
                className="h-full bg-accent"
                style={{ width: `${(18 / 60) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-cream/45">
          <span>Day 0</span>
          <span>Day 15</span>
          <span>Day 30</span>
          <span>Day 45</span>
        </div>
      </section>

      {/* SECTION 7 — LIFETIME PREMIUM */}
      <section className="px-6 sm:px-10 py-24 sm:py-36 max-w-5xl mx-auto border-t border-cream/10">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase mb-3">
          06 / The Premium They&rsquo;ll Pay
        </p>
        <p className="font-mono text-xs tracking-[0.25em] text-cream/55 uppercase mb-10 sm:mb-14">
          What buyers will pay extra to lock in your rate
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl font-light leading-tight max-w-3xl mb-16">
          The lifetime savings on your loan are{" "}
          <span className="text-accent font-medium">{formatCurrency(f.lifetimeSavings)}.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1a4673] border border-accent/30 rounded-lg p-8 sm:p-10">
            <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase mb-6">
              What a buyer will gladly pay above asking
            </p>
            <p className="font-serif text-5xl sm:text-6xl font-light text-accent mb-4">
              {formatCurrency(f.buyerPremium)}
            </p>
            <p className="text-cream/65 text-sm leading-relaxed">
              Two years of saved interest, paid up-front in price.
            </p>
          </div>
          <div className="bg-[#1a4673] border border-cream/10 rounded-lg p-8 sm:p-10">
            <p className="font-mono text-[10px] tracking-[0.2em] text-cream/55 uppercase mb-6">
              And the buyer still saves
            </p>
            <p className="font-serif text-5xl sm:text-6xl font-light text-cream/85 mb-4">
              {formatCurrency(f.buyerNetSavings)}
            </p>
            <p className="text-cream/65 text-sm leading-relaxed">
              That&rsquo;s why the math wins for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 8 — THE HARD TRUTH (static, scroll-fade) */}
      <section className="px-6 sm:px-10 py-32 sm:py-48 max-w-4xl mx-auto border-t border-cream/10">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase mb-3 text-center">
          07 / The Reason It Didn&rsquo;t Sell
        </p>
        <p className="font-mono text-xs tracking-[0.25em] text-cream/55 uppercase mb-16 sm:mb-24 text-center">
          The hard truth
        </p>
        <HardTruthReveal />
      </section>

      {/* SECTION 9 — HOW WE GET IT SOLD (static + dynamic rate in steps) */}
      <section className="px-6 sm:px-10 py-24 sm:py-36 max-w-5xl mx-auto border-t border-cream/10">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase mb-3">
          08 / What We Do Differently
        </p>
        <p className="font-mono text-xs tracking-[0.25em] text-cream/55 uppercase mb-10 sm:mb-14">
          How we get it sold
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl font-light leading-tight max-w-3xl mb-12">
          A four-step relist built around your rate.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              step: "Step 01",
              title: "Verify & document the assumability",
              body: "We pull the loan terms, confirm assumability with the servicer, and prepare a buyer-facing fact sheet.",
            },
            {
              step: "Step 02",
              title: "Re-list with the rate up front",
              body: `The ${property.assumable_rate}% rate becomes the headline. MLS, photos, listing description, all of it.`,
            },
            {
              step: "Step 03",
              title: "Pre-qualify the buyer pool",
              body: `We target buyers whose budget unlocks at ${property.assumable_rate}%, buyers your old listing never reached.`,
            },
            {
              step: "Step 04",
              title: "Run an assumption-aware closing",
              body: "We coordinate the lender approval timeline so the deal actually closes. Most agents fumble this part.",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="bg-[#1a4673] border border-cream/10 rounded-lg p-6 sm:p-8"
            >
              <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase mb-3">
                {s.step}
              </p>
              <h3 className="font-serif text-xl sm:text-2xl text-cream mb-3 leading-snug">
                {s.title}
              </h3>
              <p className="text-cream/70 text-sm sm:text-base leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 10 — BIO */}
      <section className="px-6 sm:px-10 py-24 sm:py-36 max-w-5xl mx-auto border-t border-cream/10">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase mb-12 sm:mb-16">
          09 / Who You&rsquo;re Working With
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-10 sm:gap-16 items-start">
          <div className="relative aspect-[4/5] w-full max-w-[320px] sm:max-w-none rounded-lg overflow-hidden bg-[#1a4673] border border-cream/10">
            <Image
              src="/images/ryan-headshot.png"
              alt="Ryan Thomson — The Assumable Guy"
              fill
              sizes="(max-width: 768px) 320px, 40vw"
              className="object-cover"
              priority={false}
            />
          </div>
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light leading-tight mb-6">
              I&rsquo;m Ryan Thomson.
            </h2>
            <p className="text-cream/80 text-base sm:text-lg leading-relaxed mb-6">
              I run{" "}
              <em className="text-accent not-italic italic font-medium">
                The Assumable Guy
              </em>{" "}
              in Colorado. We&rsquo;re one of the only teams that specializes 100% in selling assumable mortgage properties.
            </p>
            <p className="font-serif text-2xl sm:text-3xl text-accent italic mb-8">
              The Rate Is The Asset.
            </p>
            <div className="space-y-2 text-cream/85">
              <p>
                <a href="tel:7196243472" className="hover:text-accent transition-colors">
                  (719) 624-3472
                </a>
              </p>
              <p>
                <a
                  href="mailto:ryan@theassumableguy.com"
                  className="hover:text-accent transition-colors"
                >
                  ryan@theassumableguy.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 11 — CTA STACK */}
      <section className="px-6 sm:px-10 py-24 sm:py-36 max-w-3xl mx-auto border-t border-cream/10">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase mb-6">
          Free · 15 minutes · no obligation
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl font-light leading-[1.05] mb-6">
          Let&rsquo;s get the right buyers looking at the right home.
        </h2>
        <p className="text-cream/75 text-base sm:text-lg leading-relaxed mb-12 max-w-xl">
          I&rsquo;ll review your loan terms, confirm assumability with your
          servicer, and walk you through what your relisting would look like.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <a
            href="https://calendly.com/your-real-estate-agent-ryan/15min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 bg-accent text-bg font-mono uppercase tracking-[0.2em] text-sm font-semibold rounded-md hover:bg-accent/90 transition-colors"
          >
            Book the 15-min call →
          </a>
          <a
            href="tel:7196243472"
            className="inline-flex items-center justify-center px-8 py-4 border border-cream/25 text-cream font-mono uppercase tracking-[0.2em] text-sm rounded-md hover:border-accent/60 hover:text-accent transition-colors"
          >
            Call (719) 624-3472
          </a>
        </div>

        <CtaForm propertyId={property.property_id} />
      </section>

      {/* FOOTER */}
      <footer className="px-6 sm:px-10 py-16 max-w-5xl mx-auto border-t border-cream/10 text-cream/55 text-xs sm:text-sm leading-relaxed">
        <div className="flex items-start gap-3 mb-6">
          <EhoLogo className="w-6 h-6 text-cream/55 flex-shrink-0 mt-0.5" />
          <p>
            The Assumable Guy is a team within Keller Williams Advantage Realty.
            Each office independently owned and operated.
          </p>
        </div>
        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/40 leading-relaxed">
          Figures based on your original loan balance of{" "}
          {formatCurrency(property.original_loan_amount)} at{" "}
          {property.assumable_rate}% · Comparison scenario assumes new loan at{" "}
          {comparisonRate}% · Actual savings depend on loan terms
        </p>
        <p className="text-cream/30 text-[10px] mt-6 font-mono">
          Property: {fullAddress}
        </p>
      </footer>

      {/* Inline styles scoped to this page — Tailwind v4 colors + stamp keyframes */}
      <style>{`
        :root {
          --color-bg: #12395d;
          --color-accent: #7db0de;
          --color-accent-2: #1d5c96;
          --color-cream: #f3efe8;
        }
        .bg-bg { background-color: #12395d; }
        .text-bg { color: #12395d; }
        .text-accent { color: #7db0de; }
        .bg-accent { background-color: #7db0de; }
        .text-cream { color: #f3efe8; }
        .border-accent\\/20 { border-color: rgba(125,176,222,0.2); }
        .border-accent\\/30 { border-color: rgba(125,176,222,0.3); }
        .border-accent\\/40 { border-color: rgba(125,176,222,0.4); }
        .border-accent\\/60 { border-color: rgba(125,176,222,0.6); }
        .text-accent\\/65 { color: rgba(125,176,222,0.65); }
        .bg-accent\\/90:hover { background-color: rgba(125,176,222,0.9); }
        .hover\\:text-accent:hover { color: #7db0de; }
        .hover\\:border-accent\\/60:hover { border-color: rgba(125,176,222,0.6); }
        .focus\\:border-accent\\/60:focus { border-color: rgba(125,176,222,0.6); }
        .font-serif { font-family: var(--font-fraunces), Georgia, 'Times New Roman', serif; }
        .font-mono { font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace; }
        body { font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif; }

        @keyframes stamp-spin {
          from { transform: rotate(-6deg) scale(0.9); opacity: 0; }
          50%  { transform: rotate(2deg) scale(1.04); opacity: 1; }
          to   { transform: rotate(-2deg) scale(1); opacity: 1; }
        }
        @keyframes stamp-bob {
          0%, 100% { transform: rotate(-2deg) scale(1); }
          50%      { transform: rotate(0deg) scale(1.025); }
        }
        .stamp-spin {
          animation:
            stamp-spin 1.4s ease-out both,
            stamp-bob 5s ease-in-out 1.4s infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .stamp-spin { animation: stamp-spin 1.4s ease-out both; }
        }
      `}</style>
    </main>
  );
}
