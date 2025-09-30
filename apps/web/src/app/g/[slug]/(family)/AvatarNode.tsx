'use client'

import React, { memo, useState, useEffect } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import Image from 'next/image'
import { Avatar } from '@/components/ui/avatar'
import { cn, truncate } from '@/lib/utils'
import { AvatarNodeData } from './useFamilyTree'
import { ChevronUp, ChevronDown, ChevronLeft } from 'lucide-react'

const AvatarNode = ({ data, selected }: NodeProps<AvatarNodeData>) => {
  const [imgSrc, setImgSrc] = useState(
    data.photoUrl || '/images/default-avatar.png',
  )

  useEffect(() => {
    setImgSrc(data.photoUrl || '/images/default-avatar.png')
  }, [data.photoUrl])

  const {
    relationship,
    isCurrentUser,
    isFocalUser,
    isFocalUserSpouseOrPartner,
    canExpandUp,
    canExpandDown,
    canExpandHorizontal,
    onExpand,
  } = data

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ')

  return (
    <div className="relative">
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
      <div className="flex cursor-pointer flex-col items-center gap-2">
        <Avatar
          className={cn(
            'border-2 transition-all',
            isFocalUser || isFocalUserSpouseOrPartner
              ? 'h-48 w-48'
              : 'h-32 w-32',
            isFocalUser
              ? 'border-yellow-400 shadow-md ring-1 shadow-yellow-400/30 ring-yellow-400/50 dark:border-yellow-500 dark:shadow-yellow-500/30 dark:ring-yellow-500/50'
              : isCurrentUser
                ? 'border-primary'
                : 'border-transparent',
            selected && 'ring-ring ring-offset-background ring-2 ring-offset-2',
          )}
        >
          <Image
            src={imgSrc}
            onError={() => {
              setImgSrc('/images/default-avatar.png')
            }}
            alt={fullName}
            fill
            sizes={
              isFocalUser || isFocalUserSpouseOrPartner ? '192px' : '128px'
            }
            priority={isFocalUser}
            className="object-cover"
          />
        </Avatar>
        <div className="text-center">
          <div
            className={cn(
              isFocalUser || isFocalUserSpouseOrPartner
                ? 'text-base'
                : 'text-sm',
            )}
          >
            {truncate(fullName, 20)}
          </div>
          {relationship && (
            <div
              className={cn(
                'font-medium text-slate-500 dark:text-slate-400',
                isFocalUser || isFocalUserSpouseOrPartner
                  ? 'text-sm'
                  : 'text-xs',
              )}
            >
              {relationship}
            </div>
          )}
        </div>
      </div>
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
    </div>
  )
}

export default memo(AvatarNode)
