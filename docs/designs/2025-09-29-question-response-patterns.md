# Question-Response System Design

## Core Problem Statement

The "what's next?" problem in community platforms: users join, browse profiles, then disengage due to lack of clear pathways from introduction to deeper relationship/participation. Need a flexible system that can power multiple interaction patterns without architectural duplication.

## Key Design Insights

### 1. Generic Foundation Over Specific Solutions

**Initial Narrow Thinking**: `group_activities` and `activity_responses` tables focused on interest gauging.

**Broader Realization**: This is fundamentally a **generic question-response system** that can power:
- Interest gauging ("Who wants to go hiking?")
- Polls/surveys ("What time works best for the BBQ?")
- Profile data collection ("What's your favorite local restaurant?")
- Games ("Guess who this baby photo belongs to")
- Questionnaires ("What skills do you have to offer?")
- Memory prompts ("Share a story about [person]")

### 2. Cross-Group Privacy & Trust Gradients

**Challenge**: Users exist in multiple groups with different trust levels (family vs neighborhood vs church).

**Solution**: Dual-scoped responses with explicit visibility control:
- User gives answer once, controls which groups can see it
- Can provide different answers for different groups
- Progressive disclosure as trust builds

### 3. Static vs Temporal Data Collection

**Profile Data**: "What are your hobbies?" - collect once, reuse/refine over time
**Pulse Data**: "How satisfied are you this month?" - always collect new responses to track trends over time

### 4. Template Reusability

**Challenge**: Same questions used across different contexts (monthly pulse surveys, event feedback, etc.)

**Solution**: Separate question templates from survey instances:
- Questions can belong to multiple question groups
- Survey instances represent specific deployments with their own lifecycle
- Late responses tie to correct survey instance, not just timestamp

### 5. Intelligent Flow Control

**Challenge**: Static forms are annoying - need dynamic, contextual questioning.

**Requirements**:
- **Wizards**: Flow depends on previous answers, user attributes, group context
- **One-to-many**: Single question with variable response count (e.g., details for each child)
- **Conditional Logic**: Skip irrelevant sections based on context

## Database Schema Design

### Core Tables

```sql
-- Reusable question templates
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  type VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  response_format VARCHAR(20), -- 'single', 'multiple', 'repeating'
  options JSONB,
  max_responses INTEGER DEFAULT 1, -- for one-to-many scenarios
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reusable question group templates
CREATE TABLE question_groups (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  collection_type VARCHAR(20), -- 'profile', 'pulse', 'event_specific'
  allow_past_responses BOOLEAN DEFAULT true, -- false = always collect new
  flow_type VARCHAR(20) DEFAULT 'linear', -- 'linear', 'conditional', 'wizard'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Many-to-many: questions can belong to multiple groups
CREATE TABLE question_group_questions (
  question_group_id UUID REFERENCES question_groups(id),
  question_id UUID REFERENCES questions(id),
  order_index INTEGER,
  PRIMARY KEY (question_group_id, question_id)
);

-- Survey instances - actual deployments of question groups
CREATE TABLE survey_instances (
  id UUID PRIMARY KEY,
  question_group_id UUID REFERENCES question_groups(id),
  group_id UUID REFERENCES groups(id), -- which community group
  event_id UUID REFERENCES events(id), -- NULL if not event-specific
  title VARCHAR(255), -- "January 2025 Pulse Survey"
  launched_at TIMESTAMP DEFAULT NOW(),
  closes_at TIMESTAMP, -- NULL = never closes
  created_by UUID REFERENCES users(id)
);

-- Flow rules for intelligent questioning
CREATE TABLE question_flow_rules (
  id UUID PRIMARY KEY,
  question_group_id UUID REFERENCES question_groups(id),
  question_id UUID REFERENCES questions(id),
  condition_type VARCHAR(30), -- 'always', 'if_response', 'if_user_attr', 'if_group_attr'
  condition_data JSONB, -- flexible condition storage
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User responses with privacy control
CREATE TABLE responses (
  id UUID PRIMARY KEY,
  survey_instance_id UUID REFERENCES survey_instances(id),
  question_id UUID REFERENCES questions(id),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id), -- NULL = user-level response
  response_data JSONB,
  response_index INTEGER DEFAULT 0, -- for multiple responses to same question
  created_at TIMESTAMP DEFAULT NOW()
);

-- Privacy/visibility control for cross-group sharing
CREATE TABLE response_visibility (
  id UUID PRIMARY KEY,
  response_id UUID REFERENCES responses(id),
  group_id UUID REFERENCES groups(id),
  granted_at TIMESTAMP DEFAULT NOW()
);
```

## Usage Patterns

### Cross-Group Privacy Flow

1. **First Encounter**: User answers "What's your favorite hobby?" in Family Group A
2. **Second Encounter**: Same question in Neighborhood Group B → system shows previous answer with options:
   - Share with this group (creates visibility record)
   - Give different answer for this group (creates new response)
   - Skip question in this group

### Intelligent Flow Examples

**Gender-Based Branching**:
```json
{
  "question_id": "pregnancy_question",
  "condition_type": "if_response",
  "condition_data": {
    "question_id": "gender_question",
    "operator": "equals",
    "value": "female"
  }
}
```

**Dynamic Repetition**:
- "Do you have kids?" → No = skip children section
- Yes → "How many?" → Show name/age questions for each child
- Creates multiple response records with `response_index`

### Collection Types

**Profile Collection** (`allow_past_responses = true`):
- Static preferences and attributes
- Reuse existing answers or update once
- Build progressive user profiles across groups

