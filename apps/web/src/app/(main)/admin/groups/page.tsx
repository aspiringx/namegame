import Link from 'next/link'
import { Suspense } from 'react'
import Breadcrumbs from '@/components/Breadcrumbs'
import prisma from '@/lib/prisma'
import GroupsClient from './GroupsClient'

export default async function AdminGroupsPage() {
  const groups = await prisma.group.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="mx-auto max-w-4xl p-8">
      <Breadcrumbs />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col gap-2 pr-4">
          <h1 className="text-2xl font-bold">Parent Groups</h1>
          <p>Top-level Relation Star groups.</p>
        </div>
        <Link
          href="/admin/groups/create"
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        >
          Create
        </Link>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <GroupsClient initialGroups={groups} />
      </Suspense>
    </div>
  )
}
