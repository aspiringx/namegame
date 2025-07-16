import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { Providers } from '@/components/providers';

function AnonymousHeader() {
  return (
    <header className="bg-background border-b border-border fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto flex justify-between items-center px-5 py-4 h-full">
        <Link href="/" className="text-xl font-bold text-gray-600 dark:text-gray-200 flex items-center">
          <Image
            src="/images/butterfly.png"
            alt="NameGame social butterfly"
            width={32}
            height={32}
            className="mx-auto h-auto md:max-w-[32px]"
          />
          NameGame
        </Link>
      </div>
    </header>
  );
}

export default function AnonymousLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <AnonymousHeader />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-18 bg-background">
          {children}
        </main>
        <Footer />
      </div>
    </Providers>
  );
}
