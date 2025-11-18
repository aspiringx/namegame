/**
 * Get the application origin URL for push notifications
 * Works in both server action context (with headers) and worker context (without headers)
 */
export function getAppOrigin(headers?: Headers): string {
  // If headers are provided (server action context), use them
  if (headers) {
    // ngrok and other proxies set x-forwarded-host to the original host
    // Use it if available, otherwise fall back to host header
    const host =
      headers.get('x-forwarded-host') || headers.get('host') || 'localhost:3000'

    // Determine protocol:
    // 1. Use x-forwarded-proto if set (ngrok, production load balancer)
    // 2. Use http for localhost (even in production mode)
    // 3. Default to https for everything else
    const protocol =
      headers.get('x-forwarded-proto') ||
      (host.startsWith('localhost') || host.startsWith('127.0.0.1')
        ? 'http'
        : 'https')

    return `${protocol}://${host}`
  }

  // Fallback to environment variable (worker context, cron jobs, etc.)
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

/**
 * Generate a notification URL with the correct origin
 * @param path - The path to append to the origin (e.g., '/me?chat=open')
 * @param headers - Optional headers from server action context
 */
export function getNotificationUrl(path: string, headers?: Headers): string {
  const origin = getAppOrigin(headers)
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${origin}${normalizedPath}`
}
