import CreateUserForm from './create-user-form';
import Breadcrumbs from '../../../../components/Breadcrumbs';

export default function CreateUserPage() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-6">Create New User</h1>
      <CreateUserForm />
    </div>
  );
}
