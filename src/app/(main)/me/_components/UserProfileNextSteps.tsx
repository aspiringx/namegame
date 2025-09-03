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
import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useA2HS } from '@/context/A2HSContext'
import { useDeviceInfoContext } from '@/context/DeviceInfoContext'
import { usePushManager } from '@/hooks/use-push-manager'
import {
  NAMEGAME_PWA_PROMPT_DISMISSED_KEY,
  NAMEGAME_PWA_INSTALL_STEP_DISMISSED_KEY,
} from '@/lib/constants'

type ValidationRequirements = {
  passwordRequired: boolean
  photoRequired: boolean
}

type ProfileCompletionStep = {
  id: string
  isComplete: boolean
  title: string
  description: string
  href?: string
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
  const [isInstallStepDismissed, setIsInstallStepDismissed] = useState(false)
  useEffect(() => {
    const dismissed = localStorage.getItem(
      NAMEGAME_PWA_INSTALL_STEP_DISMISSED_KEY,
    )
    if (dismissed === 'true') {
      setIsInstallStepDismissed(true)
    }
  }, [])

  const { showPrompt } = useA2HS()
  const {
    isPushEnabled,
    subscribe,
    isSupported: isPushSupported,
    permissionStatus,
    error,
  } = usePushManager()

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

  const handleDismissInstallStep = () => {
    localStorage.setItem(NAMEGAME_PWA_INSTALL_STEP_DISMISSED_KEY, 'true')
    setIsInstallStepDismissed(true)
  }

  const canInstall = deviceInfo.a2hs.canInstall && !isInstallStepDismissed
  const canEnableNotifications =
    isPushSupported && !isPushEnabled && !notificationsBlocked

  const profileCompletionStepsRequired: ProfileCompletionStep[] = [
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
  ]

  const getOptionalFieldsDescription = () => {
    const missingFields = []
    if (!user.gender) missingFields.push('gender')
    if (!user.birthDate) missingFields.push('birth date')
    if (!user.birthPlace) missingFields.push('birth place')

    if (missingFields.length === 0) {
      return 'All optional details have been added.'
    }

    let fieldList = ''
    if (missingFields.length === 1) {
      fieldList = missingFields[0]
    } else if (missingFields.length === 2) {
      fieldList = missingFields.join(' and ')
    } else {
      fieldList = `${missingFields.slice(0, -1).join(', ')}, and ${missingFields[missingFields.length - 1]}`
    }

    return `Optionally include your ${fieldList} used in family groups.`
  }

  const profileCompletionStepsOptional: ProfileCompletionStep[] = [
    {
      id: 'optional',
      isComplete: !!user.gender && !!user.birthDate && !!user.birthPlace,
      title: 'Add optional details',
      description: getOptionalFieldsDescription(),
    },
  ]

  const incompleteRequiredSteps = profileCompletionStepsRequired.filter(
    (step) => !step.isComplete,
  )
  const incompleteOptionalSteps = isInFamilyGroup
    ? profileCompletionStepsOptional.filter((step) => !step.isComplete)
    : []

  const incompleteSteps = [
    ...incompleteRequiredSteps,
    ...incompleteOptionalSteps,
  ]

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
                            {step.href ? (
                              <Link href={step.href} className="block hover:bg-gray-50 dark:hover:bg-gray-800">
                                <div className="flex items-center px-4 py-4 sm:px-6">
                                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div className="truncate">
                                      <div className="flex text-sm">
                                        <p className="truncate font-medium text-indigo-600 dark:text-indigo-400">
                                          {step.title}
                                        </p>
                                      </div>
                                      <div className="mt-2 flex">
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                          <p>{step.description}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                                      <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
                                        <ChevronRight className="h-5 w-5" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            ) : (
                              <div>
                                {step.title}:{' '}
                                <span className="text-gray-500 dark:text-gray-300">
                                  {step.description}
                                </span>
                              </div>
                            )}
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
                      <button
                        onClick={handleDismissInstallStep}
                        className="mt-2 ml-2 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
                      >
                        Already Done
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
                        {deviceInfo.push.instructions}
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
                        Notifications are the easiest way for your groups to
                        communicate with you. Enable them on each device and
                        browser where you play.
                      </p>
                      <button
                        onClick={subscribe}
                        className="mt-2 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800"
                      >
                        Enable Notifications
                      </button>
                      {error && (
                        <div className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">
                          {error.message}
                        </div>
                      )}
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
