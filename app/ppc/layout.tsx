'use client';

import { useEffect } from 'react';

export default function PPCLayout({ children }: { children: React.ReactNode }) {
  // Kill any exit intent popup on PPC pages by setting the flag immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('exit-intent-shown', '1');
    }
  }, []);

  return <>{children}</>;
}
