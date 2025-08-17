'use client'

import React, { useState } from 'react'
import { Info, ChevronUp } from 'lucide-react'

export default function UsersPage() {
  const [showInfo, setShowInfo] = useState(false)
  return (
    <div>
      <p className="mb-6 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
        Create managed users to include those who can't participate for
        themselves.
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="-my-2 ml-2 rounded-full p-2 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        >
          <Info className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
        </button>
      </p>
      {showInfo && (
        <div
          id="managed-user-info"
          className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            Perfect for including minor children, deceased relatives (in a
            family group), people with disabilities, or people without internet
            access.
          </p>
          <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            Managed users:
            <ul className="mt-4 list-inside list-disc space-y-2">
              <li>Don't require separate logins or emails</li>
              <li>
                Multiple people can manage the same users (two parents of a
                child, adult children of a deceased parent, etc.)
              </li>
              <li>
                Parents can give control of the account to children, either
                partially or fully
              </li>
              <li>
                Birth dates are required to determine age. Birth locations,
                death dates, and death locations are optional, but nice in
                family groups.
              </li>
            </ul>
          </p>
          <button
            type="button"
            onClick={() => setShowInfo(false)}
            className="mx-auto flex items-center pt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ChevronUp className="mr-1 h-4 w-4" />
            Close
          </button>
        </div>
      )}
    </div>
  )
}
