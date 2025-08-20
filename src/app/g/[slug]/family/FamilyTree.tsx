'use client'

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

const FamilyTree: FC<FamilyTreeProps> = ({ relationships, members, currentUser }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isMiniMapExpanded, setIsMiniMapExpanded] = useState(false);
  const { setCenter, getNodes, getEdges, getViewport, fitView } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const allUsersMap = useMemo(() => {
    const map = new Map<string, UserWithPhotoUrl>();
    members.forEach(member => {
      if (member?.user) {
        map.set(member.userId, {
          ...member.user,
          name: `${member.user.firstName} ${member.user.lastName}`.trim(),
          photoUrl: member.user.photoUrl || undefined,
        });
      }
    });
    relationships.forEach(rel => {
      [rel.user1, rel.user2].forEach(user => {
        if (user && !map.has(user.id)) {
          const userWithPhoto = user as UserWithPhotoUrl;
          map.set(user.id, {
            ...user,
            name: `${user.firstName} ${user.lastName}`.trim(),
            photoUrl: userWithPhoto.photoUrl || undefined,
          });
        }
      });
    });
    return map;
  }, [members, relationships]);

  const [nodeToCenter, setNodeToCenter] = useState<{
    id: string;
    direction: 'up' | 'down' | 'left' | 'right';
  } | null>(null);

  const buildNodeDataRef = useRef<((user: UserWithPhotoUrl, allNodes: Node[]) => any) | null>(null);
  const handleNodeExpandRef = useRef<((nodeId: string, direction: 'up' | 'down' | 'left' | 'right') => void) | null>(null);

  const buildNodeData = useCallback(
    (user: UserWithPhotoUrl, allNodes: Node[]) => {
      if (!currentUser) return {};

      const adjacencyList = buildAdjacencyList(relationships, members, currentUser);
      const relations = adjacencyList.get(user.id) || [];

      const hasUnaddedParents = relations
        .filter(rel => rel.type === 'parent')
        .some(rel => !allNodes.some(n => n.id === rel.relatedUserId));

      const hasUnaddedChildren = relations
        .filter(rel => rel.type === 'child')
        .some(rel => !allNodes.some(n => n.id === rel.relatedUserId));

      const parentIds = relations
        .filter(rel => rel.type === 'parent')
        .map(rel => rel.relatedUserId);
      
      const siblingIds = new Set<string>();
      if (parentIds.length > 0) {
        parentIds.forEach(parentId => {
          (adjacencyList.get(parentId) || [])
            .filter(rel => rel.type === 'child' && rel.relatedUserId !== user.id)
            .forEach(rel => siblingIds.add(rel.relatedUserId));
        });
      }
      const hasUnaddedSiblings = Array.from(siblingIds).some(id => !allNodes.some(n => n.id === id));

      const relationship = getRelationship(
        currentUser.id,
        user.id,
        relationships,
        members,
        new Map(members.map((m) => [m.user.id, m.user])),
      )?.relationship;

      return {
        ...user,
        isCurrentUser: user.id === currentUser.id,
        onExpand: (direction: 'up' | 'down' | 'left' | 'right') => handleNodeExpandRef.current?.(user.id, direction),
        canExpandUp: hasUnaddedParents,
        canExpandDown: hasUnaddedChildren,
        canExpandHorizontal: hasUnaddedSiblings,
        relationship,
      };
    },
    [currentUser, members, relationships]
  );

  const handleNodeExpand = useCallback(
    (nodeId: string, direction: 'up' | 'down' | 'left' | 'right') => {
      if (!currentUser) return;

      const sourceNode = getNodes().find(n => n.id === nodeId);
      if (!sourceNode) return;

      let newNodes: Node[] = [];
      let newEdges: Edge[] = [];

      const addRelatives = (relatives: UserWithPhotoUrl[], position: 'above' | 'below' | 'side') => {
        const allNodes = getNodes();
        let yLevel;
        if (position === 'above') {
          yLevel = sourceNode.position.y - NODE_HEIGHT;
        } else if (position === 'below') {
          yLevel = sourceNode.position.y + NODE_HEIGHT;
        } else { // side
          yLevel = sourceNode.position.y;
        }

        const occupiedXPositions = new Set(
          allNodes
            .filter(n => Math.abs(n.position.y - yLevel) < 10)
            .map(n => n.position.x)
        );

        relatives.forEach((relative, index) => {
          if (allNodes.some(n => n.id === relative.id)) return;

          let x: number, y: number;
          if (position === 'above' || position === 'below') {
            y = yLevel;
            let targetX = sourceNode.position.x + (index - (relatives.length - 1) / 2) * NODE_WIDTH * 1.5;
            let offset = 0;
            while (occupiedXPositions.has(targetX)) {
              offset += NODE_WIDTH * 1.5;
              targetX = sourceNode.position.x + (index - (relatives.length - 1) / 2) * NODE_WIDTH * 1.5 + offset;
            }
             x = targetX;
          } else { // side
            y = sourceNode.position.y;
            const sideNodes = allNodes.filter(n => n.position.y === y);
            const sign = direction === 'right' ? 1 : -1;
            const lastNodeX = sideNodes.reduce((acc, curr) => 
              sign * curr.position.x > sign * acc ? curr.position.x : acc, 
              sourceNode.position.x
            );
            x = lastNodeX + sign * NODE_WIDTH * 1.5;
          }

          occupiedXPositions.add(x);

          newNodes.push({
            id: relative.id,
            type: 'avatar',
            position: { x, y },
            data: {}, // Will be populated later
            sourcePosition: Position.Top,
            targetPosition: Position.Bottom,
          });

          if (position === 'above') {
            newEdges.push({ id: `e-${relative.id}-${sourceNode.id}`, source: relative.id, target: sourceNode.id, type: 'orthogonal', sourceHandle: 'bottom-source', targetHandle: 'top-target' });
          } else if (position === 'below') {
            newEdges.push({ id: `e-${sourceNode.id}-${relative.id}`, source: sourceNode.id, target: relative.id, type: 'orthogonal', sourceHandle: 'bottom-source', targetHandle: 'top-target' });
          } else { // side
            const sourceHandle = direction === 'right' ? 'right-source' : 'left-source';
            const targetHandle = direction === 'right' ? 'left-target' : 'right-target';
            // Find a common parent to draw the edge from
            const adjacencyList = buildAdjacencyList(relationships, members, currentUser);
            const sourceParents = new Set((adjacencyList.get(sourceNode.id) || []).filter(r => r.type === 'parent').map(r => r.relatedUserId));
            const relativeParents = new Set((adjacencyList.get(relative.id) || []).filter(r => r.type === 'parent').map(r => r.relatedUserId));
            const commonParent = [...sourceParents].find(p => relativeParents.has(p));

            if (commonParent && allNodes.some(n => n.id === commonParent)) {
               newEdges.push({ id: `e-${commonParent}-${relative.id}`, source: commonParent, target: relative.id, type: 'orthogonal', sourceHandle: 'bottom-source', targetHandle: 'top-target' });
            } else {
              // Fallback for no visible common parent
              newEdges.push({ id: `e-${sourceNode.id}-${relative.id}`, source: sourceNode.id, target: relative.id, type: 'orthogonal', sourceHandle, targetHandle });
            }
          }
        });
      };

      const adjacencyList = buildAdjacencyList(relationships, members, currentUser);
      const relations = adjacencyList.get(nodeId) || [];
      const allNodes = getNodes();

      if (direction === 'up') {
        const parentIds = relations.filter(rel => rel.type === 'parent').map(rel => rel.relatedUserId).filter(id => !allNodes.some(n => n.id === id));
        if (parentIds.length > 0) {
          const parentUsers = parentIds.map(id => allUsersMap.get(id)).filter((u): u is UserWithPhotoUrl => !!u);
          addRelatives(parentUsers, 'above');
        }
      } else if (direction === 'down') {
        const childrenIds = relations.filter(rel => rel.type === 'child').map(rel => rel.relatedUserId).filter(id => !allNodes.some(n => n.id === id));
        if (childrenIds.length > 0) {
          const childrenUsers = childrenIds.map(id => allUsersMap.get(id)).filter((u): u is UserWithPhotoUrl => !!u);
          addRelatives(childrenUsers, 'below');
        }
      } else if (direction === 'left' || direction === 'right') {
        const parentIds = relations.filter(rel => rel.type === 'parent').map(rel => rel.relatedUserId);
        if (parentIds.length > 0) {
          const siblingIds = new Set<string>();
          parentIds.forEach((parentId: string) => {
            (adjacencyList.get(parentId) || []).filter(rel => rel.type === 'child' && rel.relatedUserId !== nodeId).forEach(rel => siblingIds.add(rel.relatedUserId));
          });
          const unaddedSiblings = Array.from(siblingIds).filter(id => !allNodes.some(n => n.id === id)).map(id => allUsersMap.get(id)).filter((u): u is UserWithPhotoUrl => !!u);
          if (unaddedSiblings.length > 0) {
            addRelatives(unaddedSiblings, 'side');
          }
        }
      }

      if (newNodes.length === 0) return;

      setNodes((nds) => {
        const finalNodes = nds.concat(newNodes);
        return finalNodes.map(n => {
          const isNewOrClicked = newNodes.some(newNode => newNode.id === n.id) || n.id === nodeId;
          if (isNewOrClicked) {
            return { ...n, data: buildNodeDataRef.current!(allUsersMap.get(n.id)!, finalNodes) };
          }
          return n;
        });
      });
      setEdges((eds) => eds.concat(newEdges));
      setNodeToCenter({ id: nodeId, direction });
    },
    [getNodes, members, relationships, setEdges, setNodes]
  );

  useEffect(() => {
    buildNodeDataRef.current = buildNodeData;
    handleNodeExpandRef.current = handleNodeExpand;
  }, [buildNodeData, handleNodeExpand]);

  useEffect(() => {
    if (!currentUser) return;

    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];
    const addedIds = new Set<string>();

    // ...
    initialNodes.push({
      id: currentUser.id,
      type: 'avatar',
      position: { x: 0, y: 0 },
      data: {},
      sourcePosition: Position.Top,
      targetPosition: Position.Bottom,
    });
    addedIds.add(currentUser.id);

    const adjacencyList = buildAdjacencyList(relationships, members, currentUser);
    const relations = adjacencyList.get(currentUser.id) || [];

    // 2. Add parents
    const parents = relations
      .filter(r => r.type === 'parent')
      .map(r => allUsersMap.get(r.relatedUserId))
      .filter((p): p is UserWithPhotoUrl => !!p && !addedIds.has(p.id));

    parents.forEach((parent, index) => {
      const x = (index - (parents.length - 1) / 2) * NODE_WIDTH * 1.5;
      initialNodes.push({ id: parent.id, type: 'avatar', position: { x, y: -NODE_HEIGHT }, data: {}, sourcePosition: Position.Top, targetPosition: Position.Bottom });
      addedIds.add(parent.id);
      initialEdges.push({ id: `e-${parent.id}-${currentUser.id}`, source: parent.id, target: currentUser.id, type: 'orthogonal', sourceHandle: 'bottom-source', targetHandle: 'top-target' });
    });

    // 3. Add children
    const children = relations
      .filter(r => r.type === 'child')
      .map(r => allUsersMap.get(r.relatedUserId))
      .filter((c): c is UserWithPhotoUrl => !!c && !addedIds.has(c.id));

    children.forEach((child, index) => {
      const x = (index - (children.length - 1) / 2) * NODE_WIDTH * 1.5;
      initialNodes.push({ id: child.id, type: 'avatar', position: { x, y: NODE_HEIGHT }, data: {}, sourcePosition: Position.Top, targetPosition: Position.Bottom });
      addedIds.add(child.id);
      initialEdges.push({ id: `e-${currentUser.id}-${child.id}`, source: currentUser.id, target: child.id, type: 'orthogonal', sourceHandle: 'bottom-source', targetHandle: 'top-target' });
    });

    // 4. Add spouses/partners
    const spouses = relations
      .filter(r => r.type === 'partner')
      .map(r => allUsersMap.get(r.relatedUserId))
      .filter((s): s is UserWithPhotoUrl => !!s && !addedIds.has(s.id));

    spouses.forEach((spouse, index) => {
      const x = (index + 1) * NODE_WIDTH * 1.5;
      initialNodes.push({ id: spouse.id, type: 'avatar', position: { x, y: 0 }, data: {}, sourcePosition: Position.Top, targetPosition: Position.Bottom });
      addedIds.add(spouse.id);
      initialEdges.push({ id: `e-${currentUser.id}-${spouse.id}`, source: currentUser.id, target: spouse.id, type: 'orthogonal', sourceHandle: 'right-source', targetHandle: 'left-target' });
    });

    // Finalize data for all nodes
    const finalInitialNodes = initialNodes.map(n => ({ ...n, data: buildNodeData(allUsersMap.get(n.id)!, initialNodes) }));

    console.log('--- Initial Node Setup ---');
    console.log('CurrentUser:', currentUser);
    console.log('AllUsersMap:', allUsersMap);
    console.log('AdjacencyList:', adjacencyList);
    console.log('Relations for currentUser:', relations);
    console.log('Parents found:', parents);
    console.log('Children found:', children);
    console.log('Spouses found:', spouses);
    console.log('Final Initial Nodes:', finalInitialNodes);
    console.log('Final Initial Edges:', initialEdges);

    setNodes(finalInitialNodes);
    setEdges(initialEdges);

  }, [relationships, members, currentUser, buildNodeData]);

  useEffect(() => {
    if (!nodeToCenter) return;

    const checkAndCenter = () => {
      const node = getNodes().find((n) => n.id === nodeToCenter.id);
      if (node && node.width && node.height) {
        const x = node.position.x + node.width / 2;
        let y = node.position.y + node.height / 2;

        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          if (nodeToCenter.direction === 'up') y -= node.height * 0.75;
          if (nodeToCenter.direction === 'down') y += node.height * 0.75;
        }

        setCenter(x, y, { zoom: 1.2, duration: 800 });
        setNodeToCenter(null);
      } else {
        requestAnimationFrame(checkAndCenter);
      }
    };
    requestAnimationFrame(checkAndCenter);
  }, [nodeToCenter, getNodes, setCenter]);

  return (
    <div ref={reactFlowWrapper} style={{ height: '70vh', width: '100%' }} className="react-flow-wrapper bg-background rounded-md border">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView proOptions={{ hideAttribution: true }}>
        <Background />
        <Controls />
        <div onMouseEnter={() => setIsMiniMapExpanded(true)} onMouseLeave={() => setIsMiniMapExpanded(false)} onClick={() => setIsMiniMapExpanded(!isMiniMapExpanded)} className="absolute bottom-0 right-0 z-10 cursor-pointer">
          <MiniMap nodeStrokeWidth={3} zoomable pannable style={{ height: isMiniMapExpanded ? 150 : 75, width: isMiniMapExpanded ? 200 : 100, transition: 'all 0.2s ease-in-out' }} />
        </div>
      </ReactFlow>
    </div>
  );
};

export default FamilyTree;
