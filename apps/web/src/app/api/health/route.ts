import { NextResponse } from 'next/server'

// This route is used by the hosting provider (DigitalOcean) to check if the
// application is healthy and ready to receive traffic. It helps ensure
// zero-downtime deployments by verifying that the app can fully render a page,
// including its static assets like CSS.

export async function GET(request: Request) {
  const host = request.headers.get('host')
  if (!host) {
    return NextResponse.json(
      { status: 'error', message: 'Host header is missing' },
      { status: 400 },
    )
  }

  // Inside the container, the app serves on HTTP. The external proxy handles HTTPS.
  // We must use http for the internal self-check.
  const protocol = 'http'
  const baseUrl = `${protocol}://${host}`

  try {
    // 1. Fetch the homepage to ensure the Next.js server is responding.
    const homepageRes = await fetch(baseUrl, {
      signal: AbortSignal.timeout(5000), // 5-second timeout
    })

    if (!homepageRes.ok) {
      throw new Error(
        `Homepage fetch failed with status: ${homepageRes.status}`,
      )
    }

    // 2. Parse the HTML to find stylesheet links.
    const html = await homepageRes.text()
    const stylesheetLinks = html.match(
      /<link[^>]+rel="stylesheet"[^>]+href="([^"\s]+)"/g,
    )

    if (!stylesheetLinks || stylesheetLinks.length === 0) {
      throw new Error('No stylesheets found in the homepage HTML.')
    }

    // 3. Check that each critical stylesheet is available.
    const assetChecks = stylesheetLinks.map((link) => {
      const hrefMatch = link.match(/href="([^"\s]+)"/)
      if (!hrefMatch || !hrefMatch[1]) {
        throw new Error('Found a stylesheet link with no href.')
      }
      const assetUrl = new URL(hrefMatch[1], baseUrl).toString()
      return fetch(assetUrl, { signal: AbortSignal.timeout(5000) }).then(
        (res) => {
          if (!res.ok) {
            throw new Error(
              `Failed to fetch asset ${assetUrl}: status ${res.status}`,
            )
          }
          return res.ok
        },
      )
    })

    await Promise.all(assetChecks)

    // If all checks pass, the application is healthy.
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Health check failed:', error)
    // If any error occurs, the app is not ready for traffic.
    return NextResponse.json(
      { status: 'error', message: (error as Error).message },
      { status: 503 }, // 503 Service Unavailable
    )
  }
}
