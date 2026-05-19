import { Metadata } from 'next';
import ContactForm from '../../components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Ryan Thomson | The Assumable Guy',
  description:
    'Questions about assumable mortgages in Colorado? Send Ryan a message and he\'ll get back to you within 1 business day.',
  alternates: {
    canonical: 'https://assumableguy.com/contact',
  },
};

export default function ContactPage() {
  return (
    <div>
      {/* HERO */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-brand-dark text-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-3">Get in Touch</h1>
          <p className="text-lg text-gray-300">
            Questions about assumable mortgages, a specific listing, or working with our
            team? Send a message and Ryan will get back to you — usually same day.
          </p>
        </div>
      </section>

      {/* FORM */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
            <ContactForm />
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Prefer email or phone?{' '}
              <a href="mailto:ryan@TheAssumableGuy.com" className="text-brand font-semibold hover:underline">
                ryan@TheAssumableGuy.com
              </a>
              {' · '}
              <a href="tel:+17196243472" className="text-brand font-semibold hover:underline">
                (719) 624-3472
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
