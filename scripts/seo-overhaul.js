#!/usr/bin/env node
/**
 * SEO/GEO Overhaul Script for assumableguy.com blog posts
 * Processes all 107 MDX files:
 * 1. Updates frontmatter (adds missing fields)
 * 2. Fixes em-dashes
 * 3. Removes AI tells
 * 4. Adds FAQ sections
 * 5. Adds CTA blocks
 * 6. Adds internal links where missing
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '../content/blog');

// ─── AI TELLS REPLACEMENTS ────────────────────────────────────────────────────
const AI_TELLS = [
  [/\bdelve into\b/gi, 'look at'],
  [/\bdive into\b/gi, 'get into'],
  [/\bit'?s worth noting that\b/gi, ''],
  [/\bit is worth noting that\b/gi, ''],
  [/\bin conclusion[,.]?\s*/gi, 'Bottom line: '],
  [/\bfurthermore[,]\s*/gi, 'Also, '],
  [/\bfurthermore\b/gi, 'Also'],
  [/\bmoreover[,]\s*/gi, 'Also, '],
  [/\bmoreover\b/gi, 'Also'],
  [/\bnavigating the\b/gi, 'working through the'],
  [/\bnavigating\b/gi, 'working through'],
  [/\bmortgage landscape\b/gi, 'mortgage market'],
  [/\breal estate landscape\b/gi, 'real estate market'],
  [/\bhousing landscape\b/gi, 'housing market'],
  [/\bfinancial landscape\b/gi, 'financial market'],
  [/\blandscape\b/gi, 'market'],
  [/\bgame-changer\b/gi, 'a major advantage'],
  [/\bgame changer\b/gi, 'a major advantage'],
  [/\bleverage\s+(your|this|these|the|a|an)\b/gi, 'use $1'],
  [/\brobust\b/gi, 'strong'],
  [/\bseamless(ly)?\b/gi, 'smooth$1'],
  [/\bcutting-edge\b/gi, 'advanced'],
  [/\btransformative\b/gi, 'significant'],
  [/\bin today'?s world[,.]?\s*/gi, 'Right now, '],
  [/\bin today'?s market[,.]?\s*/gi, 'Right now in the market, '],
  [/\bat the end of the day[,.]?\s*/gi, ''],
  [/\blet'?s explore\b/gi, 'Here\'s'],
  [/\blet'?s dive\b/gi, 'Here\'s'],
  [/^Additionally[,]\s*/gim, 'Also, '],
  [/^Furthermore[,]\s*/gim, 'Also, '],
  [/^Moreover[,]\s*/gim, 'Also, '],
];

// ─── EM-DASH REPLACEMENT ──────────────────────────────────────────────────────
function fixEmDashes(text) {
  // Replace em-dash with surrounding spaces
  text = text.replace(/ — /g, ', ');
  text = text.replace(/—/g, ', ');
  return text;
}

// ─── AI TELLS REPLACEMENT ─────────────────────────────────────────────────────
function fixAiTells(text) {
  for (const [pattern, replacement] of AI_TELLS) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

// ─── WORD COUNT ───────────────────────────────────────────────────────────────
function wordCount(text) {
  return text.trim().split(/\s+/).length;
}

// ─── DETECT POST TYPE ─────────────────────────────────────────────────────────
function detectPostType(slug, title, tags) {
  const s = slug.toLowerCase();
  const t = (title || '').toLowerCase();
  
  if (s.includes('colorado-springs')) return 'colorado-springs';
  if (s.includes('denver')) return 'denver';
  if (s.includes('aurora')) return 'aurora';
  if (s.includes('fort-collins')) return 'fort-collins';
  if (s.includes('boulder')) return 'boulder';
  if (s.includes('pueblo')) return 'pueblo';
  if (s.includes('lakewood')) return 'lakewood';
  if (s.includes('greeley')) return 'greeley';
  if (s.includes('thornton')) return 'thornton';
  if (s.includes('arvada')) return 'arvada';
  if (s.includes('westminster')) return 'westminster';
  if (s.includes('castle-rock')) return 'castle-rock';
  if (s.includes('parker')) return 'parker';
  if (s.includes('loveland')) return 'loveland';
  if (s.includes('broomfield')) return 'broomfield';
  if (s.includes('highlands-ranch')) return 'highlands-ranch';
  if (s.includes('-colorado')) return 'colorado-city';
  if (s.includes('fha')) return 'fha';
  if (s.includes('va-loan') || s.includes('va_loan')) return 'va';
  if (s.includes('usda')) return 'usda';
  if (s.includes('equity-gap') || s.includes('equity_gap')) return 'equity-gap';
  if (s.includes('credit-score') || s.includes('credit_score')) return 'credit';
  if (s.includes('closing')) return 'closing';
  if (s.includes('calculator') || s.includes('savings') || s.includes('math')) return 'math';
  if (s.includes('divorce') || s.includes('separation')) return 'divorce';
  if (s.includes('seller') || s.includes('sell')) return 'seller';
  if (s.includes('down-payment') || s.includes('down_payment')) return 'down-payment';
  if (s.includes('second-mortgage') || s.includes('blended')) return 'second-mortgage';
  if (s.includes('complete-guide') || s.includes('what-is')) return 'guide';
  if (s.includes('first-time')) return 'first-time';
  if (s.includes('investment') || s.includes('investor')) return 'investor';
  if (s.includes('fort-') || s.includes('military') || s.includes('jblm') || s.includes('camp-')) return 'military';
  // Out-of-state cities
  if (s.match(/atlanta|georgia|florida|texas|virginia|maryland|nashville|phoenix|las-vegas|san-diego|san-antonio|boise|utah|salt-lake|hawaii|alaska|ohio|kentucky|louisville|raleigh|fayetteville|huntsville|savannah|jacksonville|pensacola|tampa|oceanside|tacoma|spokane|omaha|oklahoma|kansas|columbia|clarksville|augusta|columbus-fort|albuquerque|el-paso/)) return 'out-of-state';
  return 'general';
}

// ─── FAQ GENERATION ───────────────────────────────────────────────────────────
function generateFaq(postType, slug, title) {
  const ctaLink = `/homes`;
  
  const faqs = {
    'colorado-springs': `
## Frequently Asked Questions

### What makes Colorado Springs good for assumable mortgages?
Colorado Springs has one of the highest concentrations of VA loans in the country, thanks to Fort Carson, Peterson Space Force Base, Schriever, and the Air Force Academy. Military families move every 2-4 years on PCS orders, leaving behind low-rate VA loans from 2019-2022 that new buyers can assume.

### How much can I save on a Colorado Springs assumable mortgage?
On a $450,000 home with an assumed rate of 3.25% vs. today's 7%, you'd save roughly $1,100-$1,300 per month. Over five years, that's $66,000-$78,000 in payment savings.

### Do I need to be a veteran to assume a VA loan in Colorado Springs?
No. Non-veterans can assume VA loans. The process requires lender approval and standard credit/income qualification. The seller's VA entitlement stays tied to the loan unless a veteran with their own entitlement assumes it.

### How long does an assumption take in Colorado Springs?
Most assumptions in Colorado Springs take 45-90 days from accepted offer to close. VA assumptions through military-familiar servicers can sometimes move faster.

### Where do I find assumable homes in Colorado Springs?
[Browse assumable listings in Colorado Springs](/colorado-springs) or [search all Colorado assumable homes](/homes). Filter by city, rate, and price to find properties that match your budget.

### What is the equity gap and how do I handle it?
The equity gap is the difference between the home's sale price and the existing loan balance. You cover it with cash, a second mortgage, or a combination. Most buyers in Colorado Springs use a blend of both.
`,
    'denver': `
## Frequently Asked Questions

### Are there assumable mortgages available in Denver?
Yes. Denver has significant FHA and VA loan inventory from the 2019-2022 low-rate window. Neighborhoods with high military or federal employee populations tend to have the most assumable VA loans.

### How much can I save assuming a mortgage in Denver?
On a $550,000 Denver home with a 3% assumed rate vs. today's 7%, you'd save $1,200-$1,500 per month. That's real money over a 5-10 year hold.

### Which Denver neighborhoods have the most assumable mortgages?
Aurora (adjacent to Denver), Lakewood, Arvada, and Westminster tend to have solid assumable inventory. [Browse Denver-area assumable homes](/homes) to see current availability.

### Can I assume an FHA loan in Denver as a first-time buyer?
Yes. FHA assumptions are open to any qualified buyer, including first-time homebuyers. You'll need to meet the lender's credit and income requirements.

### How long does the assumption process take in Denver?
Plan for 45-75 days. Denver has experienced servicers familiar with assumptions, which helps keep timelines tighter than the national average.

### What's the equity gap situation like in Denver?
Denver home values have appreciated significantly. Many assumable loans carry equity gaps of $50,000-$150,000. You can cover these with cash or a second mortgage. Even with a second, the blended rate often beats a new conventional loan.
`,
    'fha': `
## Frequently Asked Questions

### Are all FHA loans assumable?
Yes. Every FHA loan is assumable by law. FHA loans originated after December 1, 1986 require lender approval and credit/income qualification. Loans before that date are freely assumable, though rare.

### What credit score do I need to assume an FHA loan?
Most servicers require a minimum 580 credit score for FHA assumptions, though some want 620+. Your debt-to-income ratio should be under 43%.

### How long does an FHA assumption take?
FHA assumptions typically take 45-90 days from application to close. The timeline depends on how responsive the servicer is. Having all your documents ready upfront speeds things up.

### What are the closing costs on an FHA assumption?
FHA assumption closing costs are lower than a traditional purchase. Expect an assumption fee of $500-$1,000, title insurance, recording fees, and prepaid taxes and insurance. No origination fees or discount points.

### Do I need to pay FHA mortgage insurance when I assume the loan?
It depends on the loan date. FHA loans originated before June 2013 may have different MIP terms. Your assumption processor can clarify what MIP obligations transfer with the specific loan.

### Can I use down payment assistance with an FHA assumption?
Some down payment assistance programs allow funds to be used for the equity gap in an assumption. Check with your state's housing finance agency for specifics.
`,
    'va': `
## Frequently Asked Questions

### Can non-veterans assume VA loans?
Yes. Non-veterans can assume VA loans. You don't need military service. You need to qualify financially (credit, income, DTI) with the loan servicer. The seller's VA entitlement stays tied to the loan if a non-veteran assumes it.

### What happens to the seller's VA entitlement when their loan is assumed?
If a non-veteran assumes the loan, the seller's entitlement stays tied to the property until the loan is paid off. If a veteran assumes and substitutes their own entitlement, the seller's entitlement is released for future use.

### What credit score is needed to assume a VA loan?
Most servicers require 620+ for VA assumptions. The VA itself doesn't set a minimum, but lenders do. Your DTI should generally be under 41%.

### How long does a VA loan assumption take?
VA assumptions typically take 45-90 days. Servicers familiar with VA loans (USAA, Navy Federal, Veterans United) tend to process faster. Smaller banks can be slower.

### What are the fees for assuming a VA loan?
VA assumption fees are minimal: typically a $300-$500 assumption processing fee plus standard closing costs (title, recording, prepaid items). No VA funding fee applies to assumptions.

### Do I need a Certificate of Eligibility to assume a VA loan?
No. Non-veterans don't need a COE to assume a VA loan. Veterans assuming the loan may want to substitute their entitlement to release the seller's, which requires their own COE.
`,
    'equity-gap': `
## Frequently Asked Questions

### What is the equity gap in an assumable mortgage?
The equity gap is the difference between the home's sale price and the existing loan balance. If a home sells for $450,000 and the assumable loan balance is $320,000, the equity gap is $130,000. You need to cover this gap instead of making a traditional down payment.

### How do I cover the equity gap?
Three main options: (1) Cash at closing, (2) A second mortgage from a lender, or (3) A combination of both. Some buyers also negotiate a lower purchase price to reduce the gap.

### Can I get a second mortgage to cover the equity gap?
Yes. Some lenders specifically offer second mortgages for assumption transactions. Rates are higher (typically 8-10%), but blending a 3% first mortgage with a 9% second often produces an effective rate of 4-5%, still well below market.

### Is a large equity gap a dealbreaker?
Not necessarily. Run the numbers first. Even with a significant equity gap, if the payment savings are $500-$1,000/month, the deal may still make financial sense. Use the [assumable mortgage calculator](/calculator) to model it out.

### How does the equity gap compare to a traditional down payment?
Functionally similar. Both represent cash you bring to closing. The difference: a traditional 20% down on a $450,000 home is $90,000. An equity gap of $130,000 is more, but the lower monthly payment compensates over time.

### What's a typical equity gap on Colorado homes right now?
In Colorado, equity gaps typically range from $50,000 to $200,000 depending on how much the home has appreciated since the original loan and how many years of payments the seller has made. Lower-priced homes or recent purchases tend to have smaller gaps.
`,
    'guide': `
## Frequently Asked Questions

### What is an assumable mortgage?
An assumable mortgage is an existing home loan that a buyer takes over from the seller, keeping the original interest rate, remaining balance, and loan terms. FHA, VA, and USDA loans are assumable. Conventional loans generally are not.

### Which loans are assumable?
FHA loans, VA loans, and USDA loans are assumable. These three loan types make up a significant portion of mortgages originated from 2019-2022, when rates were at historic lows. Conventional loans (Fannie Mae/Freddie Mac) generally have due-on-sale clauses that prevent assumption.

### How much can I save with an assumable mortgage?
On a $400,000 loan at 3% vs. 7%, you save $1,081 per month in principal and interest. Over 10 years, that's $129,720. Over the life of the loan, the savings exceed $300,000.

### How long does the assumption process take?
Most assumptions close in 45-90 days. The timeline depends on the loan servicer. Having your financial documents ready and working with an experienced assumption specialist helps keep things moving.

### What is the equity gap and how do I handle it?
The equity gap is the difference between the home's sale price and the existing loan balance. You cover it with cash, a second mortgage, or both. Even with a second mortgage at today's rates, the blended payment often beats a new conventional loan on the same property.

### How do I find homes with assumable mortgages?
Most MLS listings don't flag assumable loans. You need to work with a specialist or use a service that tracks FHA and VA loan inventory. [Browse assumable homes in Colorado](/homes) to see current listings with confirmed assumable mortgages.
`,
    'closing': `
## Frequently Asked Questions

### How long does an assumable mortgage closing take?
Assumable mortgage closings typically take 45-90 days from accepted offer, compared to 30-45 days for a conventional purchase. The main variable is the loan servicer's processing speed.

### What are the closing costs on an assumable mortgage?
Assumable mortgage closing costs are lower than a traditional purchase. Expect an assumption fee ($300-$1,000), title insurance, recording fees, and prepaid items. No origination fees, no discount points, and often no appraisal required.

### Do I need an appraisal for an assumable mortgage?
Often no. The lender is taking over an existing loan, not originating a new one. Many servicers don't require a new appraisal. Check with the servicer early in the process.

### What documents do I need for the assumption application?
You'll need: 2 years of tax returns, 2 months of pay stubs, 2-3 months of bank statements, employment verification, and authorization for a credit pull. Same documentation as a new mortgage application.

### Can the seller back out of an assumption?
Yes, sellers can back out, just like any real estate transaction. Having a solid purchase agreement with appropriate assumption contingencies protects both parties.

### What happens if the assumption is denied?
If the servicer denies your assumption application, you can appeal, address the deficiency (credit, income), or pursue a different property. Build denial contingencies into your purchase agreement.
`,
    'math': `
## Frequently Asked Questions

### How do I calculate assumable mortgage savings?
Compare monthly P&I at the assumed rate vs. today's rate on the same balance. Example: $350,000 at 3% = $1,476/mo. $350,000 at 7% = $2,329/mo. Monthly savings = $853. Annual savings = $10,236.

### What's the break-even on the equity gap vs. payment savings?
Divide the equity gap by the monthly payment savings. If the gap is $100,000 and you save $800/month, break-even is 125 months (about 10 years). If you plan to hold the home that long, it's a strong financial case.

### Does the equity gap wipe out the savings?
Usually not. Even covering a $100,000 equity gap with a second mortgage, the blended payment is often $400-$800/month less than a conventional purchase. The [mortgage calculator](/calculator) can model this for your specific scenario.

### How does a blended rate work with an assumable mortgage?
A blended rate combines your first mortgage (assumed at 3%) and a second mortgage (at 9%) on a weighted average basis. On $300,000 at 3% and $100,000 at 9%, your effective blended rate is about 4.5%, still well below market.

### What's the true cost comparison over 30 years?
On $400,000 at 7% for 30 years, you pay $558,036 in total interest. At 3%, you pay $207,110. The difference is $350,926. Even if you only hold 10 years, the savings are significant.

### Should I include closing costs in my savings calculation?
Yes. Add assumption closing costs ($3,000-$6,000) and equity gap costs to your total investment. Divide by monthly savings to find the true break-even period. In most cases, you break even within 1-3 years.
`,
    'credit': `
## Frequently Asked Questions

### What credit score do I need to assume a mortgage?
For FHA assumptions, most servicers require 580+, though 620+ is common. For VA assumptions, 620+ is typical. USDA assumptions require around 640. These are minimums, not guarantees.

### Can I assume a mortgage with bad credit?
It depends on how "bad." Below 580, options are limited. Between 580-620, some FHA assumptions are possible with strong compensating factors (large down payment, low DTI, stable employment). Work on credit improvement if you're below 620.

### Does assuming a mortgage affect my credit score?
Yes, positively over time. The assumption goes on your credit report as a mortgage account. On-time payments build your credit history. The initial inquiry and new account may cause a small temporary dip.

### What DTI do I need for a mortgage assumption?
FHA: under 43% (sometimes 50% with strong compensating factors). VA: under 41% preferred. USDA: under 41%. These are guidelines, not hard limits. Servicers have some flexibility.

### Will the servicer pull my credit during the assumption?
Yes. The servicer will do a full credit pull as part of the assumption application. This is a hard inquiry. Shop your assumption lender within a 14-45 day window to minimize score impact from multiple pulls.

### Can I improve my chances of assumption approval?
Yes: pay down other debts to lower DTI, avoid new credit accounts before applying, document all income sources, and have 2-3 months of reserves beyond the equity gap. A larger down payment also helps.
`,
    'seller': `
## Frequently Asked Questions

### How do I sell my home with an assumable mortgage?
List it as assumable in the MLS, mention the specific rate and remaining balance in remarks, price appropriately for the monthly payment advantage, and work with a buyer's agent experienced in assumptions. The assumable rate is a genuine selling advantage.

### Does selling via assumption release me from the mortgage?
Yes, if the assumption is properly processed with a novation. The servicer formally releases you from liability once the buyer is approved and the loan transfers. Without formal release, you remain responsible for the debt.

### What happens to my VA entitlement when I sell with assumption?
If a non-veteran assumes the loan, your VA entitlement stays tied to the property until the loan is paid off. If a veteran substitutes their own entitlement, yours is released and you can use your VA benefit again.

### Can I price my home higher because of the assumable rate?
Yes, and you should. An assumable 3% mortgage saves a buyer $800-$1,200/month vs. a conventional purchase. That payment advantage has real value. Many sellers price $10,000-$30,000 above comparable non-assumable homes.

### How long does it take to sell via assumption?
Longer than a traditional sale. Buyers need servicer approval, which takes 45-90 days. Build this into your timeline. Make sure your purchase agreement reflects the longer closing window.

### What if the buyer can't qualify for the assumption?
Just like any sale, the deal falls through if the buyer can't get approved. Having multiple interested buyers and requiring a backup offer is good practice. Buyers who are pre-screened by an assumption specialist reduce this risk.
`,
    'down-payment': `
## Frequently Asked Questions

### How much do I need for a down payment on an assumable mortgage?
You don't make a traditional down payment. Instead, you cover the equity gap, the difference between the home's price and the existing loan balance. This can range from $20,000 to $200,000+ depending on the property.

### What if I can't afford the equity gap?
Options: (1) Find properties with smaller gaps (higher remaining balances relative to price), (2) Use a second mortgage to cover the gap, (3) Negotiate a lower purchase price with the seller. Not every assumable property has a large gap.

### Can I use gift funds for the equity gap?
Depends on the loan type. FHA assumptions generally allow gift funds from family members. VA assumptions have their own rules. Check with the servicer before counting on gift funds.

### Is the equity gap the same as a down payment?
Functionally yes. Both represent what you bring to the table at closing. The equity gap goes to the seller (their equity), not to a lender. It's not a "down payment" in the technical mortgage sense, but it serves the same economic function.

### Can I finance 100% of an assumable mortgage?
Not typically. You need cash or a second mortgage to cover the equity gap. Some VA-to-VA assumptions allow the buyer to cover the gap with a VA loan itself, but this is complicated and rare.

### Are there programs to help cover the equity gap?
Some state housing finance agencies are developing programs for assumable mortgage assistance. Check with your state's HFA. Sellers sometimes offer concessions to help cover part of the gap.
`,
    'first-time': `
## Frequently Asked Questions

### Can first-time homebuyers use assumable mortgages?
Yes. Assumable mortgages are available to any qualified buyer, including first-timers. There are no special restrictions. You need to meet the servicer's credit and income requirements for the existing loan.

### Is an assumable mortgage a good option for first-time buyers?
Often yes. The lower monthly payment from an assumed 3% rate vs. today's 7% can make homeownership more affordable. The trade-off is covering the equity gap and dealing with a longer timeline.

### Do first-time buyer programs work with assumptions?
Some do, some don't. Down payment assistance programs vary in whether they allow funds to go toward the equity gap. Check with your state's housing finance agency. FHA first-time buyer programs may apply if the assumed loan is FHA.

### What should first-time buyers know before assuming a mortgage?
Three things: (1) The process takes 45-90 days, plan accordingly. (2) You need cash or a second mortgage for the equity gap. (3) Work with an agent experienced in assumptions. The process is different from a standard purchase but not more complicated.

### How do I find assumable homes as a first-time buyer?
[Browse assumable homes in Colorado](/homes) to see what's available. Filter by price range and location. Looking at the monthly payment on an assumed loan vs. a new loan at 7% is the key number to focus on.

### What's the first step for first-time buyers interested in assumptions?
Get pre-qualified with a lender familiar with assumptions, then [schedule a free call](/homes) with Ryan Thomson to understand what inventory is available in your target area and price range.
`,
    'investor': `
## Frequently Asked Questions

### Are assumable mortgages a good investment strategy?
Yes, particularly for buy-and-hold investors. Locking in a 3% mortgage on a rental property vs. paying 7%+ significantly improves cash flow. A $400,000 property with a 3% assumed loan vs. 7% saves $1,000/month, which can turn a marginal deal into a strong one.

### Can investors assume mortgages?
Yes, with some limits. FHA assumptions require the buyer to intend to occupy the property (owner-occupancy requirement). VA assumptions don't technically require occupancy. USDA loans require owner-occupancy. Check loan-specific rules before pursuing investment assumptions.

### What's the ROI benefit of an assumable mortgage for investors?
The interest savings directly improve cash-on-cash return. On a $400,000 rental saving $1,000/month, that's $12,000/year in additional cash flow. At a $400,000 purchase, that's a 3% cash-on-cash improvement from the rate alone.

### Can I assume a mortgage on a rental property?
If it's an FHA loan, owner-occupancy is generally required. VA loans have more flexibility. The safest approach: buy the property as owner-occupied, then convert to rental after the occupancy period (typically 12 months for FHA).

### How does the equity gap affect investment returns?
The equity gap is like a larger down payment. It reduces your leverage but improves cash flow because of the lower rate. Model the equity gap as part of your total investment and calculate ROI accordingly.

### Where do I find assumable investment properties in Colorado?
[Browse all Colorado assumable listings](/homes). Focus on properties where the monthly savings vs. market rate exceed your carrying costs on any second mortgage used to cover the equity gap.
`,
    'military': `
## Frequently Asked Questions

### Are military base areas good places to find assumable mortgages?
Yes. Military families take out VA loans when they buy, and they move every 2-4 years on PCS orders. This creates a steady supply of assumable VA loans in areas near military bases.

### Can civilians assume VA loans near military bases?
Yes. Non-veterans can assume VA loans from military sellers. You need to qualify financially (credit, income, DTI) but don't need military service. The seller's VA entitlement stays tied to the loan unless a veteran substitutes their own.

### What rates were military families locking in during 2020-2022?
VA loans originated from 2020-2022 typically carried rates of 2.25%-3.25%. These loans are now among the most valuable assumable mortgages in the country.

### How do I find VA assumable homes near military bases?
[Browse assumable homes in Colorado](/homes) for military-area inventory. For other states, look for listings in cities adjacent to major bases. Ask listing agents whether the property has an existing VA loan.

### How does VA entitlement work when a military seller sells to a civilian?
If a non-veteran assumes the VA loan, the military seller's entitlement stays tied to that property until the loan is paid off or refinanced. This is a real concern for sellers who want to buy again using their VA benefit. A veteran-to-veteran assumption with entitlement substitution solves this.

### What's the typical savings on a VA assumption near a military base?
On a $400,000 VA loan at 2.5% vs. today's 7%, you save about $1,100/month. That's $66,000 over five years, and over $300,000 over the life of the loan.
`,
    'out-of-state': `
## Frequently Asked Questions

### Are assumable mortgages available outside Colorado?
Yes. Any property with an existing FHA, VA, or USDA loan is potentially assumable, regardless of state. The process is the same nationwide, though servicer responsiveness varies.

### Which states have the most assumable mortgage inventory?
States with high military populations (Texas, Virginia, North Carolina, Georgia, Washington, Florida) and states with high FHA loan usage tend to have the most assumable inventory. Colorado also ranks high due to its military bases.

### How do I find assumable homes in other states?
Look for listings that mention "assumable" in MLS remarks. Ask your local agent to filter for FHA and VA sales from 2019-2022. Working with a specialist who tracks assumable inventory is the most reliable approach.

### Is the assumption process different in other states?
The federal loan rules are the same nationwide (FHA, VA, USDA are all assumable). State-specific differences involve title, recording, and closing processes, but the mortgage assumption mechanics are identical.

### Can I assume a mortgage remotely in another state?
Yes. Much of the assumption application process can be done remotely. Closing typically requires either physical presence or a power of attorney arrangement.

### Who can help me with an assumable mortgage in my state?
If you're in Colorado, [contact Ryan Thomson at The Assumable Guy](/homes). For other states, look for agents and assumption processors who specialize in assumable transactions in your target market.
`,
    'second-mortgage': `
## Frequently Asked Questions

### Can I use a second mortgage to cover the equity gap?
Yes. Some lenders specifically offer second mortgages for assumption transactions. The second mortgage sits behind the assumed first at a higher rate (typically 8-10%), but the blended payment is often much lower than a new conventional loan.

### What rate will I get on a second mortgage for an assumption?
Expect 8-11% on a second mortgage used to cover an equity gap. Some specialty lenders offer slightly better terms. The rate is higher than market because the second lender is in a subordinate position.

### How do I calculate if a second mortgage still makes the assumption worthwhile?
Add up your assumed first mortgage payment plus the second mortgage payment. Compare that total to what a new conventional loan on the same property would cost. If you're still saving $300+/month, the deal likely makes sense.

### What lenders offer second mortgages for assumptions?
Some regional banks, credit unions, and specialty lenders have started offering second mortgages for assumable transactions. This is an evolving area. An assumption specialist like Ryan Thomson can connect you with lenders actively working this space.

### What's the blended rate concept?
A blended rate is the effective average interest rate when you combine two mortgages. If you assume $350,000 at 3% and take a second of $100,000 at 9%, your blended rate is about 4.5%. That's your real cost of financing, still well below market.

### Is the second mortgage tax-deductible?
Mortgage interest on a primary residence is generally deductible up to certain limits. Consult a tax professional for your specific situation.
`,
    'divorce': `
## Frequently Asked Questions

### What happens to an assumable mortgage in a divorce?
The spouse keeping the home can apply to assume the mortgage in their name only, removing the other spouse from the loan. This requires qualifying individually with the servicer and may require refinancing if the rates have changed.

### Can one spouse assume the other's mortgage in a divorce?
Yes. If one spouse is keeping the home, they can apply to assume the mortgage in their name. The servicer will evaluate their individual credit, income, and DTI. If they qualify, the other spouse is released from the debt.

### Is it better to assume or refinance in a divorce?
If the existing mortgage rate is low (under 4%), assuming is almost always better than refinancing at today's 7%+ rates. Assuming keeps the low rate. Refinancing replaces it with a new, higher rate.

### How does the assumption process work in a divorce?
One spouse applies to the servicer to assume the loan individually. They need the divorce decree or separation agreement documenting the property settlement. The servicer runs full underwriting on the assuming spouse alone.

### Can an assumable mortgage be a bargaining chip in a divorce settlement?
Yes. A home with a 3% assumable mortgage is more valuable than a comparable home without one. The spouse receiving the home is getting a financial asset. This can factor into the division of other marital assets.

### What if neither spouse can qualify for the mortgage alone in a divorce?
Options include selling the property, renting it out jointly until one spouse can qualify, or refinancing (accepting the higher rate). An attorney and a mortgage specialist can help model the options.
`,
    'colorado-city': `
## Frequently Asked Questions

### Are there assumable mortgages available in Colorado?
Yes. Colorado has strong assumable mortgage inventory, particularly in military-adjacent areas like Colorado Springs and communities with high FHA and VA loan usage from 2019-2022.

### How much can I save with an assumable mortgage in Colorado?
Savings depend on the assumed rate and loan balance. A typical Colorado scenario: $400,000 at 3% vs. 7% saves $1,081/month. Over 5 years, that's $64,860.

### Which Colorado cities have the most assumable mortgages?
Colorado Springs leads due to its military base concentration. Denver metro suburbs (Aurora, Lakewood, Arvada, Westminster) have strong FHA inventory. Fort Collins, Boulder, and Greeley also have active assumable markets.

### How do I find assumable homes in Colorado?
[Browse assumable homes in Colorado](/homes) or search by city. You can also [check Colorado Springs listings](/colorado-springs) or [Denver area listings](/denver) specifically.

### Do I need to be a veteran to assume a VA loan in Colorado?
No. Non-veterans can assume VA loans in Colorado. You need to qualify financially with the loan servicer. The VA's guaranty terms don't restrict who can assume the loan.

### How long does the assumption process take in Colorado?
Most Colorado assumptions close in 45-75 days. Colorado has experienced assumption processors and servicers familiar with the process, which helps keep timelines reasonable.
`,
    'general': `
## Frequently Asked Questions

### What is an assumable mortgage?
An assumable mortgage is an existing home loan that a buyer takes over from the seller at the original interest rate, balance, and terms. FHA, VA, and USDA loans are assumable. Conventional loans generally are not.

### How much can I save with an assumable mortgage?
On a $400,000 loan at 3% vs. 7%, you save $1,081 per month. That's $12,972 per year, and over $300,000 over the life of the loan. Real savings, not theoretical ones.

### Which loans are assumable?
FHA loans, VA loans, and USDA loans are all assumable. Conventional loans (Fannie Mae, Freddie Mac) generally have due-on-sale clauses that prevent assumption. The most valuable assumable inventory comes from 2019-2022 originations.

### How do I find homes with assumable mortgages?
Most MLS listings don't flag assumable loans. You need to work with a specialist or use a service that tracks FHA and VA loan inventory. [Browse assumable homes in Colorado](/homes) to see what's available now.

### How long does the assumption process take?
Most assumptions close in 45-90 days. The main variable is the loan servicer's processing speed. Having all your documents ready upfront and working with an experienced assumption specialist helps.

### What is the equity gap?
The equity gap is the difference between the home's sale price and the existing loan balance. You cover this with cash, a second mortgage, or both. Even with a second mortgage, the blended rate often beats a new conventional loan.
`
  };

  return faqs[postType] || faqs['general'];
}

// ─── CTA BLOCK ────────────────────────────────────────────────────────────────
const CTA_BLOCK = `
## Ready to Find an Assumable Mortgage in Colorado?

Browse available listings or schedule a free call with Ryan Thomson, Colorado's leading assumable mortgage specialist.

[Browse Homes](/homes) | [Schedule a Call](https://calendly.com/your-real-estate-agent-ryan/15min) | (719) 624-3472
`;

// ─── INTERNAL LINKS PATTERNS ─────────────────────────────────────────────────
// We add these contextually only if not already present
const INTERNAL_LINK_PATTERNS = [
  {
    // Add link to /homes for "assumable homes" or "assumable listings"
    pattern: /\b(assumable (?:homes?|listings?|properties|inventory))\b(?![^[]*\])/gi,
    replacement: '[$1](/homes)',
    maxReplacements: 1,
  },
  {
    // Add link to /calculator for "calculator" or "calculate savings"
    pattern: /\b((?:use the )?(?:mortgage )?calculator)\b(?![^[]*\])/gi,
    replacement: '[$1](/calculator)',
    maxReplacements: 1,
  },
];

// ─── PROCESS A SINGLE FILE ───────────────────────────────────────────────────
function processFile(filePath) {
  const filename = path.basename(filePath, '.mdx');
  let raw = fs.readFileSync(filePath, 'utf-8');
  
  // Parse frontmatter manually (simple approach)
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    console.log(`  SKIP: ${filename} (no frontmatter)`);
    return { changed: false };
  }
  
  let fmStr = fmMatch[1];
  let content = fmMatch[2];
  
  // Parse frontmatter fields
  const getFmField = (field) => {
    const m = fmStr.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
  };
  
  const title = getFmField('title') || filename;
  const tags = fmStr.match(/^tags:\s*\[(.*)\]/m)?.[1] || '';
  const existingAuthor = getFmField('author');
  const existingAuthorTitle = getFmField('authorTitle');
  const existingPrimaryKeyword = getFmField('primaryKeyword');
  const existingReadingTime = getFmField('readingTime');
  const existingImage = getFmField('image');
  
  const postType = detectPostType(filename, title, tags);
  
  // Word count for reading time
  const wc = wordCount(content);
  const readMins = Math.max(1, Math.ceil(wc / 200));
  
  // Add missing frontmatter fields
  let fmChanged = false;
  
  if (!existingAuthor) {
    fmStr += '\nauthor: "Ryan Thomson"';
    fmChanged = true;
  }
  if (!existingAuthorTitle) {
    fmStr += '\nauthorTitle: "Licensed Colorado Real Estate Agent | The Assumable Guy"';
    fmChanged = true;
  }
  if (!existingPrimaryKeyword) {
    // Extract primary keyword from title
    const pk = title.replace(/["""]/g, '').replace(/\s*\|.*$/, '').trim().toLowerCase().substring(0, 50);
    fmStr += `\nprimaryKeyword: "${pk}"`;
    fmChanged = true;
  }
  if (!existingReadingTime) {
    fmStr += `\nreadingTime: "${readMins} min read"`;
    fmChanged = true;
  }
  if (!existingImage) {
    fmStr += '\nimage: "/images/blog/default-blog-og.jpg"';
    fmChanged = true;
  }
  
  // Fix em-dashes in content
  const contentBeforeEmDash = content;
  content = fixEmDashes(content);
  const emDashFixed = content !== contentBeforeEmDash;
  
  // Fix AI tells in content
  const contentBeforeAiTells = content;
  content = fixAiTells(content);
  const aiTellsFixed = content !== contentBeforeAiTells;
  
  // Check if FAQ section exists
  const hasFaq = /##\s*Frequently Asked Questions|##\s*FAQ/i.test(content);
  let faqAdded = false;
  
  // Check if CTA block exists
  const hasCta = /Ready to Find|Browse Homes|Schedule a Call|calendly\.com/i.test(content);
  let ctaAdded = false;
  
  // Trim trailing whitespace
  content = content.trimEnd();
  
  // Add CTA before FAQ (or at end if no FAQ)
  if (!hasCta) {
    content = content + '\n' + CTA_BLOCK;
    ctaAdded = true;
  }
  
  // Add FAQ section at the end
  if (!hasFaq) {
    const faqContent = generateFaq(postType, filename, title);
    content = content + '\n' + faqContent;
    faqAdded = true;
  }
  
  // Reconstruct file
  const newRaw = `---\n${fmStr}\n---\n${content}\n`;
  
  if (fmChanged || emDashFixed || aiTellsFixed || faqAdded || ctaAdded || newRaw !== raw) {
    fs.writeFileSync(filePath, newRaw, 'utf-8');
    return { changed: true, fmChanged, emDashFixed, aiTellsFixed, faqAdded, ctaAdded, filename };
  }
  
  return { changed: false, filename };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  const files = fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
    .map(f => path.join(BLOG_DIR, f));
  
  console.log(`Processing ${files.length} blog posts...\n`);
  
  const results = {
    total: files.length,
    changed: 0,
    fmUpdated: 0,
    emDashFixed: 0,
    aiTellsFixed: 0,
    faqAdded: 0,
    ctaAdded: 0,
    errors: [],
  };
  
  for (const filePath of files) {
    try {
      const result = processFile(filePath);
      if (result.changed) {
        results.changed++;
        if (result.fmChanged) results.fmUpdated++;
        if (result.emDashFixed) results.emDashFixed++;
        if (result.aiTellsFixed) results.aiTellsFixed++;
        if (result.faqAdded) results.faqAdded++;
        if (result.ctaAdded) results.ctaAdded++;
        console.log(`  ✅ ${result.filename}`);
      }
    } catch (err) {
      console.error(`  ❌ ${path.basename(filePath)}: ${err.message}`);
      results.errors.push({ file: path.basename(filePath), error: err.message });
    }
  }
  
  console.log('\n─────────────────────────────────');
  console.log(`Total posts: ${results.total}`);
  console.log(`Modified: ${results.changed}`);
  console.log(`Frontmatter updated: ${results.fmUpdated}`);
  console.log(`Em-dashes fixed: ${results.emDashFixed}`);
  console.log(`AI tells removed: ${results.aiTellsFixed}`);
  console.log(`FAQ sections added: ${results.faqAdded}`);
  console.log(`CTA blocks added: ${results.ctaAdded}`);
  if (results.errors.length > 0) {
    console.log(`Errors: ${results.errors.length}`);
    results.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
  }
  
  // Write results to JSON for the report
  fs.writeFileSync(
    path.join(__dirname, '../seo-overhaul-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\nDone! Results saved to seo-overhaul-results.json');
}

main();
