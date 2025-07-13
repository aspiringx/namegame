import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { auth } from '@/auth';
import AuthProvider from '@/components/AuthProvider';

import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={`${inter.className} bg-background text-foreground`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <AuthProvider session={session}>
              {children}
            </AuthProvider>
          </div>
        </Providers>
      </body>
    </html>
  );
}


