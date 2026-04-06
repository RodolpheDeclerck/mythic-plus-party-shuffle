import type { Metadata } from 'next';
import { Providers } from './providers';
import { EventPageToolbar } from './components/EventPageToolbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mythic Plus Party Shuffle',
  description: 'Mythic Plus Party Shuffle Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <EventPageToolbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
