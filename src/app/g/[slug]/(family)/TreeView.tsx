'use client'

import { forwardRef } from 'react'
import { useGroup } from '@/components/GroupProvider'
import { useFamilyData } from './contexts'
import FamilyTree, { FamilyTreeRef } from './FamilyTree'
import { MemberWithUser, FullRelationship } from '@/types'

interface TreeViewProps {
  onIsFocalUserCurrentUserChange: (isCurrentUser: boolean) => void
  members: MemberWithUser[]
  onOpenRelate: (member: MemberWithUser) => void
  relationships?: FullRelationship[] // Optional prop, falls back to context if not provided
}

const TreeView = forwardRef<FamilyTreeRef, TreeViewProps>(
  ({ onIsFocalUserCurrentUserChange, members, onOpenRelate, relationships: relationshipsProp }, ref) => {
    const groupContext = useGroup()
    const { relationshipMap } = useFamilyData()

    if (!groupContext) {
      return null
    }
    const { group, isGroupAdmin, currentUserMember, relationships: contextRelationships } =
      groupContext

    if (!group) return null

    // Use prop relationships if provided, otherwise fall back to context
    const relationships = relationshipsProp || contextRelationships || []

    return (
      <div className="relative border">
        <FamilyTree
          ref={ref}
          onIsFocalUserCurrentUserChange={onIsFocalUserCurrentUserChange}
          relationships={relationships}
          members={members}
          currentUser={currentUserMember?.user}
          relationshipMap={relationshipMap}
          onOpenRelate={onOpenRelate}
          isGroupAdmin={isGroupAdmin}
        />
      </div>
    )
  },
)

TreeView.displayName = 'TreeView'

export default TreeView
