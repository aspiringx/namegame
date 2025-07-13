'use client';

import Image from 'next/image';
import { GroupWithMembers } from '@/types';

type Member = GroupWithMembers['members'][0];

interface MemberCardProps {
  member: Member;
}

export default function MemberCard({ member }: MemberCardProps) {
  return (
    <div className="text-center transition-transform duration-300 ease-in-out">
      <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg">
        <Image
          src={member.user.photoUrl || '/images/default-avatar.png'}
          alt={member.user.name || 'User avatar'}
          fill
          className="object-cover"
        />
      </div>
      <p className="mt-2 text-sm font-medium text-gray-800 truncate dark:text-gray-200">
        {member.user.name}
      </p>
    </div>
  );
}
