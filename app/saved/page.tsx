import { Metadata } from 'next';
import SavedClient from './SavedClient';

export const metadata: Metadata = {
  title: 'My Saved Listings | The Assumable Guy',
  description: 'View your saved assumable mortgage properties. Compare rates, monthly savings, and equity gaps across your favorites.',
};

export default function SavedPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-black mb-2">My Saved Listings</h1>
          <p className="text-gray-300 text-base">Properties you&apos;ve saved while browsing. Your agent can see these too.</p>
        </div>
      </section>
      <SavedClient />
    </div>
  );
}
