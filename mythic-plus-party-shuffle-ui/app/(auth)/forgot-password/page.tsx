import type { Metadata } from 'next';

import { ForgotPasswordPageClient } from './ForgotPasswordPageClient';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Password recovery for Mythic Plus Party Shuffle.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
