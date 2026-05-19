/**
 * Mortgage math for the property landing page.
 *
 * All figures use the property's ORIGINAL loan amount (apples-to-apples
 * comparison at different rates). Current loan balance is stored but never
 * displayed on the page.
 */

/**
 * Standard amortization payment formula.
 * @param principal Loan principal in dollars.
 * @param annualRate Annual interest rate as a percentage (e.g. 6.5, not 0.065).
 * @param termMonths Loan term in months. Defaults to 360 (30 years).
 */
export function monthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number = 360,
): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Reverse: given a monthly P&I payment and a rate, what loan principal
 * does that payment support?
 */
export function loanAmountForPayment(
  payment: number,
  annualRate: number,
  termMonths: number = 360,
): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return payment * termMonths;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (payment * (factor - 1)) / (monthlyRate * factor);
}

/**
 * Cumulative interest paid through a given month.
 * Used to build the Section 5 chart series.
 */
export function cumulativeInterestAtMonth(
  principal: number,
  annualRate: number,
  termMonths: number,
  monthIndex: number,
): number {
  if (monthIndex <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return 0;

  const payment = monthlyPayment(principal, annualRate, termMonths);
  let balance = principal;
  let totalInterest = 0;
  const months = Math.min(monthIndex, termMonths);
  for (let m = 0; m < months; m++) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    balance -= payment - interest;
  }
  return totalInterest;
}

export function formatCurrency(num: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(num));
}

export function formatCompactCurrency(num: number): string {
  if (Math.abs(num) >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `$${Math.round(num / 1_000)}k`;
  }
  return `$${Math.round(num)}`;
}

export interface DerivedFigures {
  assumablePayment: number;
  newLoanPayment: number;
  monthlyDelta: number;
  buyingPowerAtMarket: number;
  buyingPowerDelta: number;
  totalInterestAssumable: number;
  totalInterestNewLoan: number;
  lifetimeInterestGap: number;
  lifetimeSavings: number;
  buyerPremium: number;
  buyerNetSavings: number;
}

/**
 * Compute every derived figure shown on the page from the three primary inputs.
 * Single source of truth so server-rendered prose and client-rendered chart
 * agree to the dollar.
 */
export function deriveFigures(
  originalLoanAmount: number,
  assumableRate: number,
  comparisonRate: number,
): DerivedFigures {
  const assumablePayment = monthlyPayment(originalLoanAmount, assumableRate);
  const newLoanPayment = monthlyPayment(originalLoanAmount, comparisonRate);
  const monthlyDelta = newLoanPayment - assumablePayment;

  const buyingPowerAtMarket = loanAmountForPayment(assumablePayment, comparisonRate);
  const buyingPowerDelta = originalLoanAmount - buyingPowerAtMarket;

  const totalInterestAssumable = assumablePayment * 360 - originalLoanAmount;
  const totalInterestNewLoan = newLoanPayment * 360 - originalLoanAmount;
  const lifetimeInterestGap = totalInterestNewLoan - totalInterestAssumable;

  const lifetimeSavings = monthlyDelta * 360;
  const buyerPremium = monthlyDelta * 24;
  const buyerNetSavings = lifetimeSavings - buyerPremium;

  return {
    assumablePayment,
    newLoanPayment,
    monthlyDelta,
    buyingPowerAtMarket,
    buyingPowerDelta,
    totalInterestAssumable,
    totalInterestNewLoan,
    lifetimeInterestGap,
    lifetimeSavings,
    buyerPremium,
    buyerNetSavings,
  };
}
