# Relationship Strategy: The Five Forces Framework

**Date**: November 2025  
**Status**: Design Proposal  
**Context**: Unified approach to modeling relationships between people and
groups in Relation Star

## Executive Summary

Human relationships are complex, multidimensional, and deeply personal. They
change over time. This document proposes a framework that separates **objective
facts** (relationship labels, group membership) from **subjective feelings**
(how close/distant you feel about someone at different points in time).

**Using stars as a metaphor**, we represent people as stars in your personal
universe. Each person occupies a position in space relative to you (the center),
with their placement determined by how you perceive the relationship. Stars can
be close or distant, moving toward or away from you, attracting or repelling,
resonating or clashing. This metaphor captures the dynamic, multidimensional
nature of human relationships—they're not static labels, but living systems
governed by forces that change over time.

The framework is built on **five fundamental forces** that govern all
relationships, mirroring how stars interact in space:

1. **Space** - Distance, relative size, perceived energy exchange
2. **Time** - History, evolution, the arc of the relationship
3. **Motion** - Current trajectory, speed, direction of change
4. **Magnetism** - Attraction/repulsion, strength and polarity
5. **Alignment** - Resonance/dissonance, compatibility

## The Problem

Current systems in Relation Star conflate multiple concepts:

- **UserUser** - Uses relationship labels (friend, sibling) as a proxy for
  closeness
  - Relationship with `self` is important for understanding relationships with
    other people and groups. It's influenced by how someone takes care (and has
    care taken) for their own needs: health, nutrition, sleep, emotional
    wellbeing, exercise, financial, education, employment, etc. When these are
    overlooked or unmet, it affects other relationships.
- **GroupUser** - Treats group membership as static
- **Group hierarchy** - Parent/child relationships not fully implemented
- **Constellation [proposed]** - Placement as a proxy for current feeling

These overlapping systems create confusion and don't capture the **subjective,
temporal, private** nature of how you actually/currently feel in relationships
with yourself, other people, and groups.

### Key Issues

1. **Labels ≠ Feelings**: A sibling (label) might feel distant (feeling). A
   friend you haven't seen in 20 years is still a friend (label) but not close
   (feeling).

2. **Asymmetric Feelings**: If I place you as "close" but you place me as "far,"
   that's painful information. Each person's subjective view must remain
   private.

3. **Relationships Change**: Labels can change (friend → spouse → ex-spouse).
   Feelings change more frequently (close → distant → close again).

4. **Context Matters But Doesn't Define**: The same person appears in multiple
   groups (family, work, church), but your feeling about them transcends any
   single context.

## The Center Star: Foundation of All Relationships

Before exploring the five forces that govern relationships between stars, we
must understand the most fundamental relationship: **your relationship with
yourself**.

### You Are the Center of Your Constellation

In your personal constellation, you occupy the center—not because you're the
most important, but because **it's your perspective**. Every other star's
position is relative to you. This isn't egotistical; it's simply how perception
works. You can't see the universe from anyone else's vantage point.

But here's the paradox: **The quality of your center star affects how you
perceive and interact with all other stars.**

### The Physics of Self-Relationship

In astronomy, a star's health determines what it can sustain:

- A **healthy star** radiates energy outward, sustaining its solar system
- A **dying star** collapses inward, its gravity pulling everything toward chaos
- A star's **internal fusion** (its core processes) determines its brightness
  and stability

**Translation to human relationships:**

- When you're **depleted** (poor sleep, unmet needs, burnout), you have less
  energy to give → relationships suffer
- When you're **healthy** (needs met, emotionally regulated), you can engage
  authentically → relationships thrive
- Your **internal state** is the energy source for all your relational exchanges

### The Six Dimensions of Center Star Health

Your relationship with yourself encompasses how you care for (and have care
taken for) your fundamental needs:

1. **Physical** - Sleep, nutrition, exercise, health
2. **Emotional** - Regulation, processing, expression, wellbeing
3. **Mental** - Clarity, focus, learning, growth
4. **Social** - Connection needs being met
5. **Material** - Financial security, employment, housing
6. **Purpose** - Meaning, contribution, values alignment

