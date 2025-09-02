'use client'

import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
import { ServiceWorkerProvider } from '@/context/ServiceWorkerContext'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { PushNotificationsProvider } from '@/context/PushNotificationsContext'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ServiceWorkerProvider>
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="container mx-auto flex-1 px-4 py-4 sm:px-6 lg:px-8">
          <PushNotificationsProvider>
            {children}
          </PushNotificationsProvider>
        </main>
        <Footer />
        <ServiceWorkerRegistrar />
      </div>
    </ServiceWorkerProvider>
  )
}
