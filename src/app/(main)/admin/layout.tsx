import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import AuthProvider from '@/components/AuthProvider'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const user = session?.user

  // 1. Check if user is logged in
  if (!user) {
    redirect('/login?callbackUrl=/admin')
  }

  // 2. Check if user has the 'super' role in the 'global-admin' group
  const isSuperAdmin = user.isSuperAdmin

  if (!isSuperAdmin) {
    // Redirect to home page if not a super admin
    redirect('/')
  }

  return (
    <AuthProvider session={session}>
      <div className="min-h-screen">
        <main>
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-0 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </AuthProvider>
  )
}
