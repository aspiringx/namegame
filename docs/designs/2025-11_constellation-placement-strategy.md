# Constellation Placement Persistence Strategy

**Date**: November 2025  
**Status**: Design Proposal  
**Context**: Live group constellation experience needs to save user placements
across devices and track evolution over time

## Problem Statement

Users place stars (people) in their personal constellation within a group
context. We need to:

1. Persist placements so they appear on multiple devices
2. Track how constellations evolve over time
3. Keep placements personal (not bidirectional like UserUser)
4. Update efficiently without creating excessive database records

## Key Requirements

- **Personal & Asymmetric**: Each user has their own constellation view per
  group
- **Multi-device Sync**: Placements persist across devices
- **Historical Tracking**: See how relationships/placements change over time
- **Efficient Updates**: Don't create a new record for every placement action
- **Group Context**: Same person can be placed differently in different groups

## Proposed Solution: Daily Snapshot Model

### Data Model

```prisma
model Constellation {
  id          String   @id @default(cuid())
  userId      String   // Who created this constellation
  groupId     String   // Which group context
  placements  Json     // Array of placement objects (see structure below)
  createdAt   DateTime @default(now()) // Real timestamp when first created
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  group       Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)

  // No unique constraint - "one per day" enforced in application code
  // This preserves the real createdAt timestamp
  @@index([userId, groupId, createdAt(sort: Desc)])
  @@index([userId, groupId, updatedAt])
}
```

### Placements JSON Structure

```json
{
  "placements": [
    {
      "userId": "user123",
      "placement": "inner",
      "position": { "x": 5.2, "y": -3.1, "z": 2.8 },
      "placedAt": "2025-11-20T17:30:00Z"
    },
    {
      "userId": "user456",
      "placement": "close",
      "position": { "x": -8.5, "y": 2.3, "z": -1.2 },
      "placedAt": "2025-11-20T17:32:15Z"
    }
  ],
  "metadata": {
    "totalStars": 114,
    "placedCount": 12,
    "sessionDuration": 420
  }
}
```

## Update Strategy

### When to Save

Trigger save on these journey phases:

- `returning-batch-complete` - User finished placing a batch
- `returning-journey-complete` - User placed all available stars
- `returning` - User manually zoomed out

All three phases indicate the user is done placing for now.

### How to Save (Upsert Logic)

**Key Point**: We preserve the real `createdAt` timestamp (when the snapshot was
first created). To determine if we should update today's snapshot or create a
new one, we check if a snapshot exists where the date of `createdAt` matches
today's date in the user's timezone.

```typescript
// Pseudo-code for save operation
async function saveConstellation(
  userId,
  groupId,
  placements,
  userTimezone = 'UTC',
) {
  // Get start and end of today in user's timezone
  const todayStart = startOfDay(new Date(), { timeZone: userTimezone })
  const todayEnd = endOfDay(new Date(), { timeZone: userTimezone })

  // Find constellation created today (in user's timezone)
  const existingConstellation = await db.constellation.findFirst({
    where: {
      userId,
      groupId,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (existingConstellation) {
    // UPDATE: Replace placements in today's constellation
    await db.constellation.update({
      where: { id: existingConstellation.id },
      data: {
        placements: placements,
        // updatedAt automatically set by @updatedAt
      },
    })
  } else {
    // CREATE: New constellation for today with real timestamp
    await db.constellation.create({
      data: {
        userId,
        groupId,
        placements: placements,
        // createdAt automatically set by @default(now())
      },
    })
  }
}
```

