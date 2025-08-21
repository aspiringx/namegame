# Family Tree Relationship Design - Simplify

We've implemented family tree logic (family-tree.ts) and UI (FamilyTree.tsx),
but FamilyTree.tsx is brittle, filled with interdependencies that break when we
make changes.

## Elements

### Groups, Users, and Relationships

- We have a family group, a list of users who are members via the GroupUser
  relation.
- Within the group, users are related to each other via the UserUser relation.
- While families can have many types of complex relationships, they're all
  derived from a few simple, direct ones.
  - parent - parent relation where user1Id of the UserUser is the parent and the
    relationTypeId maps to code 'parent' in the UserUserRelationType table. This
    is uni-directional.
  - child - parent relation where user2Id of the UserUser is the child and the
    relationTypeId maps to code 'parent' in the UserUserRelationType table. This
    is uni-directional.
  - spouse - bi-directional relationship in the UserUser table where
    relationTypeId maps to code 'spouse' in the UserUserRelationType table.
    Order of user1Id and user2Id doesn't matter.
  - partner - bi-directional relationship in the UserUser table where
    relationTypeId maps to code 'partner' in the UserUserRelationType table.
    Order of user1Id and user2Id doesn't matter.

The UserUserRelationType table has a 'family' category. 'parent', 'spouse', and
'partner' are codes in the 'family' category. 'child' is not in the table
because it's a 'parent' relation where user1Id is always the parent and user2Id
is always the child. We account for this in the UI.

### Family Tree

In family-tree.ts, we build an adjacency list of users and their relationships.
We start with the currently authenticated user we call "Ego". We find the path
between Ego and all other users in the group.

For example, a 'sibling' is any other user in the group whose path from Ego is
'parent > child'. We calculate paths for every relationship type to determine a
non-gendered relationship label (e.g. 'sibling', 'parent', 'spouse', 'partner',
'cousin', 'pibling', 'nibling', etc.).

We account for relationship label modifiers like 'in-law', 'step', and 'half'
relations.

We may not be able to calculate a path to some group members because they're not
yet connected in the tree (e.g. husband of sister-in-law before sister is in the
group). Here, we use the default, non-gendered 'relative' relationship label.

Then, for each related user, if we know their gender and if the gender is 'male'
or 'female', we translate the gender-neutral relationship label to a
gender-specific relationship label (e.g. 'brother', 'sister', 'husband', 'wife',
'son', 'daughter', etc.).

### Views

We started with a grid view, then added a list view. Both should use infinite
scrolling to only load a small number of users at a time. When we filter and
sort, we call the server so they apply to the whole group instead of the few
users we initially load.

Then we added the tree view. It initially loads the ego user and their direct
relationships, or those where the number of segments in the path is 1.

**Question:** Are we initially loading all group members with their paths,
relationship labels (non-gendered and gendered) and other props like their
photoUrl? We shouldn't have to requery the server for this data as we traverse
the family tree.

## ReactFlow

This is the library we use to render the family tree. It's made of nodes (users)
and edges (relationships between users). Each node has handles that we used to
connect edges and display arrows (up, down, left, right) people can click to
traverse the tree.

**CurrentUser** This is always the authenticated user we're calling Ego.

- The Ego user only has six direct relationships: 2 parents, 1 spouse, 3
  children.
- All relationship labels are from this user's perspective.

**FocalUser** This is the user/node with the current focus. A node gets the
focus by clicking one of it's options conditionally available based on the
current state.

To help limit complexity, we need a [finite] state machine pattern to manage
what options are available to each visible node based on the current state.

### State Options

Each node has a limited number of options that may be enabled or disabled based
on the current state.

- Arrows: up, down, left, right
  - Only show arrows that are available based on state of the node. e.g. if a
    user doesn't have ancestors, don't show up arrow. If no children, don't show
    down arrow. If no siblings don't show left/right arrow. If siblings already
    showing, none shows left/right arrow.
  - The behavior of arrows may change on the state. e.g. If children already
    visible, down arrow collapses self (and all ancestors above). If children
    not visible, expands to show them.
  - The placement of arrows depends on the position of the node in relation to
    others. e.g. If row shows Ego and spouse, left node only left arrow, right
    node only right arrow. Left and right arrows shouldn't appear on the same
    node with duplicate functionality.
- Tooltip - Hover/tap shows tooltip with additional details and possibly
- Other node options (need to decide UI for this -- currently only tooltip)
  - View bigger photo and details
  - Other options like relate, view memories, chat, message, etc.
  - See path from you to this person, see shared timeline, etc.
  - Admin options like changing role, removing from group, title, etc.

To correctly know the state of each user/node, in addition to knowing the Ego
user's intial state (direct relations, etc.), we need to know the direct
relations of each potential focal user.

So each node that becomes visible should have this state. Don't pre-load states
for all nodes. Do it when they become visible. Once loaded, cache it. If they're
collapsed/invisible and re-expanded/made visible, we should retain state to
avoid needless network requests.

### State

Group:

- id (group.id)
- users (array of users)
  - relations for each user (if efficient)?

Node:

- id (user.id)
- user
  - info (name, photoUrl, etc.)
  - relationships
- direct relations (parent, child, spouse, partner)
- ui state (drives arrows, what's visible, etc.)
