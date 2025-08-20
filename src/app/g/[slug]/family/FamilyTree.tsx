'use client'

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  useReactFlow,
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
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isMiniMapExpanded, setIsMiniMapExpanded] = useState(false)
  const { setCenter, getNodes, getEdges } = useReactFlow();

  const hasUnaddedRelatives = useCallback(
    (personId: string, type: 'parent' | 'child' | 'partner') => {
      const currentNodes = getNodes();
      switch (type) {
        case 'parent':
          return relationships.some(
            (r) =>
              r.user2Id === personId &&
              r.relationType.code === 'parent' &&
              !currentNodes.some((n) => n.id === r.user1Id),
          )
        case 'child':
          return relationships.some(
            (r) =>
              r.user1Id === personId &&
              r.relationType.code === 'parent' &&
              !currentNodes.some((n) => n.id === r.user2Id),
          )
        case 'partner':
          return relationships.some(
            (r) =>
              ((r.user1Id === personId && !currentNodes.some(n => n.id === r.user2Id)) ||
                (r.user2Id === personId && !currentNodes.some(n => n.id === r.user1Id))) &&
              ['spouse', 'partner'].includes(r.relationType.code),
          )
        default:
          return false
      }
    },
    [relationships, getNodes],
  )

  const buildNodeData = useCallback(
    (person: UserWithPhotoUrl) => {
      const relationship = getRelationship(
        currentUser?.id ?? '',
        person.id,
        relationships,
        new Map(members.map((m) => [m.user.id, m.user])),
      )?.relationship

      return {
        label: person.firstName,
        image: person.photoUrl,
        relationship,
        firstName: person.firstName,
        lastName: person.lastName,
        birthDate: person.birthDate,
        birthPlace: person.birthPlace,
        birthDatePrecision: person.birthDatePrecision,
        deathDate: person.deathDate,
        deathPlace: person.deathPlace,
        deathDatePrecision: person.deathDatePrecision,
        canExpandUp: hasUnaddedRelatives(person.id, 'parent'),
        canExpandDown: hasUnaddedRelatives(person.id, 'child'),
        canExpandHorizontal: hasUnaddedRelatives(person.id, 'partner'),
        onExpand: (direction: 'up' | 'down' | 'left' | 'right') =>
          handleNodeExpand(person.id, direction),
      }
    },
    [currentUser, relationships, members, hasUnaddedRelatives],
  )

  useEffect(() => {
    if (!currentUser) return;

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
          ...buildNodeData(person),
          size: isEgo ? 'xlarge' : 'large',
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
        data: buildNodeData(parent),
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
        data: buildNodeData(child),
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

    setNodes(nodes);
    setEdges(edges);
  }, [relationships, members, currentUser, buildNodeData]);

  const handleNodeExpand = useCallback(
    (nodeId: string, direction: 'up' | 'down' | 'left' | 'right') => {
      const sourceNode = getNodes().find((n) => n.id === nodeId);
      if (!sourceNode) return;

      const membersMap = new Map(members.map((m) => [m.userId, m.user]));
      let newNodes: Node[] = [];
      let newEdges: Edge[] = [];

      const addRelatives = (relatives: UserWithPhotoUrl[], position: 'above' | 'below' | 'side') => {
        relatives.forEach((relative, index) => {
          let x, y;
          if (position === 'above') {
            x = sourceNode.position.x + (index - (relatives.length - 1) / 2) * NODE_WIDTH;
            y = sourceNode.position.y - NODE_HEIGHT;
          } else if (position === 'below') {
            x = sourceNode.position.x + (index - (relatives.length - 1) / 2) * NODE_WIDTH;
            y = sourceNode.position.y + NODE_HEIGHT;
          } else { // 'side'
            x = sourceNode.position.x + (index + 1) * NODE_WIDTH * 1.5;
            y = sourceNode.position.y;
          }

          newNodes.push({
            id: relative.id,
            type: 'avatar',
            position: { x, y },
            data: buildNodeData(relative),
          });

          if (position === 'above') {
            newEdges.push({ id: `e-${relative.id}-${nodeId}`, source: relative.id, target: nodeId, type: 'orthogonal', sourceHandle: 'bottom-source', targetHandle: 'top-target' });
          } else if (position === 'below') {
            newEdges.push({ id: `e-${nodeId}-${relative.id}`, source: nodeId, target: relative.id, type: 'orthogonal', sourceHandle: 'bottom-source', targetHandle: 'top-target' });
          } else {
            newEdges.push({ id: `e-${nodeId}-${relative.id}`, source: nodeId, target: relative.id, type: 'orthogonal', sourceHandle: 'right-source', targetHandle: 'left-target' });
          }
        });
      };

      if (direction === 'up') {
        const parents = relationships
          .filter((r) => r.user2Id === nodeId && r.relationType.code === 'parent' && !getNodes().some(n => n.id === r.user1Id))
          .map((r) => membersMap.get(r.user1Id))
          .filter((p): p is UserWithPhotoUrl => !!p);
        addRelatives(parents, 'above');
      } else if (direction === 'down') {
        const children = relationships
          .filter((r) => r.user1Id === nodeId && r.relationType.code === 'parent' && !getNodes().some(n => n.id === r.user2Id))
          .map((r) => membersMap.get(r.user2Id))
          .filter((c): c is UserWithPhotoUrl => !!c);
        addRelatives(children, 'below');
      } else if (direction === 'left' || direction === 'right') {
        const partners = relationships
          .filter(r => ((r.user1Id === nodeId && !getNodes().some(n => n.id === r.user2Id)) || (r.user2Id === nodeId && !getNodes().some(n => n.id === r.user1Id))) && ['spouse', 'partner'].includes(r.relationType.code))
          .map(r => membersMap.get(r.user1Id === nodeId ? r.user2Id : r.user1Id))
          .filter((p): p is UserWithPhotoUrl => !!p);
        addRelatives(partners, 'side');
      }

      setNodes((nds) => nds.map(n => ({ ...n, data: { ...n.data, ...buildNodeData(membersMap.get(n.id)!) } })).concat(newNodes));
      setEdges((eds) => eds.concat(newEdges));

      setTimeout(() => {
        setCenter(sourceNode.position.x, sourceNode.position.y, { zoom: 1.2, duration: 600 });
      }, 100);
    },
    [getNodes, relationships, members, setCenter, buildNodeData]
  );

  return (
    <div
      style={{ height: '70vh', width: '100%' }}
      className="react-flow-wrapper bg-background rounded-md border"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
