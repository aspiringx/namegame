import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Node, Edge, Position, useReactFlow } from 'reactflow'
import {
  User,
  FullRelationship,
  MemberWithUser,
  UserWithPhotoUrl,
} from '@/types'
import { buildAdjacencyList } from '@/lib/family-tree'
import { getRelationship as getComplexRelationship } from '@/lib/family-tree'

export interface AvatarNodeData extends UserWithPhotoUrl {
  isCurrentUser: boolean
  isFocalUser: boolean
  isFocalUserSpouseOrPartner: boolean
  onExpand: (direction: 'up' | 'down' | 'left' | 'right') => void
  canExpandUp: boolean
  canExpandDown: boolean
  canExpandHorizontal: boolean
  relationship?: string
}

interface FamilyTreeProps {
  relationships: FullRelationship[]
  members: MemberWithUser[]
  currentUser?: UserWithPhotoUrl
  relationshipMap: Map<string, string>
}

const NODE_WIDTH = 150
const NODE_HEIGHT = 230

type AdjacencyListRelationship = {
  relatedUserId: string
  type: 'parent' | 'child' | 'partner' | 'spouse'
}

export const useFamilyTree = ({
  relationships,
  members,
  currentUser,
  relationshipMap,
}: FamilyTreeProps) => {
  const [focalNodeId, setFocalNodeId] = useState<string | null>(
    currentUser?.id || null,
  )
  const [mode, setMode] = useState<'vertical' | 'horizontal'>('vertical')
  const { setCenter, getNodes, getViewport, fitView } = useReactFlow()

  const allUsersMap = useMemo(() => {
    const map = new Map<string, UserWithPhotoUrl>()
    members.forEach((member: MemberWithUser) => {
      if (member?.user) {
        map.set(member.userId, {
          ...member.user,
          name: `${member.user.firstName} ${member.user.lastName}`.trim(),
          photoUrl: member.user.photoUrl || undefined,
        })
      }
    })
    relationships.forEach((rel: FullRelationship) => {
      ;[rel.user1, rel.user2].forEach((user: User) => {
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
        .filter((rel: AdjacencyListRelationship) => rel.type === type)
        .map((rel: AdjacencyListRelationship) =>
          allUsersMap.get(rel.relatedUserId),
        )
        .filter((u: UserWithPhotoUrl | undefined): u is UserWithPhotoUrl => !!u)
    },
    [adjacencyList, allUsersMap],
  )

  const getSiblings = useCallback(
    (userId: string) => {
      const parentIds = (
        adjacencyList
          .get(userId)
          ?.filter((r: AdjacencyListRelationship) => r.type === 'parent') || []
      ).map((r: AdjacencyListRelationship) => r.relatedUserId)

      if (parentIds.length === 0) return []

      const siblingIds = new Set<string>()
      parentIds.forEach((parentId: string) => {
        const childrenOfParent = adjacencyList.get(parentId) || []
        childrenOfParent.forEach((rel: AdjacencyListRelationship) => {
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

    const focalUserSpouseAndPartnerIds = new Set(
      (adjacencyList.get(focalNodeId) || [])
        .filter(
          (rel: AdjacencyListRelationship) =>
            rel.type === 'spouse' || rel.type === 'partner',
        )
        .map((rel: AdjacencyListRelationship) => rel.relatedUserId),
    )

    const visibleUsers = new Map<string, UserWithPhotoUrl>()
    visibleUsers.set(focalUser.id, focalUser)

    const parents = getRelatives(focalNodeId, 'parent')
    parents.forEach((p: UserWithPhotoUrl) => visibleUsers.set(p.id, p))

    if (mode === 'vertical') {
      const spouses = [
        ...getRelatives(focalNodeId, 'spouse'),
        ...getRelatives(focalNodeId, 'partner'),
      ]
      spouses.forEach((s: UserWithPhotoUrl) => visibleUsers.set(s.id, s))

      // Add children from focal user
      const focalUserChildren = getRelatives(focalNodeId, 'child')
      focalUserChildren.forEach((c: UserWithPhotoUrl) => visibleUsers.set(c.id, c))

      // Add children from spouses (step-children)
      spouses.forEach((spouse) => {
        const spouseChildren = getRelatives(spouse.id, 'child')
        spouseChildren.forEach((c: UserWithPhotoUrl) => visibleUsers.set(c.id, c))
      })
    } else if (mode === 'horizontal') {
      const siblings = getSiblings(focalNodeId)
      siblings.forEach((s: UserWithPhotoUrl) => visibleUsers.set(s.id, s))
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
    parents.forEach((parent: UserWithPhotoUrl, index: number) => {
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
      ].filter((s: UserWithPhotoUrl) => visibleUsers.has(s.id))

      spouses.forEach((spouse: UserWithPhotoUrl, index: number) => {
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

      // 4a. Add all children of the focal user and their spouse(s)
      const allChildren = new Map<string, UserWithPhotoUrl>()

      // Get focal user's children
      const focalUserChildren = getRelatives(focalNodeId, 'child')
      focalUserChildren.forEach((child: UserWithPhotoUrl) =>
        allChildren.set(child.id, child),
      )

      // Get spouse's children
      spouses.forEach((spouse) => {
        const spouseChildren = getRelatives(spouse.id, 'child')
        spouseChildren.forEach((child: UserWithPhotoUrl) =>
          allChildren.set(child.id, child),
        )
      })

      const children = Array.from(allChildren.values()).filter((c) =>
        visibleUsers.has(c.id),
      )

      // Center children below parents
      const focalUserNode = newNodes.find((n) => n.id === focalNodeId)!
      const spouseNodes = newNodes.filter((n) =>
        spouses.some((s) => s.id === n.id),
      )

      const parentNodes = [focalUserNode, ...spouseNodes]
      const minX = Math.min(...parentNodes.map((n) => n.position.x))
      const maxX = Math.max(...parentNodes.map((n) => n.position.x))
      const parentMidpointX = (minX + maxX) / 2

      children.forEach((child: UserWithPhotoUrl, index: number) => {
        if (addedIds.has(child.id)) return
        const xOffset =
          (index - (children.length - 1) / 2) * NODE_WIDTH * 1.5
        const x = parentMidpointX + xOffset

        newNodes.push({
          id: child.id,
          type: 'avatar',
          position: { x, y: NODE_HEIGHT },
          data: { ...child },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        })
        addedIds.add(child.id)
        // No edge created between parent and child to reduce clutter
      })
    } else if (mode === 'horizontal') {
      // 3b. Add siblings
      const siblings = getSiblings(focalNodeId).filter((s: UserWithPhotoUrl) =>
        visibleUsers.has(s.id),
      )
      const focalUserIndex = siblings.findIndex(
        (s: UserWithPhotoUrl) => s.id === focalNodeId,
      )

      siblings.forEach((sibling: UserWithPhotoUrl, index: number) => {
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
          adjacencyList
            .get(sibling.id)
            ?.filter((r: AdjacencyListRelationship) => r.type === 'parent') ||
          []
        ).map((r: AdjacencyListRelationship) => r.relatedUserId)
        const commonParent = parents.find((p: UserWithPhotoUrl) =>
          parentIds.includes(p.id),
        )
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

    // Finalize node data with relationship and expansion info
    const finalNodes = newNodes.map((newNode) => {
      const user = visibleUsers.get(newNode.id)!

      const hasUnaddedParents = getRelatives(user.id, 'parent').some(
        (p: UserWithPhotoUrl) => !visibleUsers.has(p.id),
      )
      const hasUnaddedChildren = getRelatives(user.id, 'child').some(
        (c: UserWithPhotoUrl) => !visibleUsers.has(c.id),
      )
      const hasUnaddedSiblings = getSiblings(user.id).some(
        (s: UserWithPhotoUrl) => !visibleUsers.has(s.id),
      )

      return {
        ...newNode,
        data: {
          ...user,
          relationship: relationshipMap.get(user.id),
          isCurrentUser: user.id === currentUser?.id,
          isFocalUser: user.id === focalNodeId,
          isFocalUserSpouseOrPartner:
            mode === 'vertical' && focalUserSpouseAndPartnerIds.has(user.id),
          onExpand: (direction: 'up' | 'down' | 'left' | 'right') =>
            handleNodeExpand(user.id, direction),
          canExpandUp: hasUnaddedParents,
          canExpandDown: hasUnaddedChildren,
          canExpandHorizontal: hasUnaddedSiblings,
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

  const setFocalUser = useCallback((userId: string) => {
    setFocalNodeId(userId)
    setMode('vertical')
  }, [])

  const resetFocalUser = useCallback(() => {
    if (currentUser) {
      setFocalNodeId(currentUser.id)
      setMode('vertical')
    }
  }, [currentUser])

  const isFocalUserTheCurrentUser = focalNodeId === currentUser?.id

  return {
    nodes,
    edges,
    resetFocalUser,
    focalNodeId,
    isFocalUserTheCurrentUser,
    setFocalUser,
  }
}
