'use client'

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Position,
  useReactFlow,
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

const FamilyTree: FC<FamilyTreeProps> = ({
  relationships,
  members,
  currentUser,
}) => {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
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
    if (!currentUser) return new Set<string>()

    const ancestorSet = new Set<string>()
    const queue = [currentUser.id]
    const visited = new Set<string>([currentUser.id])
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
  }, [relationships, members, currentUser])

  const descendants = useMemo(() => {
    if (!currentUser) return new Set<string>()

    const descendantSet = new Set<string>()
    const queue = [currentUser.id]
    const visited = new Set<string>([currentUser.id])
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
  }, [relationships, members, currentUser])

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
      const hasUnaddedSiblings = Array.from(siblingIds).some(
        (id) => !allNodes.some((n) => n.id === id),
      )

      const relationship = getRelationship(
        currentUser!.id,
        user.id,
        relationships,
        members,
        new Map(members.map((m) => [m.user.id, m.user])),
      )?.relationship

      const showUpArrow =
        hasUnaddedParents || (descendants.has(user.id) && hasVisibleParent)
      const showDownArrow =
        hasUnaddedChildren || (ancestors.has(user.id) && hasVisibleChild)

      return {
        ...user,
        isCurrentUser: user.id === currentUser!.id,
        relationship,
        onExpand: (direction: 'up' | 'down' | 'left' | 'right') =>
          handleNodeExpandRef.current!(user.id, direction),
        canExpandUp: showUpArrow,
        canExpandDown: showDownArrow,
        canExpandHorizontal: hasUnaddedSiblings,
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
            // side
            const sourceHandle =
              direction === 'right' ? 'right-source' : 'left-source'
            const targetHandle =
              direction === 'right' ? 'left-target' : 'right-target'
            // Find a common parent to draw the edge from
            const adjacencyList = buildAdjacencyList(
              relationships,
              members,
              currentUser,
            )
            const sourceParents = new Set(
              (adjacencyList.get(sourceNode.id) || [])
                .filter((r) => r.type === 'parent')
                .map((r) => r.relatedUserId),
            )
            const relativeParents = new Set(
              (adjacencyList.get(relative.id) || [])
                .filter((r) => r.type === 'parent')
                .map((r) => r.relatedUserId),
            )
            const commonParent = [...sourceParents].find((p) =>
              relativeParents.has(p),
            )

            if (commonParent && allNodes.some((n) => n.id === commonParent)) {
              newEdges.push({
                id: `e-${commonParent}-${relative.id}`,
                source: commonParent,
                target: relative.id,
                type: 'orthogonal',
                sourceHandle: 'bottom-source',
                targetHandle: 'top-target',
              })
            } else {
              // Fallback for no visible common parent
              newEdges.push({
                id: `e-${sourceNode.id}-${relative.id}`,
                source: sourceNode.id,
                target: relative.id,
                type: 'orthogonal',
                sourceHandle,
                targetHandle,
              })
            }
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

      if (direction === 'up') {
        if (descendants.has(nodeId)) {
          const relations = adjacencyList.get(nodeId) || []
          const parentIds = relations
            .filter((rel) => rel.type === 'parent')
            .map((rel) => rel.relatedUserId)
          const visibleParent = allNodes.find((n) => parentIds.includes(n.id))

          if (visibleParent) {
            const nodesToRemove = new Set<string>([nodeId])
            const queue = [nodeId]
            const visited = new Set<string>([nodeId])

            while (queue.length > 0) {
              const currentId = queue.shift()!
              const childRelations = (
                adjacencyList.get(currentId) || []
              ).filter((r) => r.type === 'child')
              for (const rel of childRelations) {
                const childId = rel.relatedUserId
                if (
                  !visited.has(childId) &&
                  allNodes.some((n) => n.id === childId)
                ) {
                  nodesToRemove.add(childId)
                  visited.add(childId)
                  queue.push(childId)
                }
              }
            }

            setNodes((nds) => {
              const newNodes = nds.filter((n) => !nodesToRemove.has(n.id))
              return newNodes.map((n) => {
                if (n.id === visibleParent.id) {
                  return {
                    ...n,
                    data: buildNodeDataRef.current!(
                      allUsersMap.get(n.id)!,
                      newNodes,
                    ),
                  }
                }
                return n
              })
            })
            setEdges((eds) =>
              eds.filter(
                (e) =>
                  !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target),
              ),
            )
            setNodeToCenter({ id: visibleParent.id, direction: 'up' })
            return
          }
        }

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
      } else if (direction === 'down') {
        if (ancestors.has(nodeId)) {
          const relations = adjacencyList.get(nodeId) || []
          const childIds = relations
            .filter((rel) => rel.type === 'child')
            .map((rel) => rel.relatedUserId)
          const allNodes = getNodes()
          const visibleChild = allNodes.find((n) => childIds.includes(n.id))

          if (visibleChild) {
            const nodesToRemove = new Set<string>([nodeId])
            const queue = [nodeId]
            const visited = new Set<string>([nodeId])

            while (queue.length > 0) {
              const currentId = queue.shift()!
              const parentRelations = (
                adjacencyList.get(currentId) || []
              ).filter((r) => r.type === 'parent')
              for (const rel of parentRelations) {
                const parentId = rel.relatedUserId
                if (
                  !visited.has(parentId) &&
                  allNodes.some((n) => n.id === parentId)
                ) {
                  nodesToRemove.add(parentId)
                  visited.add(parentId)
                  queue.push(parentId)
                }
              }
            }

            setNodes((nds) => {
              const newNodes = nds.filter((n) => !nodesToRemove.has(n.id))
              return newNodes.map((n) => {
                if (n.id === visibleChild.id) {
                  return {
                    ...n,
                    data: buildNodeDataRef.current!(
                      allUsersMap.get(n.id)!,
                      newNodes,
                    ),
                  }
                }
                return n
              })
            })
            setEdges((eds) =>
              eds.filter(
                (e) =>
                  !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target),
              ),
            )
            setNodeToCenter({ id: visibleChild.id, direction: 'down' })
            return
          }
        }

        const childrenIds = relations
          .filter((rel) => rel.type === 'child')
          .map((rel) => rel.relatedUserId)
          .filter((id) => !allNodes.some((n) => n.id === id))
        if (childrenIds.length > 0) {
          const childrenUsers = childrenIds
            .map((id) => allUsersMap.get(id))
            .filter((u): u is UserWithPhotoUrl => !!u)
          addRelatives(childrenUsers, 'below')
        }
      } else if (direction === 'left' || direction === 'right') {
        const parentIds = relations
          .filter((rel) => rel.type === 'parent')
          .map((rel) => rel.relatedUserId)
        if (parentIds.length > 0) {
          const siblingIds = new Set<string>()
          parentIds.forEach((parentId: string) => {
            ;(adjacencyList.get(parentId) || [])
              .filter(
                (rel) => rel.type === 'child' && rel.relatedUserId !== nodeId,
              )
              .forEach((rel) => siblingIds.add(rel.relatedUserId))
          })
          const unaddedSiblings = Array.from(siblingIds)
            .filter((id) => !allNodes.some((n) => n.id === id))
            .map((id) => allUsersMap.get(id))
            .filter((u): u is UserWithPhotoUrl => !!u)
          if (unaddedSiblings.length > 0) {
            addRelatives(unaddedSiblings, 'side')
          }
        }
      }

      if (newNodes.length === 0) return

      setNodes((nds) => {
        const finalNodes = nds.concat(newNodes)
        return finalNodes.map((n) => {
          const isNewOrClicked =
            newNodes.some((newNode) => newNode.id === n.id) || n.id === nodeId
          if (isNewOrClicked) {
            return {
              ...n,
              data: buildNodeDataRef.current!(
                allUsersMap.get(n.id)!,
                finalNodes,
              ),
            }
          }
          return n
        })
      })
      setEdges((eds) => eds.concat(newEdges))
      setNodeToCenter({ id: nodeId, direction })
    },
    [getNodes, members, relationships, setEdges, setNodes],
  )

  useEffect(() => {
    buildNodeDataRef.current = buildNodeData
    handleNodeExpandRef.current = handleNodeExpand
  }, [buildNodeData, handleNodeExpand])

  useEffect(() => {
    if (!currentUser) return

    const initialNodes: Node[] = []
    const initialEdges: Edge[] = []
    const addedIds = new Set<string>()

    // ...
    initialNodes.push({
      id: currentUser.id,
      type: 'avatar',
      position: { x: 0, y: 0 },
      data: {},
      sourcePosition: Position.Top,
      targetPosition: Position.Bottom,
    })
    addedIds.add(currentUser.id)

    const adjacencyList = buildAdjacencyList(
      relationships,
      members,
      currentUser,
    )
    const relations = adjacencyList.get(currentUser.id) || []

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
        id: `e-${parent.id}-${currentUser.id}`,
        source: parent.id,
        target: currentUser.id,
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
        id: `e-${currentUser.id}-${child.id}`,
        source: currentUser.id,
        target: child.id,
        type: 'orthogonal',
        sourceHandle: 'bottom-source',
        targetHandle: 'top-target',
      })
    })

    // 4. Add spouses/partners
    const spouses = relations
      .filter((r) => r.type === 'partner')
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
        id: `e-${currentUser.id}-${spouse.id}`,
        source: currentUser.id,
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

    console.log('--- Initial Node Setup ---')
    console.log('CurrentUser:', currentUser)
    console.log('AllUsersMap:', allUsersMap)
    console.log('AdjacencyList:', adjacencyList)
    console.log('Relations for currentUser:', relations)
    console.log('Parents found:', parents)
    console.log('Children found:', children)
    console.log('Spouses found:', spouses)
    console.log('Final Initial Nodes:', finalInitialNodes)
    console.log('Final Initial Edges:', initialEdges)

    setNodes(finalInitialNodes)
    setEdges(initialEdges)
  }, [relationships, members, currentUser, buildNodeData])

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

export default FamilyTree
