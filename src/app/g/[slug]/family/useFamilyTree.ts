import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Node, Edge, Position, useReactFlow } from 'reactflow'
import { FullRelationship, MemberWithUser, UserWithPhotoUrl } from '@/types'
import { buildAdjacencyList } from '@/lib/family-tree'

interface FamilyTreeProps {
  relationships: FullRelationship[]
  members: MemberWithUser[]
  currentUser?: UserWithPhotoUrl
}

const NODE_WIDTH = 150
const NODE_HEIGHT = 200

type AdjacencyListRelationship = {
  relatedUserId: string
  type: 'parent' | 'child' | 'partner' | 'spouse'
}

export const useFamilyTree = ({
  relationships,
  members,
  currentUser,
}: FamilyTreeProps) => {
  const [focalNodeId, setFocalNodeId] = useState<string | null>(
    currentUser?.id || null,
  )
  const [mode, setMode] = useState<'vertical' | 'horizontal'>('vertical')
  const { setCenter, getNodes, getViewport, fitView } = useReactFlow()

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

  const getRelatives = useCallback(
    (userId: string, type: 'parent' | 'child' | 'spouse' | 'partner') => {
      const relations = adjacencyList.get(userId) || []
      return relations
        .filter((rel) => rel.type === type)
        .map((rel) => allUsersMap.get(rel.relatedUserId))
        .filter((u): u is UserWithPhotoUrl => !!u)
    },
    [adjacencyList, allUsersMap],
  )

  const getSiblings = useCallback(
    (userId: string) => {
      const parentIds = (
        adjacencyList.get(userId)?.filter((r) => r.type === 'parent') || []
      ).map((r) => r.relatedUserId)

      if (parentIds.length === 0) return []

      const siblingIds = new Set<string>()
      parentIds.forEach((parentId) => {
        const childrenOfParent = adjacencyList.get(parentId) || []
        childrenOfParent.forEach((rel) => {
          if (rel.type === 'child' && rel.relatedUserId !== userId) {
            siblingIds.add(rel.relatedUserId)
          }
        })
      })

      return Array.from(siblingIds)
        .map((id) => allUsersMap.get(id))
        .filter((u): u is UserWithPhotoUrl => !!u)
    },
    [adjacencyList, allUsersMap],
  )

  const handleNodeExpand = useCallback(
    (nodeId: string, direction: 'up' | 'down' | 'left' | 'right') => {
      setFocalNodeId(nodeId)
      if (direction === 'up' || direction === 'down') {
        setMode('vertical')
      } else if (direction === 'left' || direction === 'right') {
        setMode('horizontal')
      }
    },
    [],
  )

  const { nodes, edges } = useMemo(() => {
    if (!focalNodeId) return { nodes: [], edges: [] }

    const focalUser = allUsersMap.get(focalNodeId)
    if (!focalUser) return { nodes: [], edges: [] }

    const visibleUsers = new Map<string, UserWithPhotoUrl>()
    visibleUsers.set(focalUser.id, focalUser)

    const parents = getRelatives(focalNodeId, 'parent')
    parents.forEach((p) => visibleUsers.set(p.id, p))

    if (mode === 'vertical') {
      const spouses = [
        ...getRelatives(focalNodeId, 'spouse'),
        ...getRelatives(focalNodeId, 'partner'),
      ]
      const children = getRelatives(focalNodeId, 'child')
      spouses.forEach((s) => visibleUsers.set(s.id, s))
      children.forEach((c) => visibleUsers.set(c.id, c))
    } else if (mode === 'horizontal') {
      const siblings = getSiblings(focalNodeId)
      siblings.forEach((s) => visibleUsers.set(s.id, s))
    }

    const newNodes: Node[] = []
    const newEdges: Edge[] = []
    const addedIds = new Set<string>()

    // 1. Add focal user
    newNodes.push({
      id: focalUser.id,
      type: 'avatar',
      position: { x: 0, y: 0 },
      data: { ...focalUser }, // Temp data
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    })
    addedIds.add(focalUser.id)

    // 2. Add parents
    parents.forEach((parent, index) => {
      if (addedIds.has(parent.id)) return
      const x = (index - (parents.length - 1) / 2) * NODE_WIDTH * 1.5
      newNodes.push({
        id: parent.id,
        type: 'avatar',
        position: { x, y: -NODE_HEIGHT },
        data: { ...parent },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      })
      addedIds.add(parent.id)
      newEdges.push({
        id: `e-${parent.id}-${focalUser.id}`,
        source: parent.id,
        target: focalUser.id,
        type: 'orthogonal',
        sourceHandle: 'bottom-source',
        targetHandle: 'top-target',
      })
    })

    if (mode === 'vertical') {
      // 3a. Add spouses/partners
      const spouses = [
        ...getRelatives(focalNodeId, 'spouse'),
        ...getRelatives(focalNodeId, 'partner'),
      ].filter((s) => visibleUsers.has(s.id))

      spouses.forEach((spouse, index) => {
        if (addedIds.has(spouse.id)) return
        const x = (index + 1) * NODE_WIDTH * 1.2
        newNodes.push({
          id: spouse.id,
          type: 'avatar',
          position: { x, y: 0 },
          data: { ...spouse },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        })
        addedIds.add(spouse.id)
        newEdges.push({
          id: `e-${focalUser.id}-${spouse.id}`,
          source: focalUser.id,
          target: spouse.id,
          type: 'orthogonal',
          sourceHandle: 'right-source',
          targetHandle: 'left-target',
        })
      })

      // 4a. Add children
      const children = getRelatives(focalNodeId, 'child').filter((c) =>
        visibleUsers.has(c.id),
      )
      children.forEach((child, index) => {
        if (addedIds.has(child.id)) return
        const x = (index - (children.length - 1) / 2) * NODE_WIDTH * 1.5
        newNodes.push({
          id: child.id,
          type: 'avatar',
          position: { x, y: NODE_HEIGHT },
          data: { ...child },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        })
        addedIds.add(child.id)
        newEdges.push({
          id: `e-${focalUser.id}-${child.id}`,
          source: focalUser.id,
          target: child.id,
          type: 'orthogonal',
          sourceHandle: 'bottom-source',
          targetHandle: 'top-target',
        })
      })
    } else if (mode === 'horizontal') {
      // 3b. Add siblings
      const siblings = getSiblings(focalNodeId).filter((s) =>
        visibleUsers.has(s.id),
      )
      const focalUserIndex = siblings.findIndex(
        (s: UserWithPhotoUrl) => s.id === focalNodeId,
      )

      siblings.forEach((sibling, index) => {
        if (addedIds.has(sibling.id)) return
        const x = (index - focalUserIndex) * NODE_WIDTH * 1.2
        if (x === 0) return // Skip focal user, already added

        newNodes.push({
          id: sibling.id,
          type: 'avatar',
          position: { x, y: 0 },
          data: { ...sibling },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        })
        addedIds.add(sibling.id)
        // Edge from parent to sibling
        const parentIds = (
          adjacencyList.get(sibling.id)?.filter((r) => r.type === 'parent') ||
          []
        ).map((r) => r.relatedUserId)
        const commonParent = parents.find((p) => parentIds.includes(p.id))
        if (commonParent) {
          newEdges.push({
            id: `e-${commonParent.id}-${sibling.id}`,
            source: commonParent.id,
            target: sibling.id,
            type: 'orthogonal',
            sourceHandle: 'bottom-source',
            targetHandle: 'top-target',
          })
        }
      })
    }

    // Finalize node data with arrow visibility
    const finalNodes = newNodes.map((node) => {
      const isFocal = node.id === focalNodeId

      // Check if there are relatives that are not currently visible
      const hasUnaddedParents = getRelatives(node.id, 'parent').some(
        (p: UserWithPhotoUrl) => !visibleUsers.has(p.id),
      )
      const hasUnaddedChildren = getRelatives(node.id, 'child').some(
        (c: UserWithPhotoUrl) => !visibleUsers.has(c.id),
      )
      const hasUnaddedSiblings = getSiblings(node.id).some(
        (s: UserWithPhotoUrl) => !visibleUsers.has(s.id),
      )

      return {
        ...node,
        data: {
          ...allUsersMap.get(node.id),
          isCurrentUser: node.id === currentUser?.id,
          isFocalUser: isFocal,
          onExpand: handleNodeExpand,
          canExpandUp: isFocal && hasUnaddedParents,
          canExpandDown: isFocal && hasUnaddedChildren,
          canExpandHorizontal: isFocal && hasUnaddedSiblings,
        },
      }
    })

    return { nodes: finalNodes, edges: newEdges }
  }, [
    focalNodeId,
    mode,
    allUsersMap,
    adjacencyList,
    getRelatives,
    getSiblings,
    handleNodeExpand,
    currentUser?.id,
  ])

  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100)
    }
  }, [nodes, fitView, focalNodeId, mode])

  return { nodes, edges }
}
