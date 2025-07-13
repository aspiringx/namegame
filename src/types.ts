import type { Group, GroupUser, Photo, User } from '@/generated/prisma';

export type UserWithPhotoUrl = User & { name: string; photoUrl?: string };

export type GroupWithMembers = Group & {
  members: (GroupUser & {
    user: UserWithPhotoUrl;
    relationUpdatedAt?: Date;
  })[];
  photos: Photo[];
};
