'use client'

import type { MemberWithUser } from '@/types'
import GamesView from './GamesView'
import { useGroup } from '@/components/GroupProvider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface GamesViewClientProps {
  members: MemberWithUser[]
  groupSlug: string
  currentUserId?: string
  onSwitchToGrid: () => void
  groupType?: string
}

const GamesViewClient: React.FC<GamesViewClientProps> = ({
  onSwitchToGrid,
  ...props
}) => {
  const { group } = useGroup()

  return (
    <>
      <GamesView
        {...props}
        onSwitchToGrid={onSwitchToGrid}
        groupType={group?.groupType?.code}
      />
      <p className="mt-4 text-center text-gray-500 italic dark:text-gray-400">
        Coming soon... more group games!
      </p>
    </>
  )
}

export default GamesViewClient
