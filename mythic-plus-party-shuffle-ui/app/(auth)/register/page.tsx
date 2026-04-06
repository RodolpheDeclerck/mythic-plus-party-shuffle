import type { Metadata } from 'next';

import { RegisterPageClient } from './RegisterPageClient';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create an account for Mythic Plus Party Shuffle.',
};

export default function RegisterPage() {
  return <RegisterPageClient />;
}
