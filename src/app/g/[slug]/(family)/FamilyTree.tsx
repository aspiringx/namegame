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
import ReactFlow, { ReactFlowProvider, Node } from 'reactflow'
import 'reactflow/dist/style.css'
import { MemberWithUser, UserWithPhotoUrl, FullRelationship } from '@/types'
import AvatarNode from './AvatarNode'
import SmoothFlowEdge from './SmoothFlowEdge';
import { MemberDetailsModal } from './MemberDetailsModal'
import { useFamilyTree, AvatarNodeData } from './useFamilyTree'
import { FamilyTreeControls } from './FamilyTreeControls'

const nodeTypes = {
  avatar: AvatarNode,
}

const edgeTypes = {
  smoothflow: SmoothFlowEdge,
};

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
  relationshipMap: Map<string, { label: string; steps: number }>
  isMobile: boolean
  onOpenRelate?: (member: MemberWithUser) => void
  isGroupAdmin?: boolean
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
      onOpenRelate,
      isGroupAdmin,
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
      const calculateAndSetHeight = () => {
        if (reactFlowWrapper.current) {
          if (isFullScreen) {
            reactFlowWrapper.current.style.height = `${window.innerHeight}px`
          } else {
            const header = document.getElementById('page-header')
            const toolbar = document.getElementById('group-toolbar-container')
            const footer = document.getElementById('page-footer')
            const headerHeight = header ? header.offsetHeight : 0
            const toolbarHeight = toolbar ? toolbar.offsetHeight : 0
            const footerHeight = footer ? footer.offsetHeight : 0
            const availableHeight =
              window.innerHeight - headerHeight - toolbarHeight - footerHeight

            // Apply a margin, e.g., 1rem (16px) on top and bottom
            const margin = 36
            const finalHeight = availableHeight - margin

            reactFlowWrapper.current.style.height = `${finalHeight}px`
          }
        }
      }

      calculateAndSetHeight()

      // Recalculate on resize
      window.addEventListener('resize', calculateAndSetHeight)
      return () => {
        window.removeEventListener('resize', calculateAndSetHeight)
      }
    }, [isFullScreen])

    useImperativeHandle(ref, () => ({
      reset: resetFocalUser,
      setFocalUser: setFocalUser,
    }))

    const handleOpenRelate = (member: MemberWithUser) => {
      setIsModalOpen(false);
      onOpenRelate?.(member);
    };

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
          className={`${isFullScreen ? 'bg-background' : ''}`}
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
              ? relationshipMap.get(selectedMember.userId)?.label
              : undefined
          }
          currentUserId={currentUser?.id}
          onOpenRelate={handleOpenRelate}
          isGroupAdmin={isGroupAdmin}
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
  relationshipMap: Map<string, { label: string; steps: number }>
  onOpenRelate?: (member: MemberWithUser) => void
  isGroupAdmin?: boolean
}

const FamilyTree = forwardRef<FamilyTreeRef, FamilyTreeProps>((props, ref) => {
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

  if (!mounted) {
    return null
  }

  return (
    <ReactFlowProvider>
      <FamilyTreeComponent {...props} ref={ref} isMobile={isMobile} />
    </ReactFlowProvider>
  )
})

export default FamilyTree
