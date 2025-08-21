# Family Tree Relationship Design

This document outlines a design for determining and displaying complex family relationships (e.g., sibling, cousin, aunt, uncle) based on a minimal set of direct relationship data.

## 1. Existing Data Model

The current Prisma schema provides the necessary models to build the family graph:

- **`User`**: Represents an individual in the system.
- **`UserUser`**: This is the relationship table, equivalent to a graph edge. It connects two users (`user1` and `user2`).
- **`UserUserRelationType`**: A lookup table for relationship types (e.g., `parent`, `spouse`). This is more flexible than a hardcoded enum.

Based on this structure, we can define how the fundamental relationships are stored:

- **Parent/Child (`parent`)**: This relationship is directional. To ensure clarity and efficient traversal, we will establish a firm convention:
  - `user1Id` will be the **parent**.
  - `user2Id` will be the **child**.
  - This `parent -> child` direction makes finding descendants (traversing down the tree) a direct query.

- **Spouse/Partner (`spouse`)**: This relationship is symmetrical. To simplify traversal logic, it is highly recommended to store this relationship **twice**, once in each direction.
  - Record 1: `user1Id: A`, `user2Id: B`, `type: spouse`
  - Record 2: `user1Id: B`, `user2Id: A`, `type: spouse`
  - This approach avoids complex queries that would need to check both `user1Id` and `user2Id` for a match. Finding a user's spouse becomes a single, consistent query, which dramatically simplifies the graph traversal algorithm.

## 2. The Algorithm: Graph Traversal

With the data model confirmed, the problem of finding a relationship between any two people ("Ego" and "Alter") becomes a classic graph traversal problem. The goal is to find the shortest path between them in the family graph.

A **Breadth-First Search (BFS)** algorithm is the ideal tool for this.

### High-Level Algorithm

1.  **Fetch the Graph**: For a given family group, load all `UserUser` relationships into an in-memory graph structure. An [adjacency list](https://en.wikipedia.org/wiki/Adjacency_list) is a perfect fit. This is a one-time operation per request.

2.  **Start BFS from Ego**: The "Ego" is the user from whose perspective we are calculating the relationship.
    - Initialize a queue and add the starting node: `{ user: Ego, path: [Ego] }`. The `path` array will store the chain of users connecting Ego to the current node.
    - Maintain a `visited` set to track visited user IDs to prevent infinite loops (which are guaranteed with the bi-directional spouse relationships).

3.  **Traverse the Graph**:
    - Dequeue a node. Let's call its user `currentUser`.
    - If `currentUser` is the "Alter" (the person we're trying to relate to Ego), the search is complete! The `path` in the dequeued node is the shortest connection between them.
    - If not, find all users related to `currentUser` by querying the in-memory graph.
    - For each related user who has not yet been visited, add them to the `visited` set and enqueue them with an updated path. For example, if we followed a `parent` link from `currentUser` to their child, we would enqueue `{ user: child, path: [...currentUser.path, child] }`.

## 3. Translating Paths into Relationships

Once the BFS finds a path, the final step is to translate that sequence of users and relationship types into a human-readable label.

A "Path Interpreter" function will handle this logic. It will analyze the path's length and the types of relationships connecting the nodes.

### Path Examples:

- **Parent**: `[Ego, Parent]` (Path of length 2, connected by one `parent` link where Ego is the child).
- **Child**: `[Ego, Child]` (Path of length 2, connected by one `parent` link where Ego is the parent).
- **Grandparent**: `[Ego, Parent, Grandparent]` (Path of length 3).
- **Sibling**: `[Ego, Parent, Sibling]` (Path: up to a common parent, then down to another child).
- **Aunt/Uncle**: `[Ego, Parent, Grandparent, Uncle/Aunt]` (Path: up to a grandparent, then down to one of their other children).
- **First Cousin**: `[Ego, Parent, Grandparent, Uncle/Aunt, Cousin]`.
- **Spouse**: `[Ego, Spouse]` (Path of length 2, connected by a `spouse` link).
- **Parent-in-law**: `[Ego, Spouse, Parent-in-law]` (Path: over to a spouse, then up to their parent).

### Node arrow logic

Each person is a node in the family tree, a photo with label and arrows to
navigate the tree. Rules:

- If up (ancestors) already showing, don't show up arrow
- If down (descendants) already showing, don't show down arrow
- If left (siblings) already showing, don't show left or right arrows
- If one one node in a generation (single parent), only show left arrow for siblings. No right arrow.
- If two nodes in a generation (spouses/partners), show left arrow for the left
  positioned-node and right arrow for the right positioned-node. But don't show
  right arrow on the left node or left arrow on the right node (i.e. duplicate
  arrows that do the same thing -- open siblings).
- If already showing siblings, don't show left or right (sibling) arrows on the
  sibling nodes.
- If no ancestors for a node, don't show up arrow.
- If no descendants for a node, don't show down arrow.
- If no siblings for a node, don't show left or right arrows.

## Summary of Approach

| Component                   | Recommendation                                                                          | Justification                                                                              |
| :-------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| **Data Model**              | Use the existing `User`, `UserUser`, and `UserUserRelationType` models.                 | Aligns with the current schema and provides the necessary flexibility.                     |
| **Relationship Convention** | `parent`: `user1Id` is parent, `user2Id` is child. `spouse`: Store bi-directionally.    | Enforces consistency and dramatically simplifies the traversal algorithm.                  |
| **Algorithm**               | Fetch all group relationships once, then use Breadth-First Search (BFS) from the "Ego". | BFS is efficient and guarantees finding the shortest, most direct family connection first. |
| **Implementation**          | A "Path Interpreter" function to convert the BFS result path into a relationship name.  | Decouples the graph search logic from the business logic of naming family ties.            |
