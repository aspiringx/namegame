# Context-Specific Welcome Flow Design

## Core Problem Statement

The current photo grid default view creates the wrong first impression for new group members. It triggers "social media fatigue" by resembling Facebook/Instagram, when the goal is to convey "community utility for real-world connection." Additionally, users invited in-person are often distracted during the invitation moment and can't thoughtfully engage with the app.

## Key Challenges Identified

### 1. Wrong Mental Model
- **Current**: Photo grid → "another social media app to scroll through"
- **Desired**: Community utility → "tool to enable real-world connections"

### 2. Cognitive Overload
- Large groups (hundreds of people) create overwhelming first experience
- Users can't quickly identify relevant connections or next steps

### 3. Distracted Invitation Context
- In-person invitations happen during conversations
- Users can't focus on app exploration in the moment
- Need ability to defer meaningful engagement until later

### 4. One-Size-Fits-All Approach
- Church/neighborhood groups need connection-finding tools
- Extended family groups need geographic clustering and reunion planning
- Current photo grid serves neither context well

## Solution: Adaptive Welcome Experience

### Context-Dependent First Impressions

**Church/Neighborhood Groups**:
- **Goal**: Help newcomers find their place and connection points
- **First View**: Welcome message + upcoming events + "people like you"
- **Photo grid**: Secondary tab, not primary experience

**Extended Family Groups**:
- **Goal**: Discover family connections and plan gatherings  
- **First View**: Family tree position + nearby relatives + recent family updates
- **Photo grid**: Reference tool, not main interface

### Deferred Onboarding Pattern

**Invitation Moment** (minimal friction):
```
Welcome to [Group Name]!
You can explore anytime. We'll help you get oriented when you're ready.
[Close] [Explore Now]
```

**Return Visit** (when focused):
```
Help us show you what's most relevant:
[Quick questionnaire - 2 minutes]
[Skip for now - show everything]
```

## Welcome Flow Design by Group Type

### Church/Neighborhood Welcome Flow

**Immediate Experience**:
- Simple welcome message with group context
- No pressure to act immediately
- Clear indication they can return later

**Deferred Questionnaire** (when ready):
- "Are you new to [Church/Neighborhood]?"
- "What brings you here?" (moved in, visiting, seeking community)
- "What are you hoping to connect around?" (kids activities, service opportunities, social events)

**Resulting Personalized View**:
- **Newcomer Path**: Small group leaders, welcome committee, newcomer events
- **Parent Path**: Families with similar-aged kids, family-friendly events
- **Long-timer Path**: Leadership opportunities, ways to help newcomers
- **Service-Oriented**: Volunteer opportunities, community projects

### Extended Family Welcome Flow

**Immediate Experience**:
- Family tree snippet showing their position in the family
- "You're connected to X cousins, Y aunts/uncles in this group"

**Deferred Questionnaire** (when ready):
- "Where do you live?" (for proximity clustering)
- "When did you last see extended family?"
- "What family events interest you?" (reunions, holidays, casual meetups)
- "What family history/stories do you want to preserve?"

**Resulting Personalized View**:
- **Geographic Clusters**: "5 cousins live within 20 miles of you"
- **Recent Activity**: Family news, upcoming gatherings, shared memories
- **Connection Opportunities**: "Haven't seen Uncle Bob in 3 years - he lives 15 minutes away"
- **History Keepers**: Family story collection, photo sharing projects

## Progressive Disclosure Strategy

### Phase 1: Relevant Subset
- Show curated content based on questionnaire responses
- Focus on immediate connection opportunities
- Hide complexity until user is ready

### Phase 2: Full Group Access
- Unlock complete photo grid and member directory
- Advanced search and filtering capabilities
- Cross-reference tools (shared interests, proximity, etc.)

### Phase 3: Advanced Features
- Family tree editing and contribution
- Event planning and coordination tools
- Community project organization
- Historical content curation

## Technical Implementation

### Database Schema Extensions

