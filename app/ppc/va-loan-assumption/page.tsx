import { Metadata } from 'next';
import NewPPCPage from '../NewPPCPage';

export const metadata: Metadata = {
  title: 'Assume a VA Loan, Low Rates | The Assumable Guy',
  description: "You don't have to be a veteran to assume a VA loan. Lock in 2-3% rates on Colorado homes. $0 PMI, massive monthly savings. Get matched free.",
  robots: 'noindex, nofollow',
};

export default function VALoanAssumptionPPC() {
  return <NewPPCPage variantKey="va" />;
}
