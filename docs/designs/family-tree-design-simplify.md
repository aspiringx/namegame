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
connect edges and display arrows (up/parent, down/child, left/sibling) people
can click to traverse the tree. No right arrows since they're duplicates of
left.

**CurrentUser** This is always the authenticated user we're calling Ego.

- The Ego user only has six direct relationships: 2 parents, 1 spouse, 3
  children.
- All relationship labels are from this user's perspective.

**FocalUser** This is the user/node with the current focus. A node gets the
focus by clicking one of it's options conditionally available based on the
current state.

To help limit complexity, we need a [finite] state machine pattern to manage
what options are available to each visible node based on the current state.

### State Machine

Each node has a limited number of options that may be enabled or disabled based
on the current state.

- Arrows: up, down, left
  - Only show arrows that are available based on state of the node. e.g. if a
    user doesn't have ancestors, don't show up arrow. If no children, don't show
    down arrow. If no siblings don't show left arrow. If siblings already
    showing, none shows left arrow.
  - The behavior of arrows may change on the state. e.g. If children already
    visible, down arrow collapses self (and all ancestors above). If children
    not visible, expands to show them.
- Tooltip - Hover/tap shows tooltip with additional details and possibly
- Other node options (need to decide UI for this -- currently only tooltip)
  - View bigger photo and details
  - Other options like relate, view memories, chat, message, etc.
  - See path from you to this person, see shared timeline, etc.
  - Admin options like changing role, removing from group, title, etc.

To correctly know the state of each user/node, in addition to knowing the Ego
user's intial state (direct relations, etc.), we need to know the direct
relations of each potential focal user.

#### Group State

- id (group.id, name, slug, logo, description, etc.)
- users (array of all users in the group via GroupUser relation)
- currentUser (authenticated user)
- focalUser (user/node with current focus, starting with currentUser)

We need to be initially aware of all users in the group to support planned new
ways to set the focal user (like via the search box) and change the tree view to
center them.

#### User State

When we load the group, we should load and cache the following:

- direct vertical relations (parent, child)
- direct horizontal relations (spouse, partner)
- indirect horizontal relations (siblings, step-siblings, co-siblings,
  half-siblings)
- user info (name, photoUrl, gender, etc.)
- ui state (drives arrows, what's visible, etc.)
- relation paths to all users in the group (e.g. parent > child), keyed by
  user.id with non-gendered relation labels and gendered relation labels for
  anyone with a male/female gender.
- For users with a GroupUser relation connecting them to the group but without
  UserUser relations connecting them to the tree, we don't have a path between
  them and Ego and we use the default label of 'relative'.

Initially, we only render the Ego user and their direct relations. As we
traverse the tree using arrows, new users are rendered. Before rendering them,
we should load and cache their:

- direct vertical relations (parent, child)
- direct horizontal relations (spouse, partner)
- indirect horizontal relations (siblings, step-siblings, co-siblings,
  half-siblings)
- user info (name, photoUrl, gender, etc.)
- ui state (drives arrows, what's visible, etc.)
- Notice that here, we don't load new relation paths and labels because we
  already did this relative to the Ego user.

#### Focal User Behavior

Our Ego (current user) is the initial focal user centered in the viewport with a
slightly larger size (photo and label) than other users.

When we click/tap an arrow/handle for any visible user, they become the focal
user, centered and slightly larger.

You traverse the family tree by clicking arrows, handles on user nodes. Arrows
should only appear on a user node if they can lead to a new state. For example,
if a user has no children, they should never have a down arrow.

Since siblings aren't direct relations, we need to load the child relations of
each user's parents (for siblings or half-siblings), step parents (for
step-siblings), and co-parents (parent's partner, for co-siblings).

When siblings are displayed, we order them like this:

- First full siblings (left), then half-siblings, then step-siblings, then
  co-siblings
- For each type of siblings, if we have their birth dates, order them from
  oldest (left) to youngest (right) within each sibling type (full, half, etc.)
- If we don't have a sibling birth date, order them alphabetically by first name
  after the above sorting is applied.

Clicking/tapping any arrow on a user makes them the focal user. A focal user can
be in one of two modes:

- Vertical (parent, spouse/partner, child): If they become the focal user by
  clicking their up or down arrow, they are in vertical mode. This means they're
  centered and we show:
  - A spouse or partner (if any)
  - Children (if any)
    - If a child has children, we show down arrow. Since their siblings are
      already visible, no left arrow. Since parents already displayed, no up
      arrow.
    - Children are siblings. Order them as described in "Horizontal" below.
  - Parents (if any)
    - If parent has siblings, show left arrow. Since child is already visible,
      no down arrow. If parent has parents, show up arrow.
    - To show parent's children, the focal user can click/tap their left arrow.
  - All other group users are hidden.

- Horizontal (siblings): If they become the focal user by clicking their left
  arrow, they are in horizontal mode. The user whose left arrow we
  clicked/tapped is centered (slightly larger) and we show:
  - Siblings (if any)
    - We're already showing parents so siblings may only have a down arrow (if
      they have children).
    - In horizontal mode, siblings are already showing so no left arrow.
    - If a sibling down arrow (including the focal user) is clicked, we switch
      to vertical mode. That user becomes centered with spouse/partner (if any),
      parents (if any), and children (if any).
  - Parents (if any)
    - If parent has siblings, show left arrow. Since child is already visible,
      no down arrow. If parent has parents, show up arrow.
  - All other group users are hidden.

I believe this gives us a complete state machine for the family tree. It should
render according to these rules. All users in the group that don't fit these
rules should be hidden so we don't have orphan nodes.
