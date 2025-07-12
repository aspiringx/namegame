import CreateUserForm from './create-user-form';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function CreateUserPage() {
  return (
    <div className="max-w-2xl mx-auto p-8 dark:bg-gray-900">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Create New User</h1>
      <CreateUserForm />
    </div>
  );
}
