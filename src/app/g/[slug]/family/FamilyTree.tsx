'use client'

import {
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
} from 'react'
import { X } from 'lucide-react'
import { useReactFlow } from 'reactflow'
import ReactFlow, { Background, ReactFlowProvider, Node } from 'reactflow'
import 'reactflow/dist/style.css'
import { MemberWithUser, UserWithPhotoUrl, FullRelationship } from '@/types'
import AvatarNode from './AvatarNode'
import SmoothFlowEdge from './SmoothFlowEdge'
import { MemberDetailsModal } from './MemberDetailsModal'
import { useFamilyTree, AvatarNodeData } from './useFamilyTree'
import { FamilyTreeControls } from './FamilyTreeControls'
import { useTourManagement } from '@/hooks/useTourManagement'
import { useTheme } from 'next-themes'
import { TourProvider, StepType } from '@reactour/tour'
import { steps as desktopSteps } from '@/components/tours/FamilyTreeTour'
import { steps as mobileSteps } from '@/components/tours/FamilyTreeTourMobile'

const nodeTypes = {
  avatar: AvatarNode,
}

const edgeTypes = {
  smoothflow: SmoothFlowEdge,
}

const fitViewOptions = {
  padding: 0.4,
}

const mobileFitViewOptions = {
  padding: 0.2,
}

interface FamilyTreeComponentProps {
  relationships: FullRelationship[]
  members: MemberWithUser[]
  currentUser?: UserWithPhotoUrl
  onIsFocalUserCurrentUserChange?: (isCurrentUser: boolean) => void
  relationshipMap: Map<string, string>
  isMobile: boolean
}

const FamilyTreeComponent = forwardRef<
  {
    reset: () => void
    setFocalUser: (userId: string) => void
  },
  FamilyTreeComponentProps
>(
  (
    {
      relationships,
      members,
      currentUser,
      onIsFocalUserCurrentUserChange,
      relationshipMap,
      isMobile,
    },
    ref,
  ) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(
      null,
    )
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isFullScreen, setIsFullScreen] = useState(false)
    const { fitView, zoomTo } = useReactFlow()
    const { startTour } = useTourManagement('familyTree')

    const handleExitFullScreen = () => {
      setIsFullScreen(false)
      setTimeout(() => {
        fitView()
      }, 100)
    }

    const {
      nodes,
      edges,
      resetFocalUser,
      isFocalUserTheCurrentUser,
      setFocalUser,
    } = useFamilyTree({
      relationships,
      members,
      currentUser,
      relationshipMap,
    })

    useEffect(() => {
      const timer = setTimeout(() => {
        if (isMobile) {
          fitView(mobileFitViewOptions)
          zoomTo(0.8, { duration: 200 })
        } else {
          fitView(fitViewOptions)
        }
      }, 100)

      return () => clearTimeout(timer)
    }, [nodes, isMobile, fitView, zoomTo])

    useEffect(() => {
      onIsFocalUserCurrentUserChange?.(isFocalUserTheCurrentUser)
    }, [isFocalUserTheCurrentUser, onIsFocalUserCurrentUserChange])

    useEffect(() => {
      const setHeight = () => {
        if (reactFlowWrapper.current) {
          reactFlowWrapper.current.style.height = `${window.innerHeight}px`
        }
      }

      if (isFullScreen) {
        setHeight()
        window.addEventListener('resize', setHeight)
        return () => {
          window.removeEventListener('resize', setHeight)
          if (reactFlowWrapper.current) {
            reactFlowWrapper.current.style.height = ''
          }
        }
      } else if (reactFlowWrapper.current) {
        reactFlowWrapper.current.style.height = ''
      }
    }, [isFullScreen])

    useImperativeHandle(ref, () => ({
      reset: resetFocalUser,
      setFocalUser: setFocalUser,
    }))

    const handleNodeClick = (
      _: React.MouseEvent,
      node: Node<AvatarNodeData>,
    ) => {
      const member = members.find((m) => m.userId === node.id)
      if (member) {
        setSelectedMember(member)
        setIsModalOpen(true)
      }
    }

    return (
      <>
        <div
          className={`h-full ${isFullScreen ? 'bg-background' : ''}`}
          style={{
            width: isFullScreen ? '100vw' : '100%',
            position: isFullScreen ? 'fixed' : 'relative',
            top: 0,
            left: 0,
            zIndex: isFullScreen ? 50 : 'auto',
          }}
          ref={reactFlowWrapper}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            proOptions={{ hideAttribution: true }}
            onNodeClick={handleNodeClick}
            className="bg-background"
          >
            <FamilyTreeControls
              onFullScreen={() => setIsFullScreen(true)}
              isFullScreen={isFullScreen}
              isMobile={isMobile}
              onStartTour={startTour}
            />
            {isFullScreen && (
              <button
                onClick={handleExitFullScreen}
                className="absolute top-4 right-4 z-50 rounded-full bg-white p-2 shadow-lg"
                aria-label="Exit full screen"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>
            )}
          </ReactFlow>
        </div>
        <MemberDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          member={selectedMember}
          relationship={
            selectedMember
              ? relationshipMap.get(selectedMember.userId)
              : undefined
          }
        />
      </>
    )
  },
)

export type FamilyTreeRef = {
  reset: () => void
  setFocalUser: (userId: string) => void
}

interface FamilyTreeProps {
  relationships: FullRelationship[]
  members: MemberWithUser[]
  currentUser?: UserWithPhotoUrl
  onIsFocalUserCurrentUserChange?: (isCurrentUser: boolean) => void
  relationshipMap: Map<string, string>
}

const FamilyTree = forwardRef<FamilyTreeRef, FamilyTreeProps>((props, ref) => {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  useEffect(() => setMounted(true), [])

  const tourSteps = isMobile ? mobileSteps : desktopSteps

  // Render nothing on the server to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <ReactFlowProvider>
      <TourProvider
        steps={tourSteps}
        onClickMask={() => {}}
        styles={{
          popover: (base: React.CSSProperties) => {
            const popoverStyles = isMobile
              ? {
                  position: 'fixed' as const,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 'calc(100vw - 40px)',
                  maxWidth: 'calc(100vw - 40px)',
                }
              : {
                  maxWidth: '380px',
                }

            return {
              ...base,
              ...popoverStyles,
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              borderRadius: '0.375rem',
              boxShadow:
                '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              border: mounted
                ? `3px solid ${
                    resolvedTheme === 'dark'
                      ? 'hsl(240 3.7% 25.9%)'
                      : 'hsl(214.3 31.8% 81.4%)'
                  }`
                : 'none',
            }
          },
          badge: (base: React.CSSProperties) => ({
            ...base,
            backgroundColor: '#4f46e5',
          }),
          dot: (
            base: React.CSSProperties,
            { current }: { current?: boolean } = {},
          ) => ({
            ...base,
            backgroundColor: current ? '#4f46e5' : '#a5b4fc',
          }),
          close: (base: React.CSSProperties) => ({
            ...base,
            color: 'var(--foreground)',
            top: 12,
            right: 12,
          }),
          arrow: (base: React.CSSProperties) => ({
            ...base,
            display: 'block',
            color: 'var(--foreground)',
          }),
          maskWrapper: (base: React.CSSProperties) => {
            if (isMobile) {
              return { ...base, color: 'transparent' }
            }
            return base
          },
        }}
        showNavigation={true}
        showCloseButton={true}
      >
        <FamilyTreeComponent {...props} ref={ref} isMobile={isMobile} />
      </TourProvider>
    </ReactFlowProvider>
  )
})

export default FamilyTree
