import { signOut } from '@/auth'
import { redirect } from 'next/navigation'

// This route is used to sign out a user when their session is valid but their user record is missing.
export async function GET() {
  await signOut({ redirect: false })
  redirect('/login?callbackUrl=/me')
}
