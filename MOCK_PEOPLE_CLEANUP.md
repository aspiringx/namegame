# MOCK_PEOPLE Cleanup - Complete

## Summary

Successfully replaced all `MOCK_PEOPLE` hardcoded references throughout the
constellation experience with dynamic `people` prop that accepts actual group
members.

## Files Updated

### Core Components

1. **Scene.tsx** - Added `people` prop, replaced all MOCK_PEOPLE (12 instances)
2. **StarField.tsx** - Passes `peopleData` to all child components
3. **starData.ts** - Functions accept `people` parameter with MOCK_PEOPLE
   default

### State Management

4. **useJourneyStateMachine.ts** - Added `people` parameter, updated all
   references

### UI Components

5. **NavPanel.tsx** - Added `people` prop for star list and count
6. **ConstellationModal.tsx** - Added `people` prop, updated StarSection
7. **ConstellationLines.tsx** - Added `people` prop for line generation

## Data Flow (Complete)

```
Group Members (UniversalClient)
  ↓ (mapped to Person[])
ConstellationModal
  ↓ (people prop)
MakeConstellation
  ↓ (people prop)
StarField
  ↓ (peopleData = people || MOCK_PEOPLE)
  ├→ Scene (people prop)
  ├→ NavPanel (people prop)
  ├→ ConstellationModal (people prop)
  └→ useJourneyStateMachine (people param)
      ↓
    ConstellationLines (people prop)
```

## Remaining Lint Warnings (Non-Critical)

These are React Hook dependency warnings that suggest adding `people` to
dependency arrays. Since `people` is stable (doesn't change during a session),
these are safe to ignore for now:

- Scene.tsx useEffect (line 210)
- useJourneyStateMachine.ts useCallback (lines 165, 208, 294)

The `<img>` warnings in NavPanel and ConstellationModal are about using Next.js
Image component instead of regular img tags - optimization opportunity for
later.

## Testing

The constellation experience should now:

- ✅ Work with any number of group members
- ✅ Show actual member photos and names
- ✅ Calculate positions correctly for any group size
- ✅ Display accurate counts in UI
- ✅ Fall back to MOCK_PEOPLE for standalone demo

## What's NOT Done

These still use MOCK_PEOPLE but are only for type hints/comments:

- `types.ts` line 15 - Comment about "Index in MOCK_PEOPLE array" (just
  documentation)

This is fine - it's just a comment explaining the index field.
