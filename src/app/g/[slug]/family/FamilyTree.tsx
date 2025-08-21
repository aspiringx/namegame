'use client'

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { FullRelationship, MemberWithUser, UserWithPhotoUrl } from '@/types'
import { buildAdjacencyList } from '@/lib/family-tree'
import AvatarNode from './AvatarNode'

interface FamilyTreeProps {
  relationships: FullRelationship[]
  members: MemberWithUser[]
  currentUser?: UserWithPhotoUrl
}

const nodeTypes = {
  avatar: AvatarNode,
}

type AdjacencyListRelationship = {
  relatedUserId: string
  type: 'parent' | 'child' | 'partner' | 'spouse'
}

const NODE_WIDTH = 150
const NODE_HEIGHT = 200

const FamilyTreeComponent: FC<FamilyTreeProps> = ({
  relationships,
  members,
  currentUser,
}) => {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [focalNodeId, setFocalNodeId] = useState<string | null>(
    currentUser?.id || null,
  )
  const { setCenter, getNodes, getEdges, getViewport, fitView } = useReactFlow()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const allUsersMap = useMemo(() => {
    const map = new Map<string, UserWithPhotoUrl>()
    members.forEach((member) => {
      if (member?.user) {
        map.set(member.userId, {
          ...member.user,
          name: `${member.user.firstName} ${member.user.lastName}`.trim(),
          photoUrl: member.user.photoUrl || undefined,
        })
      }
    })
    relationships.forEach((rel: FullRelationship) => {
      ;[rel.user1, rel.user2].forEach((user) => {
        if (user && !map.has(user.id)) {
          const userWithPhoto = user as UserWithPhotoUrl
          map.set(user.id, {
            ...user,
            name: `${user.firstName} ${user.lastName}`.trim(),
            photoUrl: userWithPhoto.photoUrl || undefined,
          })
        }
      })
    })
    return map
  }, [members, relationships])

  const adjacencyList = useMemo(() => {
    if (!currentUser) return new Map()
    return buildAdjacencyList(relationships, members, currentUser)
  }, [relationships, members, currentUser])

  const ancestors = useMemo(() => {
    if (!focalNodeId || !currentUser) return new Set<string>()

    const ancestorSet = new Set<string>()
    const queue = [focalNodeId]
    const visited = new Set<string>([focalNodeId])

    while (queue.length > 0) {
      const currentId = queue.shift()!
      const relations = adjacencyList.get(currentId) || []
      const parents = relations
        .filter((r: { type: string }) => r.type === 'parent')
        .map((r: { relatedUserId: string }) => r.relatedUserId)

      for (const parentId of parents) {
        if (!visited.has(parentId)) {
          ancestorSet.add(parentId)
          visited.add(parentId)
          queue.push(parentId)
        }
      }
    }
    return ancestorSet
  }, [focalNodeId, adjacencyList])

  const descendants = useMemo(() => {
    if (!focalNodeId || !currentUser) return new Set<string>()

    const descendantSet = new Set<string>()
    const queue = [focalNodeId]
    const visited = new Set<string>([focalNodeId])

    while (queue.length > 0) {
      const currentId = queue.shift()!
      const relations = adjacencyList.get(currentId) || []
      const children = relations
        .filter((r: { type: string }) => r.type === 'child')
        .map((r: { relatedUserId: string }) => r.relatedUserId)

      for (const childId of children) {
        if (!visited.has(childId)) {
          descendantSet.add(childId)
          visited.add(childId)
          queue.push(childId)
        }
      }
    }
    return descendantSet
  }, [focalNodeId, adjacencyList])

  const [nodeToCenter, setNodeToCenter] = useState<{
    id: string
    direction: 'up' | 'down' | 'left' | 'right'
    isCollapse?: boolean
    sourceNodeId?: string
  } | null>(null)

  const buildNodeDataRef = useRef<
    ((user: UserWithPhotoUrl, allNodes: Node[]) => any) | null
  >(null)
  const handleNodeExpandRef = useRef<
    | ((nodeId: string, direction: 'up' | 'down' | 'left' | 'right') => void)
    | null
  >(null)

  const buildNodeData = useCallback(
    (user: UserWithPhotoUrl, allNodes: Node[]) => {
      const relations = adjacencyList.get(user.id) || []

      const parentIds = relations
        .filter((rel: AdjacencyListRelationship) => rel.type === 'parent')
        .map((rel: AdjacencyListRelationship) => rel.relatedUserId)
      const hasUnaddedParents = parentIds.some(
        (id: string) => !allNodes.some((n) => n.id === id),
      )
      const hasVisibleParent = parentIds.some((id: string) =>
        allNodes.some((n) => n.id === id),
      )

      const childrenIds = relations
        .filter((rel: AdjacencyListRelationship) => rel.type === 'child')
        .map((rel: AdjacencyListRelationship) => rel.relatedUserId)
      const hasUnaddedChildren = childrenIds.some(
        (id: string) => !allNodes.some((n) => n.id === id),
      )
      const hasVisibleChild = childrenIds.some((id: string) =>
        allNodes.some((n) => n.id === id),
      )

      const siblingIds = new Set<string>()
      if (parentIds.length > 0) {
        parentIds.forEach((parentId: string) => {
          ;(adjacencyList.get(parentId) || [])
            .filter(
              (rel: AdjacencyListRelationship) => rel.type === 'child' && rel.relatedUserId !== user.id,
            )
            .forEach((rel: AdjacencyListRelationship) => siblingIds.add(rel.relatedUserId))
        })
      }
      const hasSiblings = siblingIds.size > 0


      const showUpArrow =
        hasUnaddedParents || (descendants.has(user.id) && hasVisibleParent)
      const showDownArrow = hasUnaddedChildren || hasVisibleChild

      return {
        ...user,
        isCurrentUser: user.id === currentUser!.id,
        onExpand: (direction: 'up' | 'down' | 'left' | 'right') =>
          handleNodeExpandRef.current!(user.id, direction),
        canExpandUp: showUpArrow,
        canExpandDown: showDownArrow,
        canExpandHorizontal: hasSiblings,
      }
    },
    [adjacencyList, ancestors, descendants, relationships, members, currentUser],
  )

  const handleNodeExpand = useCallback(
    (nodeId: string, direction: 'up' | 'down' | 'left' | 'right') => {
      if (!currentUser) return

      const sourceNode = getNodes().find((n) => n.id === nodeId)
      if (!sourceNode) return

      const addRelatives = (
        relatives: UserWithPhotoUrl[],
        position: 'above' | 'below' | 'side',
        yLevelOverride?: number,
        expansionDirection?: 'left' | 'right',
      ) => {
        const allNodes = getNodes()
        let yLevel = yLevelOverride ?? sourceNode.position.y
        if (position === 'above' && yLevelOverride === undefined) yLevel -= NODE_HEIGHT
        if (position === 'below' && yLevelOverride === undefined) yLevel += NODE_HEIGHT

        const occupiedXPositions = new Set(
          allNodes
            .filter((n) => Math.abs(n.position.y - yLevel) < 10)
            .map((n) => n.position.x),
        )

        const addedNodes: Node[] = []
        const addedEdges: Edge[] = []

        relatives.forEach((relative, index) => {
          if (allNodes.some((n) => n.id === relative.id)) return

          let x: number, y: number
          if (position === 'above' || position === 'below') {
            y = yLevel
            let targetX =
              sourceNode.position.x +
              (index - (relatives.length - 1) / 2) * NODE_WIDTH * 1.5
            while (occupiedXPositions.has(targetX)) {
              targetX += NODE_WIDTH * 1.5 // Simple collision avoidance
            }
            x = targetX
          } else { // 'side'
            y = sourceNode.position.y
            const sign = expansionDirection === 'right' ? 1 : -1

            const siblingNodes = allNodes.filter(
              (n) => Math.abs(n.position.y - y) < 10,
            )
            let lastX = sourceNode.position.x
            if (siblingNodes.length > 0) {
              lastX = siblingNodes.reduce(
                (acc, node) =>
                  sign > 0
                    ? Math.max(acc, node.position.x)
                    : Math.min(acc, node.position.x),
                lastX,
              )
            }

            x = lastX + sign * NODE_WIDTH * 1.2 * (index + 1)
            occupiedXPositions.add(x)
          }

          occupiedXPositions.add(x)

          addedNodes.push({
            id: relative.id,
            type: 'avatar',
            position: { x, y },
            data: {}, // Populated later
            sourcePosition: Position.Top,
            targetPosition: Position.Bottom,
          })

          if (position === 'above') {
            addedEdges.push({
              id: `e-${relative.id}-${sourceNode.id}`,
              source: relative.id,
              target: sourceNode.id,
              type: 'orthogonal',
              sourceHandle: 'bottom-source',
              targetHandle: 'top-target',
            })
          } else if (position === 'below') {
            addedEdges.push({
              id: `e-${sourceNode.id}-${relative.id}`,
              source: sourceNode.id,
              target: relative.id,
              type: 'orthogonal',
              sourceHandle: 'bottom-source',
              targetHandle: 'top-target',
            })
          } else { // 'side'
            addedEdges.push({
              id: `e-${sourceNode.id}-${relative.id}-${direction}`,
              source: sourceNode.id,
              target: relative.id,
              type: 'orthogonal',
              sourceHandle: 'right-source',
              targetHandle: 'left-target',
            })
          }
        })
        return { addedNodes, addedEdges }
      }

      const isDescendant = descendants.has(nodeId)
      const isAncestor = ancestors.has(nodeId)

      // --- COLLAPSE LOGIC --- //
      if ((direction === 'up' && isDescendant) || (direction === 'down' && isAncestor)) {
        const nodesToRemove = new Set<string>()
        const queue: string[] = [nodeId]
        const visited = new Set<string>([nodeId])

        const traversalDirection = direction === 'up' ? 'child' : 'parent'

        while (queue.length > 0) {
          const currentId = queue.shift()!
          nodesToRemove.add(currentId)

          const relations = adjacencyList.get(currentId) || []
          const relatedIds = relations
            .filter((r: AdjacencyListRelationship) => r.type === traversalDirection)
            .map((r: AdjacencyListRelationship) => r.relatedUserId)

          for (const id of relatedIds) {
            if (!visited.has(id)) {
              visited.add(id)
              queue.push(id)
            }
          }
        }

        if (nodesToRemove.size > 0) {
          let nodeToCenterAfterCollapse: string | null = null
          if (direction === 'up') {
            const parentIds = (adjacencyList.get(nodeId) || []).filter((r: AdjacencyListRelationship) => r.type === 'parent').map((r: AdjacencyListRelationship) => r.relatedUserId)
            if (parentIds.length > 0) nodeToCenterAfterCollapse = parentIds[0]
          } else {
            nodeToCenterAfterCollapse = nodeId
          }

          setNodes((currentNodes) => {
            const remainingNodes = currentNodes.filter((n) => !nodesToRemove.has(n.id))
            return remainingNodes.map((n) => ({
              ...n,
              data: buildNodeData(allUsersMap.get(n.id)!, remainingNodes),
            }))
          })
          setEdges((eds) => eds.filter((e) => !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target)))

          if (nodeToCenterAfterCollapse) {
            setNodeToCenter({ id: nodeToCenterAfterCollapse, direction, isCollapse: true })
          }
        }
        return // Collapse action is final
      }

      // --- EXPANSION LOGIC --- //
      let newNodes: Node[] = []
      let newEdges: Edge[] = []

      if (direction === 'up') {
        const relations = adjacencyList.get(nodeId) || []
        const parentRels = relations.filter((rel: AdjacencyListRelationship) => rel.type === 'parent')
        const childrenRels = relations.filter((rel: AdjacencyListRelationship) => rel.type === 'child')
        const spouseRels = relations.filter(
          (rel: AdjacencyListRelationship) => rel.type === 'spouse' || rel.type === 'partner',
        )

        const hasParents = parentRels.length > 0
        const hasChildren = childrenRels.length > 0
        const hasSpouses = spouseRels.length > 0

        if (hasParents) {
          const parentUsers = parentRels
            .map((rel: AdjacencyListRelationship) => allUsersMap.get(rel.relatedUserId))
            .filter((u: UserWithPhotoUrl | undefined): u is UserWithPhotoUrl => !!u)
          const { addedNodes, addedEdges } = addRelatives(parentUsers, 'above')
          newNodes.push(...addedNodes)
          newEdges.push(...addedEdges)
        }
      }

      if (direction === 'down') {
        if (nodeId !== focalNodeId) {
          setFocalNodeId(nodeId)
          return
        }
        const relations = adjacencyList.get(nodeId) || []
        const childrenToAdd = relations
          .filter((rel: AdjacencyListRelationship) => rel.type === 'child' && !getNodes().some((n) => n.id === rel.relatedUserId))
          .map((rel: AdjacencyListRelationship) => allUsersMap.get(rel.relatedUserId))
          .filter((u: UserWithPhotoUrl | undefined): u is UserWithPhotoUrl => !!u)

        const spousesToAdd = relations
          .filter((rel: AdjacencyListRelationship) => (rel.type === 'spouse' || rel.type === 'partner') && !getNodes().some((n) => n.id === rel.relatedUserId))
          .map((rel: AdjacencyListRelationship) => allUsersMap.get(rel.relatedUserId))
          .filter((u: UserWithPhotoUrl | undefined): u is UserWithPhotoUrl => !!u)

        if (childrenToAdd.length > 0) {
          const { addedNodes, addedEdges } = addRelatives(childrenToAdd, 'below')
          newNodes.push(...addedNodes)
          newEdges.push(...addedEdges)
        }
        if (spousesToAdd.length > 0) {
          const { addedNodes, addedEdges } = addRelatives(spousesToAdd, 'side', undefined, 'right')
          newNodes.push(...addedNodes)
          newEdges.push(...addedEdges)
        }
      }

      if (direction === 'left' || direction === 'right') {
        const parentIds = (adjacencyList.get(nodeId) || []).filter((r: AdjacencyListRelationship) => r.type === 'parent').map((r: AdjacencyListRelationship) => r.relatedUserId)
        const siblingIds = new Set<string>()
        parentIds.forEach((parentId: string) => {
          (adjacencyList.get(parentId) || []).forEach((rel: AdjacencyListRelationship) => {
            if (rel.type === 'child' && rel.relatedUserId !== nodeId) {
              siblingIds.add(rel.relatedUserId)
            }
          })
        })

        const existingNodeIds = new Set(getNodes().map((n) => n.id))
        const siblingsToAdd = Array.from(siblingIds)
          .filter((id) => !existingNodeIds.has(id))
          .map((id: string) => allUsersMap.get(id))
          .filter((u: UserWithPhotoUrl | undefined): u is UserWithPhotoUrl => !!u)

        if (siblingsToAdd.length > 0) {
          const { addedNodes, addedEdges } = addRelatives(siblingsToAdd, 'side', undefined, direction)
          newNodes.push(...addedNodes)
          newEdges.push(...addedEdges)
        }
      }

      if (newNodes.length > 0) {
        setNodes((nds) => {
          const allNodes = [...nds, ...newNodes]
          return allNodes.map((n) => ({
            ...n,
            data: buildNodeData(allUsersMap.get(n.id)!, allNodes),
          }))
        })
        setEdges((eds) => [...eds, ...newEdges])

        if (direction === 'up') {
          setNodeToCenter({ id: nodeId, direction: 'up', sourceNodeId: nodeId })
        } else {
          setNodeToCenter({ id: nodeId, direction })
        }
      } else {
        // If no nodes were added, still might need to update data (e.g. arrows)
        setNodes(currentNodes => currentNodes.map(n => ({...n, data: buildNodeData(allUsersMap.get(n.id)!, currentNodes)})))
      }
    },
    [currentUser, getNodes, setEdges, setNodes, allUsersMap, buildNodeData, fitView, focalNodeId, ancestors, descendants, adjacencyList],
  )

  useEffect(() => {
    buildNodeDataRef.current = buildNodeData
    handleNodeExpandRef.current = handleNodeExpand
  }, [buildNodeData, handleNodeExpand])

  useEffect(() => {
    if (!focalNodeId || !currentUser) return

    const focalUser = allUsersMap.get(focalNodeId);
    if (!focalUser) return;

    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];
    const addedIds = new Set<string>();

    // 1. Add the focal node
    initialNodes.push({
      id: focalUser.id,
      type: 'avatar',
      position: { x: 0, y: 0 },
      data: {}, // will be populated later
      sourcePosition: Position.Top,
      targetPosition: Position.Bottom,
    });
    addedIds.add(focalUser.id);

    const relations = adjacencyList.get(focalUser.id) || [];

    // 2. Add parents
    const parents = relations
      .filter((r: AdjacencyListRelationship) => r.type === 'parent')
      .map((r: AdjacencyListRelationship) => allUsersMap.get(r.relatedUserId))
      .filter((p: UserWithPhotoUrl | undefined): p is UserWithPhotoUrl => !!p && !addedIds.has(p.id));

    parents.forEach((parent: UserWithPhotoUrl, index: number) => {
      const x = (index - (parents.length - 1) / 2) * NODE_WIDTH * 1.5;
      initialNodes.push({
        id: parent.id,
        type: 'avatar',
        position: { x, y: -NODE_HEIGHT },
        data: {},
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      });
      addedIds.add(parent.id);
      initialEdges.push({
        id: `e-${parent.id}-${focalUser.id}`,
        source: parent.id,
        target: focalUser.id,
        type: 'orthogonal',
        sourceHandle: 'bottom-source',
        targetHandle: 'top-target',
      });
    });

    // 3. Add children
    const children = relations
      .filter((r: AdjacencyListRelationship) => r.type === 'child')
      .map((r: AdjacencyListRelationship) => allUsersMap.get(r.relatedUserId))
      .filter((c: UserWithPhotoUrl | undefined): c is UserWithPhotoUrl => !!c && !addedIds.has(c.id));

    children.forEach((child: UserWithPhotoUrl, index: number) => {
      const x = (index - (children.length - 1) / 2) * NODE_WIDTH * 1.5;
      initialNodes.push({
        id: child.id,
        type: 'avatar',
        position: { x, y: NODE_HEIGHT },
        data: {},
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      });
      addedIds.add(child.id);
      initialEdges.push({
        id: `e-${focalUser.id}-${child.id}`,
        source: focalUser.id,
        target: child.id,
        type: 'orthogonal',
        sourceHandle: 'bottom-source',
        targetHandle: 'top-target',
      });
    });

    // 4. Add spouses/partners
    const spouses = relations
      .filter((r: AdjacencyListRelationship) => r.type === 'partner' || r.type === 'spouse')
      .map((r: AdjacencyListRelationship) => allUsersMap.get(r.relatedUserId))
      .filter((s: UserWithPhotoUrl | undefined): s is UserWithPhotoUrl => !!s && !addedIds.has(s.id));

    spouses.forEach((spouse: UserWithPhotoUrl, index: number) => {
      const x = (index + 1) * NODE_WIDTH * 1.5;
      initialNodes.push({
        id: spouse.id,
        type: 'avatar',
        position: { x, y: 0 },
        data: {},
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      });
      addedIds.add(spouse.id);
      initialEdges.push({
        id: `e-${focalUser.id}-${spouse.id}`,
        source: focalUser.id,
        target: spouse.id,
        type: 'orthogonal',
        sourceHandle: 'right-source',
        targetHandle: 'left-target',
      });
    });

    // Finalize data for all nodes
    const finalInitialNodes = initialNodes.map((n) => ({
      ...n,
      data: buildNodeData(allUsersMap.get(n.id)!, initialNodes),
    }));

    setNodes(finalInitialNodes);
    setEdges(initialEdges);

    // Center on the new focal node
    setTimeout(() => fitView({ duration: 800 }), 100);
  }, [focalNodeId, buildNodeData, allUsersMap, fitView, adjacencyList, currentUser])

  useEffect(() => {
    if (!nodeToCenter) return

    const checkAndCenter = () => {
      const node = getNodes().find((n) => n.id === nodeToCenter.id)
      if (node && node.width && node.height) {
        const x = node.position.x + node.width / 2
        let y = node.position.y
        const zoom = getViewport().zoom

        const sourceNode = getNodes().find((n) => n.id === nodeToCenter.sourceNodeId);

        if (nodeToCenter.isCollapse) {
          // For collapse, center on the node that remains visible.
          y = node.position.y + node.height / 2;
        } else { // Handle expansion centering
          if (nodeToCenter.direction === 'up' && sourceNode && sourceNode.id === nodeToCenter.id) {
            // Ancestor expansion: center between the source node and its new parents.
            const parentNodeRelations = (adjacencyList.get(sourceNode.id) || []).filter((rel: AdjacencyListRelationship) => rel.type === 'parent');
            const parentNodes = getNodes().filter(n => parentNodeRelations.some((rel: AdjacencyListRelationship) => rel.relatedUserId === n.id));

            if (parentNodes.length > 0 && sourceNode.width && sourceNode.height && parentNodes[0].height) {
              const avgParentY = parentNodes.reduce((acc, p) => acc + p.position.y, 0) / parentNodes.length;
              y = (avgParentY + parentNodes[0].height / 2 + sourceNode.position.y + sourceNode.height / 2) / 2;
            } else {
              requestAnimationFrame(checkAndCenter); // Wait for nodes
              return;
            }
          } else if (sourceNode?.width && sourceNode?.height) {
            // For descendant and horizontal expansions, center on the source node.
            y = sourceNode.position.y + sourceNode.height / 2;
          } else {
            // If we are here, it means a node required for centering is not ready. Poll again.
            requestAnimationFrame(checkAndCenter);
            return; // Exit to avoid setting center prematurely
          }
        }

        setCenter(x, y, { zoom: 1.2, duration: 800 })
        setNodeToCenter(null)
      } else {
        requestAnimationFrame(checkAndCenter)
      }
    }
    requestAnimationFrame(checkAndCenter)
  }, [getNodes, getViewport, setCenter, nodeToCenter, adjacencyList])

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
