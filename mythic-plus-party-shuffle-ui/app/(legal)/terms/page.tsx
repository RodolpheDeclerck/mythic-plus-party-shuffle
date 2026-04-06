import type { Metadata } from 'next';

import { TermsPageClient } from './TermsPageClient';

export const metadata: Metadata = {
  title: 'Terms of service',
  description: 'Terms of service for Mythic Plus Party Shuffle.',
};

export default function TermsPage() {
  return <TermsPageClient />;
}
