'use client'

import type { MemberWithUser } from '@/types'
import NameQuizView from './NameQuizView'
import { useGroup } from './GroupProvider'

interface NameQuizViewClientProps {
  members: MemberWithUser[]
  groupSlug: string
  currentUserId?: string
  onSwitchToGrid: () => void
  onSwitchToList: () => void
  groupType?: string
}

const NameQuizViewClient: React.FC<NameQuizViewClientProps> = ({
  onSwitchToGrid,
  onSwitchToList,
  ...props
}) => {
  const { group } = useGroup()

  return (
    <NameQuizView
      {...props}
      onSwitchToGrid={onSwitchToGrid}
      onSwitchToList={onSwitchToList}
      groupType={group?.groupType?.code}
    />
  )
}

export default NameQuizViewClient
