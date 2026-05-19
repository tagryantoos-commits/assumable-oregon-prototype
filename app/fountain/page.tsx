import { Metadata } from 'next';
import Link from 'next/link';
import { getListingsByCity } from '../../lib/listings';
import { getFilteredListings } from '../../lib/getFilteredListings';
import ListingCardWrapper from '../ListingCardWrapper';
import { getRelatedPostsForCity } from '../../lib/blog';
import LeadCaptureForm from '../../components/LeadCaptureForm';

export function generateMetadata(): Metadata {
 const cityListings = getListingsByCity('Fountain');
 const count = cityListings.length;
 const minRate = count > 0 ? Math.min(...cityListings.map(l => l.assumableRate)).toFixed(2) : '2.25';
 const slugStr = 'fountain';
 const cityName = 'Fountain';

 return {
 title: `${cityName} Assumable Mortgages | ${count}+ Homes | ${minRate}% Rate | The Assumable Guy`,
 description: `Browse ${count} assumable mortgage listings in ${cityName}, CO. Rates as low as ${minRate}%. Save $500-$1,400/month vs new loans at 6.5%. FHA and VA loans available.`,
 alternates: { canonical: `https://assumableguy.com/${slugStr}` },
 openGraph: {
 title: `${cityName} Assumable Mortgages | ${minRate}% Rate | The Assumable Guy`,
 description: `${count} homes in ${cityName} with assumable loans. Rates from ${minRate}%. Save hundreds per month.`,
 type: 'website',
 url: `https://assumableguy.com/${slugStr}`,
 images: [{ url: 'https://assumableguy.com/images/ryan-headshot.png', width: 1200, height: 630, alt: `${cityName} Assumable Mortgages` }],
 },
 twitter: {
 card: 'summary_large_image',
 title: `${cityName} Assumable Mortgages | ${minRate}% Rate`,
 description: `${count} homes with assumable loans in ${cityName}. Rates from ${minRate}%.`,
 images: ['https://assumableguy.com/images/ryan-headshot.png'],
 },
 };
}

