import { auth } from '@/auth'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { GroupProvider } from '@/components/GroupProvider'
import { getGroupTypeBySlug } from './data'
import { getGroup as getAllGroup } from './community/data'
import { getGroup as getFamilyGroup } from './family/data'
import { GroupData, FamilyGroupData } from '@/types'

// Helper to fetch the correct group data based on type
const getGroupForLayout = async (
  slug: string,
  limit?: number,
): Promise<GroupData | FamilyGroupData | null> => {
  const groupTypeData = await getGroupTypeBySlug(slug)
  if (!groupTypeData) {
    return null
  }

  if (groupTypeData.groupType.code === 'family') {
    return getFamilyGroup(slug, limit)
  }

  return getAllGroup(slug, limit)
}

import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const params = await props.params
  const { slug } = params
  const data = await getGroupForLayout(slug, 5)

  if (!data) {
    return {
      title: 'Group Not Found',
    }
  }

  return {
    title: data.name,
  }
}

export default async function GroupLayout(props: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const params = await props.params
  const session = await auth()
  const headersList = await headers()
  const headerPath = headersList.get('x-invoke-path') || ''

  // The /greet page is public and should not be protected by this authorization.
  if (!headerPath.includes('/greet') && !session?.user) {
    // Reconstruct the path from slug as a fallback
    const pathname = headerPath || `/g/${params.slug}`
    return redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
  }
  const { children } = props
  const { slug } = params

  const data = await getGroupForLayout(slug, 5)

  if (!data) {
    // This can happen if the group doesn't exist, or if the user is not a member
    // of a private group. In either case, we show a 404.
    notFound()
  }

  // Adapt data for GroupProvider based on group type
  const isFamilyGroup = 'members' in data

  const groupForProvider: GroupData = isFamilyGroup
    ? {
        ...(data as FamilyGroupData),
        relatedMembers: [],
        notRelatedMembers: (data as FamilyGroupData).members,
        relatedCount: 0,
        notRelatedCount: (data as FamilyGroupData).memberCount,
      }
    : (data as GroupData)

  const { relatedMembers, notRelatedMembers, currentUserMember, isSuperAdmin } =
    groupForProvider

  const isAuthorizedMember = !!(
    currentUserMember &&
    ['admin', 'member', 'super'].includes(currentUserMember.role.code)
  )

  const isGroupAdmin = currentUserMember?.role.code === 'admin'

  return (
    <GroupProvider
      value={{
        group: groupForProvider,
        relatedMembers,
        notRelatedMembers,
        currentUserMember,
        isSuperAdmin,
        isGroupAdmin,
        isAuthorizedMember,
      }}
    >
      <div className="relative flex min-h-screen flex-col">
        <Header
          group={groupForProvider}
          isGroupAdmin={currentUserMember?.role.code === 'admin'}
          groupSlug={slug}
        />
        <main className="flex-grow bg-gray-50 pb-16 dark:bg-gray-900">{children}</main>
        <Footer />
      </div>
    </GroupProvider>
  )
}
