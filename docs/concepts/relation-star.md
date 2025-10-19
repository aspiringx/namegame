# Visual Relationship Assessment Framework

A framework for modeling and visualizing personal relationships both at a point in time and over time.

## Core Dimensions

Based on the relationship framework, we track seven key dimensions (5 inputs + 2 outputs):

### 1. Proximity

- Physical or emotional nearness
- Affects the probability of two people meeting and interacting
- Can be in-person or virtual

### 2. Interest

Your desire, ability, and commitment to the relationship.

- **None**: No interest in a relationship, especially new ones if a person already has existing strong relationships that consume their time
- **Low**: Some interest in a relationship, but not enough to readily invest time and energy
- **Medium**: Moderate interest in a relationship, with ability and interest in investing time and energy
- **High**: Strong interest, ability, and active commitment to the relationship

### 3. Strength of Relationship

Indicated by a person using these definitions.

- **Stranger**: Someone you don't recognize
- **Nodding acquaintance**: Someone you recognize but don't know their name
- **Acquaintance**: When two people recognize each other and know each other's names
- **Friend**: Someone you like, share interests, and have spent group time together (co-workers, classmates, etc.)
- **Close friend**: A friend with whom you've spent significant personal time (outside of formal group activities)

### 4. Personal Time

Time spent focusing on each other (not tasks or large groups). This is the most important factor in building deep relationships.

- **Personal/Relational time**: Time where people are free to focus on each other rather than external tasks or goals. This builds deeper connection.
  - Examples: Coffee dates, walks, phone calls, hanging out, personal conversations
  - Can be 1-on-1 or small group (2-4) as long as the focus is on connecting
- **Task-focused time**: Time spent working together on projects, goals, or structured activities has minimal impact on relationship depth.
  - Examples: Work projects, committee meetings, organizing events, collaborative tasks
- **Large group time**: Formal group activities with 5+ people have very limited impact on relationship depth.
  - Examples: Church services, neighborhood BBQs, team meetings, classes

### 5. Common Ground

Shared identity, experiences, interests, and values that create natural connection points.

- **Shared Identity**: Common background, life stage, or circumstances that make someone feel more familiar
- **Shared Experiences**: Places visited together, events attended, formative moments
- **Shared Interests**: Hobbies, activities, topics, passions
- **Shared Values**: Worldview, priorities, what matters most in life
- **Professional Overlap**: Career fields, industry topics, professional development

The more common ground you share, the more opportunities for connection and conversation.

### 6. Familiarity

- **Face**: Recognition
- **Name**: Basic identification
- **Personal life**: Understanding of their circumstances
- **Interests**: Knowledge of what they care about
- **Goals, desires, fears, needs**: Deep understanding
- **Sympathy**: Feeling for them
- **Empathy**: Feeling with them

### 7. Change

Have there been changes that affect the dynamics of a relationship? New  
circumstances that limit or expand a person's time and availability in a
relationship.

- **Life circumstances that affect proximity**: Events that change physical/emotional distance
- **Circumstances that cause relationships to ebb and flow**: Natural cycles and seasons

---

## Input vs. Output Dimensions

The framework distinguishes between **input dimensions** (data you provide) and **output dimensions** (calculated results):

**Input Dimensions** (5 - visualized on the star chart):
1. **Proximity** - How often you're near this person (physically, emotionally, or through shared groups)
2. **Interest** - Your desire, ability, and commitment to the relationship
3. **Personal Time** - Time spent focusing on each other (not tasks or large groups)
4. **Common Ground** - Shared identity, experiences, interests, and values
5. **Familiarity** - How well you know them

**Output Dimensions** (2 - calculated, not visualized):
1. **Strength of Relationship** - Calculated from inputs, validated against your self-assessment
2. **Change** - Calculated from temporal deltas in other dimensions

---

## Recommended Visualization: Star Chart (Radar/Spider Chart) with Timeline

### Core Design

**1. Star Chart for Point-in-Time Assessment**

The star chart visualizes the **5 input dimensions** (outputs are shown separately):

