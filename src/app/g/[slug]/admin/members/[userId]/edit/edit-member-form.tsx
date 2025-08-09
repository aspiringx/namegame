'use client';

import { useTransition } from 'react';
import type { GroupUser, GroupUserRole, User } from '@/generated/prisma';
import { updateMemberRole } from './actions';

// The member prop is a GroupUser object with the user and role relations included.
interface EditMemberFormProps {
  member: GroupUser & { user: User; role: GroupUserRole };
  allRoles: GroupUserRole[];
  groupSlug: string;
}

export default function EditMemberForm({ member, allRoles, groupSlug }: EditMemberFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const roleId = parseInt(formData.get('roleId') as string, 10);

    if (isNaN(roleId)) {
      alert('Please select a valid role.');
      return;
    }

    startTransition(async () => {
      try {
        await updateMemberRole(
          {
            userId: member.userId,
            groupId: member.groupId,
            roleId: roleId,
          },
          groupSlug
        );
        alert('Role updated successfully!');
      } catch (error) {
        console.error('Failed to update role:', error);
        alert('An error occurred while updating the role.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">{`${member.user.firstName} ${member.user.lastName}`}</h2>
        <p className="text-gray-500 dark:text-gray-400">{member.user.email}</p>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Role
        </label>
        <select
          id="role"
          name="roleId"
          defaultValue={member.roleId}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
        >
          {allRoles.map(role => (
            <option key={role.id} value={role.id}>
              {role.code}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
