import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { auth } from '@/auth';
import AuthProvider from '@/components/AuthProvider';
import Header from '@/components/Header';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NameGame',
  description: 'The relationship game that starts with a name',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AuthProvider session={session}>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-12">
                {children}
              </main>
              <footer className="fixed bottom-0 left-0 w-full h-16 bg-white dark:bg-gray-900 text-center py-4 shadow-[0_-2px_4px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_4px_rgba(255,255,255,0.1)]">
                <p className="text-gray-600 dark:text-gray-400">&copy; 2025 NameGame</p>
              </footer>
            </div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}


