'use client'

import { resendVerificationEmail } from '@/app/(main)/me/actions'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ArrowRight,
  BellOff,
  BellRing,
  ChevronDown,
  ChevronUp,
  Download,
  User,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import { UserProfile } from './user-profile-form'
import { useEffect, useState, Dispatch, SetStateAction } from 'react'
import { useA2HS } from '@/context/A2HSContext'
import { useDeviceInfoContext } from '@/context/DeviceInfoContext'
import { usePushManager } from '@/hooks/use-push-manager'
import {
  NAMEGAME_PWA_PROMPT_DISMISSED_KEY,
  NAMEGAME_PWA_INSTALL_STEP_DISMISSED_KEY,
} from '@/lib/constants'

type ProfileCompletionStep = {
  id: string
  isComplete: boolean
  title: string
  description: string | React.ReactNode
  href?: string
}

type UserProfileNextStepsProps = {
  user: UserProfile
  passwordRequired: boolean
  photoRequired: boolean
  isInFamilyGroup: boolean
  setIsOptionalOpen?: Dispatch<SetStateAction<boolean>>
  isLoading: boolean
}

export default function UserProfileNextSteps({
  user,
  passwordRequired,
  photoRequired,
  isInFamilyGroup,
  setIsOptionalOpen,
  isLoading,
}: UserProfileNextStepsProps) {
  // --- Step Definitions ---
  const profileCompletionStepsRequired: ProfileCompletionStep[] = [
    {
      id: 'firstName',
      isComplete: !!user.firstName,
      title: 'First Name',
      description: 'Your first name is required.',
      href: '#firstName',
    },
    {
      id: 'lastName',
      isComplete: !!user.lastName,
      title: 'Last Name',
      description: 'Your last name is required.',
      href: '#lastName',
    },
    {
      id: 'email',
      isComplete: !!user.email,
      title: 'Email',
      description: 'Add an email to log in on other devices.',
      href: '#email',
    },
    {
      id: 'password',
      isComplete: !passwordRequired,
      title: 'Password',
      description: 'A new password is required to secure your account.',
      href: '#password',
    },
    {
      id: 'photo',
      isComplete: !photoRequired,
      title: 'Profile Photo',
      description: 'A real profile photo is required.',
      href: '#profile-photo-section',
    },
  ]

  const profileCompletionStepsOptional: ProfileCompletionStep[] = [
    {
      id: 'birthDate',
      isComplete: !!user.birthDate,
      title: 'Birth Date',
      description: 'Add your birth date.',
      href: '#optional-details',
    },
    {
      id: 'birthPlace',
      isComplete: !!user.birthPlace,
      title: 'Birth Place',
      description: 'Add your birth place.',
      href: '#optional-details',
    },
  ]

  const incompleteRequired = profileCompletionStepsRequired.filter(
    (s) => !s.isComplete,
  )
  const needsEmailVerification = user.email && !user.emailVerified

  const [isCollapsed, setIsCollapsed] = useState(true)
  const [, setIsResending] = useState(false)

  useEffect(() => {
    const shouldBeCollapsed =
      !incompleteRequired.length && !needsEmailVerification
    setIsCollapsed(shouldBeCollapsed)
  }, [incompleteRequired.length, needsEmailVerification])

  const [isInstallStepDismissed, setIsInstallStepDismissed] = useState(true) // Default to dismissed to avoid flash
  const deviceInfo = useDeviceInfoContext()
  const { showPrompt } = useA2HS()
  const {
    isPushEnabled,
    subscribe,
    isSupported: isPushSupported,
    permissionStatus,
    error,
  } = usePushManager()
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    const dismissed = localStorage.getItem(
      NAMEGAME_PWA_INSTALL_STEP_DISMISSED_KEY,
    )
    setIsInstallStepDismissed(dismissed === 'true')
  }, [])

  if (!deviceInfo || !hasMounted) {
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

  const handleDismissInstallStep = () => {
    localStorage.setItem(NAMEGAME_PWA_INSTALL_STEP_DISMISSED_KEY, 'true')
    setIsInstallStepDismissed(true)
  }

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const targetId = e.currentTarget.getAttribute('href')?.substring(1)
    if (!targetId) return

    if (targetId === 'optional-details' && setIsOptionalOpen) {
      setIsOptionalOpen(true)
    }

    setTimeout(() => {
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        const inputElement = targetElement.querySelector(
          'input, select, textarea',
        ) as HTMLElement
        if (inputElement) {
          inputElement.focus({ preventScroll: true })
        }
      }
    }, 100)
  }

  const handleResendVerificationEmail = async () => {
    setIsResending(true)
    const result = await resendVerificationEmail()
    if (result.success) {
      toast.success('Success', {
        description: result.message,
      })
    } else {
      toast.error('Error', {
        description: result.message,
      })
    }
    setIsResending(false)
  }

  const allSteps: {
    id: string
    isComplete: boolean
    title: string
    description: React.ReactNode
    action?: () => void
    actionLabel?: string
    dismiss?: () => void
    dismissLabel?: string
    href?: string
  }[] = []

  // 1. Profile Completion
  if (incompleteRequired.length > 0) {
    allSteps.push({
      id: 'complete-profile',
      isComplete: false,
      title: 'Complete Your Profile',
      description: `Add: ${incompleteRequired
        .map((s) => s.title)
        .join(', ')} to unlock full features.`,
      href: incompleteRequired[0].href,
    })
  }

  // 2. Email Verification
  if (user.email && !user.emailVerified) {
    allSteps.push({
      id: 'verify-email',
      isComplete: false,
      title: `Verify Your Email (${user.email})`,
      description: (
        <>
          <p>
            <ShieldCheck size={16} className="inline-block text-green-400" />{' '}
            Click the email verification link we sent to{' '}
            <strong>{user.email}</strong>. Check spam/junk if you don&apos;t see
            it.
          </p>
          <ul className="my-4 ml-4 list-outside list-disc">
            <li>
              If you misentered your email address, update it below for a new
              verification message.
            </li>
            <li>
              If your email is correct but you didn&apos;t see a verification
              message, resend it.
            </li>
          </ul>
        </>
      ),
      action: handleResendVerificationEmail,
      actionLabel: 'Resend Verification Email',
    })
  }

  // 3. Optional Fields
  const incompleteOptional = profileCompletionStepsOptional.filter(
    (s) => !s.isComplete,
  )
  if (isInFamilyGroup && incompleteOptional.length > 0) {
    allSteps.push({
      id: 'optional-details',
      isComplete: false,
      title: 'Add Optional Details',
      description: 'This info is used in family groups.',
      href: '#optional-details',
    })
  }

  // 4. PWA Installation
  const canInstall = deviceInfo.a2hs.canInstall && !isInstallStepDismissed
  if (canInstall) {
    allSteps.push({
      id: 'install-app',
      isComplete: false,
      title: deviceInfo.a2hs.actionLabel,
      description:
        'For a better experience and easy access, install the app on your device.',
      action: handleInstallClick,
      actionLabel: deviceInfo.a2hs.actionLabel,
      dismiss: handleDismissInstallStep,
      dismissLabel: 'Already Done',
    })
  }

  // 5. Push Notifications
  const notificationsBlocked = permissionStatus === 'denied'
  const canEnableNotifications =
    isPushSupported && !isPushEnabled && !notificationsBlocked

  if (notificationsBlocked) {
    allSteps.push({
      id: 'notifications-blocked',
      isComplete: false,
      title: 'Notifications Blocked',
      description: deviceInfo.push.instructions,
    })
  } else if (canEnableNotifications) {
    allSteps.push({
      id: 'enable-notifications',
      isComplete: false,
      title: 'Enable Notifications',
      description:
        error?.message === 'Service worker not ready.'
          ? 'Loading notification system... (this takes a few seconds on first load)'
          : 'Push notifications are the easiest way for your groups to communicate with you.',
      action: subscribe,
      actionLabel: 'Enable Notifications',
    })
  }

  // 6. Return to Group
  allSteps.push({
    id: 'return-to-group',
    isComplete: true, // This is always available, not a "to-do"
    title: 'Return to a group',
    description: "See what's new with your people.",
    href: '/me/groups',
  })

  const nextStepsCount = allSteps.filter((step) => !step.isComplete).length

  if (nextStepsCount === 0) return null

  const getIcon = (id: string) => {
    switch (id) {
      case 'complete-profile':
      case 'verify-email':
      case 'optional-details':
        return <User className="h-6 w-6 text-gray-400" />
      case 'install-app':
        return <Download className="h-6 w-6 text-gray-400" />
      case 'notifications-blocked':
        return <BellOff className="h-6 w-6 text-gray-400" />
      case 'enable-notifications':
        return <BellRing className="h-6 w-6 text-gray-400" />
      case 'return-to-group':
        return <ArrowRight className="h-6 w-6 text-gray-400" />
      default:
        return <User className="h-6 w-6 text-gray-400" />
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-md shadow sm:rounded-md ${
        isCollapsed ? 'bg-yellow-900/30' : 'bg-white bg-gray-800'
      }`}
    >
      <div className="p-4 sm:p-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <h3 className="flex items-center gap-x-2">
            <span>Next Steps</span>
            {!isLoading && (
              <Badge
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isCollapsed
                    ? 'bg-yellow-800 text-yellow-100'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {nextStepsCount}
              </Badge>
            )}
          </h3>
          {isCollapsed ? (
            <ChevronDown
              className={`h-5 w-5 ${
                isCollapsed ? 'text-yellow-400' : 'text-gray-400'
              }`}
            />
          ) : (
            <ChevronUp
              className={`h-5 w-5 ${
                isCollapsed ? 'text-yellow-400' : 'text-gray-400'
              }`}
            />
          )}
        </button>
        {!isCollapsed && (
          <div className="mt-6">
            <ul className="space-y-6">
              {allSteps
                .filter((step) => !step.isComplete)
                .map((step) => (
                  <li key={step.id}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">{getIcon(step.id)}</div>
                      <div className="ml-4">
                        <h3 className="text-sm font-semibold text-gray-200">
                          {step.title}
                        </h3>
                        <div className="mt-1 text-sm text-gray-400">
                          {step.description}
                        </div>
                        {step.href && (
                          <Link
                            href={step.href}
                            onClick={handleSmoothScroll}
                            className="mt-2 inline-flex items-center gap-x-1 text-sm font-medium text-indigo-600 hover:text-indigo-400 hover:text-indigo-300"
                          >
                            Go to section <ChevronRight className="h-4 w-4" />
                          </Link>
                        )}
                        {step.action && step.actionLabel && (
                          <div className="mt-2 flex items-center gap-x-2">
                            <button
                              onClick={step.action}
                              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none focus:ring-offset-gray-800"
                            >
                              {step.actionLabel}
                            </button>
                            {step.dismiss && step.dismissLabel && (
                              <button
                                onClick={step.dismiss}
                                className="inline-flex items-center justify-center rounded-md border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-200 shadow-sm hover:bg-gray-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none"
                              >
                                {step.dismissLabel}
                              </button>
                            )}
                          </div>
                        )}
                        {error && step.id === 'enable-notifications' && (
                          <div className="mt-2 text-sm font-semibold text-red-400">
                            {error.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
