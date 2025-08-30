'use client'

import { UserSessionProvider } from '@/context/UserSessionContext'
import { A2HSProvider } from '@/context/A2HSContext'
import { InstallAppPrompt } from '@/components/InstallAppPrompt'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
import Footer from '@/components/Footer'
import Header from '@/components/Header'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserSessionProvider>
      <A2HSProvider>
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="container mx-auto flex-1 px-4 py-4 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
          <InstallAppPrompt />
          <ServiceWorkerRegistrar />
        </div>
      </A2HSProvider>
    </UserSessionProvider>
  )
}
