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
import ReactFlow, {
  Background,
  ReactFlowProvider,
  Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { MemberWithUser, UserWithPhotoUrl, FullRelationship } from '@/types'
import AvatarNode from './AvatarNode'
import { MemberDetailsModal } from './MemberDetailsModal'
import { useFamilyTree, AvatarNodeData } from './useFamilyTree'
import { useGroup } from '@/components/GroupProvider'
import { FamilyTreeControls } from './FamilyTreeControls'

interface FamilyTreeProps {
  relationships: FullRelationship[]
  members: MemberWithUser[]
  currentUser?: UserWithPhotoUrl
  onIsFocalUserCurrentUserChange?: (isCurrentUser: boolean) => void
  relationshipMap: Map<string, string>
}

const nodeTypes = {
  avatar: AvatarNode,
}

const fitViewOptions = {
  padding: 0.4,
}

const mobileFitViewOptions = {
  padding: 0.2,
}

const FamilyTreeComponent = forwardRef<
  { reset: () => void; setFocalUser: (userId: string) => void },
  FamilyTreeProps
>(
  (
    {
      relationships,
      members,
      currentUser,
      onIsFocalUserCurrentUserChange,
      relationshipMap,
    },
    ref,
  ) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(
      null,
    )
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isFullScreen, setIsFullScreen] = useState(false)
    const { fitView, zoomTo } = useReactFlow()

    const handleExitFullScreen = () => {
      setIsFullScreen(false)
      setTimeout(() => {
        fitView()
      }, 100)
    }

    useEffect(() => {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 768)
      }
      checkIsMobile()
      window.addEventListener('resize', checkIsMobile)
      return () => window.removeEventListener('resize', checkIsMobile)
    }, [])

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
          fitView(fitViewOptions)
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

const FamilyTree = forwardRef<FamilyTreeRef, FamilyTreeProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <FamilyTreeComponent {...props} ref={ref} />
    </ReactFlowProvider>
  )
})

export default FamilyTree
