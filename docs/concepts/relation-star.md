# Visual Relationship Assessment Framework

A framework for modeling and visualizing personal relationships both at a point in time and over time.

## Core Dimensions

Based on the relationship framework, we track six key dimensions:

### 1. Proximity

- Physical or emotional nearness
- Affects the probability of two people meeting and interacting
- Can be in-person or virtual

### 2. Strength of Relationship

- **Stranger**: Someone you don't recognize
- **Nodding acquaintance**: Someone you recognize but don't know their name
- **Acquaintance**: When two people recognize each other and know each other's names
- **Friend**: Someone you like, share interests, and have spent group time together (co-workers, classmates, etc.)
- **Close friend**: A friend with whom you've spent significant personal time (outside of formal group activities)

### 3. Time Together

- **Personal**: Time focused on one person
- **Group**: Time focused on a group
- When another person is devoted to the group, time spent on behalf of the group is perceived as personal interest/care

### 4. Experiences

- **Places**: Shared locations
- **Identity**: Experiences that shape who we are
- **Formative**: Key moments that define relationships
- **Shared/common**: Experiences that create bonds

### 5. Familiarity

- **Face**: Recognition
- **Name**: Basic identification
- **Personal life**: Understanding of their circumstances
- **Interests**: Knowledge of what they care about
- **Goals, desires, fears, needs**: Deep understanding
- **Sympathy**: Feeling for them
- **Empathy**: Feeling with them

### 6. Commitment

- **Passive and disinterested**: No investment
- **Passive and interested**: Care but no action
- **Active but unavailable (low priority)**: Some action but limited
- **Active and available (high priority)**: Full investment

### 7. Change

- **Life circumstances that affect proximity**: Events that change physical/emotional distance
- **Circumstances that cause relationships to ebb and flow**: Natural cycles and seasons

---

## Recommended Visualization: Star Chart (Radar/Spider Chart) with Timeline

### Core Design

**1. Star Chart for Point-in-Time Assessment**

- Each axis represents one of the 6 primary dimensions:
  - **Proximity** (0-10 scale: distant → physically/emotionally close)
  - **Strength** (0-10 scale: stranger → close friend)
  - **Time Together** (0-10 scale: none → significant shared time)
  - **Experiences** (0-10 scale: none → many formative shared experiences)
  - **Familiarity** (0-10 scale: don't know face/name → deep empathy)
  - **Commitment** (0-10 scale: passive/disinterested → active/high priority)

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
- Columns: The 6 dimensions
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

## Next Steps

- [ ] Create a prototype of the star chart visualization
- [ ] Design the data model to store these assessments
- [ ] Explore alternative visualization approaches
- [ ] Refine the dimension scales to make them more measurable
- [ ] Consider how to capture "Change" events that explain shifts in other dimensions
