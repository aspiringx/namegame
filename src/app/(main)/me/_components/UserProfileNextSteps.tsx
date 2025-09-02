'use client'

import {
  ArrowRight,
  BellOff,
  BellRing,
  CheckCircleIcon,
  ChevronDown,
  ChevronUp,
  Download,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { UserProfile } from './user-profile-form'
import { useEffect, useState } from 'react'
import { useA2HS } from '@/context/A2HSContext'
import { useDeviceInfoContext } from '@/context/DeviceInfoContext'
import { usePushNotificationsContext } from '@/context/PushNotificationsContext'
import { NAMEGAME_PWA_PROMPT_DISMISSED_KEY } from '@/lib/constants'

type ValidationRequirements = {
  passwordRequired: boolean
  photoRequired: boolean
}

export default function UserProfileNextSteps({
  user,
  validation,
  isInFamilyGroup,
}: {
  user: UserProfile
  validation: ValidationRequirements
  isInFamilyGroup: boolean
}) {
  const deviceInfo = useDeviceInfoContext()
  const [isCollapsed, setIsCollapsed] = useState(true)
  const { showPrompt } = useA2HS()
  const {
    isPushEnabled,
    subscribe,
    isSupported: isPushSupported,
    permissionStatus,
  } = usePushNotificationsContext()

  const notificationsBlocked = permissionStatus === 'denied'

  if (!deviceInfo) {
    return null
  }

  const handleInstallClick = () => {
    if (deviceInfo.pwaPrompt.isReady) {
      deviceInfo.pwaPrompt.prompt()
    } else {
      localStorage.removeItem(NAMEGAME_PWA_PROMPT_DISMISSED_KEY)
      showPrompt()
    }
  }

  const handleNotificationsClick = async () => {
    await subscribe()
  }

  const canInstall = deviceInfo.a2hs.canInstall
  const canEnableNotifications =
    isPushSupported && !isPushEnabled && !notificationsBlocked

  const profileCompletionSteps = [
    {
      id: 'email',
      isComplete: !!user.email,
      title: 'Add an email address',
      description:
        "Without a verified email, you can't log in later on this or other devices.",
      href: '#email',
    },
    {
      id: 'verify-email',
      isComplete: !user.email || !!user.emailVerified,
      title: 'Verify your email',
      description:
        'Check your inbox for a verification link to complete the process.',
      href: '#email',
    },
    {
      id: 'password',
      isComplete: !validation.passwordRequired,
      title: 'Set a new password',
      description:
        'Your account was created with a temporary password. Please set a new one.',
      href: '#password',
    },
    {
      id: 'photo',
      isComplete: !validation.photoRequired,
      title: 'Add a profile photo',
      description:
        'Help others recognize you by adding a real profile picture.',
      href: '#photo',
    },
    {
      id: 'optional',
      isComplete: !!user.birthDate && !!user.birthPlace,
      title: 'Add optional details',
      description:
        'Optionally include your gender, birth date, and birth place used in family groups.',
      href: '#birthDate',
    },
  ]

  const incompleteSteps = profileCompletionSteps
    .filter((step) => {
      if (step.id === 'optional' && !isInFamilyGroup) {
        return false
      }
      return true
    })
    .filter((step) => !step.isComplete)

  const nextStepsCount =
    (incompleteSteps.length > 0 ? 1 : 0) +
    (canInstall ? 1 : 0) +
    (canEnableNotifications ? 1 : 0) +
    1

  return (
    <div
      className={`overflow-hidden rounded-md shadow sm:rounded-md ${
        isCollapsed
          ? 'bg-yellow-50 dark:bg-yellow-900/30'
          : 'bg-white dark:bg-gray-800'
      }`}
    >
      <div className="p-4 sm:p-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center">
            {isCollapsed && (
              <CheckCircleIcon
                className="mr-3 h-5 w-5 text-yellow-400"
                aria-hidden="true"
              />
            )}
            <h4
              className={`text-base leading-7 font-semibold ${
                isCollapsed
                  ? 'text-yellow-800 dark:text-yellow-300'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              Next Steps
              <span
                className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isCollapsed
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {nextStepsCount}
              </span>
            </h4>
          </div>
          {isCollapsed ? (
            <ChevronDown
              className={`h-5 w-5 ${isCollapsed ? 'text-yellow-400' : 'text-gray-400'}`}
            />
          ) : (
            <ChevronUp
              className={`h-5 w-5 ${isCollapsed ? 'text-yellow-400' : 'text-gray-400'}`}
            />
          )}
        </button>
        {!isCollapsed && (
          <div className="mt-6">
            <ul className="space-y-6">
              {incompleteSteps.length > 0 && (
                <li>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <User
                        className="h-6 w-6 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Complete Your Profile
                      </h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
                        {incompleteSteps.map((step) => (
                          <li key={step.id}>
                            <a href={step.href} className="hover:underline">
                              {step.title}:{' '}
                              <span className="text-gray-500 dark:text-gray-300">
                                {step.description}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              )}
              {canInstall && (
                <li>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Download
                        className="h-6 w-6 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {deviceInfo.a2hs.actionLabel}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        For a better experience and to make it easy to return,
                        install the app on your device.
                      </p>
                      <button
                        onClick={handleInstallClick}
                        className="mt-2 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800"
                      >
                        {deviceInfo.a2hs.actionLabel}
                      </button>
                    </div>
                  </div>
                </li>
              )}
              {notificationsBlocked && (
                <li>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <BellOff
                        className="h-6 w-6 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Notifications Blocked
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        You have previously blocked notifications. To enable
                        them, you'll need to go to your browser's site settings
                        for this page.
                      </p>
                    </div>
                  </div>
                </li>
              )}
              {canEnableNotifications && (
                <li>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <BellRing
                        className="h-6 w-6 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Enable Notifications
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Get notified about group updates. It's the easiest way
                        for groups to communicate with you.
                      </p>
                      <button
                        onClick={subscribe}
                        className="mt-2 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800"
                      >
                        Enable Notifications
                      </button>
                    </div>
                  </div>
                </li>
              )}
              <li>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ArrowRight
                      className="h-6 w-6 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Return to a group
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      See what's new with your people.
                    </p>
                    <Link
                      href={`/me/groups`}
                      className="mt-2 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800"
                    >
                      Go to Groups
                    </Link>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
