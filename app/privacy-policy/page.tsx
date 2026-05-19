import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | The Assumable Guy',
  description: 'Privacy Policy for The Assumable Guy, how we collect, use, and protect your personal information.',
  alternates: {
    canonical: 'https://assumableguy.com/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'April 17, 2026';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: {lastUpdated}</p>

        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed space-y-8">

          <section>
            <p>
              The Assumable Guy (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates
              assumableguy.com. This Privacy Policy explains what information we collect when you use
              our website, how we use it, how we protect it, and your rights with respect to it.
            </p>
            <p className="mt-3">
              By using this website, you agree to the collection and use of information as described
              in this policy. If you have questions, contact us at{' '}
              <a href="mailto:ryan@TheAssumableGuy.com" className="text-brand hover:underline">
                ryan@TheAssumableGuy.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">Information You Provide Directly</h3>
            <p>When you submit a lead form, register an account, or contact us, we may collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Home buying preferences (price range, location, timeline)</li>
              <li>Messages or questions you send us</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Information Collected Automatically</h3>
            <p>When you visit our website, we automatically collect certain technical information, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>IP address and general location (city/region level)</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent on each page</li>
              <li>Referring website or search query that brought you here</li>
              <li>Device type (desktop, mobile, tablet)</li>
              <li>Clicks, scrolls, and interactions on our site</li>
            </ul>
            <p className="mt-3">
              This information is collected through cookies and third-party analytics tools described below.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Cookies and Tracking Technologies</h3>
            <p>
              We use cookies and similar tracking technologies to operate our website, analyze traffic,
              and serve relevant advertising. You can control cookie behavior through your browser settings,
              though disabling cookies may affect site functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Respond to your inquiries and connect you with real estate resources</li>
              <li>Send you information about available assumable mortgage listings in Colorado</li>
              <li>Follow up on your home buying or selling goals via phone, email, or text</li>
              <li>Improve our website content, performance, and user experience</li>
              <li>Measure the effectiveness of our advertising campaigns</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-3">
              If you submit a contact form or register on our site, you consent to being contacted by
              our team via the information you provide. You may opt out at any time by replying STOP
              to any text message or clicking unsubscribe in any email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third Parties We Share Data With</h2>
            <p>
              We do not sell your personal information. We share data only with the following trusted
              service providers that help us operate our business:
            </p>

            <div className="mt-4 space-y-4">
              <div className="border border-gray-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">FollowUpBoss (CRM)</h4>
                <p className="text-sm mt-1">
                  Contact information you submit is stored in FollowUpBoss, our customer relationship
                  management system. This allows our agents to follow up on your inquiry efficiently.
                  FollowUpBoss is a U.S.-based company with its own privacy policy at followupboss.com.
                </p>
              </div>

              <div className="border border-gray-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">Google Analytics and Google Ads</h4>
                <p className="text-sm mt-1">
                  We use Google Analytics to understand how visitors use our site, and Google Ads to
                  measure the performance of our advertising campaigns. Google may collect data through
                  cookies and similar technologies. You can opt out of Google Analytics tracking at{' '}
                  <a href="https://tools.google.com/dlpage/gaoptout" className="text-brand hover:underline" target="_blank" rel="noopener noreferrer">
                    tools.google.com/dlpage/gaoptout
                  </a>. Google&rsquo;s privacy policy is available at policies.google.com/privacy.
                </p>
              </div>

              <div className="border border-gray-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">Meta (Facebook) Pixel</h4>
                <p className="text-sm mt-1">
                  We use the Meta Pixel to measure the effectiveness of our Facebook and Instagram
                  advertising, and to serve relevant ads to people who have visited our site. Meta
                  may collect browsing behavior data through this pixel. You can manage your ad
                  preferences at facebook.com/ads/preferences.
                </p>
              </div>

              <div className="border border-gray-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">Supabase</h4>
                <p className="text-sm mt-1">
                  We use Supabase to securely store user account data and saved listing preferences
                  for registered users of our site. Data is stored on encrypted servers. Supabase&rsquo;s
                  privacy policy is available at supabase.com/privacy.
                </p>
              </div>

              <div className="border border-gray-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">Resend (Email)</h4>
                <p className="text-sm mt-1">
                  We use Resend to send transactional emails (account confirmations, listing alerts)
                  from our domain. Your email address is transmitted to Resend solely for the purpose
                  of email delivery. Resend&rsquo;s privacy policy is available at resend.com/legal/privacy-policy.
                </p>
              </div>
            </div>

            <p className="mt-4">
              All third-party service providers are contractually required to handle your data
              securely and only for the purposes we specify. We do not share your information
              with any other third parties without your explicit consent, except as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Protect Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>All data transmitted between your browser and our site is encrypted via HTTPS/TLS</li>
              <li>User account data is stored in Supabase with encryption at rest</li>
              <li>Access to contact data in our CRM is limited to licensed real estate agents on our team</li>
              <li>We do not store full credit card or financial account numbers</li>
              <li>Our systems are reviewed regularly for security vulnerabilities</li>
            </ul>
            <p className="mt-3">
              No method of transmission over the internet is 100% secure. While we take commercially
              reasonable precautions to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Access</strong> the personal information we hold about you</li>
              <li><strong>Correct</strong> inaccurate or incomplete information</li>
              <li><strong>Delete</strong> your information from our systems (subject to legal retention requirements)</li>
              <li><strong>Opt out</strong> of marketing communications at any time</li>
              <li><strong>Opt out</strong> of targeted advertising through Google and Meta settings</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{' '}
              <a href="mailto:ryan@TheAssumableGuy.com" className="text-brand hover:underline">
                ryan@TheAssumableGuy.com
              </a>{' '}
              and we will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
            <p>
              We retain your contact information for as long as necessary to provide our services
              and comply with legal obligations. If you request deletion of your data, we will remove
              it from our active systems within 30 days, except where retention is required by law
              (such as real estate transaction records, which Colorado law requires us to retain for
              a minimum period).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Children&rsquo;s Privacy</h2>
            <p>
              Our website is not directed at children under 13. We do not knowingly collect personal
              information from children under 13. If you believe we have inadvertently collected
              such information, contact us immediately and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the
              &ldquo;Last updated&rdquo; date at the top of this page. We encourage you to review
              this page periodically. Continued use of our website after any changes constitutes
              your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or how we handle your data:</p>
            <div className="mt-3 space-y-1">
              <p><strong>The Assumable Guy</strong></p>
              <p>Ryan Thomson, Colorado Licensed Real Estate Agent</p>
              <p>
                Email:{' '}
                <a href="mailto:ryan@TheAssumableGuy.com" className="text-brand hover:underline">
                  ryan@TheAssumableGuy.com
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
