// API endpoint to fetch relation star history for a specific member

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { AI_REQUEST_TYPES } from '@/lib/llm/types';

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Get memberId (which is actually another userId) from query params
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      );
    }

    // 3. Verify the member exists and has a relationship with the current user
    const member = await prisma.user.findUnique({
      where: {
        id: memberId,
      },
      select: {
        id: true,
        firstName: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Note: We don't check user_user relationship here because access is controlled
    // through group membership. Users can create assessments for any group member.

    // 4. Fetch relation star assessments for this specific member using raw SQL
    // We use raw SQL to filter by JSON field in the database
    const assessments = await prisma.$queryRaw<Array<{
      id: string;
      requestInput: string;
      requestContext: string | null;
      response: string;
      requestedAt: Date;
    }>>`
      SELECT id, "requestInput", "requestContext", response, "requestedAt"
      FROM ai_requests
      WHERE "userId" = ${session.user.id}
        AND "requestType" = ${AI_REQUEST_TYPES.RELATION_STAR_INDIVIDUAL}
        AND "isFollowUp" = false
        AND "requestContext"::jsonb->>'aboutUserId' = ${memberId}
      ORDER BY "requestedAt" DESC
    `;

    // 5. Parse assessments
    const memberAssessments = assessments
      .map((assessment) => {
        try {
          const input = JSON.parse(assessment.requestInput);
          return {
            id: assessment.id,
            input,
            response: assessment.response,
            requestedAt: assessment.requestedAt,
          };
        } catch {
          return null;
        }
      })
      .filter((assessment): assessment is NonNullable<typeof assessment> => assessment !== null);

    // 6. Format response
    const formattedAssessments = memberAssessments.map((assessment) => ({
      id: assessment.id,
      scores: assessment.input.scores,
      starScore: assessment.input.starScore,
      relationshipLabel: assessment.input.relationshipLabel,
      relationshipGoals: assessment.input.relationshipGoals,
      response: assessment.response,
      createdAt: assessment.requestedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      assessments: formattedAssessments,
    });
  } catch (error) {
    console.error('Fetch relation star history error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch history',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