```sql
-- Welcome questionnaires as survey instances
CREATE TABLE welcome_questionnaires (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  question_group_id UUID REFERENCES question_groups(id), -- reuse question-response system
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Track user onboarding state
CREATE TABLE user_onboarding_state (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  questionnaire_completed BOOLEAN DEFAULT false,
  preferred_view VARCHAR(50), -- 'newcomer', 'parent', 'geographic', 'service', etc.
  onboarding_data JSONB, -- flexible storage for questionnaire responses
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Welcome flow configurations per group
CREATE TABLE group_welcome_configs (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  welcome_message TEXT,
  questionnaire_delay_hours INTEGER DEFAULT 24, -- how long to wait before prompting
  default_view VARCHAR(50), -- fallback if questionnaire not completed
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Integration with Question-Response System

The welcome questionnaires leverage the existing flexible question-response infrastructure:
- **Questions**: Reusable templates for different group types
- **Question Groups**: Welcome questionnaire templates
- **Survey Instances**: Specific deployments for each group
- **Responses**: User answers that drive view personalization

### View Personalization Logic

```javascript
async function getPersonalizedGroupView(userId, groupId) {
  const onboardingState = await getUserOnboardingState(userId, groupId);
  const group = await getGroup(groupId);
  
  if (!onboardingState.questionnaire_completed) {
    return getDefaultWelcomeView(group.type);
  }
  
  const responses = await getWelcomeResponses(userId, groupId);
  return generatePersonalizedView(group.type, responses, onboardingState.preferred_view);
}
```

## User Experience Flows

### New Member Journey

1. **Invitation**: Receives invite link, clicks during conversation
2. **First Visit**: Sees minimal welcome screen, can close immediately
3. **Return Visit**: Prompted for questionnaire when ready to engage
4. **Personalization**: Views curated content based on responses
5. **Progressive Discovery**: Unlocks full features as engagement increases

### Admin Configuration

**Group Setup**:
- Select welcome questionnaire template based on group type
- Customize welcome message for group context
- Set questionnaire timing preferences
- Configure default views for different user types

**Analytics & Optimization**:
- Track questionnaire completion rates
- Monitor which personalized views drive most engagement
- A/B test different welcome messages and timing

## Privacy & Permission Considerations

### Questionnaire Data
- Responses used only for view personalization within the group
- No cross-group sharing of welcome questionnaire data
- Users can update responses or reset personalization anytime

### Gradual Information Disclosure
- Welcome questionnaires collect minimal information initially
- More detailed profiling happens through natural app usage
- Respects trust gradient - start simple, build complexity over time

### Opt-Out Options
- Users can skip questionnaire and see full group view
- Can disable personalization and revert to photo grid default
- Clear controls over how their information is used for personalization

## Success Metrics

### Engagement Metrics
- **Questionnaire completion rate**: % of new members who complete welcome flow
- **Return visit rate**: % who come back after initial invitation
- **Time to first meaningful interaction**: Comments, connections, event participation

### Perception Metrics
- **First impression surveys**: Does this feel like a community tool vs social media?
- **Connection success**: Do users find relevant people/opportunities?
- **Retention**: Do personalized views lead to longer-term engagement?

### Group Health Metrics
- **New member integration**: How quickly do newcomers become active participants?
- **Cross-group differences**: Which group types benefit most from personalization?
- **Admin satisfaction**: Do group leaders see better member engagement?

## Implementation Priority

### Phase 1: Basic Welcome Flow
- Simple welcome messages with deferred engagement
- Basic questionnaire system using existing question-response infrastructure
- Two personalized view types per group category

### Phase 2: Advanced Personalization
- More sophisticated view customization
- Geographic clustering for family groups
- Interest-based matching for community groups

### Phase 3: Adaptive Intelligence
- Learn from user behavior to improve personalization
- Predictive suggestions for connections and activities
- Dynamic questionnaire optimization based on group success patterns

This context-specific welcome flow addresses the core challenge of creating the right first impression while respecting the distracted nature of in-person invitations and the diverse needs of different group types.