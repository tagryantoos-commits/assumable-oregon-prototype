import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import LayoutWrapper from '../components/LayoutWrapper';
import ExitIntentPopup from '../components/ExitIntentPopup';
import ChatWidget from '../components/ChatWidget';
import MetaPixel from '../components/MetaPixel';

export const metadata: Metadata = {
  metadataBase: new URL('https://assumable-oregon-prototype.vercel.app'),
  title: 'The Assumable Guy | Oregon & PNW Assumable Mortgages | Save $500-$1,500/Month',
  description: 'Browse Oregon & Washington homes with low-rate assumable mortgages (2-4%). Save hundreds per month vs today\'s 6%+ rates. Portland, Vancouver, Beaverton & more.',
  keywords: 'assumable mortgage oregon, FHA assumable loan oregon, VA assumable mortgage portland, portland assumable, vancouver wa assumable homes',

  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'The Assumable Guy | Oregon & PNW Assumable Mortgages',
    description: 'Browse Oregon & Washington homes with low-rate assumable mortgages. Save $500-$1,500/month.',
    type: 'website',
    url: 'https://assumable-oregon-prototype.vercel.app',
  },
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'The Assumable Guy',
  description: 'Oregon & Washington real estate team specializing in assumable mortgages. FHA and VA loans with rates as low as 2.6%. Serving Portland, Vancouver, Beaverton, and the PNW.',
  url: 'https://assumable-oregon-prototype.vercel.app',
  telephone: '+17196243472',
  areaServed: [
    { '@type': 'State', name: 'Oregon' },
    { '@type': 'State', name: 'Washington' },
  ],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Portland',
    addressRegion: 'OR',
    addressCountry: 'US',
  },
  knowsAbout: ['Assumable mortgages', 'FHA loans', 'VA loans', 'USDA loans', 'Colorado real estate'],
  sameAs: [
    'https://www.instagram.com/the.assumable.guy/',
    'https://www.tiktok.com/@the.assumable.guy',
    'https://www.linkedin.com/in/ryanthomson111/',
  ],
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'The Assumable Guy',
  alternateName: 'The Assumable Guy Real Estate Team',
  url: 'https://assumableguy.com',
  logo: 'https://assumableguy.com/icon.svg',
  description: 'Colorado\'s leading real estate team specializing exclusively in assumable mortgages. We help buyers assume existing FHA and VA loans at 2-4% interest rates instead of getting new mortgages at 6%+ rates, saving $500 to $1,500 per month.',
  founder: {
    '@type': 'Person',
    name: 'Ryan Thomson',
    jobTitle: 'Licensed Real Estate Agent',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+17196243472',
    contactType: 'sales',
    areaServed: 'US-CO',
    availableLanguage: 'English',
  },
  areaServed: {
    '@type': 'State',
    name: 'Colorado',
    containedInPlace: {
      '@type': 'Country',
      name: 'United States',
    },
  },
  knowsAbout: [
    'Assumable mortgages',
    'FHA loan assumptions',
    'VA loan assumptions',
    'USDA loan assumptions',
    'Equity gap financing',
    'Mortgage assumption process',
    'Colorado real estate',
  ],
  sameAs: [
    'https://www.instagram.com/the.assumable.guy/',
    'https://www.tiktok.com/@the.assumable.guy',
    'https://www.linkedin.com/in/ryanthomson111/',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // GTM_CONTAINER_ID env var: set in Vercel dashboard once you have a GTM container.
  // Google Ads conversion tracking fires from /app/buy/BuyPageClient.tsx via window.gtag().
  // NEXT_PUBLIC_GADS_CONVERSION_ID format: AW-XXXXXXXXXX/XXXXXXXXXX
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID; // e.g. GTM-XXXXXXX

  return (
    <html lang="en">
      <head />
      <body className="antialiased">
        {/* ── Google Tag Manager ── */}
        {GTM_ID && (
          <>
            <Script id="gtm" strategy="afterInteractive">
              {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
            </Script>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          </>
        )}
        {/* ── Google Ads gtag ── hardcoded ID to prevent conditional compilation stripping */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17997636825"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','AW-17997636825');`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <LayoutWrapper>{children}</LayoutWrapper>
        <ExitIntentPopup />
        <ChatWidget />
        <MetaPixel />
      </body>
    </html>
  );
}
