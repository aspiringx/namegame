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

    // Verify there's a relationship between the users
    const relationship = await prisma.userUser.findFirst({
      where: {
        OR: [
          { user1Id: session.user.id, user2Id: memberId },
          { user1Id: memberId, user2Id: session.user.id },
        ],
      },
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'No relationship found with this user' },
        { status: 403 }
      );
    }

    // 4. Fetch all relation star assessments for this member
    const assessments = await prisma.aIRequest.findMany({
      where: {
        userId: session.user.id,
        requestType: AI_REQUEST_TYPES.RELATION_STAR_INDIVIDUAL,
        isFollowUp: false,
      },
      select: {
        id: true,
        requestInput: true,
        response: true,
        requestedAt: true,
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });

    // 5. Filter and parse assessments for this specific member
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
      .filter((assessment): assessment is NonNullable<typeof assessment> => {
        if (!assessment) return false;
        // Check if this assessment is for the requested member
        // The input contains memberFirstName which we can match
        return assessment.input.memberFirstName === member.firstName;
      });

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
