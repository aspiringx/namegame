'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type BreadcrumbItem = {
  label: string
  href: string
  active?: boolean
}

const Breadcrumbs = ({
  breadcrumbs: propBreadcrumbs,
}: {
  breadcrumbs?: BreadcrumbItem[]
}) => {
  const pathname = usePathname()

  const breadcrumbs = propBreadcrumbs
    ? propBreadcrumbs.map((b) => ({ ...b, isLast: b.active }))
    : (() => {
        const pathSegments = pathname.split('/').filter((segment) => segment)

        return pathSegments.map((segment, index) => {
          const href = '/' + pathSegments.slice(0, index + 1).join('/')
          const isLast = index === pathSegments.length - 1
          const label = segment.charAt(0).toUpperCase() + segment.slice(1)

          return {
            href,
            label,
            isLast,
          }
        })
      })()

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
      <ol className="flex list-none flex-wrap items-center p-0">
        <li className="flex items-center">
          <Link href="/" className="hover:text-blue-500">
            Home
          </Link>
        </li>
        {breadcrumbs.map((breadcrumb, _index) => (
          <li key={breadcrumb.href} className="flex items-center">
            <span className="mx-2">/</span>
            {breadcrumb.isLast ? (
              <span className="max-w-[120px] truncate text-gray-300 sm:max-w-none">
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="max-w-[120px] truncate hover:text-blue-500 sm:max-w-none"
              >
                {breadcrumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
