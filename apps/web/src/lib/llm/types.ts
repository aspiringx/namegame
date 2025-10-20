// LLM provider types and interfaces

// Request types - managed in code, not as DB enum
export const AI_REQUEST_TYPES = {
  RELATION_STAR_INDIVIDUAL: 'relation_star_individual',
  RELATION_STAR_COMPARISON: 'relation_star_comparison',
  GROUP_HEALTH: 'group_health',
  CUSTOM: 'custom',
} as const;

export type AIRequestType = typeof AI_REQUEST_TYPES[keyof typeof AI_REQUEST_TYPES];

// Provider types - managed in code, not as DB enum
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
} as const;

export type AIProviderType = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS];

export interface AIRequestInput {
  type: AIRequestType;
  data: Record<string, any>; // Flexible JSON data
  context?: string; // Optional additional context
}

export interface AIResponse {
  text: string;
  tokensUsed: number;
  cost: number;
  processingTimeMs: number;
}

export interface LLMProvider {
  name: string;
  model: string;
  generateResponse(
    systemPrompt: string,
    userPrompt: string,
    maxTokens?: number
  ): Promise<AIResponse>;
  estimateCost(inputTokens: number, outputTokens: number): number;
}

// Helper type for Relation Star requests
export interface RelationStarIndividualData {
  scores: {
    proximity: number;
    interest: number;
    personalTime: number;
    commonGround: number;
    familiarity: number;
  };
  starScore: number;
  relationshipLabel: string;
  relationshipGoals?: string;
  currentUserFirstName?: string;
  memberFirstName?: string;
}

export interface RelationStarComparisonData {
  personA: RelationStarIndividualData;
  personB: RelationStarIndividualData;
}

export interface GroupHealthData {
  groupId: string;
  groupName: string;
  memberCount: number;
  metrics: Record<string, any>;
  adminQuestion?: string;
}
