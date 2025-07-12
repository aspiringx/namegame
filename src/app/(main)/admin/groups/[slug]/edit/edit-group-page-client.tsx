'use client';

import { useState } from 'react';
import EditGroupForm from './edit-group-form';
import GroupMembers from './group-members';
import type { GroupWithMembers } from './page';

interface EditGroupPageClientProps {
  group: GroupWithMembers;
  logoUrl?: string;
  isSuperAdmin: boolean;
  isGlobalAdminGroup: boolean;
}

export default function EditGroupPageClient({ group, logoUrl, isSuperAdmin, isGlobalAdminGroup }: EditGroupPageClientProps) {
  const [activeView, setActiveView] = useState('details');

  const tabBaseClasses = 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm';
  const activeTabClasses = 'border-indigo-500 text-indigo-600';
  const inactiveTabClasses = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';

  return (
    <div>
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveView('details')}
            className={`${tabBaseClasses} ${activeView === 'details' ? activeTabClasses : inactiveTabClasses}`}
          >
            Edit Details
          </button>
          <button
            onClick={() => setActiveView('members')}
            className={`${tabBaseClasses} ${activeView === 'members' ? activeTabClasses : inactiveTabClasses}`}
          >
            Manage Members
          </button>
        </nav>
      </div>

      {activeView === 'details' && <EditGroupForm group={group} logoUrl={logoUrl} />}
      {activeView === 'members' && <GroupMembers group={group} isSuperAdmin={isSuperAdmin} isGlobalAdminGroup={isGlobalAdminGroup} />}
    </div>
  );
}
