import type { Metadata } from 'next';

import { PrivacyPageClient } from './PrivacyPageClient';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'Privacy policy for Mythic Plus Party Shuffle.',
};

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}
