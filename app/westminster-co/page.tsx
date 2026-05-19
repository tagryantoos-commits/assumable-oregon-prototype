import { Metadata } from 'next';
import Link from 'next/link';
import { getListingsByCity } from '../../lib/listings';
import { getFilteredListings } from '../../lib/getFilteredListings';
import ListingCardWrapper from '../ListingCardWrapper';
import MarketExpertForm from '../../components/MarketExpertForm';
import { getRelatedPostsForCity } from '../../lib/blog';

export function generateMetadata(): Metadata {
 const cityListings = getListingsByCity('Westminster');
 const count = cityListings.length;
 const minRate = count > 0 ? Math.min(...cityListings.map(l => l.assumableRate)).toFixed(2) : '2.25';
 const slugStr = 'westminster-co';
 const cityName = 'Westminster';

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

export default function WestminsterPage() {
 const westminsterListings = getListingsByCity('Westminster');
 const featured = getFilteredListings(westminsterListings, { limit: 6 });

 const avgRate = westminsterListings.length > 0
 ? (westminsterListings.reduce((sum, l) => sum + l.assumableRate, 0) / westminsterListings.length).toFixed(2)
 : '2.75';

 const avgSavings = westminsterListings.length > 0
 ? Math.round(westminsterListings.reduce((sum, l) => sum + l.monthlySavings, 0) / westminsterListings.length)
 : 950;

 const relatedPosts = getRelatedPostsForCity('Westminster');

 return (
 <div className="min-h-screen bg-gray-50">
 <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4">
 <div className="max-w-4xl mx-auto">
 <h1 className="text-4xl font-bold mb-4">Assumable Mortgages in Westminster, Colorado</h1>
 <p className="text-xl mb-6">
 Skip the new loan hassle. Take over existing mortgages at rates as low as {westminsterListings.length > 0 ? Math.min(...westminsterListings.map(l => l.assumableRate)).toFixed(2) : '2.25'}%. Save up to ${avgSavings}/month compared to current market rates.
 </p>
 <p className="text-lg opacity-90">
 {westminsterListings.length}+ homes available with assumable loans in Westminster and surrounding areas.
 </p>
 </div>
 </section>

 <section className="max-w-5xl mx-auto px-4 py-12">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
 <div className="bg-white rounded-lg shadow-md p-6">
 <div className="text-3xl font-bold text-blue-600 mb-2">{westminsterListings.length}+</div>
 <p className="text-gray-700">Assumable Listings Available</p>
 </div>
 <div className="bg-white rounded-lg shadow-md p-6">
 <div className="text-3xl font-bold text-blue-600 mb-2">{avgRate}%</div>
 <p className="text-gray-700">Average Assumable Rate</p>
 </div>
 <div className="bg-white rounded-lg shadow-md p-6">
 <div className="text-3xl font-bold text-blue-600 mb-2">${avgSavings}</div>
 <p className="text-gray-700">Avg Monthly Savings</p>
 </div>
 </div>

 <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-12 rounded">
 <h2 className="text-2xl font-bold text-gray-800 mb-3">Why Choose an Assumable Mortgage in Westminster?</h2>
 <ul className="text-gray-700 space-y-2">
 <li>. Lock in rates significantly lower than current market rates (currently 6.5%+)</li>
 <li>. Streamlined approval process. Faster closing than traditional financing</li>
 <li>. Access to FHA and VA assumable loans with special terms</li>
 <li>. Avoid paying appraisal fees and many closing costs</li>
 <li>. Perfect for first-time homebuyers and families seeking stability</li>
 </ul>
 </div>

 <h2 className="text-3xl font-bold text-gray-800 mb-8">Featured Assumable Homes in Westminster</h2>
 {featured.length > 0 ? (
 <ListingCardWrapper listings={featured} />
 ) : (
 <div className="bg-white rounded-lg shadow p-8 text-center">
 <p className="text-gray-600 text-lg">No listings currently available. Check back soon or contact us for off-market opportunities.</p>
 </div>
 )}

 <div id="get-notified" className="mt-12 bg-gradient-to-br from-gray-900 to-brand-dark rounded-3xl p-8 text-white">
 <div className="text-center mb-6">
 <h3 className="text-2xl font-bold mb-2">Talk to an Assumable Mortgage Expert in Westminster</h3>
 <p className="text-gray-300 text-sm">Fill out the form below and one of our agents will reach out to walk you through your options.</p>
 </div>
 <div className="bg-white rounded-2xl p-6">
 <MarketExpertForm city="Westminster" />
 </div>
 </div>

 <section className="mt-16 bg-gray-100 rounded-lg p-8">
 <h2 className="text-2xl font-bold text-gray-800 mb-6">About Assumable Mortgages</h2>
 <div className="text-gray-700 space-y-4">
 <p>
 An assumable mortgage allows you to take over the seller's existing loan instead of applying for a new one. This is especially valuable in Westminster's competitive market, where you can inherit below-market interest rates.
 </p>
 <p>
 Westminster, located in Adams County between Denver and Boulder, has seen steady real estate growth. With proximity to major employers and family-friendly neighborhoods, assumable mortgages are a smart way to enter or upgrade your home here without the burden of current market financing.
 </p>
 <p>
 Eligible loans include FHA mortgages (allowing non-military buyers), VA loans (for military and veterans), and conventional mortgages depending on lender approval. The process typically takes 15-30 days, making it significantly faster than traditional home purchases.
 </p>
 </div>
 </section>

 {relatedPosts.length > 0 && (
 <section className="mt-16">
 <h2 className="text-2xl font-bold text-gray-800 mb-6">Latest Assumable Mortgage Insights</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {relatedPosts.slice(0, 4).map((post) => (
 <Link key={post.slug} href={`/blog/${post.slug}`}>
 <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer">
 <h3 className="font-bold text-lg text-gray-800 mb-2">{post.title}</h3>
 <p className="text-gray-600 text-sm mb-4">{post.description}</p>
 <span className="text-blue-600 font-semibold">Read More .</span>
 </div>
 </Link>
 ))}
 </div>
 </section>
 )}


 </section>
 </div>
 );
}