import { Metadata } from 'next';
import Link from 'next/link';
import { getListingsByCity } from '../../lib/listings';
import { getFilteredListings } from '../../lib/getFilteredListings';
import ListingCardWrapper from '../ListingCardWrapper';
import MarketExpertForm from '../../components/MarketExpertForm';
import { getRelatedPostsForCity } from '../../lib/blog';

export function generateMetadata(): Metadata {
 const cityListings = getListingsByCity('Peyton');
 const count = cityListings.length;
 const minRate = count > 0 ? Math.min(...cityListings.map(l => l.assumableRate)).toFixed(2) : '2.25';
 const slugStr = 'peyton';
 const cityName = 'Peyton';

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

export default function PeytonPage() {
 const peytonListings = getListingsByCity('Peyton');
 const featured = getFilteredListings(peytonListings, { limit: 6 });

 const avgRate = peytonListings.length > 0
 ? (peytonListings.reduce((sum, l) => sum + l.assumableRate, 0) / peytonListings.length).toFixed(2)
 : '2.25';

 const relatedPosts = getRelatedPostsForCity('Peyton');

 return (
 <div className="min-h-screen bg-white">
 <section className="bg-gradient-to-b from-blue-50 to-white py-16 px-4 sm:px-6 lg:px-8">
 <div className="max-w-4xl mx-auto text-center">
 <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
 Assumable Mortgages in Peyton, Colorado
 </h1>
 <p className="text-xl text-gray-600 mb-8">
 Discover homes with assumable loans at rates as low as {avgRate}%. Lock in savings of $500-$1,400 per month compared to current market rates.
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
 <p className="text-3xl font-bold text-blue-600">{peytonListings.length}+</p>
 <p className="text-gray-600">Assumable Listings</p>
 </div>
 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
 <p className="text-3xl font-bold text-blue-600">{avgRate}%</p>
 <p className="text-gray-600">Average Rate</p>
 </div>
 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
 <p className="text-3xl font-bold text-blue-600">$1K+</p>
 <p className="text-gray-600">Monthly Savings</p>
 </div>
 </div>
 </div>
 </section>

 <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
 <div className="max-w-6xl mx-auto">
 <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
 Featured Assumable Homes in Peyton
 </h2>
 {featured.length > 0 ? (
 <ListingCardWrapper listings={featured} />
 ) : (
 <div className="text-center py-12">
 <p className="text-gray-600 text-lg">
 No listings currently available. Check back soon for new assumable mortgages in Peyton.
 </p>
 </div>
 )}
 </div>
 </section>

 <section className="py-12 px-4 sm:px-6 lg:px-8">
 <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
 <div>
 <h2 className="text-3xl font-bold text-gray-900 mb-6">
 Why Choose an Assumable Mortgage in Peyton?
 </h2>
 <ul className="space-y-4">
 <li className="flex items-start">
 <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
 <p className="text-gray-700">Lock in lower interest rates and save thousands over the life of the loan.</p>
 </li>
 <li className="flex items-start">
 <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
 <p className="text-gray-700">Streamlined closing process means faster home ownership in Peyton.</p>
 </li>
 <li className="flex items-start">
 <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
 <p className="text-gray-700">FHA and VA assumable loans available for qualified buyers.</p>
 </li>
 <li className="flex items-start">
 <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
 <p className="text-gray-700">Lower closing costs compared to traditional mortgage refinancing.</p>
 </li>
 <li className="flex items-start">
 <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
 <p className="text-gray-700">Perfect for military families and relocating professionals.</p>
 </li>
 </ul>
 </div>
 <div className="bg-gradient-to-br from-gray-900 to-brand-dark rounded-3xl p-6 text-white">
 <div className="text-center mb-4">
 <h3 className="text-xl font-bold mb-2">Talk to an Assumable Mortgage Expert in Peyton</h3>
 <p className="text-gray-300 text-sm">Fill out the form below and one of our agents will reach out to walk you through your options.</p>
 </div>
 <div className="bg-white rounded-2xl p-5">
 <MarketExpertForm city="Peyton" />
 </div>
 </div>
 </div>
 </section>

 <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
 <div className="max-w-4xl mx-auto">
 <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
 About Peyton, Colorado
 </h2>
 <div className="prose prose-lg max-w-none text-gray-700">
 <p>
 Peyton is a charming community located east of Colorado Springs, known for its rural character and proximity to the Front Range. The area attracts families and professionals seeking a quieter lifestyle while maintaining access to Colorado Springs amenities.
 </p>
 <p>
 As a growing area in El Paso County, Peyton offers excellent opportunities for homebuyers. With assumable mortgages, you can take advantage of below-market interest rates and reduce your monthly housing costs significantly.
 </p>
 <p>
 The Assumable Guy specializes in helping buyers like you navigate assumable mortgages in Peyton and throughout El Paso County. Whether you are relocating for work, military service, or personal reasons, we have the expertise to help you find the right assumable home.
 </p>
 </div>
 </div>
 </section>

 {relatedPosts.length > 0 && (
 <section className="py-12 px-4 sm:px-6 lg:px-8">
 <div className="max-w-4xl mx-auto">
 <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
 Learn More About Assumable Mortgages
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 {relatedPosts.slice(0, 4).map((post) => (
 <Link key={post.slug} href={`/blog/${post.slug}`}>
 <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200">
 <h3 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h3>
 <p className="text-gray-600 mb-4">{post.description}</p>
 <span className="text-blue-600 font-semibold hover:underline">Read More</span>
 </div>
 </Link>
 ))}
 </div>
 </div>
 </section>
 )}

 <section className="py-12 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
 <div className="max-w-4xl mx-auto text-center">
 <h2 className="text-3xl font-bold mb-4">
 Ready to Explore Assumable Homes in Peyton?
 </h2>
 <p className="text-lg mb-8 opacity-90">
 Connect with The Assumable Guy today. We will help you navigate the process and find the perfect assumable mortgage in Peyton.
 </p>
 <Link
 href="/contact"
 className="inline-block bg-white text-blue-600 font-bold px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors"
 >
 Schedule a Consultation
 </Link>
 </div>
 </section>

 <section className="py-12 px-4 sm:px-6 lg:px-8">
 <div className="max-w-4xl mx-auto">
 <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
 Frequently Asked Questions
 </h2>
 <div className="space-y-6">
 <div className="bg-white p-6 rounded-lg border border-gray-200">
 <h3 className="text-xl font-bold text-gray-900 mb-2">
 What is an assumable mortgage?
 </h3>
 <p className="text-gray-700">
 An assumable mortgage allows a buyer to take over the seller&apos;s existing loan instead of obtaining a new one. This means you inherit the original interest rate, which is often lower than current market rates.
 </p>
 </div>
 <div className="bg-white p-6 rounded-lg border border-gray-200">
 <h3 className="text-xl font-bold text-gray-900 mb-2">
 Am I eligible to assume a mortgage in Peyton?
 </h3>
 <p className="text-gray-700">
 Most FHA, VA, and USDA loans are assumable. Conventional loans may have restrictions. The Assumable Guy will review the specific loan to determine eligibility. Contact us to discuss your situation.
 </p>
 </div>
 <div className="bg-white p-6 rounded-lg border border-gray-200">
 <h3 className="text-xl font-bold text-gray-900 mb-2">
 How much can I save with an assumable mortgage?
 </h3>
 <p className="text-gray-700">
 Savings depend on the interest rate difference between the assumable loan and current market rates. Many buyers save $500-$1,400 per month. Our team can calculate your specific savings.
 </p>
 </div>
 <div className="bg-white p-6 rounded-lg border border-gray-200">
 <h3 className="text-xl font-bold text-gray-900 mb-2">
 How long does it take to assume a mortgage?
 </h3>
 <p className="text-gray-700">
 The assumable mortgage process is typically faster than obtaining a traditional loan. Most transactions close within 2-4 weeks, depending on lender requirements and your financial situation.
 </p>
 </div>
 </div>
 </div>
 </section>
 </div>
 );
}