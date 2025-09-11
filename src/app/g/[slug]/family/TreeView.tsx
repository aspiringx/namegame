'use client'

import { useRef } from 'react'
import { useGroup } from '@/components/GroupProvider'
import FamilyTree from './FamilyTree'
import type { FamilyTreeRef } from './FamilyTree'
import { FocalUserSearch } from './FocalUserSearch'

export default function TreeView() {
  const { group, relatedMembers, isGroupAdmin, currentUserMember, relationships } =
    useGroup()
  const familyTreeRef = useRef<FamilyTreeRef>(null)

  if (!group) return null

  return (
    <div className="relative rounded-md border">
      <FocalUserSearch
        members={relatedMembers}
        onSelect={(userId) => familyTreeRef.current?.setFocalUser(userId)}
      />
      <FamilyTree
        ref={familyTreeRef}
        relationships={relationships || []}
        members={relatedMembers}
        currentUser={currentUserMember?.user}
        onIsFocalUserCurrentUserChange={() => {}}
        relationshipMap={new Map()}
        onOpenRelate={() => {}}
        isGroupAdmin={isGroupAdmin}
      />
    </div>
  )
}
