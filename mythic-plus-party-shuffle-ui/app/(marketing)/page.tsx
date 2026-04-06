import type { Metadata } from 'next';

import { HomePageClient } from './HomePageClient';

export const metadata: Metadata = {
  title: 'Join an event',
  description:
    'Enter an event code to join a Mythic Plus party shuffle run.',
};

export default function Home() {
  return <HomePageClient />;
}
