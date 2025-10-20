# Share & Compare Cosmic Insights - Design Document

## Overview

Allow users to invite others to share their perspective on their relationship,
then optionally compare both perspectives using AI analysis.

## User Story

1. User A creates Cosmic Insights about their relationship with User B
2. User A wants to invite User B to share their perspective
3. User B creates their own Cosmic Insights about the relationship
4. Both users can optionally request an AI comparison of their different
   perspectives
5. Comparison results are shared with both parties

---

## Design Options

### 1. Sharing Mechanism - "Invite to Share Perspective"

#### Option A: Direct Link to Pre-filled Chat

**Flow:**

- Button in modal: "Invite [Name] to Share Their Perspective"
- Generates URL: `/chat?recipientId=xyz&prefill=true&contextId=assessment123`
- Opens/creates chat conversation with pre-populated message
- Message template: "I just reflected on our relationship using Cosmic Insights.
  I'd love to hear your perspective too! [Link]"

**Pros:**

- Leverages existing chat infrastructure
- Familiar UX pattern
- No new pages needed
- Direct, personal communication

**Cons:**

- Requires chat message prefill functionality (may not exist yet)
- Less context for recipient
- Could feel intrusive if they're not expecting it

#### Option B: Dedicated Invitation Landing Page

**Flow:**

- Button: "Invite [Name] to Share Their Perspective"
- Generates shareable link: `/cosmic-insights/invitation/[token]`
- Landing page shows:
  - "Joe invited you to share perspectives on your relationship"
  - Brief explanation of Cosmic Insights
  - CTA: "Create Your Cosmic Insights"
- After completion, prompts to share back

**Pros:**

- Better context and explanation
- Less intrusive - recipient can choose when to engage
- Can track invitation status (pending, completed, declined)
- More professional/polished experience

**Cons:**

- Requires new page and routing
- More complex implementation
- Additional database table for invitations

**Recommendation:** Option B provides better UX and sets up infrastructure for
future features, though Option A is faster to implement.

---

### 2. Comparison Flow - After Both Complete

Once both users have created assessments, enable comparison feature.

#### Components Needed:

1. **Detection:** System detects when both parties have assessments
2. **Prompt:** UI prompts users to request comparison
3. **Consent:** Both parties must opt-in to share/compare
4. **AI Analysis:** Generate comparison using existing
   `relation_star_comparison` prompt type
5. **Results Display:** Show side-by-side scores + AI insights
6. **Sharing:** Send results link via chat to both parties

#### Data Model:

```typescript
// New table: relation_star_comparisons
{
  id: string
  userAId: string
  userBId: string
  assessmentAId: string  // FK to ai_requests
  assessmentBId: string  // FK to ai_requests
  comparisonRequestId: string  // FK to ai_requests (the comparison AI response)
  consentUserA: boolean
  consentUserB: boolean
  createdAt: DateTime
  sharedAt: DateTime?
}
```

#### API Endpoints:

- `POST /api/relation-star/compare` - Request comparison (requires both
  assessments)
- `GET /api/relation-star/comparison/[id]` - Fetch comparison results

#### UI Pages:

- `/cosmic-insights/comparison/[token]` - Display comparison results
  - Side-by-side star charts
  - Individual scores comparison table
  - AI analysis of differences and suggestions

---

### 3. Privacy & Permissions

#### Key Questions:

1. **Should sender's insights be visible to recipient before they complete their
   own?**

   - **Recommendation:** No - could bias their assessment
   - Only show that sender completed it, not the actual scores/insights

2. **Should comparison require explicit consent from both parties?**

   - **Recommendation:** Yes - both must opt-in
   - Prevents unwanted sharing of private reflections

3. **Who can see comparison results?**

   - **Recommendation:** Both parties, once both consent
   - Results are shared equally

4. **Can users revoke access to their insights?**
   - **Future consideration:** Allow users to delete/hide their assessment from
     comparison

---

## Proposed Implementation Phases

### Phase 1: Simple Share Button (1-2 files, ~2 hours)

**Goal:** Enable basic sharing without complex infrastructure

**Changes:**

- Add "Share Your Perspective" button in `RelationStarModal.tsx`
- Opens chat with pre-filled message (if chat prefill exists) OR copies
  shareable link
- Message contains link to member's profile or `/relation-star-demo`
- No special landing page - just encourages recipient to create their own

**Files:**

- `apps/web/src/components/RelationStarModal.tsx`
- Possibly chat component if adding prefill

### Phase 2: Invitation System (3-4 files, ~4 hours)

**Goal:** Proper invitation tracking and landing page

**Changes:**

- Create `cosmic_insights_invitations` table
- Generate unique invitation tokens
- Build `/cosmic-insights/invitation/[token]` landing page
- Track invitation status (pending, accepted, declined)
- Better recipient UX with context and explanation

**Files:**

- `packages/db/prisma/schema.prisma` - Add invitations table
- `apps/web/src/app/(main)/cosmic-insights/invitation/[token]/page.tsx` -
  Landing page
- `apps/web/src/app/api/cosmic-insights/invitation/route.ts` - Create invitation
  API
- `apps/web/src/components/RelationStarModal.tsx` - Add share button

### Phase 3: Comparison Feature (4-5 files, ~6 hours)

**Goal:** AI-powered comparison of both perspectives

**Changes:**

- Create `relation_star_comparisons` table
- Detect when both parties have assessments
- Prompt for comparison consent
- Generate AI comparison using existing prompt type
- Build comparison results page
- Send results link via chat

**Files:**

- `packages/db/prisma/schema.prisma` - Add comparisons table
- `apps/web/src/app/(main)/cosmic-insights/comparison/[token]/page.tsx` -
  Results page
- `apps/web/src/app/api/relation-star/compare/route.ts` - Comparison API
- `apps/web/src/components/RelationStarModal.tsx` - Add comparison prompt
- `apps/web/src/components/CosmicInsightsComparison.tsx` - Comparison display
  component

---

## Open Questions

1. **Does the chat system support message prefill?**

   - If not, Phase 1 will just copy a shareable link to clipboard

2. **Should we limit comparison to the most recent assessment from each
   person?**

   - Or allow comparing any two historical assessments?
   - **Recommendation:** Most recent only for simplicity

3. **Should there be a notification when the other person completes their
   assessment?**

   - In-app notification?
   - Email notification?
   - Chat message?

4. **Cost considerations for AI comparisons:**

   - Comparison requests will use ~300 input + 400 output tokens
   - Est. $0.0004 per comparison with gpt-4o-mini
   - Should we rate-limit comparisons per user?

5. **What happens if one person updates their assessment after comparison?**
   - Archive old comparison?
   - Prompt to re-run comparison?
   - Show "outdated" warning?

---

## Next Steps

1. **Decision:** Which phase to start with?
2. **Decision:** Resolve open questions above
3. **Implementation:** Begin with chosen phase
4. **Testing:** Ensure privacy controls work correctly
5. **Iteration:** Gather feedback and refine
