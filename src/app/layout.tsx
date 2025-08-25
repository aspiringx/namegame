import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'

import { auth } from '@/auth'
import AuthProvider from '@/components/AuthProvider'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { UserSessionProvider } from '@/context/UserSessionContext'

import './globals.css'

const inter = localFont({
  src: '../../public/fonts/InterVariable.woff2',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  applicationName: 'NameGame',
  title: 'NameGame',
  description: 'Break the ice!',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NameGame',
    startupImage: [
      'icons/apple-splash-2048-2732.jpg',
      {
        url: 'icons/apple-splash-2732-2048.jpg',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1668-2388.jpg',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2388-1668.jpg',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1536-2048.jpg',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2048-1536.jpg',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1640-2360.jpg',
        media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2360-1640.jpg',
        media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1668-2224.jpg',
        media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2224-1668.jpg',
        media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1620-2160.jpg',
        media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2160-1620.jpg',
        media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1290-2796.jpg',
        media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2796-1290.jpg',
        media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1179-2556.jpg',
        media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2556-1179.jpg',
        media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1170-2532.jpg',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2532-1170.jpg',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1284-2778.jpg',
        media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2778-1284.jpg',
        media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1125-2436.jpg',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2436-1125.jpg',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1242-2688.jpg',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2688-1242.jpg',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-828-1792.jpg',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-1792-828.jpg',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-1242-2208.jpg',
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-2208-1242.jpg',
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-750-1334.jpg',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-1334-750.jpg',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
      {
        url: 'icons/apple-splash-640-1136.jpg',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: 'icons/apple-splash-1136-640.jpg',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon.png',
    apple: '/icons/apple-touch-icon.png',
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
          <div className="relative min-h-screen">
            <AuthProvider session={session}>
              <UserSessionProvider>{children}</UserSessionProvider>
            </AuthProvider>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
