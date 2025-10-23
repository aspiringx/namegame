import { NextRequest, NextResponse } from 'next/server'
import ogs from 'open-graph-scraper'
import { auth } from '@/auth'

// Simple in-memory cache for link previews
const previewCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Rate limiting: track requests per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 requests per minute

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }
    // Block localhost and private IPs
    const hostname = parsed.hostname.toLowerCase()
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.endsWith('.local')
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    // Reset or create new limit
    rateLimitMap.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL or blocked domain' },
        { status: 400 }
      )
    }

    // Check cache
    const cached = previewCache.get(url)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Fetch Open Graph data with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const { result } = await ogs({
        url,
        timeout: 10000,
        fetchOptions: {
          signal: controller.signal,
        },
      })

      clearTimeout(timeoutId)

      const preview = {
        url,
        title: result.ogTitle || result.twitterTitle || null,
        description: result.ogDescription || result.twitterDescription || null,
        image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
        siteName: result.ogSiteName || null,
      }

      // Cache the result
      previewCache.set(url, {
        data: preview,
        timestamp: Date.now(),
      })

      // Clean up old cache entries (keep last 1000)
      if (previewCache.size > 1000) {
        const entries = Array.from(previewCache.entries())
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
        const toDelete = entries.slice(0, entries.length - 1000)
        toDelete.forEach(([key]) => previewCache.delete(key))
      }

      return NextResponse.json(preview)
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout' },
          { status: 408 }
        )
      }

      throw error
    }
  } catch (error) {
    console.error('[Link Preview] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch link preview' },
      { status: 500 }
    )
  }
}
