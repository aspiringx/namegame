'use client'

import { useEffect, useState, useRef } from 'react'
import { useTheme } from 'next-themes'
import { Panel, useReactFlow } from 'reactflow'
import type { ComponentProps } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Expand,
  Maximize,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react'

interface FamilyTreeControlsProps {
  onFullScreen: () => void
  isFullScreen?: boolean
  isMobile?: boolean
}

interface StyledControlButtonProps extends ComponentProps<'button'> {
  isLast?: boolean
}

const StyledControlButton = ({
  children,
  isLast,
  ...props
}: StyledControlButtonProps) => {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <button
      type="button"
      {...props}
      className="flex h-12 w-12 items-center justify-center"
      style={{
        background: resolvedTheme === 'dark' ? 'hsl(240 10% 3.9%)' : 'white',
        borderBottom: isLast
          ? 'none'
          : `1px solid ${
              resolvedTheme === 'dark'
                ? 'hsl(240 3.7% 15.9%)'
                : 'hsl(214.3 31.8% 91.4%)'
            }`,
      }}
    >
      {children}
    </button>
  )
}

const Controls = ({
  onFullScreen,
  fitView,
  zoomIn,
  zoomOut,
}: {
  onFullScreen: () => void
  fitView: () => void
  zoomIn: () => void
  zoomOut: () => void
}) => {
  const handleFullScreenClick = () => {
    onFullScreen()
    setTimeout(() => {
      fitView()
    }, 100)
  }

  return (
    <div
      className="bg-background flex flex-col overflow-hidden rounded-md border shadow-lg"
      data-tour="family-tree-controls"
    >
      <StyledControlButton
        onClick={handleFullScreenClick}
        title="Full screen"
        data-tour="fullscreen-button"
      >
        <Maximize size={24} strokeWidth={1.5} />
      </StyledControlButton>
      <StyledControlButton onClick={() => zoomIn()} title="Zoom in">
        <ZoomIn size={24} strokeWidth={1.5} />
      </StyledControlButton>
      <StyledControlButton onClick={() => zoomOut()} title="Zoom out">
        <ZoomOut size={24} strokeWidth={1.5} />
      </StyledControlButton>
      <StyledControlButton onClick={() => fitView()} title="Fit view">
        <Expand size={24} strokeWidth={1.5} />
      </StyledControlButton>
    </div>
  )
}

export function FamilyTreeControls({
  onFullScreen,
  isFullScreen,
  isMobile,
}: FamilyTreeControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const controlsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        controlsRef.current &&
        !controlsRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  const handleFullScreenClick = () => {
    onFullScreen()
    setTimeout(() => {
      fitView()
    }, 100)
  }

  if (!isMobile) {
    return (
      <Panel position="bottom-center">
        <div
            className="bg-background flex items-center overflow-hidden rounded-md border shadow-lg"
            data-tour="family-tree-controls"
          >
          <StyledControlButton
            onClick={handleFullScreenClick}
            title="Full screen"
          >
            <Maximize size={24} strokeWidth={1.5} />
          </StyledControlButton>
          <StyledControlButton onClick={() => zoomIn()} title="Zoom in">
            <ZoomIn size={24} strokeWidth={1.5} />
          </StyledControlButton>
          <StyledControlButton onClick={() => zoomOut()} title="Zoom out">
            <ZoomOut size={24} strokeWidth={1.5} />
          </StyledControlButton>
          <StyledControlButton onClick={() => fitView()} title="Fit view" isLast>
            <Expand size={24} strokeWidth={1.5} />
          </StyledControlButton>
        </div>
      </Panel>
    )
  }

  // Mobile view
  return (
    <Panel position="bottom-left">
      <div ref={controlsRef} className="flex flex-col items-start gap-2">
        {isMobileMenuOpen && (
          <div className="bg-background overflow-hidden rounded-md border shadow-lg">
            <Controls {...{ onFullScreen, fitView, zoomIn, zoomOut }} />
          </div>
        )}
        <StyledControlButton
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          title="Tools"
          isLast
          className="bg-background rounded-md border shadow-lg"
        >
          <SlidersHorizontal size={24} strokeWidth={1.5} />
        </StyledControlButton>
      </div>
    </Panel>
  )
}
