// API endpoint for AI-powered relationship assessments

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { OpenAIProvider } from '@/lib/llm/openai-provider';
import { buildPrompt, getMaxTokens } from '@/lib/llm/prompt-builder';
import { AI_REQUEST_TYPES, AI_PROVIDERS } from '@/lib/llm/types';
import type { RelationStarIndividualData } from '@/lib/llm/types';

// Rate limit: 2 requests per 24 hours
const RATE_LIMIT = 2;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function calculateStarScore(scores: {
  proximity: number;
  interest: number;
  personalTime: number;
  commonGround: number;
  familiarity: number;
}): number {
  const personalTimeScore = scores.personalTime * 0.30;
  const commonGroundScore = scores.commonGround * 0.25;
  const familiarityScore = scores.familiarity * 0.20;
  const interestScore = scores.interest * 0.15;
  const proximityScore = scores.proximity * 0.10;

  return personalTimeScore + commonGroundScore + familiarityScore + interestScore + proximityScore;
}

function getRelationshipLabel(score: number): string {
  if (score >= 8) return 'Close Friend';
  if (score >= 5) return 'Friend';
  if (score >= 3) return 'Acquaintance';
  if (score >= 1) return 'Nodding Acquaintance';
  return 'Stranger';
}

async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const cutoffTime = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  
  const recentRequests = await prisma.aIRequest.count({
    where: {
      userId,
      requestedAt: {
        gte: cutoffTime,
      },
      isFollowUp: false, // Only count initial requests
    },
  });

  const remaining = Math.max(0, RATE_LIMIT - recentRequests);
  return {
    allowed: recentRequests < RATE_LIMIT,
    remaining,
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Check email verification
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true },
    });

    if (!user?.email || !user.emailVerified) {
      return NextResponse.json(
        { error: 'Verified email required for AI assessments' },
        { status: 403 }
      );
    }

    // 3. Check rate limit (skip for super admins)
    const isSuperAdmin = session.user.isSuperAdmin || false;
    let rateLimit = { allowed: true, remaining: 999 };
    
    if (!isSuperAdmin) {
      rateLimit = await checkRateLimit(session.user.id);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'You have used your 2 free AI assessments for today. Please try again in 24 hours.',
            remaining: 0,
          },
          { status: 429 }
        );
      }
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const {
      proximity,
      interest,
      personalTime,
      commonGround,
      familiarity,
      relationshipGoals,
      currentUserFirstName,
      memberFirstName,
      aboutUserId, // The user this assessment is about
    } = body;

    // Validate scores
    const scores = { proximity, interest, personalTime, commonGround, familiarity };
    for (const [key, value] of Object.entries(scores)) {
      if (typeof value !== 'number' || value < 0 || value > 10) {
        return NextResponse.json(
          { error: `Invalid ${key}: must be a number between 0 and 10` },
          { status: 400 }
        );
      }
    }

    // Check if all scores are 0
    if (Object.values(scores).every(v => v === 0)) {
      return NextResponse.json(
        { error: 'Please adjust at least one slider before requesting an assessment' },
        { status: 400 }
      );
    }

    // 5. Calculate star score and label
    const starScore = calculateStarScore(scores);
    const relationshipLabel = getRelationshipLabel(starScore);

    // 6. Build request data
    const requestData: RelationStarIndividualData = {
      scores,
      starScore: parseFloat(starScore.toFixed(1)),
      relationshipLabel,
      relationshipGoals: relationshipGoals || undefined,
      currentUserFirstName: currentUserFirstName || undefined,
      memberFirstName: memberFirstName || undefined,
    };

    // 7. Build prompts
    const { systemPrompt, userPrompt } = buildPrompt(
      AI_REQUEST_TYPES.RELATION_STAR_INDIVIDUAL,
      requestData
    );
    const maxTokens = getMaxTokens(AI_REQUEST_TYPES.RELATION_STAR_INDIVIDUAL);

    // 8. Generate AI response
    const provider = new OpenAIProvider();
    const output = await provider.generateResponse(systemPrompt, userPrompt, maxTokens);

    // 9. Save to database
    const assessment = await prisma.aIRequest.create({
      data: {
        userId: session.user.id,
        requestType: AI_REQUEST_TYPES.RELATION_STAR_INDIVIDUAL,
        requestInput: JSON.stringify(requestData),
        requestContext: aboutUserId ? JSON.stringify({ aboutUserId }) : null,
        provider: AI_PROVIDERS.OPENAI,
        model: provider.model,
        systemPrompt,
        userPrompt,
        response: output.text,
        tokensUsed: output.tokensUsed,
        costUsd: output.cost,
        processingTimeMs: output.processingTimeMs,
        isFollowUp: false,
      },
    });

    // 8. Return response with rate limit info
    return NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        text: output.text,
        starScore: starScore.toFixed(1),
        relationshipLabel,
      },
      rateLimit: {
        remaining: isSuperAdmin ? 999 : rateLimit.remaining - 1,
        resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW_MS).toISOString(),
      },
      metadata: {
        tokensUsed: output.tokensUsed,
        processingTimeMs: output.processingTimeMs,
      },
    });

  } catch (error) {
    console.error('AI assessment error:', error);
    
    // Save error to database if we have a user ID
    const session = await auth();
    if (session?.user?.id) {
      try {
        await prisma.aIRequest.create({
          data: {
            userId: session.user.id,
            requestType: AI_REQUEST_TYPES.RELATION_STAR_INDIVIDUAL,
            requestInput: '{}',
            provider: AI_PROVIDERS.OPENAI,
            model: 'gpt-4o-mini',
            systemPrompt: '',
            userPrompt: '',
            response: '',
            isFollowUp: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } catch (dbError) {
        console.error('Failed to log error to database:', dbError);
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to generate assessment',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
