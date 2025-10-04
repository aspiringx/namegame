import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'

import { auth } from '@/auth'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { UserSessionProvider } from '@/context/UserSessionContext'
import { DeviceInfoProvider } from '@/context/DeviceInfoContext'
import { A2HSProvider } from '@/context/A2HSContext'
import { InstallAppPrompt } from '@/components/InstallAppPrompt'
import { ClientOnly } from '@/components/ClientOnly'
import AuthProvider from '@/components/AuthProvider'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
import { ServiceWorkerProvider } from '@/context/ServiceWorkerContext'
import { PushNotificationsProvider } from '@/context/PushNotificationsContext'
import { SocketProvider } from '@/context/SocketContext'

import './globals.css'

const inter = localFont({
  src: '../../public/fonts/InterVariable.woff2',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  applicationName: 'NameGame',
  title: 'NameGame',
  description: 'The relationship game that starts with a name',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NameGame',
    startupImage: [
      // Light mode splash screens
      {
        url: 'icons/apple-splash-2048-2732.png',
        media:
          '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2732-2048.png',
        media:
          '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1668-2388.png',
        media:
          '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2388-1668.png',
        media:
          '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1536-2048.png',
        media:
          '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2048-1536.png',
        media:
          '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1620-2160.png',
        media:
          '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2160-1620.png',
        media:
          '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1290-2796.png',
        media:
          '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2796-1290.png',
        media:
          '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1179-2556.png',
        media:
          '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2556-1179.png',
        media:
          '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1284-2778.png',
        media:
          '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2778-1284.png',
        media:
          '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1170-2532.png',
        media:
          '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2532-1170.png',
        media:
          '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1125-2436.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2436-1125.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1242-2688.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2688-1242.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-828-1792.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-1792-828.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-750-1334.png',
        media:
          '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-1334-750.png',
        media:
          '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      // Dark mode splash screens
      {
        url: 'icons/apple-splash-dark-2048-2732.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-dark-2732-2048.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-dark-1668-2388.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-dark-2388-1668.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-dark-1536-2048.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-dark-2048-1536.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-dark-1620-2160.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-dark-2160-1620.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-dark-1290-2796.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-dark-2796-1290.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-dark-1179-2556.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-dark-2556-1179.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-dark-1284-2778.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-dark-2778-1284.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-dark-1170-2532.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-dark-2532-1170.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-dark-1125-2436.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-dark-2436-1125.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-dark-1242-2688.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-dark-2688-1242.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-dark-828-1792.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-dark-1792-828.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-dark-750-1334.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-dark-1334-750.png',
        media:
          '(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon.png',
    apple: '/icons/apple-icon-180.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} bg-background text-foreground overflow-visible font-sans`}
      >
        <Providers>
          <AuthProvider session={session}>
            <DeviceInfoProvider>
              <UserSessionProvider>
                <SocketProvider>
                  <A2HSProvider>
                    <ServiceWorkerProvider>
                      <PushNotificationsProvider>
                        <div className="relative min-h-screen">{children}</div>
                        <ClientOnly>
                          <InstallAppPrompt />
                          <ServiceWorkerRegistrar />
                        </ClientOnly>
                        <Toaster />
                      </PushNotificationsProvider>
                    </ServiceWorkerProvider>
                  </A2HSProvider>
                </SocketProvider>
              </UserSessionProvider>
            </DeviceInfoProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
