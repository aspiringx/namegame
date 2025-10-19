# Visual Relationship Assessment Framework

A framework for modeling and visualizing personal relationships both at a point in time and over time.

## Core Dimensions

Based on the relationship framework, we track eight key dimensions:

### 1. Proximity

- Physical or emotional nearness
- Affects the probability of two people meeting and interacting
- Can be in-person or virtual

### 2. Desire for Relationship

- **None**: No interest in a relationship, especially new ones if a person already has existing strong relationships that consume their time
- **Low**: Some interest in a relationship, but not enough to readily invest time and energy
- **Medium**: Moderate interest in a relationship, with ability and interest in investing time and energy
- **High**: Strong interest and ability for a relationship

### 3. Strength of Relationship

Indicated by a person using these definitions.

- **Stranger**: Someone you don't recognize
- **Nodding acquaintance**: Someone you recognize but don't know their name
- **Acquaintance**: When two people recognize each other and know each other's names
- **Friend**: Someone you like, share interests, and have spent group time together (co-workers, classmates, etc.)
- **Close friend**: A friend with whom you've spent significant personal time (outside of formal group activities)

### 4. Time Together

What kind of time do people spend together? The key distinction is whether the time is **relationship-focused** or **task-focused**.

- **Personal/Relational time**: Time where people are free to focus on each other rather than external tasks or goals. This builds deeper connection.
  - Examples: Coffee dates, walks, phone calls, hanging out, personal conversations
  - Can be 1-on-1 or small group (2-4) as long as the focus is on connecting
- **Task-focused time**: Time spent working together on projects, goals, or structured activities. Even with just 2-3 people, if attention is on completing a task rather than building relationship, it's task-focused.
  - Examples: Work projects, committee meetings, organizing events, collaborative tasks
  - Includes "personal banter" but primary focus remains on the task
- **Large group time**: Formal group activities with 5+ people, typically structured
  - Examples: Church services, neighborhood BBQs, team meetings, classes
  - Limited opportunity for deep personal connection due to group size and structure

### 5. Experiences

What kind of experiences have people shared?

- **Places**: Shared locations
- **Events**: Shared events, experiences, or situations
- **Identity**: Do people have or see common identity that makes someone feel more familiar and likely to have shared understandings?
- **Formative**: Key moments that define relationships or create bonds from shared memories

### 6. Familiarity

- **Face**: Recognition
- **Name**: Basic identification
- **Personal life**: Understanding of their circumstances
- **Interests**: Knowledge of what they care about
- **Goals, desires, fears, needs**: Deep understanding
- **Sympathy**: Feeling for them
- **Empathy**: Feeling with them

### 7. Commitment

- **Passive and disinterested**: No investment
- **Passive and interested**: Care but no action or not close enough to be aware of what someone cares about
- **Active but unavailable (low priority)**: Some action but limited or inconsistent
- **Active and available (high priority)**: High investment, awareness, and regular interaction

### 8. Change

Have there been changes that affect the dynamics of a relationship? New  
circumstances that limit or expand a person's time and availability in a
relationship.

- **Life circumstances that affect proximity**: Events that change physical/emotional distance
- **Circumstances that cause relationships to ebb and flow**: Natural cycles and seasons

---

## Recommended Visualization: Star Chart (Radar/Spider Chart) with Timeline

### Core Design

**1. Star Chart for Point-in-Time Assessment**