**Pulse Collection** (`allow_past_responses = false`):
- Temporal data for trend analysis
- Always collect new responses
- Track community health, satisfaction, engagement over time

**Event-Specific Collection**:
- Tied to specific events via `event_id`
- Feedback, planning, coordination
- Contextual to specific moments/activities

## Architectural Benefits

### 1. Avoids Feature Duplication
Single system powers multiple interaction patterns without 800-1300 line code duplication when adding new group types.

### 2. Respects Trust Gradients
Users control information sharing across different community contexts with varying trust levels.

### 3. Enables Progressive Relationship Building
Clear pathway from "learning about people" to "doing things together" through structured interaction containers.

### 4. Scales with Community Needs
Foundation supports simple interest gauging today, complex community coordination tomorrow.

### 5. Context-Aware Intelligence
Dynamic flows adapt to user context, group type, and previous interactions for relevant, non-annoying experiences.

## Data Storage & Query Considerations

### JSONB Trade-offs

**Advantages**:
- **Future-proof**: Can add new question types without schema migrations
- **Rapid iteration**: New features don't require database changes
- **Complex data**: Can store arrays, nested objects, conditional logic rules

**Disadvantages**:
- **Query complexity**: `response_data->>'favorite_color'` vs `favorite_color`
- **Type safety**: No database-level validation of structure
- **Performance**: JSONB queries can be slower than indexed columns
- **Analytics complexity**: Harder to aggregate across variable structures

### Hybrid Architecture Options

**Option 1: Common Fields + JSONB Extension**
```sql
CREATE TABLE responses (
  -- Common, queryable fields
  text_value TEXT,
  numeric_value DECIMAL,
  boolean_value BOOLEAN,
  date_value TIMESTAMP,
  
  -- Flexible extension for complex data
  response_data JSONB,
  -- ... other fields
);
```

**Option 2: Materialized Views for Analytics**
Keep JSONB for flexibility but create materialized views for common queries:
```sql
CREATE MATERIALIZED VIEW user_interests AS
SELECT 
  user_id,
  group_id,
  response_data->>'interest' as interest_name,
  (response_data->>'level')::integer as interest_level
FROM responses r
JOIN questions q ON r.question_id = q.id
WHERE q.type = 'interest_selection';
```

**Recommendation**: Start with JSONB for rapid iteration, optimize based on real usage patterns.

## Admin Experience & Data Visualization

### The Google Forms Problem

**Challenge**: Technical flexibility (JSONB) shouldn't create admin complexity. Google Forms → Google Sheets works because it translates complex data into familiar tabular format, even with messy dynamic columns.

**Solution**: Hide technical complexity behind intuitive admin interfaces.

### Smart Data Presentation Layer

**Poll Results Display**:
```
"What time works best?"
- 6 PM: 12 responses (60%)
- 7 PM: 6 responses (30%) 
- 8 PM: 2 responses (10%)
```

**One-to-Many Results** (e.g., family registration):
```
Family Registration Summary:
- Johnson Family: 2 kids (ages 12, 14)
- Smith Family: 1 kid (age 13)
- Brown Family: 3 kids (ages 11, 12, 15)
```

### Template-Based Admin Views

Different question types get different admin interfaces:

**Interest Gauging**: "Who's interested in hiking?"
- Participant list with Yes/No/Maybe responses
- Export as contact list for follow-up

**Event Planning**: "What should we bring to the BBQ?"
- Categorized list (Food, Drinks, Supplies)
- Group similar responses automatically

**Profile Building**: "What are your skills?"
- Searchable directory format
- Filter by skill type, availability, etc.

### Export & Analysis Features

**Flexible CSV Export**:
- Dynamically flatten JSONB into columns
- Handle variable columns gracefully (empty cells for missing data)
- Example: "Name", "Email", "Child 1 Name", "Child 1 Age", "Child 2 Name", "Child 2 Age"

**Summary Reports**:
- Bar charts for multiple choice questions
- Word clouds for text responses
- Tables for structured data
- Cross-reference with user profiles

### Privacy & Permission Layers

**Group Member View**: Aggregated results only
- "15 people are interested in hiking"
- No individual response details

**Group Admin View**: Individual response access
- See who responded what
- Contact specific respondents
- Export detailed data

**Response Creator View**: Full control over their own data
- Edit/delete their responses
- Control visibility across groups
- See how their data is being used

## Cost & Performance Considerations

### Database Performance
- **JSONB Performance**: Generally good for read-heavy workloads with GIN indexes
- **Storage Cost**: More compact than normalized tables for variable data
- **Query Cost**: Slightly higher CPU for JSONB operations, but PostgreSQL handles well

### Scaling Strategy
- **Phase 1**: Pure JSONB for development speed
- **Phase 2**: Add common typed fields based on usage patterns
- **Phase 3**: Materialized views or ETL for heavy analytics

### No Global Data Mining
- System designed for group-level insights, not cross-group analytics
- Privacy-first architecture respects group boundaries
- Focus on utility for group admins, not advertising/monetization

## Implementation Priority

**Phase 1**: Basic question-response system with cross-group privacy
- Core JSONB schema
- Simple admin result views
- Basic CSV export

**Phase 2**: Survey instances and template reusability
- Template-based admin interfaces
- Interactive filtering/sorting
- Cross-reference with profiles

**Phase 3**: Intelligent flow control and conditional logic
- Advanced visualization options
- Custom report building
- Workflow automation

This foundation addresses the core "what's next?" problem while providing architectural flexibility for the broader Community OS vision, with careful attention to admin usability and performance scalability.