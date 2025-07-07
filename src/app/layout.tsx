import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/AuthProvider';
import Header from '@/components/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NameGame',
  description: 'The relationship game that starts with a name',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100`}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-grow pt-16 pb-10">
              {children}
            </main>

            <footer className="fixed bottom-0 left-0 w-full h-10 bg-white text-center py-2 shadow-[0_-2px_4px_rgba(0,0,0,0.1)]">
              <p className="text-gray-600">&copy; 2025 NameGame</p>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}


