'use client'

import type { MemberWithUser } from '@/types'
import NameQuizView from './NameQuizView'

interface NameQuizViewClientProps {
  members: MemberWithUser[]
  groupSlug: string
  currentUserId?: string
  onSwitchToGrid: () => void
  onSwitchToList: () => void
}

const NameQuizViewClient: React.FC<NameQuizViewClientProps> = ({
  onSwitchToGrid,
  onSwitchToList,
  ...props
}) => {
  return (
    <NameQuizView
      {...props}
      onSwitchToGrid={onSwitchToGrid}
      onSwitchToList={onSwitchToList}
    />
  )
}

export default NameQuizViewClient
