// OpenAI LLM provider implementation

import OpenAI from 'openai';
import type { LLMProvider, AIResponse } from './types';
import { AI_PROVIDERS } from './types';

export class OpenAIProvider implements LLMProvider {
  name = AI_PROVIDERS.OPENAI;
  model = 'gpt-4o-mini';
  private client: OpenAI;

  // Pricing per 1M tokens (as of 2024)
  private readonly INPUT_COST_PER_1M = 0.15; // $0.15 per 1M input tokens
  private readonly OUTPUT_COST_PER_1M = 0.60; // $0.60 per 1M output tokens

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number = 300
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      const processingTimeMs = Date.now() - startTime;
      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = this.calculateCost(
        response.usage?.prompt_tokens || 0,
        response.usage?.completion_tokens || 0
      );

      return {
        text: response.choices[0]?.message?.content || 'No response generated',
        tokensUsed,
        cost,
        processingTimeMs,
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    return this.calculateCost(inputTokens, outputTokens);
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1_000_000) * this.INPUT_COST_PER_1M;
    const outputCost = (outputTokens / 1_000_000) * this.OUTPUT_COST_PER_1M;
    return inputCost + outputCost;
  }
}
