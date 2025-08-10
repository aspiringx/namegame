import prisma from '@/lib/prisma'
import Breadcrumbs from '@/components/Breadcrumbs'
import CreateGroupForm from './CreateGroupForm'

export default async function CreateGroupPage() {
  const groupTypes = await prisma.groupType.findMany()
  return (
    <div className="mx-auto max-w-2xl p-8 dark:bg-gray-900">
      <Breadcrumbs />
      <h1 className="mb-6 text-2xl font-bold dark:text-white">
        Create New Group
      </h1>
      <CreateGroupForm groupTypes={groupTypes} />
    </div>
  )
}
