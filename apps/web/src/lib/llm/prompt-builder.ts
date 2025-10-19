// Prompt builder for different AI request types

import type {
  AIRequestType,
  RelationStarIndividualData,
  RelationStarComparisonData,
  GroupHealthData,
} from './types';

const SYSTEM_PROMPTS: Record<AIRequestType, string> = {
  relation_star_individual: `You are a relationship insight assistant. Provide brief, empathetic, and actionable assessments of personal relationships based on Relation Star data. Focus on:

1. Identifying patterns and barriers
2. Validating the user's feelings and goals
3. Offering specific, practical suggestions
4. Being warm, non-judgmental, and constructive

Keep responses concise (2-3 sentences). Avoid jargon. Speak directly to the user.`,

  relation_star_comparison: `You are a relationship insight assistant helping two people understand their different perspectives on the same relationship. Provide balanced, empathetic analysis that:

1. Identifies where they agree and differ
2. Explains why perceptions might differ
3. Highlights mutual strengths
4. Offers specific suggestions for bridging gaps

Keep responses around 150 words. Be warm, balanced, and actionable.`,

  group_health: `You are a group dynamics consultant helping administrators understand and improve their community. Provide data-driven, actionable insights that:

1. Identify key patterns and trends
2. Highlight both strengths and areas for improvement
3. Offer specific, practical recommendations
4. Consider the unique context and goals

Be professional, constructive, and specific. Tailor advice to the group's size and type.`,

  custom: `You are a helpful AI assistant. Provide clear, accurate, and helpful responses based on the context provided.`,
};

export function buildPrompt(
  requestType: AIRequestType,
  data: Record<string, any>,
  context?: string
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = SYSTEM_PROMPTS[requestType];

  let userPrompt = '';

  switch (requestType) {
    case 'relation_star_individual':
      userPrompt = buildRelationStarIndividualPrompt(data as RelationStarIndividualData);
      break;
    case 'relation_star_comparison':
      userPrompt = buildRelationStarComparisonPrompt(data as RelationStarComparisonData);
      break;
    case 'group_health':
      userPrompt = buildGroupHealthPrompt(data as GroupHealthData);
      break;
    case 'custom':
      userPrompt = JSON.stringify(data, null, 2);
      break;
  }

  if (context) {
    userPrompt = `${context}\n\n${userPrompt}`;
  }

  return { systemPrompt, userPrompt };
}

function buildRelationStarIndividualPrompt(data: RelationStarIndividualData): string {
  const { scores, starScore, relationshipLabel, relationshipGoals } = data;

  let prompt = `Analyze this Relation Star assessment:

**Scores (0-10):**
- Proximity: ${scores.proximity}/10
- Interest: ${scores.interest}/10
- Personal Time: ${scores.personalTime}/10
- Common Ground: ${scores.commonGround}/10
- Familiarity: ${scores.familiarity}/10

**Overall Star Score:** ${starScore}/10 (${relationshipLabel})`;

  if (relationshipGoals) {
    prompt += `\n\n**User's Goal:** "${relationshipGoals}"`;
  }

  prompt += `\n\nProvide your response as clean HTML (no wrapping tags like <html> or <body>). Use this structure:

<p><strong>Summary:</strong> (1-2 sentences about the overall relationship state and pattern)</p>

<div>
  <strong>Dimension Insights:</strong>
  <ul>
    <li><strong>Dimension Name (score/10):</strong> Brief observation and actionable suggestion (1-2 sentences)</li>
  </ul>
</div>

Address each dimension that has a notable score (high, low, or mismatched with others). Focus on the most impactful dimensions first.`;

  return prompt;
}

function buildRelationStarComparisonPrompt(data: RelationStarComparisonData): string {
  const { personA, personB } = data;

  let prompt = `Compare these two Relation Star assessments of the same relationship:

**Person A's Assessment:**
- Proximity: ${personA.scores.proximity}/10
- Interest: ${personA.scores.interest}/10
- Personal Time: ${personA.scores.personalTime}/10
- Common Ground: ${personA.scores.commonGround}/10
- Familiarity: ${personA.scores.familiarity}/10
- Star Score: ${personA.starScore}/10 (${personA.relationshipLabel})`;

  if (personA.relationshipGoals) {
    prompt += `\n- Goal: "${personA.relationshipGoals}"`;
  }

  prompt += `\n\n**Person B's Assessment:**
- Proximity: ${personB.scores.proximity}/10
- Interest: ${personB.scores.interest}/10
- Personal Time: ${personB.scores.personalTime}/10
- Common Ground: ${personB.scores.commonGround}/10
- Familiarity: ${personB.scores.familiarity}/10
- Star Score: ${personB.starScore}/10 (${personB.relationshipLabel})`;

  if (personB.relationshipGoals) {
    prompt += `\n- Goal: "${personB.relationshipGoals}"`;
  }

  prompt += `\n\nProvide a brief comparison (~150 words) that identifies:
1. Where they agree (aligned perceptions)
2. Key differences in perception
3. Mutual strengths to build on
4. 2-3 specific suggestions for bridging gaps`;

  return prompt;
}

function buildGroupHealthPrompt(data: GroupHealthData): string {
  const { groupName, memberCount, metrics, adminQuestion } = data;

  let prompt = `Analyze this group's health and dynamics:

**Group:** ${groupName}
**Members:** ${memberCount}

**Metrics:**
${JSON.stringify(metrics, null, 2)}`;

  if (adminQuestion) {
    prompt += `\n\n**Admin's Question:** "${adminQuestion}"`;
  }

  prompt += `\n\nProvide actionable insights and recommendations for improving this group's health and engagement.`;

  return prompt;
}

export function getMaxTokens(requestType: AIRequestType): number {
  switch (requestType) {
    case 'relation_star_individual':
      return 400; // Est. cost: ~$0.0003 per request (gpt-4o-mini: ~200 input + 400 output tokens)
    case 'relation_star_comparison':
      return 400; // Est. cost: ~$0.0004 per request (gpt-4o-mini: ~300 input + 400 output tokens)
    case 'group_health':
      return 500; // Est. cost: ~$0.0005 per request (gpt-4o-mini: ~400 input + 500 output tokens)
    case 'custom':
      return 500; // Est. cost: varies by input
    default:
      return 300;
  }
}