export default function FountainPage() {
 const fountainListings = getListingsByCity('Fountain');
 const featured = getFilteredListings(fountainListings, { limit: 6 });
 const relatedPosts = getRelatedPostsForCity('Fountain');

 const minRate = fountainListings.length > 0 ? Math.min(...fountainListings.map(l => l.assumableRate)).toFixed(2) : '2.25';
 const maxRate = fountainListings.length > 0 ? Math.max(...fountainListings.map(l => l.assumableRate)).toFixed(2) : '4.50';
 const avgPrice = fountainListings.length > 0 ? Math.round(fountainListings.reduce((sum, l) => sum + l.price, 0) / fountainListings.length) : 0;

 return (
 <div className="w-full">
 <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 px-4">
 <div className="max-w-4xl mx-auto text-center">
 <h1 className="text-4xl md:text-5xl font-bold mb-4">Assumable Mortgages in Fountain, Colorado</h1>
 <p className="text-xl md:text-2xl mb-6">Skip the new loan process. Take over an existing mortgage and lock in rates as low as {minRate}%.</p>
 <p className="text-lg opacity-95 mb-8">Fountain offers affordable homes with assumable mortgages. Qualify in days, not months. Save thousands in closing costs and interest.</p>
 </div>
 </section>

 <section className="py-12 px-4 bg-gray-50">
 <div className="max-w-5xl mx-auto">
 <h2 className="text-3xl font-bold mb-8 text-gray-900">Why Choose an Assumable Mortgage in Fountain?</h2>
 <div className="grid md:grid-cols-2 gap-8">
 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
 <h3 className="text-xl font-semibold mb-3 text-blue-700">Lower Interest Rates</h3>
 <p className="text-gray-700">Assumable mortgages in Fountain range from {minRate}% to {maxRate}%. Traditional loans today are over 6.5%. That means savings of $500-$1,400 every month.</p>
 </div>
 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
 <h3 className="text-xl font-semibold mb-3 text-blue-700">Faster Closing</h3>
 <p className="text-gray-700">Assume a loan in 7-14 days instead of 45-60. Less paperwork, fewer inspections, and lower appraisal fees. Get to closing faster.</p>
 </div>
 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
 <h3 className="text-xl font-semibold mb-3 text-blue-700">No Origination Fees</h3>
 <p className="text-gray-700">Skip the 1-2% loan origination fees charged on new mortgages. Avoid PMI on many FHA and VA assumptions. Save thousands upfront.</p>
 </div>
 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
 <h3 className="text-xl font-semibold mb-3 text-blue-700">Qualify More Easily</h3>
 <p className="text-gray-700">Assumable loans have more flexible credit requirements than new mortgages. Lower debt-to-income ratios needed. Better odds of approval.</p>
 </div>
 </div>
 </div>
 </section>

 <section className="py-12 px-4">
 <div className="max-w-5xl mx-auto">
 <h2 className="text-3xl font-bold mb-2 text-gray-900">Fountain Real Estate Market</h2>
 <p className="text-gray-700 mb-8">Fountain is a growing community south of Colorado Springs with family-friendly neighborhoods and affordable prices.</p>
 <div className="grid md:grid-cols-3 gap-6">
 <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
 <p className="text-4xl font-bold text-blue-700 mb-2">${avgPrice.toLocaleString()}</p>
 <p className="text-gray-700">Average home price in Fountain</p>
 </div>
 <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
 <p className="text-4xl font-bold text-blue-700 mb-2">{minRate}%</p>
 <p className="text-gray-700">Lowest assumable rate available</p>
 </div>
 <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
 <p className="text-4xl font-bold text-blue-700 mb-2">{fountainListings.length}+</p>
 <p className="text-gray-700">Active assumable listings</p>
 </div>
 </div>
 </div>
 </section>

 <section className="py-12 px-4 bg-gray-50">
 <div className="max-w-5xl mx-auto">
 <h2 className="text-3xl font-bold mb-8 text-gray-900">Featured Homes with Assumable Mortgages</h2>
 {featured.length > 0 ? (
 <ListingCardWrapper listings={featured} />
 ) : (
 <p className="text-gray-700 text-center py-8">No listings currently available. Check back soon or contact us for updates.</p>
 )}
 <div className="text-center mt-10">
 <Link href="/listings?city=Fountain" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
 View All Fountain Listings
 </Link>
 </div>
 </div>
 </section>

 <section className="py-12 px-4">
 <div className="max-w-5xl mx-auto">
 <h2 className="text-3xl font-bold mb-8 text-gray-900">About Assumable Mortgages</h2>
 <div className="space-y-4 text-gray-700">
 <p>An assumable mortgage allows a home buyer to take over the seller's existing loan. Instead of getting a new mortgage, you inherit their terms, rate, and remaining balance. This is especially valuable in Fountain where assumable mortgages offer rates well below market.</p>
 <p>Assumable mortgages are available on FHA loans, VA loans, USDA loans, and some conventional mortgages. The loan remains tied to the property, not the original borrower. As the new owner, you make payments directly to the lender.</p>
 <p>To assume a mortgage, you must qualify with the lender. They will review your credit, income, and debt-to-income ratio. Requirements are typically more flexible than new mortgages. Some FHA and VA assumptions require only a credit check.</p>
 <p>Fountain's growing population and proximity to Colorado Springs make it attractive for military families and first-time homebuyers. Assumable mortgages remove barriers to entry and make homeownership more affordable.</p>
 </div>
 </div>
 </section>

 <section className="py-12 px-4 bg-white">
 <div className="max-w-3xl mx-auto">
 <LeadCaptureForm
 source="Fountain City Page"
 title="Get Expert Guidance on Fountain Assumable Mortgages"
 subtitle="Speak with The Assumable Guy team. We'll answer your questions and help you find the right home."
 compact={false}
 />
 </div>
 </section>

 {relatedPosts.length > 0 && (
 <section className="py-12 px-4 bg-gray-50">
 <div className="max-w-5xl mx-auto">
 <h2 className="text-3xl font-bold mb-8 text-gray-900">Articles About Fountain & Assumable Mortgages</h2>
 <div className="grid md:grid-cols-2 gap-6">
 {relatedPosts.map((post) => (
 <Link key={post.slug} href={`/blog/${post.slug}`} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border border-gray-200">
 <h3 className="text-xl font-semibold mb-2 text-gray-900 hover:text-blue-600">{post.title}</h3>
 <p className="text-gray-700 mb-4">{post.description}</p>
 <p className="text-sm text-gray-500">{post.date}</p>
 </Link>
 ))}
 </div>
 </div>
 </section>
 )}

 <section className="py-12 px-4 bg-blue-700 text-white">
 <div className="max-w-4xl mx-auto text-center">
 <h2 className="text-3xl font-bold mb-4">Ready to Buy in Fountain?</h2>
 <p className="text-xl mb-8">Contact The Assumable Guy today. We specialize in assumable mortgages and know the Fountain market inside and out.</p>
 <div className="flex flex-col sm:flex-row gap-4 justify-center">
 <Link href="tel:+17195551234" className="inline-block bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
 Call Us Today
 </Link>
 <Link href="/contact" className="inline-block bg-blue-600 border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition">
 Schedule a Consultation
 </Link>
 </div>
 </div>
 </section>
 </div>
 );
}