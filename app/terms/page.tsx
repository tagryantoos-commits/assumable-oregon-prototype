import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | The Assumable Guy',
  description: 'Terms of Service for The Assumable Guy — governing your use of assumableguy.com.',
  alternates: {
    canonical: 'https://assumableguy.com/terms',
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = 'April 27, 2026';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: {lastUpdated}</p>

        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed space-y-8">

          <section>
            <p>
              These Terms of Service govern your use of assumableguy.com, operated by The Assumable
              Guy (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). By accessing or using
              this website, you agree to these terms. If you don&rsquo;t agree, don&rsquo;t use the site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Who We Are</h2>
            <p>
              The Assumable Guy is a licensed real estate team affiliated with Keller Williams,
              specializing in assumable FHA and VA mortgage transactions in Colorado. Our team is
              licensed under Colorado real estate law. Ryan Thomson, CO License #100080993.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use of This Website</h2>
            <p>You may use this site for lawful purposes only. You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Scrape, copy, or reproduce listings or content without permission</li>
              <li>Submit false or misleading information through any form</li>
              <li>Attempt to access any part of the site you&rsquo;re not authorized to use</li>
              <li>Use the site in any way that violates applicable federal, state, or local law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. SMS and Text Message Communications</h2>
            <p>
              By submitting a contact form, registering an account, or otherwise providing your phone
              number on this site, you consent to receive SMS text messages from The Assumable Guy
              related to your real estate inquiry. Message frequency varies. Message and data rates
              may apply.
            </p>
            <p className="mt-3">
              To opt out at any time, reply <strong>STOP</strong> to any text message. To request
              help, reply <strong>HELP</strong> or call{' '}
              <a href="tel:+17196243472" className="text-brand hover:underline">
                (719) 624-3472
              </a>
              . You can also email{' '}
              <a href="mailto:hello@theassumableguy.com" className="text-brand hover:underline">
                hello@theassumableguy.com
              </a>{' '}
              to be removed from our contact list.
            </p>
            <p className="mt-3">
              Opting out will not affect any active real estate transaction you have with our team.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Real Estate Disclaimer</h2>
            <p>
              Nothing on this website constitutes legal, financial, or mortgage advice. Assumable
              mortgage transactions involve complex processes and third-party lender approval. Results
              vary. Past transaction timelines, savings figures, and case studies shared on this site
              reflect specific circumstances and are not guarantees of future outcomes.
            </p>
            <p className="mt-3">
              All real estate services are subject to a separate buyer or seller representation agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Listings and Availability</h2>
            <p>
              Property listings and market data on this site are provided for informational purposes
              and may not reflect current availability. We make no guarantee that any listed property
              is available, accurately described, or suitable for your needs. Confirm all details
              directly with our team before making any decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p>
              All content on this site — including text, graphics, logos, and tools — is owned by or
              licensed to The Assumable Guy. You may not reproduce, distribute, or create derivative
              works from any content without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Third-Party Links</h2>
            <p>
              This site may link to third-party websites we don&rsquo;t control. We&rsquo;re not
              responsible for their content, privacy practices, or accuracy. Links don&rsquo;t imply
              endorsement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, The Assumable Guy is not liable for any indirect,
              incidental, or consequential damages arising from your use of this site or any services
              described here. Our total liability for any claim related to this site will not exceed $100.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
            <p>
              These terms are governed by the laws of the State of Colorado. Any disputes will be
              resolved in the courts of El Paso County, Colorado.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to These Terms</h2>
            <p>
              We may update these Terms of Service at any time. The &ldquo;last updated&rdquo; date
              at the top of this page will reflect any changes. Continued use of the site after
              changes are posted means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact</h2>
            <div className="space-y-1">
              <p><strong>The Assumable Guy</strong></p>
              <p>Ryan Thomson, Colorado Licensed Real Estate Agent</p>
              <p>
                Email:{' '}
                <a href="mailto:hello@theassumableguy.com" className="text-brand hover:underline">
                  hello@theassumableguy.com
                </a>
              </p>
              <p>
                Phone:{' '}
                <a href="tel:+17196243472" className="text-brand hover:underline">
                  (719) 624-3472
                </a>
              </p>
              <p>Website: <a href="https://assumableguy.com" className="text-brand hover:underline">assumableguy.com</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
