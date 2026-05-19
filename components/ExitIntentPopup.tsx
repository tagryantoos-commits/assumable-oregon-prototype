'use client';

import { useState, useEffect, useRef } from 'react';
import { useUTMParams } from '../lib/useUTMParams';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const META_PIXEL_ID = '1466132101765066';

// Storage keys
const DISMISSED_UNTIL = 'ei_dismissed_until';
const SUBMITTED_UNTIL = 'ei_submitted_until';
const ANY_FORM_SUBMITTED = 'tag_any_form_submitted';

// Suppression windows
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days
const SUBMIT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;   // 30 days

export default function ExitIntentPopup() {
  const utmParams = useUTMParams();
  const [show, setShow] = useState(false);
  const [isPPC, setIsPPC] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/ppc') || window.location.pathname.startsWith('/property'))) {
      setIsPPC(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window.location.pathname.startsWith('/ppc') || window.location.pathname.startsWith('/property'))) return;

    // Cross-form suppression: any prior form submit on the site kills exit intent.
    if (localStorage.getItem(ANY_FORM_SUBMITTED) === '1') return;

    const now = Date.now();
    const dismissedUntil = parseInt(localStorage.getItem(DISMISSED_UNTIL) || '0', 10);
    const submittedUntil = parseInt(localStorage.getItem(SUBMITTED_UNTIL) || '0', 10);
    if (now < dismissedUntil || now < submittedUntil) return;

    // Once per session guard (separate from cross-day cooldowns).
    if (sessionStorage.getItem('exit-intent-shown')) return;

    const MIN_TIME_ON_PAGE_MS = 10000;      // Spec: floor of 10s
    const MIN_SCROLL_DEPTH = 0.25;
    const FALLBACK_TIMER_MS = 60000;
    const MOBILE_SCROLL_DOWN_PX = 300;      // Must scroll down this far before scroll-to-top can trigger
    const MOBILE_SCROLL_TOP_PX = 50;        // Considered "back at top"

    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    let armed = false;
    let hasScrolled = false;
    let maxScrollY = 0;
    const pageLoadTime = Date.now();

    const checkArmed = () => {
      if (armed) return true;
      if (Date.now() - pageLoadTime >= MIN_TIME_ON_PAGE_MS && hasScrolled) {
        armed = true;
      }
      return armed;
    };

    const triggerShow = () => {
      if (triggered.current) return;
      triggered.current = true;
      sessionStorage.setItem('exit-intent-shown', '1');
      setShow(true);
    };

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0 && scrollTop / docHeight >= MIN_SCROLL_DEPTH) {
        hasScrolled = true;
      }
      if (scrollTop > maxScrollY) maxScrollY = scrollTop;

      // Mobile: scroll-to-top detection. User scrolled down meaningfully, then came back near top.
      if (
        isCoarsePointer &&
        !triggered.current &&
        checkArmed() &&
        maxScrollY >= MOBILE_SCROLL_DOWN_PX &&
        scrollTop <= MOBILE_SCROLL_TOP_PX
      ) {
        triggerShow();
      }
    };

    // Desktop: mouse toward the browser chrome (close button area).
    const handleMouseOut = (e: MouseEvent) => {
      if (isCoarsePointer) return;
      if (e.clientY <= 5 && checkArmed()) {
        triggerShow();
      }
    };

    const timer = setTimeout(() => triggerShow(), FALLBACK_TIMER_MS);

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseout', handleMouseOut);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseout', handleMouseOut);
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_UNTIL, String(Date.now() + DISMISS_COOLDOWN_MS));
    } catch {}
    setShow(false);
  };

  const fireTracking = (firstNameVal: string, emailVal: string) => {
    if (typeof window === 'undefined') return;
    // Meta Pixel custom event (init w/ advanced matching so em/fn hash on Meta side)
    if (window.fbq) {
      try {
        window.fbq('init', META_PIXEL_ID, {
          em: emailVal,
          fn: firstNameVal.toLowerCase(),
        });
        window.fbq('trackCustom', 'ExitIntentSignup', {
          source: 'Website - Exit Intent',
        });
      } catch {}
    }
    // GA4 / GTM
    if (window.gtag) {
      try {
        window.gtag('event', 'ExitIntentSignup', {
          event_category: 'lead',
          event_label: 'Website - Exit Intent',
        });
      } catch {}
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: 'ExitIntentSignup',
        source: 'Website - Exit Intent',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: firstName,
          first_name: firstName,
          email,
          ...utmParams,
          source: 'exit-intent',
          formType: 'Form: Exit Intent',
          timestamp: new Date().toISOString(),
        }),
      });
      fireTracking(firstName, email);
      try {
        localStorage.setItem(SUBMITTED_UNTIL, String(Date.now() + SUBMIT_COOLDOWN_MS));
        localStorage.setItem(ANY_FORM_SUBMITTED, '1');
      } catch {}
      setSubmitted(true);
    } catch {
      // Even on transport failure, show success, server also fails-safe.
      try {
        localStorage.setItem(SUBMITTED_UNTIL, String(Date.now() + SUBMIT_COOLDOWN_MS));
        localStorage.setItem(ANY_FORM_SUBMITTED, '1');
      } catch {}
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (isPPC) return null;
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-2xl"
          aria-label="Close"
        >
          ✕
        </button>

        {submitted ? (
          <div>
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re in.</h2>
            <p className="text-gray-600">Check your inbox.</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-3">🏠</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wait. Before You Go.</h2>
            <p className="text-gray-600 mb-6">
              Join 2,000+ Colorado buyers learning how to buy a home at 2.5% while everyone else pays 7%.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <input
                type="text"
                required
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-60"
              >
                {submitting ? 'Sending...' : 'Show Me How'}
              </button>
              <p className="text-xs text-center text-gray-400 leading-relaxed">
                By submitting, you consent to be contacted by The Assumable Guy via email regarding assumable mortgage education. Reply STOP to opt out.
              </p>
            </form>
            <button
              onClick={handleDismiss}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              No thanks, I&apos;ll keep paying 7%
            </button>
          </>
        )}
      </div>
    </div>
  );
}
