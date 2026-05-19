import { Metadata } from 'next';
import NewPPCPage from '../NewPPCPage';

export const metadata: Metadata = {
  title: 'Save $900+/Month With an Assumable Mortgage | The Assumable Guy',
  description: 'Assume a 2-3% mortgage instead of taking out a new loan at 6.8%. Save $900-$1,100/month. Licensed CO agent Ryan Thomson. Get started free today.',
  robots: 'noindex, nofollow',
};

export default function AssumableMortgagePPC() {
  return <NewPPCPage variantKey="general" />;
}
