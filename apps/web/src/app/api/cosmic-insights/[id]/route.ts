// API endpoint to fetch a specific Cosmic Insights assessment

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params

    // 2. Fetch the AI request
    const aiRequest = await prisma.aIRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!aiRequest) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // 3. Verify the current user owns this assessment
    if (aiRequest.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this assessment' },
        { status: 403 }
      )
    }

    // 4. Parse the request input to get the scores and context
    const requestInput = JSON.parse(aiRequest.requestInput)

    // 5. Extract scores (they're nested in a scores object)
    const scores = requestInput.scores || {
      proximity: 0,
      interest: 0,
      personalTime: 0,
      commonGround: 0,
      familiarity: 0,
    }

    const starScore =
      scores.personalTime * 0.3 +
      scores.commonGround * 0.25 +
      scores.familiarity * 0.2 +
      scores.interest * 0.15 +
      scores.proximity * 0.1

    const relationshipLabel =
      starScore >= 8
        ? 'Close Friend'
        : starScore >= 5
        ? 'Friend'
        : starScore >= 3
        ? 'Acquaintance'
        : starScore >= 1
        ? 'Nodding Acquaintance'
        : 'Stranger'

    // 6. Return the assessment data
    return NextResponse.json({
      id: aiRequest.id,
      userId: aiRequest.userId,
      userName: `${aiRequest.user.firstName} ${aiRequest.user.lastName || ''}`.trim(),
      memberFirstName: requestInput.memberFirstName,
      scores,
      starScore: parseFloat(starScore.toFixed(1)),
      relationshipLabel,
      relationshipGoals: requestInput.relationshipGoals,
      response: aiRequest.response,
      createdAt: aiRequest.requestedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching cosmic insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    )
  }
}
