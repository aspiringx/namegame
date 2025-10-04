# Strategy Pattern for Group Types

## Problem Statement
Currently, adding a new group type requires duplicating 800-1300 lines of code across multiple files:
- Client components (CommunityClient, FamilyClient)
- Page components 
- Actions and data fetching logic
- Custom UI components (MemberCard vs FamilyMemberCard)

This creates a maintenance nightmare and slows innovation velocity.

## Proposed Solution: Strategy Pattern

### Core Concept
Replace conditional logic and duplication with pluggable strategies that handle group-specific behavior.

### Architecture

#### 1. Group Adapter Interface
```typescript
interface GroupAdapter {
  getToolbarConfig(): ToolbarConfig
  renderMemberCard(member: Member, props: CardProps): ReactNode
  getActions(): GroupActions
  getDataFetcher(): DataFetcher
  getSettings(): GroupSettings
}
```

#### 2. Concrete Adapters
```typescript
class CommunityAdapter implements GroupAdapter {
  renderMemberCard(member, props) {
    return <BaseMemberCard member={member} strategy={new CommunityCardStrategy()} {...props} />
  }
  // ... other community-specific implementations
}

class FamilyAdapter implements GroupAdapter {
  renderMemberCard(member, props) {
    return <BaseMemberCard member={member} strategy={new FamilyCardStrategy()} {...props} />
  }
  // ... other family-specific implementations
}
```

#### 3. Universal Client
```typescript
const UniversalClient = ({ groupType, ...props }) => {
  const adapter = getAdapter(groupType) // Factory function
  
  return (
    <div>
      <GroupToolbar config={adapter.getToolbarConfig()} />
      {members.map(member => adapter.renderMemberCard(member, props))}
    </div>
  )
}
```

### Benefits

1. **Eliminate Duplication**: 90% of code becomes shared
2. **Easy Extension**: New group type = ~20-50 lines instead of 800-1300 lines
3. **Single Source of Truth**: Changes propagate automatically
4. **Type Safety**: TypeScript ensures all strategies implement required methods
5. **Testability**: Each adapter can be tested independently

### Implementation Impact

#### Before (Current State)
- Community: ~800 lines
- Family: ~1300 lines
- Adding Office: +800-1300 lines (90% duplication)

#### After (Strategy Pattern)
- UniversalClient: ~500 lines (shared)
- CommunityAdapter: ~50 lines (unique logic only)
- FamilyAdapter: ~100 lines (unique logic only)
- Adding Office: +30-80 lines (unique logic only)

### Example: Member Card Strategy

#### Shared Base Component (90% of code)
```typescript
function BaseMemberCard({ member, strategy, ...props }) {
  return (
    <div className="member-card">
      <Image src={member.user.photoUrl} />
      {strategy.renderHeader(member)}
      <h3>{member.user.name}</h3>
      {strategy.renderRelationship(member.relationship)}
      {strategy.renderActions(member, props)}
    </div>
  )
}
```

#### Strategy-Specific Logic (10% of code)
```typescript
class CommunityCardStrategy {
  renderRelationship(relationship) {
    return <span>{relationship || 'Not Connected'}</span>
  }
  renderActions(member, props) {
    return <Button onClick={() => props.onConnect(member)}>Connect</Button>
  }
}

class FamilyCardStrategy {
  renderRelationship(relationship) {
    return <span className="font-medium">{relationship || 'Relative'}</span>
  }
  renderActions(member, props) {
    return <Button onClick={() => props.onRelate(member)}>Add Relationship</Button>
  }
}
```

## Implementation Timeline
- **Phase 1**: Create base interfaces and adapters (~2-3 hours)
- **Phase 2**: Migrate existing components to use adapters (~2-3 hours)  
- **Phase 3**: Test and refine (~1 hour)

**Total: ~6 hours of work to solve the duplication problem permanently**

## Long-term Value
- Adding Office groups: 30 minutes instead of 2-3 days
- Making changes: Update once instead of N times
- Reduced bugs: Single implementation to test
- Faster innovation: Focus on features, not maintenance