When these dimensions are overlooked or unmet, it affects every other
relationship. Not because you're selfish for attending to them, but because **a
depleted person can't accurately assess their relationships or show up
authentically**.

### How Center Star Health Affects Perception

**When your center star is healthy:**

- Distances feel manageable (you have energy to maintain connections)
- Magnetism is clearer (you can discern healthy attraction from codependence)
- Alignment is easier (you're not projecting unmet needs onto others)
- Motion is intentional (you're moving toward growth, not running from pain)
- Time feels abundant (you can invest in relationships)

**When your center star is depleted:**

- Everything feels farther away (isolation)
- Magnetism gets distorted (clinging to toxic relationships, pushing away
  healthy ones)
- Alignment is harder (conflict feels overwhelming)
- Motion is reactive (drifting or fleeing)
- Time feels scarce (relationships feel like burdens)

### The Inseparability Paradox

Here's the paradox that makes this framework powerful: **Self-care is
inseparable from relationships with others.**

You can't truly care for yourself in isolation:

- Physical health requires others (healthcare, food systems, safety)
- Emotional wellbeing requires connection and support
- Mental growth requires teachers, mentors, conversations
- Social needs are inherently relational
- Material security often depends on employment and community
- Purpose emerges through contribution to others

**The insight:** Attending to your center star isn't selfish—it's **realistic**.
A healthy center star doesn't withdraw from relationships; it engages more
authentically. The goal isn't independence, but **interdependence from a place
of wholeness rather than depletion**.

### Tracking Self-Relationship

In the data model, self-relationship is captured as a special case of
`RelationshipFeeling` where `userId === targetUserId`:

```
{
  userId: "joe",
  targetUserId: "joe",
  position: { x: 0, y: 0, z: 0 }, // Always at center

  centerStarHealth: {
    physical: 0.7,
    emotional: 0.5,
    mental: 0.8,
    social: 0.6,
    material: 0.9,
    purpose: 0.7
  },

  overallHealth: 0.7, // Weighted average
  resonance: 0.6, // How aligned you are with your values
  notes: "Feeling stretched thin this week, not sleeping well"
}
```

This isn't just data—it's **context** for understanding all other placements.
When you see your constellation and notice everyone feels distant, you can ask:
"Is this about them, or is my center star dimming?"

## The Five Forces Framework

With the foundation of center star health established, we can now explore the
five fundamental forces that govern relationships between stars:

### 1. Space

**Your mental map of the universe. Its size and your position in it, physical or
mental, relative to other stars.**

- **Distance** - How close or far someone feels right now
- **Relative size** - How much energy/attention this relationship occupies in
  your life
- **Perceived exchange** - Is energy flowing between you? Balanced or one-sided?

**Examples:**

- Close friend: Small distance, moderate size, balanced exchange
- Demanding relative: Small distance, large size, unbalanced exchange (they take
  more than they give)
- Distant acquaintance: Large distance, small size, minimal exchange

### 2. Time

**Ongoing movement of stars, chosen and imposed, that change their relative
positions in space.**

- **History** - The arc of the relationship over months, years, decades
- **Evolution** - How the relationship has changed
- **Accumulated experience** - Shared memories, past closeness or distance

**Examples:**

- Childhood friend: Were very close (past), now distant (present), but history
  remains
- New relationship: No history yet, but building
- Former spouse: Deep shared history, but relationship fundamentally changed

**Key insight:** "Once-nearby stars apart with indifference" - they _were_
close, now they're not. Time captures this arc.

### 3. Motion

**Ongoing movements of stars, chosen and imposed, that change their relative
positions in space.**

- **Trajectory** - Are you moving toward each other, drifting apart, or
  maintaining distance?
- **Speed** - How quickly is the relationship changing?
- **Direction** - Approaching, receding, orbiting (maintaining distance but
  still connected)

**Examples:**

- Growing friendship: Approaching trajectory, moderate speed
- Fading relationship: Drifting trajectory, slow speed
- Stable relationship: Orbiting trajectory, no speed (maintaining consistent
  distance)

**Distinction from Time:** Motion is the _current_ velocity/direction. Time is
the _accumulated_ history.

### 4. Magnetism

**Forces that attract or repel stars based on alignment.**

- **Polarity** - Positive (attracted to), negative (repelled by), or neutral
- **Strength** - How strong is the pull or push?
- **Distance decay** - Magnetic force weakens with distance

**Examples:**

- Energizing friend: Positive polarity, strong strength - you're drawn to spend
  time together
- Draining person: Negative polarity, strong strength - you actively avoid them
- Neutral colleague: Neutral polarity, weak strength - no particular pull either
  way

**Key insight:** Magnetism can change. Someone you were drawn to can become
someone you avoid. The "charge" flips.

**Not romantic:** Attraction doesn't have to be romantic. You can be attracted
to someone's energy, ideas, humor, or competence.

### 5. Alignment

**If, where, and how energy is shared between nearby stars.**

- **Resonance** - Do your energies harmonize or clash?
- **Compatibility** - Can you function together without collision?
- **Shared foundation** - Common values, compatible communication styles

**Examples:**

- High alignment: Shared values, easy communication, mutual understanding
- Low alignment: Constant misunderstandings, different worldviews, friction
- Misaligned but attracted: "Opposites attract" - drawn together but clash
  frequently

**Distinction from Magnetism:**

- **Magnetism** = Are you drawn to or repelled by someone? (The pull)
- **Alignment** = Do you resonate or clash when together? (The compatibility)

You can be strongly attracted to someone (high magnetism) but constantly clash
(low alignment). Or feel aligned with someone but not particularly drawn to
them.

## The Diversity Paradox

"Opposites attract" vs. "Birds of a feather flock together" - both are true.

**Magnetism** can represent **attraction to difference** - the pull toward
someone _because_ they're not like you. Complementary energies. Different
perspectives. This is positive magnetism toward diversity.

**Alignment** represents **shared foundation** - the common ground you need to
actually function together. Shared values, compatible communication styles,
mutual respect.

**A healthy relationship might have:**

- Moderate-to-high magnetism (drawn to each other, energized by differences)
- Moderate-to-high alignment (enough common ground to work through conflicts)
- Diverse but aligned (different in enriching ways, same in foundational ways)

**The metaphor:** You can have different orbital patterns (diverse) but still be
aligned in a way that creates a stable system. Or you can be pulled toward each
other but have incompatible orbits that cause chaos.

## Proposed Data Model

### Separation of Concerns

**Objective Facts** (can be shared/public):

- Relationship labels: "sibling", "spouse", "friend", "colleague"
- Group membership: "member of this church", "employee at this company"
- Group hierarchy: "this choir is part of this church"

**Subjective Feelings** (deeply private):

- Current proximity: How close/distant you feel right now
- Alignment: Do we resonate or clash?
- Magnetism: Am I drawn to or drained by this person?
- Motion: Is this relationship growing or fading?
- Time/history: We were close, now we're distant

### 1. UserUser - Objective Relationship Labels (Shared)

**Purpose:** Track factual relationship types that can be mutually agreed upon.

**Characteristics:**

- Can be mutual/shared (both people agree on the label)
- Changes rarely (friend → spouse, colleague → former colleague)
- Multiple labels possible per relationship (sibling + friend)
- Visible to both parties (with consent)

**Current Schema:**

```prisma
model UserUser {
  id             Int      @id @default(autoincrement())
  user1Id        String
  user2Id        String
  greetCount     Int                  @default(0)
  relationTypeId Int
  createdAt      DateTime             @default(now())
  updatedAt      DateTime             @updatedAt
  deletedAt      DateTime?
  user1          User                 @relation("User1Relation", fields: [user1Id], references: [id])
  user2          User                 @relation("User2Relation", fields: [user2Id], references: [id])
  relationType   UserUserRelationType @relation(fields: [relationTypeId], references: [id])

  @@unique([user1Id, user2Id, relationTypeId])
}
```

**Proposed Changes:**

- Support multiple relationship types per pair (remove unique constraint on
  relationTypeId, or allow multiple UserUser records)
- Add history tracking (when labels change)
- Consider making labels unidirectional (you call them "friend", they might call
  you "acquaintance")

### 2. GroupUser - Group Membership with Roles (Shared within group)

**Purpose:** Track who's in which groups and their roles over time.

**Characteristics:**

- Visible to group members (or subset based on permissions)
- Changes over time (active → alumnus, member → admin)
- Roles can evolve (volunteer → leader → emeritus)
- Membership can be temporary or permanent

**Examples:**

- Church: member, leader, alumnus
- Company: employee, manager, former employee
- Family: active member, estranged, reconnected

**Proposed Changes:**

- Add role history tracking
- Support multiple simultaneous roles
- Add membership status (active, inactive, alumnus, former)
- Track start/end dates for roles

### 3. Group Hierarchy - Parent/Child Relationships (Shared)

**Purpose:** Track how groups relate to each other in hierarchical structures.

**Characteristics:**

- Groups can have multiple parent groups (many-to-many)
- Groups can have multiple child groups
- Two types of relationships:
  - **Owned** - Child dies when parent ends (e.g., church committee)
  - **Associated** - Child persists independently (e.g., alumni group)
- Permissions can cascade or be isolated

**Examples:**

- Church > Choir > Youth Choir
- Company > Department > Team
- Extended Family > Nuclear Family > Household
- University > College > Department > Research Lab

**Current Status:** Partially implemented, needs full many-to-many support.

**Proposed Changes:**

- Implement full many-to-many group relationships
- Add relationship type (owned vs. associated)
- Add permission inheritance rules
- Support viewing a group in multiple parent contexts

### 4. RelationshipFeeling - Subjective Placement (Private)

**Purpose:** Capture how YOU feel about someone right now, based on the five
forces.

**Characteristics:**

- **Deeply private** - only visible to the person who created it
- **Unidirectional** - your feeling ≠ their feeling
- **Changes frequently** - as feelings evolve
- **Global** - transcends group context (your feeling about someone is the same
  regardless of which group you're viewing)
- **Multidimensional** - captures all five forces

**Proposed Schema:**

```prisma
model RelationshipFeeling {
  id           String   @id @default(cuid())
  userId       String   // The observer (self)
  targetUserId String   // The other person

  // SPACE - Position and perceived energy exchange
  position     Json     // { x, y, z } - 3D coordinates in personal constellation
  distance     Float    // Calculated from position, for queries
  relativeSize Float    @default(1.0) // How much space/energy this relationship occupies
  energyFlow   String   @default("balanced") // "balanced", "giving", "taking", "stagnant"

  // TIME - History and evolution
  relationshipAge Int?   // Days since relationship began
  historyDepth String   @default("new") // "new", "developing", "established", "long-term"

  // MOTION - Trajectory and change
  trajectory   String   @default("stable") // "approaching", "drifting", "stable", "orbiting"
  changeSpeed  String   @default("slow") // "rapid", "moderate", "slow", "static"

  // MAGNETISM - Attraction/repulsion
  polarity     String   @default("neutral") // "positive", "negative", "neutral"
  magneticStrength Float @default(0.5) // 0.0 (weak) to 1.0 (strong)

  // ALIGNMENT - Resonance and compatibility
  resonance    Float    @default(0.0) // -1.0 (dissonant) to +1.0 (resonant)
  compatibility String  @default("neutral") // "harmonious", "complementary", "neutral", "friction", "incompatible"

  // CENTER STAR HEALTH (only for self-relationship where userId === targetUserId)
  centerStarHealth Json? // { physical, emotional, mental, social, material, purpose }
  overallHealth Float?  // 0.0 to 1.0, weighted average of health dimensions

  // METADATA
  placedAt     DateTime @default(now())
  updatedAt    DateTime @updatedAt
  lastReviewed DateTime? // When user last consciously considered this placement
  notes        String?  // Private notes about the relationship

  user         User     @relation("FeelingsByUser", fields: [userId], references: [id], onDelete: Cascade)
  targetUser   User     @relation("FeelingsAboutUser", fields: [targetUserId], references: [id], onDelete: Cascade)

  @@unique([userId, targetUserId])
  @@index([userId])
  @@index([userId, distance]) // For "who's closest" queries
  @@index([userId, trajectory]) // For "who's drifting" queries
  @@index([userId, overallHealth]) // For center star health queries
}
```

**Key Design Decisions:**

1. **Global, not group-scoped** - Your feeling about someone transcends context.
   When viewing a group constellation, filter RelationshipFeelings by group
   membership, but the feelings themselves are universal.

2. **Privacy is paramount** - Never reveal one person's feelings to another. The
   system should allow relationships to be unbalanced without shame.

3. **Multidimensional** - Captures all five forces, not just distance. This
   enables rich experiences beyond simple placement.

4. **Queryable** - Indexed fields allow for queries like "show me relationships
   that are drifting" or "who am I most aligned with?"

## How the Systems Work Together

### Example 1: Siblings Who Aren't Close

**UserUser:**

```
relationTypeId = "sibling" (objective, shared, permanent)
```

**GroupUser:**

```
Both in "Extended Family" group (shared)
```

**RelationshipFeeling (You → Sibling):**

```
distance = 25.0 (far)
resonance = -0.3 (slight dissonance)
polarity = "neutral" (no strong pull either way)
trajectory = "stable" (not changing)
(private - only you see this)
```

**RelationshipFeeling (Sibling → You):**

```
distance = 8.0 (close)
resonance = 0.7 (high resonance)
polarity = "positive" (drawn to you)
trajectory = "approaching" (wanting to get closer)
(private - only they see this, you never see it)
```

**Result:** The label "sibling" is shared and permanent. But your feelings are
completely different and private. They feel close to you, you feel distant from
them. Neither knows how the other feels unless explicitly communicated.

### Example 2: Friend Becomes Spouse, Then Ex-Spouse

**Timeline:**

**Year 1-3 (Dating):**

- UserUser: `relationTypeId = "friend"`
- RelationshipFeeling: distance = 5.0, polarity = "positive", resonance = 0.8

**Year 4-8 (Married):**

- UserUser: `relationTypeId = "spouse"` (label changed)
- RelationshipFeeling: distance = 2.0, polarity = "positive", resonance = 0.9

**Year 9-10 (Marriage struggles):**

- UserUser: `relationTypeId = "spouse"` (label unchanged)
- RelationshipFeeling: distance = 15.0, polarity = "neutral", resonance = -0.2,
  trajectory = "drifting"

**Year 11+ (Divorced):**

- UserUser: `relationTypeId = "ex-spouse"` (label changed)
- GroupUser: Removed from "Our Family" group
- RelationshipFeeling: distance = 40.0, polarity = "negative", resonance = -0.7

**Result:** Labels change rarely. Feelings change frequently. Both are tracked
independently.

### Example 3: Former Colleague, Still Friends

**UserUser:**

```
relationTypeId = ["colleague", "friend"] (multiple labels)
After job change: ["former colleague", "friend"]
```

**GroupUser:**

```
Removed from "Company" group
Both still in "College Friends" group
```

**RelationshipFeeling:**

```
distance = 8.0 (close - unchanged after job change)
polarity = "positive"
resonance = 0.6
trajectory = "stable"
```

**Result:** Group membership changes, but the feeling persists. The relationship
transcends the work context.

## Constellation Experience Design

When a user views a constellation (group context):

1. **Load group members** (GroupUser) - who's in this group?
2. **Load your RelationshipFeelings** for those people (private) - how do you
   feel about each person?
3. **Display based on YOUR feelings** - position stars using space, color by
   alignment, show motion trails for trajectory
4. **Never show how they placed you** - their feelings remain private

### Visual Encoding of the Five Forces

**Space:**

- Position in 3D space (x, y, z coordinates)
- Distance from center (you)
- Size of star (relativeSize)

**Time:**

- Trail showing past positions (if historical data exists)
- Visual indicator of relationship age (new stars glow differently)

**Motion:**

- Motion trails showing trajectory
- Animation speed showing changeSpeed
- Arrow or vector showing direction

**Magnetism:**

- Glow intensity (magneticStrength)
- Color temperature (positive = warm, negative = cool, neutral = white)
- Particle effects (attraction = particles flow toward you, repulsion =
  particles flow away)

**Alignment:**

- Star color (resonant = harmonious colors, dissonant = clashing colors)
- Pulse pattern (aligned stars pulse in sync with yours, misaligned pulse out of
  sync)

## User Experiences Enabled by This Framework

### 1. Center Star Check-In

**Before viewing your constellation**, a quick self-assessment to establish
context.

**Purpose:** Prime users to be self-aware before judging others. Contextualizes
their perception ("I'm seeing everyone as distant because I'm exhausted").

**Experience:**

```
"Before exploring your constellation, let's check in with your center star.
How are you feeling today?"

[Physical] 😴 Exhausted ─────●─── 😊 Energized
[Emotional] 😰 Overwhelmed ───●──── 😌 Balanced
[Mental] 😵‍💫 Foggy ──────●─── 🧠 Clear
[Social] 😔 Isolated ─────●──── 🤗 Connected
[Material] 😟 Stressed ───────●─ 😊 Secure
[Purpose] 😕 Lost ────────●── ⭐ Aligned

[Skip for now] [Save & Continue]
```

**Takes 30 seconds. Optional but encouraged.**

**Benefits:**

- Normalizes that **your state affects your view**
- Provides context for constellation perception
- Tracks how center star health correlates with relationship patterns
- Gentle reminder to attend to self before focusing on others

**Insights enabled:**

- "You tend to see relationships as more distant when your physical health is
  low"
- "When your purpose alignment is high, you're more likely to approach drifting
  relationships"
- "Your emotional state strongly affects how you perceive magnetism"

**Gentle prompts when health is low:**

- "Your center star has been dimming this week. Consider what needs attention
  before making big changes to your constellation."
- "When your center star is healthy, you tend to feel more aligned with others.
  What's different this week?"

### 2. Constellation Placement

Place stars in 3D space based on how close/distant you feel.

**Visual representation of center star:**

- **Brightness** - Overall energy/health
- **Color** - Emotional state (warm when healthy, cool when depleted)
- **Pulse rate** - Stress level (slow and steady vs rapid)
- **Size** - Sense of self (too small = diminished, too large = inflated)

**When center star health is low:**

- Other stars appear dimmer (harder to see clearly)
- Distances feel exaggerated (everything feels farther)
- Motion trails are erratic (relationships feel unstable)

### 3. Relationship Review

- "Stars that are drifting" - show relationships with `trajectory = "drifting"`
- "Stars you haven't reviewed" - sort by `lastReviewed`
- Prompt: "Is this person still in the right place?"

### 4. Energy Audit

- "Which relationships take the most energy?" - sort by `relativeSize` and
  `energyFlow = "taking"`
- "Where is there dissonance?" - filter by `resonance < 0`
- Visualize as energy flow diagram

### 5. Relationship Evolution

- Show how position, alignment, trajectory changed over time
- "This person was drifting, but now they're approaching"
- Historical snapshots show the motion

### 6. Alignment Explorer

- "Who am I most aligned with?" - sort by `resonance`
- "Show me complementary relationships" - high magnetism, moderate alignment
- "Show me harmonious relationships" - high alignment, high magnetism

### 7. Magnetism Map

- Visualize attraction/repulsion forces
- "Who drains my energy?" - negative polarity, high strength
- "Who energizes me?" - positive polarity, high strength

### 8. Center Star Health Impact Analysis

- Show how your center star health affects your constellation view
- "When your physical health is low, you tend to see relationships as more
  distant"
- "Your emotional state correlates with how you perceive magnetism"
- Overlay historical center star health with relationship changes
- Helps distinguish: "Is this relationship actually changing, or is my
  perception changing?"

## Privacy and Asymmetry

### Core Principles

1. **Your feelings are yours alone** - Never reveal one person's
   RelationshipFeeling to another
2. **Asymmetry is normal** - It's okay for feelings to be unbalanced
3. **No comparison** - Don't show "they placed you closer than you placed them"
4. **Consent for sharing** - If users want to share their constellation view, it
   must be explicit opt-in

### What Can Be Shared

**With consent:**

- UserUser relationship labels (both parties agree)
- GroupUser membership (visible to group)
- Group hierarchy (visible based on permissions)

**Never shared:**

- RelationshipFeeling data (always private)
- Comparisons between two people's feelings
- Aggregate data that could reveal individual feelings

## Implementation Considerations

### Phase 1: Core Models

1. Enhance UserUser to support multiple labels and history
2. Enhance GroupUser to support roles and history
3. Implement full Group hierarchy (many-to-many)
4. Create RelationshipFeeling model

### Phase 2: Constellation Experience

1. Build constellation placement UI using RelationshipFeeling.position
2. Visual encoding of the five forces
3. Save/load functionality
4. Multi-device sync

### Phase 3: Advanced Experiences

1. Relationship review tools
2. Energy audit visualizations
3. Historical tracking and evolution views
4. Alignment/magnetism explorers

### Phase 4: Analytics and Insights

1. Identify patterns in your constellation
2. Suggest relationships that need attention
3. Highlight changes over time
4. Export data for personal reflection

## Open Questions

1. **Should UserUser support multiple labels per relationship?**

   - Proposal: Yes, allow multiple labels (sibling + friend)
   - Implementation: Either allow multiple UserUser records or change to array
     of relationTypeIds

2. **Should GroupUser track role history?**

   - Proposal: Yes, add GroupUserHistory model or timeline field
   - Use case: "I was a member 2020-2023, now I'm an alumnus"

3. **Should RelationshipFeeling be scoped to groups or global?**

   - Proposal: Global - your feeling about someone transcends context
   - Implementation: Filter by group membership when viewing, but feelings are
     universal

4. **What do we call RelationshipFeeling?**

   - Options: RelationshipFeeling, PersonalConstellation, RelationshipView,
     SubjectiveRelationship
   - Proposal: RelationshipFeeling (emphasizes the subjective, emotional nature)

5. **How do we handle historical tracking?**

   - Option A: Snapshot entire constellation periodically (ConstellationSnapshot
     model)
   - Option B: Track changes to individual RelationshipFeelings
     (RelationshipFeelingHistory model)
   - Option C: Both (snapshots for overview, history for detail)

6. **Should we track "Self" as a special RelationshipFeeling?**

   - **Decision: Yes** - where `userId === targetUserId`
   - Use case: Track how your self-perception and center star health changes
     over time
   - Position: Always at origin (0, 0, 0), but centerStarHealth and other
     attributes vary
   - This is the foundation that contextualizes all other relationship
     perceptions

7. **How should Center Star Check-In be prompted?**

   - Option A: Required before every constellation view
   - Option B: Optional prompt, can be skipped
   - Option C: Periodic reminders (e.g., once per day)
   - Proposal: Option B + C - Optional but encouraged, with gentle daily
     reminders

8. **Should center star health affect visual rendering of constellation?**
   - Proposal: Yes - when health is low, other stars appear dimmer, distances
     exaggerated
   - This makes the subjective nature of perception explicit and visible
   - Users can toggle "health-adjusted view" vs "neutral view"

## Success Metrics

- ✅ Users can place people based on subjective feelings, not just labels
- ✅ Feelings remain private - no one sees how you placed them
- ✅ Relationships can be asymmetric without shame
- ✅ Labels and feelings are tracked independently
- ✅ System supports all five forces (space, time, motion, magnetism, alignment)
- ✅ **Center star health is tracked and contextualizes all other
  relationships**
- ✅ **Users understand that their internal state affects their perception**
- ✅ Experiences are consistent with star metaphor
- ✅ Users can track how relationships evolve over time
- ✅ **Self-care is integrated naturally, not as separate feature**

## The Relation Star Differentiator

**Most relationship apps focus on:** Managing relationships with others

**Relation Star focuses on:** Understanding that your relationship with yourself
is the lens through which you see all other relationships

### The Key Insight

You're not being selfish by attending to your center star—you're being
**realistic**. A depleted person can't accurately assess their relationships or
show up authentically.

The paradox: Self-care isn't separate from relationships. It's inseparable. You
can't truly care for yourself in isolation, and you can't show up fully for
others when your center star is collapsing.

### The Message

**This isn't about self-centeredness. It's about self-awareness.**

When you notice everyone in your constellation feels distant, you can ask: "Is
this about them, or is my center star dimming?" This question transforms how you
approach relationships—with curiosity instead of judgment, with self-compassion
instead of blame.

**The goal isn't independence. It's interdependence from a place of wholeness
rather than depletion.**

## Next Steps

1. Review and refine this framework
2. Decide on open questions (multiple labels, history tracking, naming)
3. Create detailed schema migrations
4. Design API endpoints
5. Build constellation placement experience
6. Test with real users
7. Iterate based on feedback

## Appendix: Relationship Types

### Types of Relationships (from framework)

**Self** - How a star understands its place in the universe

- From birth, relationship with self is defined by relation to other stars
- Healthy stars regularly exchange positive energy or none, no energy, with
  other stars
- Unhealthy stars exchange negative energy, or waste, no energy, with other
  stars

**Personal** - Two people who share energy directly with each other

- Different levels: family, close friend, friend, acquaintance, stranger, enemy
- These labels tend to stick, even with dissonance over an extended period to
  separate
- Many relationships only exist due to current shared space and time (school,
  job, neighborhood)
- When context changes, relationship quickly changes, requiring effort to keep
  it

**Group** - Shared spaces and times where stars have the possibility of meeting
and sharing energy

- Shared spaces and casual relationships are more likely to happen to the extent
  each star has chances to be near and align with other stars
- Shared space and time create conditions for different types of relationships,
  but close relationships only form when resonance aligns people, creating
  magnetism that increases opportunity for more resonance

**Sub-groups** - Within larger groups, many sub-groups may have different
relationships to other groups

- As part of another group, like a choir within a congregation or a class within
  a school
- Other sub-groups can exist within many groups, like a family that has members
  in multiple groups
- Sub-groups may be part of multiple group hierarchies
- One family could be a sub-group within multiple families (extended family
  hierarchies)
- A church, a school, a neighborhood, etc. AND a church congregation may be part
  of its own denominational hierarchy

## Appendix: Fundamental Forces Details

### Space

Your mental map of the universe. Its size and your position in it, physical or
mental, relative to other stars.

**How Forces are Perceived and Measured:**

- Distance, relative size, and perceived exchange of energy

### Time

Ongoing movement of stars, chosen and imposed, that change their relative
positions in space.

**How Forces are Perceived and Measured:**

- History, evolution, accumulated experience

### Motion

Ongoing movements of stars, chosen and imposed, that change their relative
positions in space.

**How Forces are Perceived and Measured:**

- Speed, direction

### Magnetism

Forces that attract or repel stars based on alignment.

**How Forces are Perceived and Measured:**

- Strength, positive, negative
- Resonance, dissonance, indifference, instability

**Key Properties:**

- If, where, and how energy is shared between nearby stars
- Aligned energies bind stars together with resonance. The longer stars are
  closely aligned, the stronger their bond remains across space and time
- Misaligned energies push stars apart with dissonance unless energies can be
  aligned to create resonance
- Once nearby stars apart with indifference, a stronger separating force than
  dissonance, they're never close enough to share energy tend to remain apart
  due to inertia. Out of sight, out of mind.
- Stars that were never close enough to share energy tend to remain apart due to
  inertia. Out of sight, out of mind.

### Alignment

If, where, and how energy is shared between nearby stars.

**How Forces are Perceived and Measured:**

- Resonance, dissonance, indifference, instability
