'use client'

import React, { memo, useState } from 'react'
import { NodeProps } from 'reactflow'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
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
    <TooltipProvider>
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
    </TooltipProvider>
  )
}

export default memo(AvatarNode)
