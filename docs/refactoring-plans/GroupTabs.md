# Refactoring Plan: `GroupTabs.tsx`

**Current State:** At over 800 lines, this component is responsible for managing
tab state, sorting, filtering, multiple view modes (grid, list, quiz), data
fetching, and several modals.

**Proposed Refactoring:**

- Rename from `GroupTabs` to `CommunityGroupClient`.
- Get rid of the Greeted/Not Greeted tabs.
  - Show all group members in one list, but add a filter for greeted/not
    greeted. Change the filter name to Met/Not Met instead of Greeted/Not
    Greeted.
- Remove the list view mode:
  - Only show the grid view mode.
  - Remove the grid and list view buttons from the UI since there will only be
    one view mode (grid).
  - Simplify MemberCard.tsx to only show the grid view.

1.  **Extract UI Components:** Decompose the main component into smaller, more
    focused presentational components:
    - `GroupToolbar`: A dedicated component for the user controls (sort buttons,
      filter toggles, view mode switcher).
    - `MemberGrid`: A component specifically for rendering members in a grid
      layout.
    - `MemberList`: A component for rendering members in a list layout.
    - `MemberView`: A controlling component that decides whether to render the
      `MemberGrid` or `MemberList` based on the current view mode.

2.  **Extract Logic into a Custom Hook:**
    - `useGroupMembers`: Create a custom hook to manage the state and logic for
      tabs, search queries, sorting, and filtering. This will encapsulate the
      large `useMemo` block that currently handles the filtering and sorting,
      making the logic easier to maintain and test.

3.  **Consolidate Modal Logic:**
    - The logic for the `RelateModal`, `NameQuizIntroModal`, and the "Connect"
      modal can be better encapsulated either within their own components or
      managed by a dedicated state management solution to reduce clutter in the
      main `GroupTabs` component.
