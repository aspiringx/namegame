'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { getPhotoUrl } from '@/lib/photos'
import StarChart from '../../stars/StarChart'

interface CosmicInsightsData {
  id: string
  userId: string
  userName: string
  memberFirstName?: string
  memberId: string | null
  creatorPhoto: { url: string } | null
  aboutUserPhoto: { url: string } | null
  scores: {
    proximity: number
    interest: number
    personalTime: number
    commonGround: number
    familiarity: number
  }
  starScore: number
  relationshipLabel: string
  relationshipGoals?: string
  response: string
  createdAt: string
}

export default function CosmicInsightsPage() {
  const params = useParams()
  const router = useRouter()
  const { status } = useSession()
  const [data, setData] = useState<CosmicInsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatorPhotoUrl, setCreatorPhotoUrl] = useState<string | null>(null)
  const [aboutUserPhotoUrl, setAboutUserPhotoUrl] = useState<string | null>(
    null,
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/cosmic-insights/${params.id}`)

        if (!response.ok) {
          if (response.status === 403) {
            // Unauthorized - redirect to home
            router.push('/')
            return
          } else if (response.status === 404) {
            setError('Assessment not found.')
          } else {
            setError('Failed to load assessment.')
          }
          return
        }

        const result = await response.json()
        setData(result)

        // Load photo URLs
        if (result.creatorPhoto) {
          const url = await getPhotoUrl(result.creatorPhoto, { size: 'thumb' })
          setCreatorPhotoUrl(url)
        }
        if (result.aboutUserPhoto) {
          const url = await getPhotoUrl(result.aboutUserPhoto, {
            size: 'thumb',
          })
          setAboutUserPhotoUrl(url)
        }
      } catch {
        setError('An error occurred while loading the assessment.')
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/cosmic-insights/${params.id}`)
      return
    }

    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, params.id, router])

  if (isLoading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600"></div>
          <p className="mt-4 text-sm text-gray-400">
            Loading Cosmic Insights...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-100">
            Unable to Load Assessment
          </h1>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold text-gray-100">
              Cosmic Insights
              {data.memberFirstName && ` with ${data.memberFirstName}`}
            </h1>
            <p className="text-sm text-gray-400">
              Created {new Date(data.createdAt).toLocaleDateString()} at{' '}
              {new Date(data.createdAt).toLocaleTimeString()} by {data.userName}
            </p>
            {/* Mobile: Photos below text */}
            <div className="flex gap-3 mt-3 md:hidden">
              {creatorPhotoUrl && (
                <div className="relative h-18 w-18 flex-shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={creatorPhotoUrl}
                    alt={data.userName}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {aboutUserPhotoUrl && (
                <div className="relative h-18 w-18 flex-shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={aboutUserPhotoUrl}
                    alt={data.memberFirstName || 'User'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          {/* Desktop: Photos on right */}
          <div className="hidden md:flex gap-3">
            {creatorPhotoUrl && (
              <div className="relative h-18 w-18 flex-shrink-0 overflow-hidden rounded-full">
                <Image
                  src={creatorPhotoUrl}
                  alt={data.userName}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            {aboutUserPhotoUrl && (
              <div className="relative h-18 w-18 flex-shrink-0 overflow-hidden rounded-full">
                <Image
                  src={aboutUserPhotoUrl}
                  alt={data.memberFirstName || 'User'}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Context and Insights */}
        <div className="space-y-6">
          {data.relationshipGoals && (
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <h2 className="mb-4 text-xl font-bold">Relationship Context</h2>
              <div className="text-sm text-gray-300">
                {data.relationshipGoals}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-bold">Your Cosmic Insights</h2>
            <div
              className="prose prose-sm prose-indigo prose-invert max-w-none text-gray-200 [&_li]:leading-relaxed [&_ul]:space-y-3 [&>div]:space-y-2 [&>p]:mb-8"
              dangerouslySetInnerHTML={{ __html: data.response }}
            />
          </div>
        </div>

        {/* Right: Chart and Score */}
        <div className="space-y-6">
          {/* Star Chart */}
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-bold">Star Chart</h2>
            <StarChart
              data={[
                {
                  dimension: 'Proximity',
                  value: data.scores.proximity,
                  max: 10,
                },
                {
                  dimension: 'Interest',
                  value: data.scores.interest,
                  max: 10,
                },
                {
                  dimension: 'Personal Time',
                  value: data.scores.personalTime,
                  max: 10,
                },
                {
                  dimension: 'Common Ground',
                  value: data.scores.commonGround,
                  max: 10,
                },
                {
                  dimension: 'Familiarity',
                  value: data.scores.familiarity,
                  max: 10,
                },
              ]}
              size="large"
            />
          </div>

          {/* Star Score */}
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-bold">Star Score</h2>
            <div className="mb-4 text-center">
              <div className="font-bold">
                <span className="text-4xl text-indigo-400">
                  {data.starScore}
                </span>
                <span className="text-2xl text-gray-400">/10</span>
              </div>
              <div className="mt-2 text-sm font-medium text-gray-400">
                {data.relationshipLabel}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Personal Time (30%)</span>
                <span className="font-medium">
                  {data.scores.personalTime}/10
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Common Ground (25%)</span>
                <span className="font-medium">
                  {data.scores.commonGround}/10
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Familiarity (20%)</span>
                <span className="font-medium">
                  {data.scores.familiarity}/10
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Interest (15%)</span>
                <span className="font-medium">{data.scores.interest}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Proximity (10%)</span>
                <span className="font-medium">{data.scores.proximity}/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
