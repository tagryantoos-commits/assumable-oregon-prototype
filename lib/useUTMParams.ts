'use client';

import { useEffect, useRef } from 'react';

export interface UTMParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  gclid: string;
  landing_url: string;
}

export function useUTMParams(): UTMParams {
  const paramsRef = useRef<UTMParams>({
    utm_source: '', utm_medium: '', utm_campaign: '',
    utm_term: '', utm_content: '', gclid: '', landing_url: '',
  });

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    paramsRef.current = {
      utm_source: sp.get('utm_source') || '',
      utm_medium: sp.get('utm_medium') || '',
      utm_campaign: sp.get('utm_campaign') || '',
      utm_term: sp.get('utm_term') || '',
      utm_content: sp.get('utm_content') || '',
      gclid: sp.get('gclid') || '',
      landing_url: window.location.href,
    };
  }, []);

  return paramsRef.current;
}
