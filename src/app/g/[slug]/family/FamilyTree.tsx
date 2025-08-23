'use client'

import { FC, useRef } from 'react'
import ReactFlow, { Background, Controls, ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'
import { MemberWithUser, UserWithPhotoUrl, FullRelationship } from '@/types'
import AvatarNode from './AvatarNode'
import { useFamilyTree } from './useFamilyTree'

interface FamilyTreeProps {
  relationships: FullRelationship[]
  members: MemberWithUser[]
  currentUser?: UserWithPhotoUrl
}

const nodeTypes = {
  avatar: AvatarNode,
}

const FamilyTreeComponent: FC<FamilyTreeProps> = ({ relationships, members, currentUser }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { nodes, edges } = useFamilyTree({ relationships, members, currentUser })

  return (
    <div style={{ width: '100%', height: '100%' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}

const FamilyTree: FC<FamilyTreeProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FamilyTreeComponent {...props} />
    </ReactFlowProvider>
  )
}

export default FamilyTree
