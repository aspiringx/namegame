'use client'

import { useRef } from 'react'
import { useGroup } from '@/components/GroupProvider'
import FamilyTree from './FamilyTree'
import type { FamilyTreeRef } from './FamilyTree'
import { FocalUserSearch } from './FocalUserSearch'
import { useFamilyGroupMembers } from './FamilyGroupClient';
import { MemberWithUser } from '@/types';

export default function TreeView() {
  const members = useFamilyGroupMembers();
  const groupContext = useGroup();
  if (!groupContext) {
    return null;
  }
  const { group, isGroupAdmin, currentUserMember, relationships } = groupContext;
  const familyTreeRef = useRef<FamilyTreeRef>(null)

  if (!group) return null

  return (
    <div className="relative rounded-md border">
      <FocalUserSearch
        members={members}
        onSelect={(userId) => familyTreeRef.current?.setFocalUser(userId)}
      />
      <FamilyTree
        ref={familyTreeRef}
        relationships={relationships || []}
        members={members}
        currentUser={currentUserMember?.user}
        onIsFocalUserCurrentUserChange={() => {}}
        relationshipMap={new Map()}
        onOpenRelate={() => {}}
        isGroupAdmin={isGroupAdmin}
      />
    </div>
  )
}
