'use client'

import { forwardRef } from 'react'
import { useGroup } from '@/components/GroupProvider'
import { useFamilyGroupData } from './FamilyGroupClient'
import FamilyTree, { FamilyTreeRef } from './FamilyTree'
import { MemberWithUser } from '@/types'

interface TreeViewProps {
  onIsFocalUserCurrentUserChange: (isCurrentUser: boolean) => void
  members: MemberWithUser[]
}

const TreeView = forwardRef<FamilyTreeRef, TreeViewProps>(
  ({ onIsFocalUserCurrentUserChange, members }, ref) => {
    const groupContext = useGroup()
    if (!groupContext) {
      return null
    }
    const { group, isGroupAdmin, currentUserMember, relationships } =
      groupContext

    if (!group) return null

    const { relationshipMap } = useFamilyGroupData()

    const handleSelect = (userId: string) => {
      if (typeof ref === 'object' && ref?.current) {
        ref.current.setFocalUser(userId)
      }
    }

    return (
      <div className="relative border">
        <FamilyTree
          ref={ref}
          onIsFocalUserCurrentUserChange={onIsFocalUserCurrentUserChange}
          relationships={relationships || []}
          members={members}
          currentUser={currentUserMember?.user}
          relationshipMap={relationshipMap}
          onOpenRelate={() => {}}
          isGroupAdmin={isGroupAdmin}
        />
      </div>
    )
  },
)

TreeView.displayName = 'TreeView'

export default TreeView
