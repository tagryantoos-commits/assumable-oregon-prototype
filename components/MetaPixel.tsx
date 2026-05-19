'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const META_PIXEL_ID = '1466132101765066';

export default function MetaPixel() {
  const pathname = usePathname();

  // Initialize pixel once on mount
  useEffect(() => {
    if (typeof window === 'undefined' || window.fbq) return;

    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any) {
      const n: any = (f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      });
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      const t = b.createElement(e);
      t.async = true;
      t.src = v;
      const s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    // Init with Automatic Advanced Matching enabled
    window.fbq('init', META_PIXEL_ID, {});
    window.fbq('track', 'PageView');
  }, []);

  // Track PageView on client-side route changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}

/**
 * Fire Meta Pixel Lead event on form submissions.
 * Call this after successful form submit.
 */
export function trackMetaLead(userData?: { em?: string; ph?: string; fn?: string }) {
  if (typeof window !== 'undefined' && window.fbq) {
    // If we have user data, update advanced matching
    if (userData && (userData.em || userData.ph)) {
      window.fbq('init', META_PIXEL_ID, {
        em: userData.em || '',
        ph: userData.ph?.replace(/\D/g, '') || '',
        fn: userData.fn?.split(' ')[0]?.toLowerCase() || '',
      });
    }
    window.fbq('track', 'Lead');
  }
}

/**
 * Fire Meta Pixel ViewContent event on property detail pages.
 */
export function trackMetaViewContent(contentData?: {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', contentData || {});
  }
}
