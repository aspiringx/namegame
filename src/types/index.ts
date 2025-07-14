import { Prisma, Group, GroupUser, User } from '@/generated/prisma';

// NOTE: It's important to keep this in sync with the `groupWithMembers` query in
// `src/app/(main)/admin/groups/[slug]/edit/layout.tsx`.
const groupWithMembers = Prisma.validator<Prisma.GroupDefaultArgs>()({
  include: {
    photos: true,
    members: {
      include: {
        user: {
          include: {
            photos: true,
          },
        },
      },
    },
  },
});

export type GroupPayload = Prisma.GroupGetPayload<typeof groupWithMembers>;

export type GroupWithMembers = Omit<GroupPayload, 'members'> & {
  members: (Omit<GroupPayload['members'][number], 'user'> & {
    user: GroupPayload['members'][number]['user'] & { photoUrl?: string };
  })[];
};

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
