import type { Metadata } from 'next';
import localFont from 'next/font/local';

import { auth } from '@/auth';
import AuthProvider from '@/components/AuthProvider';
import { Providers } from '@/components/providers';

import './globals.css';

const inter = localFont({
  src: '../../public/fonts/InterVariable.woff2',
  variable: '--font-sans',
});

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
      <body className={`${inter.variable} font-sans bg-background text-foreground`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <AuthProvider session={session}>{children}</AuthProvider>
          </div>
        </Providers>
      </body>
    </html>
  );
}
