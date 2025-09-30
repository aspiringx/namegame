import Footer from '@/components/Footer'
import Image from 'next/image'
import Link from 'next/link'
import { Providers } from '@/components/providers'

function AnonymousHeader() {
  return (
    <header className="bg-background border-border fixed top-0 left-0 z-50 w-full border-b">
      <div className="container mx-auto flex h-full items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="flex items-center text-xl font-bold text-gray-600 dark:text-gray-200"
        >
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
  )
}

export default function AnonymousLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <AnonymousHeader />
        <main className="bg-background container mx-auto flex-grow px-4 py-18 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
