import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <span className="text-brand-light text-xl">🏠</span>
              <span>The <span className="text-brand-light">Assumable</span> Guy</span>
            </div>
            <p className="text-sm text-gray-400 max-w-sm">
              Oregon &amp; PNW experts in assumable mortgage transactions.
              Helping buyers save $1,100+ per month on their next home.
            </p>
            <div className="mt-4 flex flex-col gap-1 text-sm">
              <a href="tel:7196243472" className="text-brand-light hover:text-brand-light">(719) 624-3472</a>
              <a href="mailto:ryan@TheAssumableGuy.com" className="text-brand-light hover:text-brand-light">ryan@TheAssumableGuy.com</a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Browse</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/homes" className="hover:text-brand-light transition-colors">All Oregon &amp; PNW Listings</Link></li>
              <li><Link href="/portland" className="hover:text-brand-light transition-colors">Portland</Link></li>
              <li><Link href="/vancouver" className="hover:text-brand-light transition-colors">Vancouver, WA</Link></li>
              <li><Link href="/beaverton" className="hover:text-brand-light transition-colors">Beaverton</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Learn More</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-brand-light transition-colors">About</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-brand-light transition-colors">How It Works</Link></li>
              <li><Link href="/#faq" className="hover:text-brand-light transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2026 The Assumable Guy | Oregon &amp; PNW Prototype. All rights reserved.</p>
          <p>All listings subject to change. Contact us to verify current availability.</p>
        </div>
      </div>
    </footer>
  );
}
