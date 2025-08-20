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
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface AvatarNodeData {
  label: string
  image?: string | null
  relationship?: string
  size?: 'xlarge' | 'large' | 'default'
  firstName?: string | null
  lastName?: string | null
  birthDate?: Date | string | null
  birthPlace?: string | null
  birthDatePrecision?: string | null
  deathDate?: Date | string | null
  deathPlace?: string | null
  deathDatePrecision?: string | null
  canExpandUp?: boolean
  canExpandDown?: boolean
  canExpandHorizontal?: boolean
  onExpand?: (direction: 'up' | 'down' | 'left' | 'right') => void
}

const AvatarNode = ({ data }: NodeProps<AvatarNodeData>) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const {
    label,
    image,
    relationship,
    size = 'default',
    firstName,
    lastName,
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

  const isLarge = size === 'large'
  const isXLarge = size === 'xlarge'
  const fullName = [firstName, lastName].filter(Boolean).join(' ')

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
      <Handle type="source" position={Position.Top} id="top-source" className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Top} id="top-target" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Right} id="right-target" className="!bg-transparent !border-0" />
      <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
        <TooltipTrigger asChild>
          <div
            className="flex cursor-pointer flex-col items-center gap-2"
            onClick={() => setIsTooltipOpen(!isTooltipOpen)}
          >
            <Avatar
              className={cn(
                'border-primary border-2',
                isXLarge ? 'h-32 w-32' : isLarge ? 'h-24 w-24' : 'h-16 w-16',
              )}
            >
              {image && <AvatarImage src={image} alt={label} />}
              <AvatarFallback>{label.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <div className="text-sm font-semibold">{truncate(label, 16)}</div>
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
            <p className="font-bold">{fullName || label}</p>
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
                <span className="font-semibold">Birth Place:</span> {birthPlace}
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
                <span className="font-semibold">Death Place:</span> {deathPlace}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Left} id="left-source" className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-transparent !border-0" />
      {canExpandUp && (
        <div
          onClick={() => onExpand?.('up')}
          className="absolute -top-4 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background text-muted-foreground shadow-md transition-colors hover:bg-accent hover:text-accent-foreground opacity-75 hover:opacity-100"
        >
          <ChevronUp className="h-5 w-5" />
        </div>
      )}
      {canExpandDown && (
        <div
          onClick={() => onExpand?.('down')}
          className="absolute -bottom-4 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background text-muted-foreground shadow-md transition-colors hover:bg-accent hover:text-accent-foreground opacity-75 hover:opacity-100"
        >
          <ChevronDown className="h-5 w-5" />
        </div>
      )}
      {canExpandHorizontal && (
        <>
          <div
            onClick={() => onExpand?.('left')}
            className="absolute -left-4 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background text-muted-foreground shadow-md transition-colors hover:bg-accent hover:text-accent-foreground opacity-75 hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </div>
          <div
            onClick={() => onExpand?.('right')}
            className="absolute -right-4 top-1/2 z-10 flex h-8 w-8 translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background text-muted-foreground shadow-md transition-colors hover:bg-accent hover:text-accent-foreground opacity-75 hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </div>
        </>
      )}
    </TooltipProvider>
    </div>
  )
}

export default memo(AvatarNode)