**Result**: One snapshot per user per group per day (in user's timezone), with
real timestamps preserved. We know exactly when the snapshot was first created
and last updated.

## API Design

### Save/Update Constellation

```typescript
POST /api/groups/[groupId]/constellations
Headers: Authorization: Bearer <token>
Body: {
  placements: [
    { userId, placement, position, placedAt }
  ]
}
Response: {
  id: string,
  updatedAt: string,
  placedCount: number
}
```

### Get Constellations (with pagination)

```typescript
GET /api/groups/[groupId]/constellations
Headers: Authorization: Bearer <token>
Query params:
  - limit: number (default: 1) - Number of constellations to return
  - cursor: string (optional) - Constellation ID to load after (for pagination)
  - date: string (optional) - ISO date to filter by (YYYY-MM-DD)

Examples:
  // Get latest constellation (default)
  GET /api/groups/[groupId]/constellations

  // Get last 10 constellations
  GET /api/groups/[groupId]/constellations?limit=10

  // Get next page (cursor-based pagination)
  GET /api/groups/[groupId]/constellations?limit=10&cursor=clx123abc

  // Get constellation from specific date
  GET /api/groups/[groupId]/constellations?date=2025-11-15

Response: {
  constellations: [
    {
      id: string,
      placements: [...],
      createdAt: string,
      updatedAt: string
    }
  ],
  nextCursor: string | null  // For pagination
}
```

## Client-Side Integration

### Loading Constellation on Mount

```typescript
// In StarField.tsx or Scene.tsx
useEffect(() => {
  async function loadConstellation() {
    // Fetch latest constellation (default limit=1)
    const response = await fetch(`/api/groups/${groupId}/constellations`)
    const data = await response.json()

    if (data.constellations && data.constellations.length > 0) {
      const latestConstellation = data.constellations[0]

      // Restore placements to stars map
      const restoredStars = new Map(stars)
      latestConstellation.placements.forEach((p) => {
        const star = restoredStars.get(p.userId)
        if (star) {
          star.placement = p.placement
          star.constellationPosition = p.position
        }
      })
      setStars(restoredStars)
    }
  }

  loadConstellation()
}, [groupId])
```

### Saving on Returning Phase

```typescript
// In useJourneyStateMachine or Scene.tsx
const lastSavedPhaseRef = useRef<string | null>(null)
const [saveError, setSaveError] = useState<string | null>(null)

useEffect(() => {
  // Only save once per phase change to a returning* phase
  if (
    journeyPhase.startsWith('returning') &&
    journeyPhase !== lastSavedPhaseRef.current
  ) {
    lastSavedPhaseRef.current = journeyPhase
    saveConstellation()
  }
}, [journeyPhase])

async function saveConstellation() {
  const placements = Array.from(stars.entries())
    .filter(([_, star]) => star.placement)
    .map(([userId, star]) => ({
      userId,
      placement: star.placement,
      position: star.constellationPosition,
      placedAt: new Date().toISOString(),
    }))

  try {
    const response = await fetch(`/api/groups/${groupId}/constellations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placements }),
    })

    if (!response.ok) throw new Error('Save failed')

    // Success - clear any error and localStorage backup
    setSaveError(null)
    localStorage.removeItem(`constellation_backup_${groupId}`)
  } catch (error) {
    // Save failed - persist to localStorage and show error
    localStorage.setItem(
      `constellation_backup_${groupId}`,
      JSON.stringify({ placements, timestamp: Date.now() }),
    )
    setSaveError('Saving failed - will retry when online')

    // Retry on next phase change or network reconnect
    // (handled by useEffect watching journeyPhase)
  }
}
```

## Benefits

✅ **Personal & Private** - Each user's constellation is their own view  
✅ **Multi-device Sync** - Saved to server, loads on any device  
✅ **Historical Tracking** - One snapshot per day shows evolution  
✅ **Efficient** - Updates same snapshot multiple times per day  
✅ **Clean Separation** - Doesn't pollute UserUser model  
✅ **Flexible** - Can add metadata (notes, mood, etc.) later  
✅ **Performant** - Single upsert per save, indexed queries

## Edge Cases & Considerations

### 1. User Never Places Anyone

- No snapshot created (only save when placements exist)
- Empty constellation is valid state

### 2. User Removes a Placement

- Snapshot reflects current state (removed user not in placements array)
- Full state replacement on each save

### 3. Multiple Sessions Same Day

- First session creates snapshot
- Subsequent sessions update same snapshot
- `updatedAt` tracks last modification

### 4. Timezone Handling

- Use UTC for `createdAt` date comparison
- "Today" is based on user's timezone on client
- Server converts to UTC for storage/queries

### 5. Group Deletion

- Cascade delete all snapshots for that group
- Defined in schema: `onDelete: Cascade`

### 6. User Deletion

- Cascade delete all snapshots by that user
- Defined in schema: `onDelete: Cascade`

### 7. Placed User Leaves Group

- Snapshot still contains their userId
- Client handles missing user gracefully (skip or show placeholder)

## Future Enhancements

### Phase 2: Snapshot Metadata

```json
{
  "placements": [...],
  "metadata": {
    "totalStars": 114,
    "placedCount": 12,
    "sessionDuration": 420,
    "mood": "focused",
    "notes": "Team restructure today"
  }
}
```

### Phase 3: Comparison View

- "Compare constellation from [date] to [date]"
- Show which placements changed
- Visualize relationship evolution

### Phase 4: Shared Constellations

- Optional: Share your constellation view with group
- See how others perceive relationships
- Privacy controls per user

## Alternative Approaches Considered

### Alternative 1: Individual Placement Records

```prisma
model ConstellationPlacement {
  id          String   @id @default(cuid())
  userId      String
  placedUserId String
  groupId     String
  placement   String
  position    Json
  createdAt   DateTime @default(now())
  @@unique([userId, groupId, placedUserId])
}
```

**Rejected because:**

- More complex queries (need to join all placements)
- Harder to get "state at a point in time"
- More database records (one per placement vs one per day)

### Alternative 2: Extend UserUser Model

```prisma
model UserUser {
  // ... existing fields
  constellationPlacement   String?
  constellationPosition    Json?
  placedAt                 DateTime?
}
```

**Rejected because:**

- UserUser is bidirectional (both users see same record)
- Mixes relationship data with spatial data
- No historical tracking
- Doesn't fit "personal constellation" concept

### Alternative 3: Snapshot on Every Save

Create new snapshot every time user zooms out.

**Rejected because:**

- Too many records (could be 10+ per day)
- Cluttered history
- Harder to query "latest state"

## Implementation Plan

### Phase 1: Basic Persistence (MVP)

1. Add `Constellation` model to schema
2. Run migration
3. Create API endpoints (POST, GET current)
4. Add save trigger on returning phases
5. Add load on constellation mount
6. Test multi-device sync

### Phase 2: Historical Tracking

1. Implement pagination for loading multiple constellations
2. Add date picker or timeline UI
3. Add "view past constellation" feature (load historical state into scene)
4. Add visualization showing how constellation evolved over time
5. Test time-travel functionality

**Example use case**: User can see how their team constellation changed over the
past 6 months, visualizing relationship shifts as people moved between
inner/close/outer circles.

### Phase 3: Analytics & Insights

1. Track placement changes over time
2. Show "relationship stability" metrics
3. Highlight recent changes
4. Export constellation data

## Design Decisions

### 1. Save Strategy ✅

**Decision**: Save immediately when `journeyPhase` changes to any `returning*`
phase.

**Implementation requirements**:

- Use `useRef` to track last saved phase - only save once per phase change
- If save fails (network error):
  - Persist unsaved constellation to localStorage
  - Show subtle indicator: "Saving failed - will retry when online"
  - Retry on next phase change or when network reconnects
  - Clear localStorage once successfully saved
- No debouncing - user doesn't control save timing

### 2. Multiple Tabs ✅

**Decision**: Last-write-wins (unlikely edge case, acceptable for MVP)

- Multiple tabs can update same constellation
- Most recent `updatedAt` wins
- No optimistic locking needed initially

### 3. User Feedback ✅

**Decision**: Silent auto-save with error-only notifications

- **Success**: No toast, no indicator - it just works
- **Failure**: Subtle persistent indicator showing save failed + will retry
- Users shouldn't be bothered with "saved successfully" messages

### 4. Data Retention ✅

**Decision**: Keep all constellations indefinitely

- No automatic deletion or archiving
- Can add retention policy later if storage becomes concern
- Historical data valuable for evolution visualization

## Success Metrics

- ✅ User can place stars and see them on another device
- ✅ Placements persist across sessions
- ✅ Historical snapshots show evolution over time
- ✅ Save operation completes in <500ms
- ✅ Load operation completes in <300ms
- ✅ No data loss during normal usage

## Next Steps

1. Review and approve this design
2. Create Prisma migration
3. Implement API endpoints
4. Add client-side save/load logic
5. Test with real group data
6. Deploy and monitor
