import type { Metadata } from 'next';

import { auth } from '@/auth';
import AuthProvider from '@/components/AuthProvider';
import { Providers } from '@/components/providers';

import './globals.css';



export const metadata: Metadata = {
  title: 'NameGame',
  description: 'Easily meet people and remember names',
  icons: {
    icon: '/icon.png',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-background text-foreground">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <AuthProvider session={session}>{children}</AuthProvider>
          </div>
        </Providers>
      </body>
    </html>
  );
}
