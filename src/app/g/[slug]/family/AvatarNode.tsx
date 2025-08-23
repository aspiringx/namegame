'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { UserWithPhotoUrl } from '@/types'
import { ChevronUp, ChevronDown, ChevronLeft } from 'lucide-react'
import { format } from 'date-fns'

interface AvatarNodeData extends UserWithPhotoUrl {
  isCurrentUser: boolean
  isFocalUser: boolean
  onExpand: (direction: 'up' | 'down' | 'left' | 'right') => void
  canExpandUp: boolean
  canExpandDown: boolean
  canExpandHorizontal: boolean
  relationship?: string
}

const AvatarNode = ({ data, selected }: NodeProps<AvatarNodeData>) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const {
    firstName,
    photoUrl,
    relationship,
    isCurrentUser,
    isFocalUser,
    birthDate,
    birthPlace,
    deathDate,
    deathPlace,
    birthDatePrecision,
    deathDatePrecision,
    canExpandUp,
    canExpandDown,
    canExpandHorizontal,
    onExpand,
  } = data

  const truncate = (str: string, n: number) => {
    return str.length > n ? str.slice(0, n - 1) + '...' : str
  }

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ')

  const formatDate = (
    date: Date | string | null | undefined,
    precision: string | null | undefined,
  ) => {
    if (!date) return null
    let formatString = 'P' // Default to day precision, e.g., 07/09/1974
    switch (precision) {
      case 'YEAR':
        formatString = 'yyyy'
        break
      case 'MONTH':
        formatString = 'LLLL yyyy' // e.g., July 1974
        break
      case 'DAY':
        formatString = 'P' // e.g., 07/09/1974 (locale-sensitive)
        break
      case 'TIME':
        formatString = 'P p' // e.g., 07/09/1974, 5:00 PM (locale-sensitive)
        break
    }
    try {
      return format(new Date(date), formatString)
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const formattedBirthDate = formatDate(birthDate, birthDatePrecision)
  const formattedDeathDate = formatDate(deathDate, deathDatePrecision)

  return (
    <div className="relative">
      <TooltipProvider>
        <Handle
          type="source"
          position={Position.Top}
          id="top-source"
          className="!border-0 !bg-transparent"
        />
        <Handle
          type="target"
          position={Position.Top}
          id="top-target"
          className="!border-0 !bg-transparent"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right-source"
          className="!border-0 !bg-transparent"
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right-target"
          className="!border-0 !bg-transparent"
        />
        <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
          <TooltipTrigger asChild>
            <div className="flex cursor-pointer flex-col items-center gap-2">
              <Avatar
                className={cn(
                  'border-2 transition-all',
                  isFocalUser ? 'h-28 w-28' : 'h-24 w-24',
                  isCurrentUser ? 'border-primary' : 'border-transparent',
                  selected &&
                    'ring-ring ring-offset-background ring-2 ring-offset-2',
                )}
              >
                {photoUrl && <AvatarImage src={photoUrl} alt={fullName} />}
                <AvatarFallback>{firstName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="text-sm font-semibold">
                  {truncate(fullName, 16)}
                </div>
                {relationship && (
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {relationship}
                  </div>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1 text-left">
              <p className="font-bold">{fullName}</p>
              {relationship && (
                <p className="text-xs text-slate-200 dark:text-slate-300">
                  {relationship}
                </p>
              )}
              {formattedBirthDate && (
                <p className="text-xs">
                  <span className="font-semibold">Birth Date:</span>{' '}
                  {formattedBirthDate}
                </p>
              )}
              {birthPlace && (
                <p className="text-xs">
                  <span className="font-semibold">Birth Place:</span>{' '}
                  {birthPlace}
                </p>
              )}
              {formattedDeathDate && (
                <p className="text-xs">
                  <span className="font-semibold">Death Date:</span>{' '}
                  {formattedDeathDate}
                </p>
              )}
              {deathPlace && (
                <p className="text-xs">
                  <span className="font-semibold">Death Place:</span>{' '}
                  {deathPlace}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-source"
          className="!border-0 !bg-transparent"
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom-target"
          className="!border-0 !bg-transparent"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left-source"
          className="!border-0 !bg-transparent"
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left-target"
          className="!border-0 !bg-transparent"
        />
        {canExpandUp && (
          <div
            onClick={(e) => {
              e.stopPropagation()
              onExpand?.('up')
            }}
            className="bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground absolute -top-4 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full opacity-75 shadow-md transition-colors hover:opacity-100"
          >
            <ChevronUp className="h-5 w-5" />
          </div>
        )}
        {canExpandDown && (
          <div
            onClick={(e) => {
              e.stopPropagation()
              onExpand?.('down')
            }}
            className="bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground absolute -bottom-4 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 translate-y-1/2 cursor-pointer items-center justify-center rounded-full opacity-75 shadow-md transition-colors hover:opacity-100"
          >
            <ChevronDown className="h-5 w-5" />
          </div>
        )}
        {canExpandHorizontal && (
          <div
            onClick={(e) => {
              e.stopPropagation()
              onExpand?.('left')
            }}
            className="bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground absolute top-1/2 -left-4 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full opacity-75 shadow-md transition-colors hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </div>
        )}
      </TooltipProvider>
    </div>
  )
}

export default memo(AvatarNode)
