import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/auth-utils'

// GET - Check if current user is an admin of the group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { groupId } = await params
    const groupIdNum = parseInt(groupId, 10)

    if (isNaN(groupIdNum)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 })
    }

    const isGroupAdmin = await isAdmin(session.user.id, groupIdNum)

    return NextResponse.json({ isAdmin: isGroupAdmin })
  } catch (error) {
    console.error('[API] Error checking admin status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
