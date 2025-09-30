import CreateUserForm from './create-user-form'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function CreateUserPage() {
  return (
    <div className="mx-auto max-w-2xl p-8 dark:bg-gray-900">
      <Breadcrumbs />
      <h1 className="mb-6 text-2xl font-bold dark:text-white">
        Create New User
      </h1>
      <CreateUserForm />
    </div>
  )
}
