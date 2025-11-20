# Personalized Constellation Greeting

## Summary

Updated the constellation experience to greet users by name and use the actual
group name instead of "Hypothetical Group".

## Changes Made

### 1. UniversalClient.tsx

- Pass `currentUserName` to ConstellationModal
- Uses `currentUserMember?.user?.firstName` (preferred) or falls back to full
  name

### 2. ConstellationModal.tsx

- Added `currentUserName` prop
- Passes it through to MakeConstellation

### 3. MakeConstellation.tsx

- Added `groupName` and `currentUserName` props
- Passes both to StarField

### 4. StarField.tsx

- Added `groupName` and `currentUserName` props
- Uses `actualGroupName = groupName || 'Hypothetical Group'` for fallback
- Passes both to useJourneyStateMachine

### 5. useJourneyStateMachine.ts

- Added `currentUserName` parameter
- Updated intro message logic:
  ```typescript
  const greeting = currentUserName
    ? `Hi ${currentUserName}, welcome to the ${groupName} cluster. Sensors detect ${people.length} stars.`
    : `Welcome to the ${groupName} cluster. Sensors detect ${people.length} stars.`
  ```

## Example Output

**Before:**

```
Welcome to the Hypothetical Group cluster. Sensors detect 20 stars.
```

**After (authenticated user):**

```
Hi Joe, welcome to the Tippetts Family cluster. Sensors detect 15 stars.
```

**After (standalone demo):**

```
Welcome to the Hypothetical Group cluster. Sensors detect 20 stars.
```

## Data Flow

```
UniversalClient
  ↓ currentUserMember.user.firstName
  ↓ groupContext.group.name
ConstellationModal
  ↓ currentUserName, groupName
MakeConstellation
  ↓ currentUserName, groupName
StarField
  ↓ currentUserName, actualGroupName
useJourneyStateMachine
  ↓ Personalized greeting in INTRO_MESSAGES
```

## Testing

1. Open any group as an authenticated user
2. Click the sparkles icon (✨)
3. Verify the intro message shows: "Hi [YourName], welcome to [GroupName]
   cluster..."
4. Open `/constellations` standalone demo
5. Verify it still shows: "Welcome to the Hypothetical Group cluster..."
