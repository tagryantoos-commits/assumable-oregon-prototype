'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { trackActivity } from '../lib/tracking';
import { useAuth } from '../lib/useAuth';

const MARKET_CITIES = new Set([
  'arvada', 'aurora', 'boulder', 'broomfield', 'castle-rock', 'centennial',
  'colorado-springs', 'denver', 'fort-collins', 'fountain', 'greeley',
  'highlands-ranch', 'lakewood', 'littleton', 'longmont', 'loveland',
  'parker', 'peyton', 'pueblo', 'thornton', 'westminster',
]);

const RETURN_VISIT_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

// Paths we never mirror to FUB as page views — internal routes, form
// submissions, admin, etc. Everything else a logged-in user hits gets sent.
const PAGE_VIEW_EXCLUDE_PREFIXES = ['/api/', '/admin', '/_next'];

// FUB's Website Activity panel doesn't render pageDuration in its list view,
// so we bake it into pageTitle (" · 2m 17s") to make time-on-page visible
// inline. Keep the format compact so long page titles don't wrap awkwardly.
function formatDuration(seconds: number): string {
  if (seconds < 1) return '';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s === 0 ? `${m}m` : `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm === 0 ? `${h}h` : `${h}h ${rm}m`;
}

// FUB's panel has a narrow column — raw SEO-optimized <title> tags ("Colorado
// Springs Assumable Mortgages | 451+ Homes | 2.00% Rate | The Assumable Guy")
// overflow and cut off the duration suffix. Drop brand boilerplate, and if
// still too wide, keep only the first segment. Property listings like
// "1611 Wood, Colorado Springs | 2.77% Assumable VA" stay intact — that's
// the useful info for an agent scanning the panel.
const FUB_PANEL_MAX_TITLE = 50;
const BRAND_RE = /the assumable guy/i;

function shortenTitle(title: string): string {
  const parts = title
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !BRAND_RE.test(s));
  if (parts.length === 0) return title;
  const joined = parts.join(' | ');
  return joined.length <= FUB_PANEL_MAX_TITLE ? joined : parts[0];
}

function withDurationSuffix(title: string, seconds: number): string {
  const d = formatDuration(seconds);
  const short = shortenTitle(title);
  return d ? `${short} · ${d}` : short;
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const isNoNav =
    pathname?.startsWith('/ppc') ||
    pathname?.startsWith('/buy') ||
    pathname?.startsWith('/property');

  // Return-visit detection: on first mount after login, check last-seen and
  // fire if dormant >14d.
  useEffect(() => {
    if (!isLoggedIn) return;
    if (typeof window === 'undefined') return;
    try {
      const KEY = 'assumableguy:last_active';
      const last = localStorage.getItem(KEY);
      const now = Date.now();
      if (!last || now - Number(last) > RETURN_VISIT_THRESHOLD_MS) {
        trackActivity('return_visit', {});
      }
      localStorage.setItem(KEY, String(now));
    } catch {
      // Storage blocked — skip.
    }
  }, [isLoggedIn]);

  // Market-page visit detection: fires once per (user, city) per 15min.
  useEffect(() => {
    if (!isLoggedIn || !pathname) return;
    const slug = pathname.replace(/^\//, '').split('/')[0].toLowerCase();
    if (MARKET_CITIES.has(slug)) {
      const city = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      trackActivity('market_page_visit', { city });
    }
  }, [isLoggedIn, pathname]);

  // Per-route page-view tracking — populates FUB's Website Activity panel the
  // same way the Pixel does on theassumableguy.com. Events fire on *leave*
  // (route change, tab hide, unload) so each event carries an accurate
  // pageDuration. See sendBeacon note below — that's why duration works at
  // all across tab-close.
  const currentView = useRef<{
    startedAt: number;
    title: string;
    url: string;
    referrer: string | undefined;
  } | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !pathname) return;
    if (typeof window === 'undefined') return;

    const excluded = PAGE_VIEW_EXCLUDE_PREFIXES.some(p => pathname.startsWith(p));

    // Flush the PREVIOUS page's event (if any) before starting the new one.
    if (currentView.current) {
      const prev = currentView.current;
      const duration = Math.max(0, Math.floor((Date.now() - prev.startedAt) / 1000));
      trackActivity('page_viewed', {
        page_title: withDurationSuffix(prev.title, duration),
        page_url: prev.url,
        page_referrer: prev.referrer,
        page_duration: duration,
      });
      currentView.current = null;
    }

    if (excluded) return;

    // Give the browser a tick so document.title reflects the new route before
    // we capture it as the "starting title" for duration tracking. Reading
    // window.location directly (rather than useSearchParams) keeps this
    // component static-render-safe — useSearchParams forces CSR bailout on
    // every consumer page.
    const timer = window.setTimeout(() => {
      currentView.current = {
        startedAt: Date.now(),
        title: document.title,
        url: `${window.location.origin}${window.location.pathname}${window.location.search}`,
        referrer: document.referrer || undefined,
      };
    }, 50);
    return () => window.clearTimeout(timer);
  }, [isLoggedIn, pathname]);

  // Flush on tab close / visibility hide. beforeunload is unreliable on
  // mobile, so we also listen for visibilitychange->hidden. sendBeacon is
  // the only reliable way to POST during unload — fetch() gets cancelled.
  // The tradeoff: sendBeacon bypasses trackActivity's dedupe, but page_viewed
  // dedupe is 0 so that's a non-issue.
  useEffect(() => {
    if (!isLoggedIn) return;
    if (typeof window === 'undefined') return;

    const flush = () => {
      const view = currentView.current;
      if (!view) return;
      const duration = Math.max(0, Math.floor((Date.now() - view.startedAt) / 1000));
      const body = JSON.stringify({
        type: 'page_viewed',
        payload: {
          page_title: withDurationSuffix(view.title, duration),
          page_url: view.url,
          page_referrer: view.referrer,
          page_duration: duration,
        },
      });
      try {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon?.('/api/track', blob);
      } catch {
        // Last-ditch — if sendBeacon throws, we can't do much during unload.
      }
      currentView.current = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isLoggedIn]);

  return (
    <>
      {!isNoNav && <Header />}
      <main>{children}</main>
      {!isNoNav && <Footer />}
    </>
  );
}
