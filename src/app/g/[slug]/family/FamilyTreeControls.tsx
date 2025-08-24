'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  Panel,
  ControlButton,
  ControlButtonProps,
  useReactFlow,
} from 'reactflow'
import { ZoomIn, ZoomOut, Expand, Maximize } from 'lucide-react'

interface FamilyTreeControlsProps {
  onFullScreen: () => void
}

interface StyledControlButtonProps extends ControlButtonProps {
  isLast?: boolean
}

const StyledControlButton = ({ children, isLast, ...props }: StyledControlButtonProps) => {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <ControlButton
      {...props}
      className="p-2"
      style={{
        background: resolvedTheme === 'dark' ? 'hsl(240 10% 3.9%)' : 'white',
        borderBottom: isLast
          ? 'none'
          : `1px solid ${
              resolvedTheme === 'dark' ? 'hsl(240 3.7% 15.9%)' : 'hsl(214.3 31.8% 91.4%)'
            }`,
      }}
    >
      {children}
    </ControlButton>
  )
}

export function FamilyTreeControls({ onFullScreen }: FamilyTreeControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <Panel position="bottom-left">
      <div className="bg-background flex flex-col overflow-hidden rounded-md border shadow-lg">
        <StyledControlButton onClick={() => zoomIn()} title="zoom in">
          <ZoomIn />
        </StyledControlButton>
        <StyledControlButton onClick={() => zoomOut()} title="zoom out">
          <ZoomOut />
        </StyledControlButton>
        <StyledControlButton onClick={() => fitView()} title="fit view">
          <Expand />
        </StyledControlButton>
        <StyledControlButton onClick={onFullScreen} title="full screen" isLast>
          <Maximize />
        </StyledControlButton>
      </div>
    </Panel>
  )
}
