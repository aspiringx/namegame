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

What kind of time do people spend together? Currently, in the past, or hoping
for it in the future?

- **Personal**: Time together focused on one or a few people (2-4).
- **Group**: Time focused on a group (5+ people)

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

## Next Steps

- [ ] Create a prototype of the star chart visualization
- [ ] Design the data model to store these assessments
- [ ] Decide whether "Change" should be a chart axis or a separate timeline annotation
- [ ] Consider grouping dimensions by temporal characteristics in the UI
- [ ] Explore alternative visualization approaches
- [ ] Refine the dimension scales to make them more measurable
