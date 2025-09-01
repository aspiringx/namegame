'use client'

import { useEffect, useState, useRef } from 'react'
import { useTheme } from 'next-themes'
import { Panel, useReactFlow } from 'reactflow'
import type { ComponentProps } from 'react'
import { ZoomIn, ZoomOut, Expand, Maximize, Wrench } from 'lucide-react'

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

const Controls = ({ onFullScreen, fitView, zoomIn, zoomOut }: any) => {
  const handleFullScreenClick = () => {
    onFullScreen()
    setTimeout(() => {
      fitView()
    }, 100)
  }

  return (
    <div className="bg-background flex flex-col overflow-hidden rounded-md border shadow-lg">
      <StyledControlButton onClick={handleFullScreenClick} title="Full screen">
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

  if (!isMobile) {
    return (
      <Panel position="bottom-left">
        <Controls {...{ onFullScreen, fitView, zoomIn, zoomOut }} />
      </Panel>
    )
  }

  // Mobile view
  const positionClass = isFullScreen ? 'fixed bottom-4 left-4 z-50' : ''

  return (
    <Panel position="bottom-left">
      <div className={positionClass} ref={controlsRef}>
        {isMobileMenuOpen ? (
          <Controls {...{ onFullScreen, fitView, zoomIn, zoomOut }} />
        ) : (
          <div className="overflow-hidden rounded-md border">
            <StyledControlButton
              onClick={() => setIsMobileMenuOpen(true)}
              title="tools"
              isLast
            >
              <Wrench size={24} strokeWidth={1.5} />
            </StyledControlButton>
          </div>
        )}
      </div>
    </Panel>
  )
}
