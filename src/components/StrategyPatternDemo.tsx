'use client'

import React from 'react'
import BaseMemberCard from './BaseMemberCard'
import { getGroupAdapter } from '@/lib/group-adapters'
import { MemberWithUser } from '@/types'

/**
 * Demo component to showcase the strategy pattern working
 * This demonstrates how the same BaseMemberCard component
 * renders differently based on the group type strategy
 */
export default function StrategyPatternDemo() {
  // Mock member data
  const mockMember: MemberWithUser = {
    id: '1',
    userId: 'user-1',
    groupId: 'group-1',
    role: { code: 'member', name: 'Member' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    connectedAt: null,
    user: {
      id: 'user-1',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      photoUrl: '/images/default-avatar.png',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  const mockMemberWithConnection: MemberWithUser = {
    ...mockMember,
    id: '2',
    userId: 'user-2',
    connectedAt: new Date().toISOString(),
    user: {
      ...mockMember.user,
      id: 'user-2',
      name: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
    }
  }

  // Get adapters for both group types
  const communityAdapter = getGroupAdapter('community')
  const familyAdapter = getGroupAdapter('family')

  const communityStrategy = communityAdapter.getMemberCardStrategy()
  const familyStrategy = familyAdapter.getMemberCardStrategy()

  const handleRelate = (member: MemberWithUser) => {
    alert(`Relate clicked for ${member.user.name}`)
  }

  const handleConnect = (member: MemberWithUser) => {
    alert(`Connect clicked for ${member.user.name}`)
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Strategy Pattern Demo</h1>
      <p className="text-gray-600">
        Same BaseMemberCard component, different strategies based on group type.
        This eliminates 800+ lines of duplication!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Community Group Example */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Community Group</h2>
          <p className="text-sm text-gray-500">
            • No relationship display<br/>
            • Shows "Connect" action for unconnected members<br/>
            • Shows "Relationships" action
          </p>
          <div className="grid grid-cols-2 gap-4">
            <BaseMemberCard
              member={mockMember}
              strategy={communityStrategy}
              onRelate={handleRelate}
              onConnect={handleConnect}
              currentUserId="current-user"
              isGroupAdmin={true}
              groupSlug="demo-community"
            />
            <BaseMemberCard
              member={mockMemberWithConnection}
              strategy={communityStrategy}
              onRelate={handleRelate}
              onConnect={handleConnect}
              currentUserId="current-user"
              isGroupAdmin={true}
              groupSlug="demo-community"
            />
          </div>
        </div>

        {/* Family Group Example */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Family Group</h2>
          <p className="text-sm text-gray-500">
            • Shows relationship labels (clickable)<br/>
            • No "Connect" action<br/>
            • Shows "Relationships" action
          </p>
          <div className="grid grid-cols-2 gap-4">
            <BaseMemberCard
              member={mockMember}
              strategy={familyStrategy}
              relationship="Brother"
              onRelate={handleRelate}
              currentUserId="current-user"
              isGroupAdmin={true}
              groupSlug="demo-family"
            />
            <BaseMemberCard
              member={mockMemberWithConnection}
              strategy={familyStrategy}
              relationship="Sister"
              onRelate={handleRelate}
              currentUserId="current-user"
              isGroupAdmin={true}
              groupSlug="demo-family"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800">✅ Strategy Pattern Benefits Demonstrated:</h3>
        <ul className="mt-2 text-sm text-green-700 space-y-1">
          <li>• Single BaseMemberCard component handles both group types</li>
          <li>• Different behavior based on strategy configuration</li>
          <li>• No code duplication between group types</li>
          <li>• Easy to add new group types (just create new strategy)</li>
          <li>• Type-safe configuration objects</li>
        </ul>
      </div>
    </div>
  )
}