- Each axis represents one of the 8 dimensions:
  - **Proximity** (0-10 scale: distant → physically/emotionally close)
  - **Desire for Relationship** (0-10 scale: none → high interest and ability)
  - **Strength of Relationship** (0-10 scale: stranger → close friend)
  - **Time Together** (0-10 scale: none → significant shared time)
  - **Experiences** (0-10 scale: none → many formative shared experiences)
  - **Familiarity** (0-10 scale: don't know face/name → deep empathy)
  - **Commitment** (0-10 scale: passive/disinterested → active/high priority)
  - **Change** (0-10 scale: stable circumstances → major life changes affecting relationship)

**2. Timeline Slider/Animation**

- Horizontal timeline showing key dates/periods
- User can scrub through time to see how the star chart morphs
- Overlay multiple time periods to compare (e.g., "2020 vs 2024")

**3. Change Indicators**

- Highlight axes with significant change (color coding: red for decline, green for growth)
- Annotate specific life events that caused shifts

---

## Alternative Visualizations

### Option A: River/Stream Chart

- X-axis: Time
- Y-axis: Stacked areas for each dimension
- Shows how the "composition" of the relationship changes over time
- Good for seeing dominant factors at different periods

### Option B: Heatmap Matrix

- Rows: Time periods (monthly/yearly)
- Columns: The 8 dimensions
- Cell color intensity: Strength of that dimension
- Patterns emerge showing relationship seasons/cycles

### Option C: 3D Landscape

- X/Y: Two primary dimensions (e.g., Proximity × Strength)
- Z-axis: Time
- Creates a "relationship journey" path through 3D space
- Other dimensions shown via color/size of the path

---

## Implementation Recommendation

For NameGame context:

**Interactive Star Chart Component** with:

1. **Quick Assessment Mode**: Click/tap each axis to rate 1-10
2. **Historical View**: Store assessments with timestamps
3. **Comparison View**: Overlay past vs present
4. **Insights Panel**: Auto-generate observations like:
   - "Familiarity increased 40% since last year"
   - "Commitment has remained steady despite decreased proximity"
   - "Shared experiences peaked during 2022"

---

## Dimension Analysis

### Potential Overlaps & Duplicates

**1. Desire for Relationship ↔ Commitment**

- **Overlap**: Both measure investment/interest in the relationship
- **Distinction**:
  - _Desire_ = Internal capacity and interest ("Do I want this?")
  - _Commitment_ = External behavior and action ("What am I doing about it?")
- **Example**: High desire but low commitment = "I'd love to be closer but I'm overwhelmed with work"
- **Verdict**: Keep both - they measure different aspects (intent vs. action)

**2. Strength of Relationship ↔ Familiarity**

- **Overlap**: Both increase as relationships deepen
- **Distinction**:
  - _Strength_ = Social label/category (stranger → close friend)
  - _Familiarity_ = Knowledge depth about the person
- **Example**: Long-time coworker = Friend (strength) but low familiarity with personal life
- **Verdict**: Keep both - strength is outcome, familiarity is one input

**3. Time Together ↔ Experiences**

- **Overlap**: Both track shared history
- **Distinction**:
  - _Time Together_ = Quantity and context (personal vs. group)
  - _Experiences_ = Quality and memorability (formative moments)
- **Example**: 100 hours in meetings (time) vs. one intense road trip (experience)
- **Verdict**: Keep both - quantity ≠ quality

**4. Commitment ↔ Time Together**

- **Overlap**: Commitment often manifests as time spent
- **Distinction**:
  - _Commitment_ = Current priority and availability
  - _Time Together_ = Historical pattern (past, present, future)
- **Verdict**: Keep both - commitment is present-tense, time is cumulative

### Temporal Characteristics

**Static Dimensions** (change slowly, require major life events):

- **Proximity** - Requires moving, job change, major life transition
- **Experiences** - Accumulates slowly, can't be "undone"
- **Familiarity** - Generally only increases (rarely decreases unless long separation)

**Dynamic Dimensions** (change frequently, responsive to life circumstances):

- **Desire for Relationship** - Fluctuates with life stage, stress, capacity, interactions that affirm, increase, or decrease trust
- **Commitment** - Can shift weekly based on priorities, workload, family needs
- **Time Together** - Varies with schedules, seasons, availability
- **Change** - By definition, tracks recent shifts in circumstances

**Hybrid Dimension**:

- **Strength of Relationship** - Typically grows slowly but can shift suddenly (e.g., conflict, betrayal, or breakthrough moment)

### Recommendation

**Keep all 8 dimensions** - they each capture distinct aspects:

1. **Proximity** = Physical/emotional distance
2. **Desire** = Internal capacity for relationship
3. **Strength** = Social categorization of relationship
4. **Time Together** = Quantity of shared history
5. **Experiences** = Quality of shared memories
6. **Familiarity** = Depth of knowledge about the person
7. **Commitment** = Current behavioral investment
8. **Change** = Recent life circumstances affecting relationship

The apparent overlaps actually represent the complexity of relationships - multiple factors contribute to outcomes. For visualization, consider:

- **Primary chart**: 7 stable dimensions (exclude Change)
- **Change indicator**: Separate annotation or timeline marker
- **Temporal view**: Color-code static vs. dynamic dimensions

---

## Data Model Design

### Input vs. Output Dimensions

**Input Dimensions** (User provides data):

1. **Proximity** - "How close do you live/work to this person?"
2. **Desire for Relationship** - "How interested are you in deepening this relationship?"
3. **Time Together** - "How much time have you spent together?"
   - **Personal/Relational time**: Time focused on each other, not tasks (1-on-1 or small group 2-4 where people are free to connect)
   - **Task-focused time**: Working together on projects/goals (even if just 2-3 people, if focus is on the task not the relationship)
   - **Large group time**: Formal group activities (5+ people, structured events)
4. **Experiences** - "What have you shared together?"
   - Places visited together
   - Memorable events/moments
   - Identity markers (common background, interests)
5. **Familiarity** - "How well do you know them?"
   - Face/name recognition
   - Personal life details
   - Deep understanding (goals, fears, needs)
6. **Commitment** - "How available are you for this relationship?"
   - Current priority level
   - Recent interaction frequency

**Output Dimensions** (Calculated from inputs):

1. **Strength of Relationship** - Derived from inputs, validated against user's self-assessment
2. **Change** - Calculated from temporal deltas in other dimensions

**Relationship Strength Calculation:**

```
Strength Score = weighted average of:
- Time Together:
  - Personal/Relational time × 0.20 (highest weight)
  - Task-focused time × 0.05 (minimal weight)
  - Large group time × 0.02 (very minimal weight)
- Experiences (formative moments) × 0.20
- Familiarity (depth of knowledge) × 0.20
- Commitment (current investment) × 0.20
- Proximity (enables interaction) × 0.10
- Desire (capacity for growth) × 0.05

Label Assignment:
0-2: Stranger
2-4: Nodding Acquaintance
4-6: Acquaintance
6-8: Friend
8-10: Close Friend
```

### Reality Check & Validation

When calculated strength differs from user's self-assessment by >2 points:

**Scenario 1: User says "Close Friend" but inputs suggest "Friend"**

- Show comparison: "You've labeled this as a close friendship, but you've indicated:"
  - ✓ You know their name and interests
  - ✓ You've spent time together in group settings or working on projects
  - ⚠️ You haven't spent much personal/relational time together (where you focus on each other, not tasks)
  - ⚠️ You don't know much about their personal life or deeper goals
- Prompt: "Would you like to:"
  - Update your inputs (maybe you forgot about personal time together)
  - Keep your label (your definition of 'close friend' is different)
  - Get suggestions for deepening this friendship

**Scenario 2: User says "Acquaintance" but inputs suggest "Friend"**

- Show: "Based on your inputs, this relationship seems stronger than you've labeled it:"
  - ✓ You've spent significant time together
  - ✓ You've shared memorable experiences
  - ✓ You know them fairly well
- Prompt: "Consider updating your label or reflecting on what's holding you back from seeing this as a friendship."

### Database Schema

```typescript
// Core relationship assessment table
RelationshipAssessment {
  id: string
  userId: string              // Who is assessing
  targetUserId: string        // Who is being assessed
  groupId: string             // Context of relationship
  createdAt: timestamp        // When this assessment was made

  // INPUT DIMENSIONS (0-10 scale)
  proximity: number
  desire: number
  timePersonal: number        // Relationship-focused (1-on-1 or small group)
  timeTask: number            // Task-focused (any size, focus on work/projects)
  timeGroup: number           // Large group formal activities (5+ people)
  experiencesPlaces: number
  experiencesEvents: number
  experiencesIdentity: number
  experiencesFormative: number
  familiarityBasic: number    // Face/name
  familiarityPersonal: number // Life details
  familiarityDeep: number     // Goals/fears/needs
  commitmentLevel: number
  commitmentFrequency: number

  // OUTPUT DIMENSIONS (calculated)
  calculatedStrength: number  // Algorithm output

  // USER OVERRIDE
  userStrength: number | null // User's self-assessment
  userStrengthLabel: string | null // "friend", "close friend", etc.

  // VALIDATION
  hasDiscrepancy: boolean     // |calculated - user| > 2
  discrepancyAcknowledged: boolean
}

// Change events that explain shifts
RelationshipEvent {
  id: string
  assessmentId: string
  userId: string
  targetUserId: string
  eventDate: timestamp
  eventType: string           // "bonding_moment", "conflict", "life_change"
  description: string
  impactedDimensions: string[] // ["experiences", "familiarity"]
  impactMagnitude: number     // -10 to +10
}

// Simplified quick-entry table for mobile
QuickAssessment {
  id: string
  userId: string
  targetUserId: string
  groupId: string
  createdAt: timestamp

  // Simplified 3-question input
  howOftenConnect: number     // 0-10 (never → daily)
  howWellKnow: number         // 0-10 (stranger → deeply)
  howMuchCare: number         // 0-10 (indifferent → high priority)

  // Expands to full assessment
  expandedToFullAssessment: boolean
  fullAssessmentId: string | null
}
```

### Quick Input UI Flow

**Step 1: Gut Check (3 questions, 15 seconds)**

```
"How often do you connect with [Name]?"
[Slider: Never ←→ Daily]

"How well do you know them?"
[Slider: Just their name ←→ Know them deeply]

"How much do you care about this relationship?"
[Slider: Not a priority ←→ Very important]
```

**Step 2: Auto-calculate & Show Result**

```
Your relationship with [Name]: Friend ⭐⭐⭐

Based on your responses:
- You connect occasionally
- You know them moderately well
- This relationship matters to you
```

**Step 3: Offer Deep Dive (Optional)**

```
"Want to get more specific? Answer a few more questions
to get personalized suggestions for strengthening this relationship."

[Maybe Later] [Yes, Let's Go]
```

### Temporal Tracking & Change Detection

**Automatic Change Detection:**

- Run weekly: Compare current assessment to previous assessment
- Flag significant changes (>2 point shift in any dimension)
- Prompt user: "We noticed your relationship with [Name] has changed. What happened?"

**Change Score Calculation:**

```
Change Score = sum of absolute deltas across all dimensions
0-5: Stable
5-10: Minor shift
10-20: Moderate change
20+: Major transformation
```

**Timeline View:**

- Store all assessments (never delete)
- Show relationship trajectory over time
- Annotate with events ("Started new job", "Had conflict", "Went on trip")

### Group Health Score

**Individual Relationship Health:**

```
Health = (calculatedStrength + commitment + desire) / 3
```

**Group Integration Score (per member):**

```
Integration Score = average(Health scores with all group members)

Interpretation:
0-3: Isolated (not connected to group)
3-5: Peripheral (few connections)
5-7: Integrated (solid connections)
7-10: Core (deeply connected to many)
```

**Group Overall Health:**

```
Group Health = average(all members' Integration Scores)

Also track:
- % of members with Integration Score > 5 ("Connected Members")
- % of possible relationships that exist ("Network Density")
- Members with lowest scores ("At Risk")
```

### Actionable Insights

**When relationship strength is lower than desired:**

```
You want to be closer to [Name], but:
- Low personal time → "Schedule a coffee or lunch, just the two of you"
- Low familiarity → "Ask about their background, interests, or current challenges"
- Low experiences → "Invite them to do something memorable together"
- Low commitment → "Set a reminder to check in with them weekly"
```

**When group integration is low:**

```
[Member] seems disconnected from the group:
- Only 2 relationships above "Acquaintance" level
- Hasn't attended recent events
- Suggestion: Pair them with [Well-Connected Member] for a small group activity
```

---

## Next Steps

- [ ] Create a prototype of the star chart visualization
- [ ] Implement the quick 3-question assessment flow
- [ ] Build the full assessment form with validation
- [ ] Design the temporal comparison view (relationship over time)
- [ ] Create the group health dashboard
- [ ] Decide whether "Change" should be a chart axis or a separate timeline annotation
- [ ] Consider grouping dimensions by temporal characteristics in the UI
- [ ] Test the strength calculation algorithm with real data
- [ ] Design the "reality check" intervention UI
