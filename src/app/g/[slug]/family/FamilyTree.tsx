'use client'

import {
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
} from 'react'
import { useReactFlow } from 'reactflow'
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { MemberWithUser, UserWithPhotoUrl, FullRelationship } from '@/types'
import AvatarNode from './AvatarNode'
import { MemberDetailsModal } from './MemberDetailsModal'
import { useFamilyTree, AvatarNodeData } from './useFamilyTree'

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
    const { fitView, zoomTo } = useReactFlow()

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
        <div style={{ width: '100%', height: '100%' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
            style={{ background: 'transparent' }}
            onNodeClick={handleNodeClick}
          >
            <Controls />
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
