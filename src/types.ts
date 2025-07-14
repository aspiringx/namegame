import type { Group, GroupUser, Photo, User } from '@/generated/prisma';

export type UserWithPhotoUrl = User & { name: string; photoUrl?: string };

export type MemberWithUser = GroupUser & {
  user: UserWithPhotoUrl;
  relationUpdatedAt?: Date;
};



export type GroupData = Group & {
  isSuperAdmin: boolean;
  sunDeckMembers: MemberWithUser[];
  iceBlockMembers: MemberWithUser[];
  currentUserMember: MemberWithUser | undefined;
};
