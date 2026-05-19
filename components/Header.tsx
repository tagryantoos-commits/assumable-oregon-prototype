'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/useAuth';
import AuthGate from './AuthGate';

const frontRangeCities = [
  { name: 'Portland', href: '/portland' },
  { name: 'Vancouver, WA', href: '/vancouver' },
  { name: 'Beaverton', href: '/beaverton' },
  { name: 'Ridgefield, WA', href: '/ridgefield' },
  { name: 'Silverlake, WA', href: '/silverlake' },
];

const northSouthCities: { name: string; href: string }[] = [];

export default function Header() {
  const { user, isLoggedIn, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [marketsOpen, setMarketsOpen] = useState(false);
  const [mobileMarketsOpen, setMobileMarketsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const marketsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const marketsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolledPastHero(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMarketsEnter = () => {
    if (marketsTimeout.current) clearTimeout(marketsTimeout.current);
    marketsTimeout.current = setTimeout(() => setMarketsOpen(true), 100);
  };

  const handleMarketsLeave = () => {
    if (marketsTimeout.current) clearTimeout(marketsTimeout.current);
    marketsTimeout.current = setTimeout(() => setMarketsOpen(false), 150);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <span className="text-brand text-2xl">🏠</span>
            <span>The <span className="text-brand">Assumable</span> Guy</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/homes" className="hover:text-brand transition-colors">Browse Homes</Link>
            <Link href="/saved" className="hover:text-brand transition-colors">Saved</Link>
            <Link href="/deals" className="hover:text-brand transition-colors">Deals</Link>
            <Link href="/calculator" className="hover:text-brand transition-colors">Calculator</Link>

            {/* Markets Dropdown */}
            <div
              ref={marketsRef}
              className="relative"
              onMouseEnter={handleMarketsEnter}
              onMouseLeave={handleMarketsLeave}
            >
              <button className="flex items-center gap-1 hover:text-brand transition-colors">
                Markets
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${marketsOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 ${
                  marketsOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'
                }`}
              >
                <div className="bg-white shadow-lg rounded-lg border border-gray-100 p-5 w-[420px]">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Column 1 */}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Oregon &amp; PNW Markets</p>
                      <div className="space-y-0.5">
                        {frontRangeCities.map((city) => (
                          <Link
                            key={city.href}
                            href={city.href}
                            className="block text-sm text-gray-700 hover:text-brand hover:bg-gray-50 rounded px-2 py-1.5 transition-colors"
                          >
                            {city.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                    {/* Column 2 */}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">More Markets</p>
                      <div className="space-y-0.5">
                        {northSouthCities.map((city) => (
                          <Link
                            key={city.href}
                            href={city.href}
                            className="block text-sm text-gray-700 hover:text-brand hover:bg-gray-50 rounded px-2 py-1.5 transition-colors"
                          >
                            {city.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <Link
                      href="/homes"
                      className="text-xs text-gray-400 hover:text-brand transition-colors"
                    >
                      View All Oregon &amp; PNW Markets →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/sell" className="hover:text-brand transition-colors">Sell</Link>
            <Link href="/blog" className="hover:text-brand transition-colors">Blog</Link>
            <Link href="/team" className="hover:text-brand transition-colors">Team</Link>
            <Link href="/about" className="hover:text-brand transition-colors">About</Link>
            <a href="tel:7196243472" className="text-brand hover:text-brand-dark transition-colors" title="Call (719) 624-3472">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z"/>
              </svg>
            </a>

            {/* Auth: Sign In or User Menu */}
            {isLoggedIn ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-brand transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold">
                    {(user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                  </span>
                  <span className="hidden lg:inline">{user?.firstName || user?.email?.split('@')[0]}</span>
                  <svg className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white shadow-lg rounded-lg border border-gray-100 py-2 w-40 z-50">
                    <button
                      onClick={() => { signOut(); setUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthGateOpen(true)}
                className="text-sm font-medium text-gray-600 hover:text-brand transition-colors"
              >
                Sign In
              </button>
            )}
          </nav>

          {/* CTA Button - appears after scrolling past hero */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/homes"
              className={`bg-brand hover:bg-brand text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-300 ${
                scrolledPastHero ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
              }`}
            >
              See all homes
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-3">
            <Link href="/homes" onClick={() => setMenuOpen(false)} className="block text-gray-700 hover:text-brand font-medium">Browse Homes</Link>
            <Link href="/saved" onClick={() => setMenuOpen(false)} className="block text-gray-700 hover:text-brand font-medium">Saved</Link>
            <Link href="/deals" onClick={() => setMenuOpen(false)} className="block text-gray-700 hover:text-brand font-medium">Deals</Link>
            <Link href="/calculator" onClick={() => setMenuOpen(false)} className="block text-gray-700 hover:text-brand font-medium">Calculator</Link>

            {/* Mobile Markets Accordion */}
            <div>
              <button
                onClick={() => setMobileMarketsOpen(!mobileMarketsOpen)}
                className="flex items-center gap-1 text-gray-700 hover:text-brand font-medium w-full"
              >
                Markets
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileMarketsOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileMarketsOpen && (
                <div className="mt-2 ml-4 space-y-1">
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Oregon &amp; PNW Markets</p>
                  {frontRangeCities.map((city) => (
                    <Link
                      key={city.href}
                      href={city.href}
                      onClick={() => setMenuOpen(false)}
                      className="block text-sm text-gray-600 hover:text-brand py-1"
                    >
                      {city.name}
                    </Link>
                  ))}
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mt-3 mb-1">More Markets</p>
                  {northSouthCities.map((city) => (
                    <Link
                      key={city.href}
                      href={city.href}
                      onClick={() => setMenuOpen(false)}
                      className="block text-sm text-gray-600 hover:text-brand py-1"
                    >
                      {city.name}
                    </Link>
                  ))}
                  <Link
                    href="/homes"
                    onClick={() => setMenuOpen(false)}
                    className="block text-xs text-gray-400 hover:text-brand mt-2"
                  >
                    View All Colorado Markets →
                  </Link>
                </div>
              )}
            </div>

            <Link href="/sell" onClick={() => setMenuOpen(false)} className="block text-gray-700 hover:text-brand font-medium">Sell</Link>
            <Link href="/blog" onClick={() => setMenuOpen(false)} className="block text-gray-700 hover:text-brand font-medium">Blog</Link>
            <Link href="/team" onClick={() => setMenuOpen(false)} className="block text-gray-700 hover:text-brand font-medium">Team</Link>
            <Link href="/about" onClick={() => setMenuOpen(false)} className="block text-gray-700 hover:text-brand font-medium">About</Link>
            <a href="tel:7196243472" className="flex items-center gap-2 text-brand hover:text-brand-dark font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z"/>
              </svg>
              (719) 624-3472
            </a>
            {isLoggedIn ? (
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="block w-full text-left text-gray-700 hover:text-brand font-medium"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => { setAuthGateOpen(true); setMenuOpen(false); }}
                className="block w-full text-left text-gray-700 hover:text-brand font-medium"
              >
                Sign In
              </button>
            )}
            <Link
              href="/homes"
              onClick={() => setMenuOpen(false)}
              className="block bg-brand text-white font-semibold px-4 py-2 rounded-lg text-center"
            >
              See all homes
            </Link>
          </div>
        )}
      </div>

      {authGateOpen && (
        <AuthGate
          onUnlock={() => setAuthGateOpen(false)}
          onClose={() => setAuthGateOpen(false)}
        />
      )}
    </header>
  );
}
