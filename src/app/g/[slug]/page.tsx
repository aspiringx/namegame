'use client';

import { useGroup } from '@/components/GroupProvider';
import Image from 'next/image';

export default function GroupPage() {
  const group = useGroup();

  if (!group) {
    // This should technically not happen if the layout handles it,
    // but it's good practice for robustness.
    return null;
  }

  const members = group.members;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {members.map((member) => (
          <div key={member.user.id} className="text-center">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg">
              <Image
                src={member.user.photoUrl || '/default-avatar.png'}
                alt={member.user.name}
                fill
                className="object-cover"
              />
            </div>
            <p className="mt-2 text-sm font-medium text-gray-800 truncate">{member.user.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
