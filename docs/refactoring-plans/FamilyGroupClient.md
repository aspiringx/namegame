# Refactoring Plan: `FamilyGroupClient.tsx`

**Current State:** This 745-line component is similar to `GroupTabs.tsx` but tailored for family groups. It adds the complexity of a family tree view and the associated relationship calculations.

**Proposed Refactoring:**

1.  **Extract UI Components:** Break down the UI into more manageable pieces:
    *   `FamilyGroupToolbar`: A component for the top bar containing sorting controls, view mode buttons, and the search input.
    *   `FamilyMemberGrid` and `FamilyMemberList`: Similar to the `GroupTabs` refactoring, create dedicated components for displaying members in grid and list formats.
    *   `FamilyTreeContainer`: The `FamilyTree` component and its related state/controls (like `FocalUserSearch`) can be further isolated into a single container component to manage the tree view's complexity.

2.  **Extract Logic into Custom Hooks:**
    *   `useFamilyMembers`: A hook to manage fetching, filtering, and sorting of the family members.
    *   `useFamilyRelationships`: A dedicated hook to handle the complex and performance-critical `relationshipMap` calculation. This isolates the business logic of traversing the family graph from the component that displays it.
