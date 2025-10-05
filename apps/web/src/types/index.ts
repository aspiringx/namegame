import type {
  User,
  UserUserRelationType,
  Group,
  GroupUser,
  UserUser,
  GroupType,
  GroupUserRole,
} from '@namegame/db'
import { Prisma } from '@namegame/db'

export type { User, UserUserRelationType }

// NOTE: It's important to keep this in sync with the `groupWithMembers` query in
// `src/app/(main)/admin/groups/[slug]/edit/layout.tsx`.
const _groupWithMembers = Prisma.validator<Prisma.GroupDefaultArgs>()({
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
})

export type GroupPayload = Prisma.GroupGetPayload<typeof _groupWithMembers>

export type GroupWithMembers = Omit<GroupPayload, 'members'> & {
  members: (Omit<GroupPayload['members'][number], 'user'> & {
    user: GroupPayload['members'][number]['user'] & { name: string; photoUrl?: string }
  })[]
}

export type UserWithPhotoUrl = User & { name: string; photoUrl?: string }

export type MemberWithUser = GroupUser & {
  user: UserWithPhotoUrl;
  role: GroupUserRole;
  parents: (GroupUser & { user: UserWithPhotoUrl })[];
  children: (GroupUser & { user: UserWithPhotoUrl })[];
  connectedAt?: Date | null;
};

export type GroupData = Group & {
  logo?: string;
  groupType: GroupType;
  isSuperAdmin?: boolean;
};

export type FullRelationship = UserUser & {
  relationType: UserUserRelationType;
  relatedUser: User;
  user1: User;
  user2: User;
};

export type CommunityGroupData = Group & {
  logo?: string;
  groupType: GroupType;
  isSuperAdmin: boolean;
  members: MemberWithUser[];
  memberCount: number;
  relatedMembers: MemberWithUser[];
  notRelatedMembers: MemberWithUser[];
  relatedCount: number;
  notRelatedCount: number;
  currentUserMember?: MemberWithUser;
};

export type FamilyGroupData = Group & {
  logo?: string;
  groupType: GroupType;
  isSuperAdmin: boolean;
  members: MemberWithUser[];
  memberCount: number;
  currentUserMember: MemberWithUser | undefined;
  relationships?: FullRelationship[];
};
