'use client'

import React, { memo } from 'react'
import { NodeProps } from 'reactflow'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AvatarNodeData {
  label: string
  image?: string | null
  relationship?: string
  size?: 'large' | 'default'
}

const AvatarNode = ({ data }: NodeProps<AvatarNodeData>) => {
  const { label, image, relationship, size = 'default' } = data

  const truncate = (str: string, n: number) => {
    return str.length > n ? str.slice(0, n - 1) + '...' : str
  }

  const isLarge = size === 'large'

  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar
        className={cn(
          'border-primary border-2',
          isLarge ? 'h-24 w-24' : 'h-16 w-16',
        )}
      >
        <AvatarImage src={image || undefined} alt={label} />
        <AvatarFallback>{label.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="text-center">
        <div className="text-sm font-semibold">{truncate(label, 16)}</div>
        {relationship && (
          <div className="text-muted-foreground text-xs">{relationship}</div>
        )}
      </div>
    </div>
  )
}

export default memo(AvatarNode)
