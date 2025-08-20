'use client'

import React, { useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { FullRelationship, MemberWithUser, UserWithPhotoUrl } from '@/types'
import { getRelationship } from '@/lib/family-tree'
import AvatarNode from './AvatarNode'

interface FamilyTreeProps {
  relationships: FullRelationship[]
  members: MemberWithUser[]
  currentUser?: UserWithPhotoUrl
}

const nodeTypes = {
  avatar: AvatarNode,
}

const NODE_WIDTH = 150
const NODE_HEIGHT = 200

const FamilyTree: React.FC<FamilyTreeProps> = ({
  relationships,
  members,
  currentUser,
}) => {
  const [isMiniMapExpanded, setIsMiniMapExpanded] = useState(false)

  const elements = useMemo(() => {
    if (!currentUser) return { nodes: [], edges: [] }

    const nodes: Node[] = []
    const edges: Edge[] = []
    const membersMap = new Map(members.map((m) => [m.userId, m.user]))
    const usersMap = new Map(members.map((m) => [m.user.id, m.user]))
    const addedIds = new Set<string>()

    // 1. Identify all partners
    const partners = relationships
      .filter(
        (r) =>
          (r.user1Id === currentUser.id || r.user2Id === currentUser.id) &&
          ['spouse', 'partner'].includes(r.relationType.code),
      )
      .map((r) => {
        const partnerId = r.user1Id === currentUser.id ? r.user2Id : r.user1Id
        return membersMap.get(partnerId)
      })
      .filter((p): p is UserWithPhotoUrl => !!p && !addedIds.has(p.id))

    // 2. Position the central group (ego and partners)
    const centralGroup = [currentUser, ...partners];
    const centralGroupWidth = (centralGroup.length - 1) * NODE_WIDTH * 1.5;
    const startX = -centralGroupWidth / 2;

    let egoXPosition = 0

    centralGroup.forEach((person, index) => {
      const isEgo = person.id === currentUser.id
      const x = startX + index * NODE_WIDTH * 1.5
      if (isEgo) {
        egoXPosition = x
      }

      const relationship = isEgo
        ? 'You'
        : getRelationship(currentUser.id, person.id, relationships, usersMap)
            ?.relationship

      nodes.push({
        id: person.id,
        type: 'avatar',
        position: { x, y: 0 },
        data: {
          label: person.firstName,
          image: person.photoUrl,
          size: isEgo ? 'xlarge' : 'large',
          relationship,
          firstName: person.firstName,
          lastName: person.lastName,
          birthDate: person.birthDate,
          birthPlace: person.birthPlace,
          birthDatePrecision: person.birthDatePrecision,
          deathDate: person.deathDate,
          deathPlace: person.deathPlace,
          deathDatePrecision: person.deathDatePrecision,
        },
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      })
      addedIds.add(person.id)

    })

    // 3. Position parents above the ego
    const parents = relationships
      .filter((r) => r.user2Id === currentUser.id && r.relationType.code === 'parent')
      .map((r) => membersMap.get(r.user1Id))
      .filter((p): p is UserWithPhotoUrl => !!p && !addedIds.has(p.id))

    parents.forEach((parent, index) => {
      const x = egoXPosition + (index - (parents.length - 1) / 2) * NODE_WIDTH
      const relationship = getRelationship(
        currentUser.id,
        parent.id,
        relationships,
        usersMap,
      )?.relationship

      nodes.push({
        id: parent.id,
        type: 'avatar',
        position: { x, y: -NODE_HEIGHT },
        data: {
          label: parent.firstName,
          image: parent.photoUrl,
          relationship,
          firstName: parent.firstName,
          lastName: parent.lastName,
          birthDate: parent.birthDate,
          birthPlace: parent.birthPlace,
          birthDatePrecision: parent.birthDatePrecision,
          deathDate: parent.deathDate,
          deathPlace: parent.deathPlace,
          deathDatePrecision: parent.deathDatePrecision,
        },
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      })
      addedIds.add(parent.id)
    })

    // 4. Position children below the ego
    const children = relationships
      .filter((r) => r.user1Id === currentUser.id && r.relationType.code === 'parent')
      .map((r) => membersMap.get(r.user2Id))
      .filter((c): c is UserWithPhotoUrl => !!c && !addedIds.has(c.id))

    children.forEach((child, index) => {
      const x = egoXPosition + (index - (children.length - 1) / 2) * NODE_WIDTH
      const relationship = getRelationship(
        currentUser.id,
        child.id,
        relationships,
        usersMap,
      )?.relationship

      nodes.push({
        id: child.id,
        type: 'avatar',
        position: { x, y: NODE_HEIGHT },
        data: {
          label: child.firstName,
          image: child.photoUrl,
          relationship,
          firstName: child.firstName,
          lastName: child.lastName,
          birthDate: child.birthDate,
          birthPlace: child.birthPlace,
          birthDatePrecision: child.birthDatePrecision,
          deathDate: child.deathDate,
          deathPlace: child.deathPlace,
          deathDatePrecision: child.deathDatePrecision,
        },
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      })
      addedIds.add(child.id)
    })

    // 5. Create edges based on relationships
    parents.forEach((parent) => {
      edges.push({
        id: `e-${currentUser.id}-${parent.id}`,
        source: currentUser.id,
        target: parent.id,
        sourceHandle: 'top-source',
        targetHandle: 'bottom-target',
        type: 'orthogonal',
      });
    });

    children.forEach((child) => {
      edges.push({
        id: `e-${currentUser.id}-${child.id}`,
        source: currentUser.id,
        target: child.id,
        sourceHandle: 'bottom-source',
        targetHandle: 'top-target',
        type: 'orthogonal',
      });
    });

    partners.forEach((partner) => {
      edges.push({
        id: `e-${currentUser.id}-${partner.id}`,
        source: currentUser.id,
        target: partner.id,
        sourceHandle: 'right-source',
        targetHandle: 'left-target',
        type: 'orthogonal',
      });
    });

    return { nodes, edges }
  }, [relationships, members, currentUser])

  return (
    <div
      style={{ height: '70vh', width: '100%' }}
      className="react-flow-wrapper bg-background rounded-md border"
    >
      <ReactFlow
        nodes={elements.nodes}
        edges={elements.edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <div
          onMouseEnter={() => setIsMiniMapExpanded(true)}
          onMouseLeave={() => setIsMiniMapExpanded(false)}
          onClick={() => setIsMiniMapExpanded(!isMiniMapExpanded)}
          className="absolute bottom-0 right-0 z-10 cursor-pointer"
        >
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            style={{
              height: isMiniMapExpanded ? 150 : 75,
              width: isMiniMapExpanded ? 200 : 100,
              transition: 'all 0.2s ease-in-out',
            }}
          />
        </div>
      </ReactFlow>
    </div>
  )
}

export default FamilyTree
