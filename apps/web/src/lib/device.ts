/**
 * Server-side device type detection based on User-Agent header.
 * This is used for photo sizing and other server-side rendering decisions.
 * For detailed device/OS/browser detection, use the client-side useDeviceInfo hook.
 */
export function getDeviceTypeFromHeaders(
  headersList: Headers,
): 'mobile' | 'desktop' {
  const userAgent = headersList.get('user-agent') || ''
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    )

  return isMobile ? 'mobile' : 'desktop'
}
