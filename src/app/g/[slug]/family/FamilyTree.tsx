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
import { getRelationship, buildAdjacencyList } from '@/lib/family-tree'
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
    relationships.forEach((rel) => {
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

  const ancestors = useMemo(() => {
    if (!focalNodeId || !currentUser) return new Set<string>()

    const ancestorSet = new Set<string>()
    const queue = [focalNodeId]
    const visited = new Set<string>([focalNodeId])
    const adjacencyList = buildAdjacencyList(
      relationships,
      members,
      currentUser,
    )

    while (queue.length > 0) {
      const currentId = queue.shift()!
      const relations = adjacencyList.get(currentId) || []
      const parents = relations
        .filter((r) => r.type === 'parent')
        .map((r) => r.relatedUserId)

      for (const parentId of parents) {
        if (!visited.has(parentId)) {
          ancestorSet.add(parentId)
          visited.add(parentId)
          queue.push(parentId)
        }
      }
    }
    return ancestorSet
  }, [focalNodeId, relationships, members, currentUser])

  const descendants = useMemo(() => {
    if (!focalNodeId || !currentUser) return new Set<string>()

    const descendantSet = new Set<string>()
    const queue = [focalNodeId]
    const visited = new Set<string>([focalNodeId])
    const adjacencyList = buildAdjacencyList(
      relationships,
      members,
      currentUser,
    )

    while (queue.length > 0) {
      const currentId = queue.shift()!
      const relations = adjacencyList.get(currentId) || []
      const children = relations
        .filter((r) => r.type === 'child')
        .map((r) => r.relatedUserId)

      for (const childId of children) {
        if (!visited.has(childId)) {
          descendantSet.add(childId)
          visited.add(childId)
          queue.push(childId)
        }
      }
    }
    return descendantSet
  }, [focalNodeId, relationships, members, currentUser])

  const [nodeToCenter, setNodeToCenter] = useState<{
    id: string
    direction: 'up' | 'down' | 'left' | 'right'
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
      const adjacencyList = buildAdjacencyList(
        relationships,
        members,
        currentUser!,
      )
      const relations = adjacencyList.get(user.id) || []

      const parentIds = relations
        .filter((rel) => rel.type === 'parent')
        .map((rel) => rel.relatedUserId)
      const hasUnaddedParents = parentIds.some(
        (id) => !allNodes.some((n) => n.id === id),
      )
      const hasVisibleParent = parentIds.some((id) =>
        allNodes.some((n) => n.id === id),
      )

      const childrenIds = relations
        .filter((rel) => rel.type === 'child')
        .map((rel) => rel.relatedUserId)
      const hasUnaddedChildren = childrenIds.some(
        (id) => !allNodes.some((n) => n.id === id),
      )
      const hasVisibleChild = childrenIds.some((id) =>
        allNodes.some((n) => n.id === id),
      )

      const siblingIds = new Set<string>()
      if (parentIds.length > 0) {
        parentIds.forEach((parentId) => {
          ;(adjacencyList.get(parentId) || [])
            .filter(
              (rel) => rel.type === 'child' && rel.relatedUserId !== user.id,
            )
            .forEach((rel) => siblingIds.add(rel.relatedUserId))
        })
      }
      const hasSiblings = siblingIds.size > 0

      const relationship = getRelationship(
        currentUser!.id,
        user.id,
        relationships,
        members,
        new Map(members.map((m) => [m.user.id, m.user])),
      )?.relationship

      const showUpArrow =
        hasUnaddedParents || (descendants.has(user.id) && hasVisibleParent)
      const showDownArrow = hasUnaddedChildren || hasVisibleChild

      return {
        ...user,
        isCurrentUser: user.id === currentUser!.id,
        relationship,
        onExpand: (direction: 'up' | 'down' | 'left' | 'right') =>
          handleNodeExpandRef.current!(user.id, direction),
        canExpandUp: showUpArrow,
        canExpandDown: showDownArrow,
        canExpandHorizontal: hasSiblings,
      }
    },
    [members, relationships, currentUser, ancestors, descendants],
  )

  const handleNodeExpand = useCallback(
    (nodeId: string, direction: 'up' | 'down' | 'left' | 'right') => {
      if (!currentUser) return

      const sourceNode = getNodes().find((n) => n.id === nodeId)
      if (!sourceNode) return

      let newNodes: Node[] = []
      let newEdges: Edge[] = []

      const addRelatives = (
        relatives: UserWithPhotoUrl[],
        position: 'above' | 'below' | 'side',
      ) => {
        const allNodes = getNodes()
        let yLevel
        if (position === 'above') {
          yLevel = sourceNode.position.y - NODE_HEIGHT
        } else if (position === 'below') {
          yLevel = sourceNode.position.y + NODE_HEIGHT
        } else {
          // side
          yLevel = sourceNode.position.y
        }

        const occupiedXPositions = new Set(
          allNodes
            .filter((n) => Math.abs(n.position.y - yLevel) < 10)
            .map((n) => n.position.x),
        )

        relatives.forEach((relative, index) => {
          if (allNodes.some((n) => n.id === relative.id)) return

          let x: number, y: number
          if (position === 'above' || position === 'below') {
            y = yLevel
            let targetX =
              sourceNode.position.x +
              (index - (relatives.length - 1) / 2) * NODE_WIDTH * 1.5
            let offset = 0
            while (occupiedXPositions.has(targetX)) {
              offset += NODE_WIDTH * 1.5
              targetX =
                sourceNode.position.x +
                (index - (relatives.length - 1) / 2) * NODE_WIDTH * 1.5 +
                offset
            }
            x = targetX
          } else {
            // side
            y = sourceNode.position.y
            const sign = direction === 'right' ? 1 : -1
            let lastX = sourceNode.position.x

            // Find the outermost node on the side we're adding to
            allNodes
              .filter(
                (n) =>
                  Math.abs(n.position.y - y) < 10 &&
                  sign * n.position.x > sign * sourceNode.position.x,
              )
              .forEach((n) => {
                if (sign * n.position.x > sign * lastX) {
                  lastX = n.position.x
                }
              })

            let targetX = lastX + sign * NODE_WIDTH * 1.5
            while (occupiedXPositions.has(targetX)) {
              targetX += sign * NODE_WIDTH * 1.5
            }
            x = targetX
          }

          occupiedXPositions.add(x)

          newNodes.push({
            id: relative.id,
            type: 'avatar',
            position: { x, y },
            data: {}, // Will be populated later
            sourcePosition: Position.Top,
            targetPosition: Position.Bottom,
          })

          if (position === 'above') {
            newEdges.push({
              id: `e-${relative.id}-${sourceNode.id}`,
              source: relative.id,
              target: sourceNode.id,
              type: 'orthogonal',
              sourceHandle: 'bottom-source',
              targetHandle: 'top-target',
            })
          } else if (position === 'below') {
            newEdges.push({
              id: `e-${sourceNode.id}-${relative.id}`,
              source: sourceNode.id,
              target: relative.id,
              type: 'orthogonal',
              sourceHandle: 'bottom-source',
              targetHandle: 'top-target',
            })
          } else {
            // side - edges for siblings are handled separately
          }
        })
      }

      const adjacencyList = buildAdjacencyList(
        relationships,
        members,
        currentUser,
      )
      const relations = adjacencyList.get(nodeId) || []
      const allNodes = getNodes()

      if (direction === 'down' && nodeId !== focalNodeId) {
        setFocalNodeId(nodeId)
        return
      }

      if (direction === 'up') {
        if (nodeId !== focalNodeId) {
          setFocalNodeId(nodeId)
          return
        } else {
          // If the node is already the focal node, add its parents
          const parentIds = relations
            .filter((rel) => rel.type === 'parent')
            .map((rel) => rel.relatedUserId)
            .filter((id) => !allNodes.some((n) => n.id === id))
          if (parentIds.length > 0) {
            const parentUsers = parentIds
              .map((id) => allUsersMap.get(id))
              .filter((u): u is UserWithPhotoUrl => !!u)
            addRelatives(parentUsers, 'above')
          }
        }
      } else if (direction === 'down') {
        // Remove any visible siblings of the current node
        const parentIds = relations
          .filter((rel) => rel.type === 'parent')
          .map((rel) => rel.relatedUserId)

        const siblingIds = new Set<string>()
        if (parentIds.length > 0) {
          parentIds.forEach((parentId) => {
            ;(adjacencyList.get(parentId) || [])
              .filter((rel) => rel.type === 'child' && rel.relatedUserId !== nodeId)
              .forEach((rel) => siblingIds.add(rel.relatedUserId))
          })
        }

        const nodesToRemove = new Set<string>()
        getNodes().forEach((n) => {
          if (siblingIds.has(n.id)) {
            nodesToRemove.add(n.id)
          }
        })

        if (nodesToRemove.size > 0) {
          setNodes((nds) => nds.filter((n) => !nodesToRemove.has(n.id)))
          setEdges((eds) =>
            eds.filter(
              (e) =>
                !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target),
            ),
          )
        }

        // Add children
        const childrenIds = relations
          .filter((rel) => rel.type === 'child')
          .map((rel) => rel.relatedUserId)
          .filter((id) => !getNodes().some((n) => n.id === id))

        if (childrenIds.length > 0) {
          const childrenUsers = childrenIds
            .map((id) => allUsersMap.get(id))
            .filter((u): u is UserWithPhotoUrl => !!u)
          addRelatives(childrenUsers, 'below')
        }
      } else if (direction === 'left' || direction === 'right') {
        // 1. Hide descendants and spouse/partner of the source node
        const nodesToRemove = new Set<string>()
        const queue = [nodeId]
        const visited = new Set<string>() // Don't start with nodeId, we want to check its children

        while (queue.length > 0) {
          const currentId = queue.shift()!
          if (visited.has(currentId)) continue
          visited.add(currentId)

          const childRelations = (adjacencyList.get(currentId) || []).filter(
            (r) => r.type === 'child',
          )

          for (const rel of childRelations) {
            const childId = rel.relatedUserId
            if (allNodes.some((n) => n.id === childId)) {
              nodesToRemove.add(childId)
              queue.push(childId)
            }
          }
        }

        const partnerRelations = relations.filter(
          (r) => r.type === 'partner' || r.type === 'spouse',
        )
        for (const rel of partnerRelations) {
          if (allNodes.some((n) => n.id === rel.relatedUserId)) {
            nodesToRemove.add(rel.relatedUserId)
          }
        }

        let intermediateNodes = getNodes()
        if (nodesToRemove.size > 0) {
          intermediateNodes = intermediateNodes.filter(
            (n) => !nodesToRemove.has(n.id),
          )
          setNodes(intermediateNodes)
          setEdges((eds) =>
            eds.filter(
              (e) =>
                !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target),
            ),
          )
        }

        // 2. Show siblings
        const parentIds = relations
          .filter((rel) => rel.type === 'parent')
          .map((rel) => rel.relatedUserId)

        if (parentIds.length > 0) {
          const siblingIds = new Set<string>()
          parentIds.forEach((parentId: string) => {
            ;(adjacencyList.get(parentId) || []).forEach((rel) => {
              if (rel.type === 'child' && rel.relatedUserId !== nodeId) {
                siblingIds.add(rel.relatedUserId)
              }
            })
          })

          const unaddedSiblings = Array.from(siblingIds)
            .filter((id) => !intermediateNodes.some((n) => n.id === id))
            .map((id) => allUsersMap.get(id))
            .filter((u): u is UserWithPhotoUrl => !!u)

          if (unaddedSiblings.length > 0) {
            addRelatives(unaddedSiblings, 'side')
          }

          // 3. Ensure parents are visible and connected
          const visibleParent = allNodes.find((n) => parentIds.includes(n.id))
          if (visibleParent) {
            const allSiblingUsers = Array.from(siblingIds)
              .map((id) => allUsersMap.get(id))
              .filter((u): u is UserWithPhotoUrl => !!u)

            const siblingEdges: Edge[] = []
            allSiblingUsers.forEach((sibling) => {
              siblingEdges.push({
                id: `e-${visibleParent.id}-${sibling.id}`,
                source: visibleParent.id,
                target: sibling.id,
                type: 'orthogonal',
                sourceHandle: 'bottom-source',
                targetHandle: 'top-target',
              })
            })

            setEdges((eds) => {
              const siblingIdsWithSource = new Set(
                Array.from(siblingIds).concat(nodeId),
              )
              const filteredEdges = eds.filter(
                (e) =>
                  !(e.source === visibleParent.id && siblingIdsWithSource.has(e.target)),
              )
              return [...filteredEdges, ...siblingEdges]
            })
          }
        }
        setFocalNodeId(nodeId)
      }

      // This check is now important because setFocalNodeId can cause a re-render
      // without new nodes being added in this function.
      if (newNodes.length === 0 && direction !== 'left' && direction !== 'right')
        return

      setNodes((nds) => {
        const finalNodes = nds.concat(newNodes)
        return finalNodes.map((n) => ({
          ...n,
          data: buildNodeDataRef.current!(
            allUsersMap.get(n.id)!,
            finalNodes,
          ),
        }))
      })

      if (direction === 'up' || direction === 'down') {
        setEdges((eds) => eds.concat(newEdges))
      }

      setNodeToCenter({ id: nodeId, direction })
    },
    [currentUser, getNodes, members, relationships, setEdges, setNodes, ancestors, descendants, allUsersMap],
  )

  useEffect(() => {
    buildNodeDataRef.current = buildNodeData
    handleNodeExpandRef.current = handleNodeExpand
  }, [buildNodeData, handleNodeExpand])

  useEffect(() => {
    if (!focalNodeId || !currentUser) return

    const focalUser = allUsersMap.get(focalNodeId)
    if (!focalUser) return

    const initialNodes: Node[] = []
    const initialEdges: Edge[] = []
    const addedIds = new Set<string>()

    // 1. Add the focal node
    initialNodes.push({
      id: focalUser.id,
      type: 'avatar',
      position: { x: 0, y: 0 },
      data: {},
      sourcePosition: Position.Top,
      targetPosition: Position.Bottom,
    })
    addedIds.add(focalUser.id)

    const adjacencyList = buildAdjacencyList(
      relationships,
      members,
      currentUser,
    )
    const relations = adjacencyList.get(focalUser.id) || []

    // 2. Add parents
    const parents = relations
      .filter((r) => r.type === 'parent')
      .map((r) => allUsersMap.get(r.relatedUserId))
      .filter((p): p is UserWithPhotoUrl => !!p && !addedIds.has(p.id))

    parents.forEach((parent, index) => {
      const x = (index - (parents.length - 1) / 2) * NODE_WIDTH * 1.5
      initialNodes.push({
        id: parent.id,
        type: 'avatar',
        position: { x, y: -NODE_HEIGHT },
        data: {},
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      })
      addedIds.add(parent.id)
      initialEdges.push({
        id: `e-${parent.id}-${focalUser.id}`,
        source: parent.id,
        target: focalUser.id,
        type: 'orthogonal',
        sourceHandle: 'bottom-source',
        targetHandle: 'top-target',
      })
    })

    // 3. Add children
    const children = relations
      .filter((r) => r.type === 'child')
      .map((r) => allUsersMap.get(r.relatedUserId))
      .filter((c): c is UserWithPhotoUrl => !!c && !addedIds.has(c.id))

    children.forEach((child, index) => {
      const x = (index - (children.length - 1) / 2) * NODE_WIDTH * 1.5
      initialNodes.push({
        id: child.id,
        type: 'avatar',
        position: { x, y: NODE_HEIGHT },
        data: {},
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      })
      addedIds.add(child.id)
      initialEdges.push({
        id: `e-${focalUser.id}-${child.id}`,
        source: focalUser.id,
        target: child.id,
        type: 'orthogonal',
        sourceHandle: 'bottom-source',
        targetHandle: 'top-target',
      })
    })

    // 4. Add spouses/partners
    const spouses = relations
      .filter((r) => r.type === 'partner' || r.type === 'spouse')
      .map((r) => allUsersMap.get(r.relatedUserId))
      .filter((s): s is UserWithPhotoUrl => !!s && !addedIds.has(s.id))

    spouses.forEach((spouse, index) => {
      const x = (index + 1) * NODE_WIDTH * 1.5
      initialNodes.push({
        id: spouse.id,
        type: 'avatar',
        position: { x, y: 0 },
        data: {},
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      })
      addedIds.add(spouse.id)
      initialEdges.push({
        id: `e-${focalUser.id}-${spouse.id}`,
        source: focalUser.id,
        target: spouse.id,
        type: 'orthogonal',
        sourceHandle: 'right-source',
        targetHandle: 'left-target',
      })
    })

    // Finalize data for all nodes
    const finalInitialNodes = initialNodes.map((n) => ({
      ...n,
      data: buildNodeData(allUsersMap.get(n.id)!, initialNodes),
    }))

    setNodes(finalInitialNodes)
    setEdges(initialEdges)

    // Center on the new focal node
    setTimeout(() => fitView({ duration: 800 }), 100)
  }, [focalNodeId, relationships, members, currentUser, buildNodeData, allUsersMap, fitView])

  useEffect(() => {
    if (!nodeToCenter) return

    const checkAndCenter = () => {
      const node = getNodes().find((n) => n.id === nodeToCenter.id)
      if (node && node.width && node.height) {
        const x = node.position.x + node.width / 2
        let y = node.position.y + node.height / 2
        const zoom = getViewport().zoom

        if (nodeToCenter.direction === 'up') {
          y -= NODE_HEIGHT * 0.75
        } else if (nodeToCenter.direction === 'down') {
          y += NODE_HEIGHT * 0.75
        }

        const isMobile = window.innerWidth < 768
        if (isMobile) {
          if (nodeToCenter.direction === 'up') y -= node.height * 0.75
          if (nodeToCenter.direction === 'down') y += node.height * 0.75
        }

        setCenter(x, y, { zoom: 1.2, duration: 800 })
        setNodeToCenter(null)
      } else {
        requestAnimationFrame(checkAndCenter)
      }
    }
    requestAnimationFrame(checkAndCenter)
  })

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
