import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { PushTestClientPage } from './push-test-client'

export default async function PushTestPage() {
  const session = await auth()
  const user = session?.user

  if (!user) {
    redirect('/login?callbackUrl=/me/push-test')
  }

  if (!user.isSuperAdmin) {
    redirect('/')
  }

  return <PushTestClientPage />
}
