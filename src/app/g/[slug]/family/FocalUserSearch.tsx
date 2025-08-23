'use client'

import { useState } from 'react'
import { Combobox } from '@/components/ui/combobox'
import { MemberWithUser } from '@/types'

interface FocalUserSearchProps {
  members: MemberWithUser[]
  onSelect: (userId: string) => void
}

export function FocalUserSearch({ members, onSelect }: FocalUserSearchProps) {
  const [selectedValue, setSelectedValue] = useState('')

  const options = members.map((member) => ({
    value: member.userId,
    label: `${member.user.firstName} ${member.user.lastName}`,
  }))

  const handleSelect = (value: string) => {
    onSelect(value)
    setSelectedValue('')
  }

  return (
    <Combobox
      options={options}
      selectedValue={selectedValue}
      onSelectValue={handleSelect}
      placeholder="Find a family member..."
      name="focal-user-search"
    />
  )
}
