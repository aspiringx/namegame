import { auth } from '@/auth'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { GroupProvider, GroupPageData } from '@/components/GroupProvider'
import { getGroupForLayout } from './utils'
import { FamilyGroupData, CommunityGroupData } from '@/types'
import { getDeviceTypeFromHeaders } from '@/lib/device'

import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata({
  params: paramsProp,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const params = await paramsProp
  const headersList = await headers()
  const deviceType = getDeviceTypeFromHeaders(headersList)
  const data = await getGroupForLayout(params.slug, deviceType)

  if (!data) {
    return {
      title: 'Group Not Found',
    }
  }

  return {
    title: data.name,
  }
}

export default async function GroupLayout({
  children,
  params: paramsProp,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const params = await paramsProp
  const session = await auth()
  const headersList = await headers()
  const headerPath = headersList.get('x-invoke-path') || ''
  const deviceType = getDeviceTypeFromHeaders(headersList)

  // The /greet page is public and should not be protected by this authorization.
  if (!headerPath.includes('/greet') && !session?.user) {
    // Reconstruct the path from slug as a fallback
    const pathname = headerPath || `/g/${params.slug}`
    return redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
  }

  const data = await getGroupForLayout(params.slug, deviceType)

  if (!data) {
    // This can happen if the group doesn't exist, or if the user is not a member
    // of a private group. In either case, we show a 404.
    notFound()
  }

  const isFamilyGroup = data.groupType.code === 'family'

  let groupForProvider: GroupPageData

  if (isFamilyGroup) {
    const familyData = data as FamilyGroupData
    groupForProvider = {
      group: familyData,
      relatedMembers: [], // This will be populated client-side
      notRelatedMembers: familyData.members, // Initially, all are not related
      currentUserMember: familyData.currentUserMember,
      isSuperAdmin: familyData.isSuperAdmin,
      isGroupAdmin: familyData.currentUserMember?.role.code === 'admin',
      isAuthorizedMember:
        !!familyData.currentUserMember &&
        ['admin', 'member', 'super'].includes(
          familyData.currentUserMember.role.code,
        ),
    }
  } else {
    const communityData = data as CommunityGroupData
    groupForProvider = {
      group: communityData,
      relatedMembers: [],
      notRelatedMembers: [],
      currentUserMember: communityData.currentUserMember,
      isSuperAdmin: communityData.isSuperAdmin,
      isGroupAdmin: communityData.currentUserMember?.role.code === 'admin',
      isAuthorizedMember:
        !!communityData.currentUserMember &&
        ['admin', 'member', 'super'].includes(
          communityData.currentUserMember.role.code,
        ),
    }
  }

  return (
    <GroupProvider value={groupForProvider}>
      <div className="relative flex min-h-screen flex-col">
        <Header
          group={groupForProvider.group}
          isGroupAdmin={groupForProvider.isGroupAdmin}
          groupSlug={params.slug}
        />
        <main className="flex-grow bg-gray-50 pb-20 dark:bg-gray-900">
          {children}
        </main>
        <Footer />
      </div>
    </GroupProvider>
  )
}