- **Proximity** (0-10 scale: distant → physically/emotionally/group-connected)
- **Interest** (0-10 scale: none → high desire, ability, and commitment)
- **Personal Time** (0-10 scale: none → significant 1-on-1 or small group relational time)
- **Common Ground** (0-10 scale: nothing in common → many shared interests/values/experiences)
- **Familiarity** (0-10 scale: don't know face/name → deep empathy)

**Calculated Outputs** (displayed separately, not on star chart):
- **Strength of Relationship** - Shown as a label (Stranger → Close Friend) with numeric score
- **Change** - Shown as timeline annotations or trend indicators

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

---

## AI-Powered Relationship Insights

### Overview

Users can request AI-generated narrative assessments of their Relation Star responses. The system supports both individual assessments and comparative assessments when two users evaluate the same relationship.

### LLM Provider Architecture

**Design Principle**: Provider-agnostic architecture with pluggable LLM backends.

**Initial Implementation**: OpenAI GPT-4o-mini
- Cost-effective: ~$0.0003 per assessment
- High quality for relationship analysis
- Fast response times
- Easy upgrade path to GPT-4o if needed

**Future Providers**:
- Anthropic Claude 3.5 Sonnet (for more nuanced analysis)
- Google Gemini 1.5 Flash (for budget-conscious scaling)
- Local models (for privacy-sensitive deployments)

### Assessment Types

#### 1. Individual Assessment

**Input**:
- 5 dimension scores (0-10 each)
- Overall Star Score
- Relationship label (Stranger → Close Friend)
- Optional: User's relationship goals/hopes (free text)

**Output** (2-3 sentences):
1. Current state of the relationship
2. Notable patterns or barriers identified
3. One actionable suggestion for growth

**Example**:
```
Your relationship shows high interest (8/10) but limited personal time (3/10). 
This suggests you value the connection but haven't had opportunities to deepen it. 
Consider scheduling regular one-on-one time to build on your shared interests.
```

#### 2. Comparative Assessment (Two Perspectives)

**Input**:
- Person A's 5 dimension scores + goals
- Person B's 5 dimension scores + goals
- Both users must consent to comparison

**Output** (~150 words):
1. Areas of agreement (aligned perceptions)
2. Key differences in perception
3. Mutual strengths to build on
4. 2-3 specific suggestions for bridging gaps

**Example**:
```
You both value this relationship highly (Interest: 8/10 and 9/10), but perceive 
different levels of personal time spent together (A: 4/10, B: 7/10). This gap 
suggests you may define "quality time" differently. Person A may be seeking more 
focused one-on-one conversations, while Person B counts group activities as 
meaningful connection time. Your shared common ground (both 8/10) is a strength 
to build on. Suggestion: Discuss what "personal time" means to each of you, and 
experiment with both styles of connection.
```

### User Input: Relationship Goals

**New Field**: "What would you like or hope for in this relationship?"

**Purpose**:
- Provides context for AI assessment
- Helps identify gaps between current state and desired state
- Enables more personalized suggestions

**Examples**:
- "I'd like to feel closer to my teenage daughter"
- "I want to maintain this friendship despite living far apart"
- "I hope we can move from coworkers to actual friends"
- "I'd like to rebuild trust after our conflict"

**Implementation**: Optional textarea (max 500 characters) below the 5 sliders

### Rate Limiting & Access Control

**Authentication Requirement**:
- AI assessments only available to authenticated users with verified email
- Prevents abuse and manages API costs

**Rate Limits**:
- **Free tier**: 2 AI assessments per 24-hour period per user
- **Paid tier** (future): Unlimited assessments
- Rate limit tracked per user, not per assessment type

**Implementation**:
```typescript
// Database table (flexible design)
AIRequest {
  id: string
  userId: string
  requestType: string              // 'relation_star_individual' | 'relation_star_comparison' | 'group_health' | 'custom'
                                   // Stored as string (not enum) to avoid migrations when adding new types
  requestedAt: timestamp
  
  // Flexible input - stored as JSON
  requestInput: string             // JSON string containing all context and data
  
  // AI response
  provider: string                 // 'openai' | 'anthropic' | 'google' (managed in code, not DB enum)
  model: string
  systemPrompt: string
  userPrompt: string
  response: string
  tokensUsed?: number
  costUsd?: number
  
  // Conversation support (for future credit-based system)
  conversationId?: string          // Groups related requests together
  parentRequestId?: string         // References previous request in conversation
  isFollowUp: boolean              // Default false
  creditsUsed?: number             // For future credit system
  
  // Metadata
  processingTimeMs?: number
  error?: string
}

// Rate limiting check
async function canRequestAssessment(userId: string): Promise<boolean> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentRequests = await db.aIRequest.count({
    where: {
      userId,
      requestedAt: { gte: twentyFourHoursAgo },
      isFollowUp: false  // Only count initial requests, not follow-ups
    }
  });
  return recentRequests < 2;
}
```

**Design Principles**:
- **No DB enums**: `requestType` and `provider` are strings managed in TypeScript, avoiding migrations when adding new types
- **JSON flexibility**: `requestInput` stores any data structure, allowing new request types without schema changes
- **One-shot by default**: Initial implementation provides single response per request
- **Future-ready**: Conversation threading (`conversationId`, `parentRequestId`) and credits system ready for when pricing allows
- **Cost control**: Admin controls AI interaction; users can't freely chat with AI (prevents cost overruns)

### API Integration

**Provider Interface** (pluggable architecture):
```typescript
interface LLMProvider {
  name: string;
  generateAssessment(input: AssessmentInput): Promise<AssessmentOutput>;
  estimateCost(input: AssessmentInput): number;
}

class OpenAIProvider implements LLMProvider {
  name = 'openai';
  model = 'gpt-4o-mini';
  
  async generateAssessment(input: AssessmentInput): Promise<AssessmentOutput> {
    const prompt = this.buildPrompt(input);
    const response = await openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7
    });
    return {
      text: response.choices[0].message.content,
      tokensUsed: response.usage.total_tokens,
      cost: this.calculateCost(response.usage)
    };
  }
}

// Easy to add new providers
class AnthropicProvider implements LLMProvider { ... }
class GeminiProvider implements LLMProvider { ... }
```

**System Prompt**:
```
You are a relationship insight assistant. Your role is to provide brief, 
empathetic, and actionable assessments of personal relationships based on 
Relation Star data. Focus on:

1. Identifying patterns and barriers
2. Validating the user's feelings and goals
3. Offering specific, practical suggestions
4. Being warm, non-judgmental, and constructive

Keep responses concise (2-3 sentences for individual, ~150 words for comparisons).
Avoid jargon. Speak directly to the user.
```

### Privacy & Security

**Data Handling**:
- No personally identifiable information sent to LLM APIs
- Use OpenAI's zero-retention option (data not used for training)
- Store AI responses in our database, not with provider
- User can delete their AI assessment history

**Consent for Comparisons**:
- Both users must explicitly opt-in to share their assessment
- Comparison only shows aggregated insights, not raw scores to other party
- Either user can revoke comparison access

### Cost Management

**Estimated Costs** (GPT-4o-mini):
- Individual assessment: ~500 input + 300 output tokens = $0.0003
- Comparison assessment: ~800 input + 400 output tokens = $0.0005
- 1,000 users × 2 assessments/day = $0.60/day = $18/month
- 10,000 users × 2 assessments/day = $6/day = $180/month

**Optimization Strategies**:
- Cache system prompts (OpenAI prompt caching)
- Batch processing for non-urgent assessments
- Monitor token usage and adjust max_tokens
- Switch to cheaper providers for simple assessments

### Demo Page Implementation

**UI Flow**:
1. User completes 5 sliders
2. Optional: Enters relationship goals (textarea)
3. "Get AI Insight" button appears
4. If not authenticated: Prompt to sign in
5. If rate limited: Show "You've used your 2 free assessments today. Try again in X hours."
6. If available: Show loading state → Display AI assessment
7. Assessment saved to user's history

**Button States**:
```typescript
// Disabled states
- Not authenticated: "Sign in to get AI insights"
- Rate limited: "Daily limit reached (2/2)"
- All sliders at 0: "Adjust sliders to get insights"
- Loading: "Generating insights..."

// Active state
- "Get AI Insight (X/2 remaining today)"
```

---

## Next Steps

- [x] Document AI assessment architecture
- [ ] Implement LLM provider interface
- [ ] Add relationship goals textarea to demo page
- [ ] Build AI assessment API endpoint with rate limiting
- [ ] Add authentication check to demo page
- [ ] Create AI assessment history view
- [ ] Implement comparison assessment flow
- [ ] Add cost tracking dashboard (admin)
- [ ] Create a prototype of the star chart visualization
- [ ] Implement the quick 3-question assessment flow
- [ ] Build the full assessment form with validation
- [ ] Design the temporal comparison view (relationship over time)
- [ ] Create the group health dashboard
- [ ] Test the strength calculation algorithm with real data
- [ ] Design the "reality check" intervention UI
