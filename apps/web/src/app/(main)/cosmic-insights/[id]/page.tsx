'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { getPhotoUrl } from '@/lib/photos'

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
            <div className="relative mx-auto aspect-square w-full">
              <svg viewBox="-10 -10 340 340" className="h-full w-full">
                {/* Center point */}
                <circle cx="160" cy="160" r="3" fill="#4f46e5" />

                {/* Concentric circles */}
                {[32, 64, 96, 128, 160].map((radius) => (
                  <circle
                    key={radius}
                    cx="160"
                    cy="160"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="stroke-gray-300 stroke-gray-600"
                  />
                ))}

                {/* Scale labels */}
                {[0, 5, 10].map((val) => (
                  <text
                    key={val}
                    x="160"
                    y={160 - val * 16 - (val === 0 ? 12 : 0) + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="500"
                    fill="currentColor"
                    className="fill-gray-500 fill-gray-400"
                  >
                    {val}
                  </text>
                ))}

                {/* Axes */}
                {Object.keys(data.scores).map((_, idx) => {
                  const angle = (idx * (360 / 5) - 90 + 30) * (Math.PI / 180)
                  const x = 160 + 160 * Math.cos(angle)
                  const y = 160 + 160 * Math.sin(angle)
                  return (
                    <line
                      key={idx}
                      x1="160"
                      y1="160"
                      x2={x}
                      y2={y}
                      stroke="currentColor"
                      strokeWidth="1"
                      className="stroke-gray-300 stroke-gray-600"
                    />
                  )
                })}

                {/* Filled area */}
                <path
                  d={
                    Object.values(data.scores)
                      .map((value, idx) => {
                        const angle =
                          (idx * (360 / 5) - 90 + 30) * (Math.PI / 180)
                        const length = value * 16
                        const x = 160 + length * Math.cos(angle)
                        const y = 160 + length * Math.sin(angle)
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
                      })
                      .join(' ') + ' Z'
                  }
                  fill="#4f46e5"
                  fillOpacity="0.15"
                  stroke="#4f46e5"
                  strokeWidth="3"
                  opacity="0.6"
                />

                {/* Points */}
                {Object.values(data.scores).map((value, idx) => {
                  const angle = (idx * (360 / 5) - 90 + 30) * (Math.PI / 180)
                  const length = value * 16
                  const x = 160 + length * Math.cos(angle)
                  const y = 160 + length * Math.sin(angle)

                  return (
                    <g key={idx}>
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill="#4f46e5"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </g>
                  )
                })}

                {/* Labels */}
                {[
                  { key: 'proximity', label: 'Proximity' },
                  { key: 'interest', label: 'Interest' },
                  { key: 'personalTime', label: 'Personal\nTime' },
                  { key: 'commonGround', label: 'Common\nGround' },
                  { key: 'familiarity', label: 'Familiarity' },
                ].map((dim, idx) => {
                  const angle = (idx * (360 / 5) - 90 + 30) * (Math.PI / 180)
                  const labelDistance = 145
                  const x = 160 + labelDistance * Math.cos(angle)
                  const y = 160 + labelDistance * Math.sin(angle)

                  return (
                    <text
                      key={dim.key}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="14"
                      fontWeight="600"
                      fill="currentColor"
                      className="fill-gray-700 fill-gray-300"
                    >
                      {dim.label.split('\n').map((line, i) => (
                        <tspan key={i} x={x} dy={i === 0 ? 0 : 16}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  )
                })}
              </svg>
            </div>
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
