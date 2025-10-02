'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, {
  useActionState,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import Modal from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { getPhotoUrl } from '@/lib/photos'
import { PushManager } from '@/components/PushManager'
import { usePushManager } from '@/hooks/use-push-manager'
import {
  updateUserProfile,
  getUserUpdateRequirements,
  type State,
} from '../actions'
import { Info } from 'lucide-react'
import Image from 'next/image'
import {
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Copy,
  Check,
  ChevronDown,
  XCircle as XCircleIcon,
  CheckCircle as CheckCircleIcon,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DatePrecision, Gender, Photo } from '@namegame/db'
import { format } from 'date-fns'
import UserProfileNextSteps from './UserProfileNextSteps'
import StickySaveBar from '@/components/ui/StickySaveBar'

const formatBirthDateForDisplay = (
  date: string | Date | null,
  precision: DatePrecision | null,
): string => {
  if (!date) return ''
  const d = new Date(date)
  switch (precision) {
    case 'TIME':
      return format(d, "MMM d, yyyy 'at' h:mm a")
    case 'DAY':
      return format(d, 'MMM d, yyyy')
    case 'MONTH':
      return format(d, 'MMM yyyy')
    case 'YEAR':
      return format(d, 'yyyy')
    default:
      return ''
  }
}

export type UserProfile = {
  id: string
  username: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  emailVerified: string | null // Pass date as ISO string
  primaryPhoto: Photo | null
  gender: 'male' | 'female' | 'non_binary' | null
  birthDate: string | null
  birthDatePrecision: DatePrecision | null
  birthPlace: string | null
}

export default function UserProfileForm({
  user,
  isInFamilyGroup,
}: {
  user: UserProfile
  isInFamilyGroup: boolean
}) {
  const [displayEmail, setDisplayEmail] = useState(user.email || '')
  const { update: updateSession } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    async function setInitialPhoto() {
      const url = await getPhotoUrl(user.primaryPhoto, { size: 'small' })
      setPreviewUrl(url)
    }
    setInitialPhoto()
  }, [user.primaryPhoto])

  const [firstName, setFirstName] = useState(user.firstName || '')
  const [lastName, setLastName] = useState(user.lastName || '')
  const [gender, setGender] = useState<Gender | null>(user.gender || null)

  const [birthDate, setBirthDate] = useState(
    formatBirthDateForDisplay(
      user.birthDate ?? null,
      user.birthDatePrecision ?? null,
    ),
  )
  const [birthPlace, setBirthPlace] = useState(user.birthPlace || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const formSubmitted = useRef(false)
  const toastShownRef = useRef(false)
  const [validation, setValidation] = useState({
    submitted: false,
    passwordRequired: false,
    photoRequired: false,
  })
  const [fileSelected, setFileSelected] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOptionalOpen, setIsOptionalOpen] = useState(false)
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false)
  const [isSubmittingAfterConfirm, setIsSubmittingAfterConfirm] =
    useState(false)

  const [isEmailValid, setIsEmailValid] = useState(
    !user.email || z.string().email().safeParse(user.email).success,
  )
  const [isEmailTooltipOpen, setIsEmailTooltipOpen] = useState(false)
  const [isPasswordTooltipOpen, setIsPasswordTooltipOpen] = useState(false)
  const [isBirthDateTooltipOpen, setIsBirthDateTooltipOpen] = useState(false)
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(true)
  const { isSupported } = usePushManager()
  const [isPushSupported, setIsPushSupported] = useState(false)
  const [timezone, setTimezone] = useState('')

  useEffect(() => {
    setIsPushSupported(isSupported)
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [isSupported])

  const optionalFields = [birthDate, birthPlace]
  const completedOptionalFields = optionalFields.filter(
    (field) => field !== null && field !== '',
  ).length
  const totalOptionalFields = optionalFields.length

  const validatePassword = (password: string) => {
    if (!password && !validation.passwordRequired) {
      setPasswordError(null)
      return
    }
    if (!password && validation.passwordRequired) {
      setPasswordError('Password is required.')
      return
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/.test(password)) {
      setPasswordError('6+ characters with letters and numbers.')
      return
    }
    if (password.toLowerCase().includes('pass')) {
      setPasswordError('Password cannot contain the word "pass".')
      return
    }
    setPasswordError(null)
  }

  const initialState: State = {
    message: null,
    error: null,
    errors: null,
    success: false,
    newFirstName: null,
    newPhotoUrl: null,
    redirectUrl: null,
    emailUpdated: false,
  }

  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction] = useActionState(updateUserProfile, initialState)

  const handleDiscard = useCallback(() => {
    setFirstName(user.firstName || '')
    setLastName(user.lastName || '')
    setDisplayEmail(user.email || '')
    setGender(user.gender || null)
    setBirthDate(
      formatBirthDateForDisplay(
        user.birthDate ?? null,
        user.birthDatePrecision ?? null,
      ),
    )
    setBirthPlace(user.birthPlace || '')
    setPassword('')
    async function resetPreview() {
      const url = await getPhotoUrl(user.primaryPhoto, { size: 'small' })
      setPreviewUrl(url)
    }
    resetPreview()
    setFileSelected(false)
    setIsEmailValid(true)
    setPasswordError(null)
  }, [
    user.firstName,
    user.lastName,
    user.email,
    user.gender,
    user.birthDate,
    user.birthDatePrecision,
    user.birthPlace,
    user.primaryPhoto,
  ])

  useEffect(() => {
    // Determine if the form is dirty
    const isFirstNameDirty = firstName !== (user.firstName ?? '')
    const isLastNameDirty = lastName !== (user.lastName ?? '')
    const isEmailDirty = displayEmail !== (user.email ?? '')
    const isPasswordDirty = !!password
    const isPhotoDirty = fileSelected
    const isGenderDirty = gender !== user.gender
    const originalBirthDate = formatBirthDateForDisplay(
      user.birthDate ?? null,
      user.birthDatePrecision ?? null,
    )
    const isBirthDateDirty = birthDate !== originalBirthDate
    const isBirthPlaceDirty = birthPlace !== (user.birthPlace || '')

    setIsDirty(
      isFirstNameDirty ||
        isLastNameDirty ||
        isEmailDirty ||
        isPasswordDirty ||
        isPhotoDirty ||
        isGenderDirty ||
        isBirthDateDirty ||
        isBirthPlaceDirty,
    )
  }, [
    firstName,
    lastName,
    displayEmail,
    password,
    fileSelected,
    gender,
    birthDate,
    user.firstName,
    user.lastName,
    user.email,
    user.gender,
    user.birthDate,
    user.birthDatePrecision,
    birthPlace,
    user.birthPlace,
  ])

  useEffect(() => {
    async function fetchRequirements() {
      setIsLoadingRequirements(true)
      const { passwordRequired, photoRequired } =
        await getUserUpdateRequirements()
      setValidation((v) => ({ ...v, passwordRequired, photoRequired }))
      setIsLoadingRequirements(false)
    }
    fetchRequirements()
  }, [user.id])

  useEffect(() => {
    if (searchParams.get('verified') === 'true' && !toastShownRef.current) {
      toast.success('Email verified successfully!', {
        duration: 10000,
        closeButton: true,
      })
      // Use the browser's history API to remove the query param without a Next.js navigation event,
      // which was causing a re-render that cancelled the toast.
      window.history.replaceState(null, '', pathname)
      toastShownRef.current = true
    }
    // We only want this to run when the component mounts and searchParams are available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (isSubmittingAfterConfirm) {
      // This effect triggers the form submission after the state has been updated.
      formRef.current?.requestSubmit()
    }
  }, [isSubmittingAfterConfirm])

  // This effect runs when the user prop changes, which happens after router.refresh().
  // It resets the form fields to match the latest user data.
  useEffect(() => {
    handleDiscard()
  }, [user, handleDiscard])

  useEffect(() => {
    if (state.success && !formSubmitted.current) {
      formSubmitted.current = true
      window.scrollTo(0, 0)
      setShowSuccessMessage(true)

      if (state.newPhotoUrl) {
        setPreviewUrl(state.newPhotoUrl) // This is the new thumb URL
      }

      // Clear the password field on successful submission
      if (password) {
        setPassword('')
      }

      if (fileSelected) {
        setFileSelected(false)
      }

      // We pass `newFirstName` as `name` to session.update to mirror the admin flow.
      // The `auth.ts` jwt callback will handle updating both `name` and `firstName` in the token.
      updateSession({
        name: state.newFirstName,
        image: state.newPhotoUrl,
      }).then(async () => {
        // After updating, re-fetch the requirements to see if they've changed
        const { passwordRequired, photoRequired } =
          await getUserUpdateRequirements()
        setValidation((v) => ({ ...v, passwordRequired, photoRequired }))

        if (state.redirectUrl) {
          router.push(state.redirectUrl)
        } else {
          router.refresh() // This will trigger a re-render with the new user prop
        }
      })
    }
  }, [state, updateSession, router, password, fileSelected, user.primaryPhoto])

  const handleGeneratePassword = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '123456789'
    const allChars = letters + numbers
    let result = ''

    // Generate a random string of the given length
    for (let i = 0; i < 6; i++) {
      result += allChars.charAt(Math.floor(Math.random() * allChars.length))
    }

    // Check if it has at least one number
    const hasNumber = numbers.split('').some((num) => result.includes(num))

    // If not, replace a random character with a random number
    if (!hasNumber) {
      const randomIndex = Math.floor(Math.random() * 6)
      const randomNumber = numbers.charAt(
        Math.floor(Math.random() * numbers.length),
      )
      result =
        result.substring(0, randomIndex) +
        randomNumber +
        result.substring(randomIndex + 1)
    }

    setPassword(result)
    validatePassword(result)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFileSelected(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      // If the user cancels file selection, revert to the original photo if it exists
      async function resetPreview() {
        const url = await getPhotoUrl(user.primaryPhoto, { size: 'small' })
        setPreviewUrl(url)
      }
      resetPreview()
      setFileSelected(false)
    }
  }

  const handleChoosePhoto = () => {
    fileInputRef.current?.click()
  }

  const handleCopyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password).then(() => {
        setShowCopySuccess(true)
        setTimeout(() => {
          setShowCopySuccess(false)
        }, 2000) // Hide after 2 seconds
      })
    }
  }

  const isFormValid = React.useMemo(() => {
    const isFirstNameValid = !!firstName
    const isLastNameValid = !!lastName
    const isPasswordValid =
      !passwordError && !(validation.passwordRequired && !password)
    const isPhotoValid = !(
      validation.photoRequired &&
      previewUrl?.includes('dicebear.com') &&
      !fileSelected
    )

    return (
      isFirstNameValid &&
      isLastNameValid &&
      isEmailValid &&
      isPasswordValid &&
      isPhotoValid
    )
  }, [
    firstName,
    lastName,
    isEmailValid,
    password,
    passwordError,
    validation.passwordRequired,
    validation.photoRequired,
    previewUrl,
    fileSelected,
  ])

  // The email is considered verified for display purposes only if the original email
  // was verified AND the email in the input hasn't been changed.
  const isVerifiedForDisplay =
    !!user.emailVerified && displayEmail === user.email

  return (
    <>
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
      >
        <div className="bg-white p-6 dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Confirm Email Deletion
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You are about to delete a verified email. If you add a new email
              later, you will have to re-verify it. Are you sure you want to
              continue?
            </p>
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => setConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setConfirmModalOpen(false)
                setIsSubmittingAfterConfirm(true)
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
      <div className="mb-6">
        <UserProfileNextSteps
          user={user}
          passwordRequired={validation.passwordRequired}
          photoRequired={validation.photoRequired}
          isInFamilyGroup={isInFamilyGroup}
          setIsOptionalOpen={setIsOptionalOpen}
          isLoading={isLoadingRequirements}
        />
      </div>

      <h3 className="mb-6">My Profile</h3>
      <form
        ref={formRef}
        action={formAction}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && isFormValid && isDirty) {
            // Prevent default to avoid any other 'Enter' behavior in some browsers
            e.preventDefault()
            // Programmatically submit the form
            formRef.current?.requestSubmit()
          }
        }}
        onSubmit={(e) => {
          // If the submission is happening after confirmation, allow it to proceed.
          if (isSubmittingAfterConfirm) {
            setIsSubmittingAfterConfirm(false) // Reset the flag
            return
          }

          // Otherwise, check if we need to show the confirmation modal.
          const isDeletingVerifiedEmail =
            user.emailVerified && user.email && !displayEmail

          if (isDeletingVerifiedEmail) {
            e.preventDefault() // Prevent the default submission
            setConfirmModalOpen(true) // Show the modal
          }
        }}
        className="space-y-6"
      >
        {showSuccessMessage && state?.message && (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/30">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon
                    className="h-5 w-5 text-green-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-green-800 dark:text-green-300">
                    <p>{state.message}</p>
                  </div>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      type="button"
                      onClick={() => setShowSuccessMessage(false)}
                      className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50 focus:outline-none dark:bg-transparent dark:text-green-400 dark:hover:bg-green-800/50"
                    >
                      <span className="sr-only">Dismiss</span>
                      <XCircleIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {state?.errors && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon
                  className="h-5 w-5 text-red-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                  Please correct the following issues:
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-200">
                  <ul role="list" className="list-disc space-y-1 pl-5">
                    {Object.entries(state.errors).flatMap(([field, messages]) =>
                      messages.map((message, index) => (
                        <li key={`${field}-${index}`}>{message}</li>
                      )),
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        <input type="hidden" name="timezone" value={timezone} />
        <div className="flex">
          <div className="flex-grow">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              First
            </label>
            <input
              type="text"
              name="firstName"
              placeholder="First name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`mt-1 block w-full rounded-l-md rounded-r-none border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
                !firstName || state?.errors?.firstName
                  ? 'bg-red-100 dark:bg-red-900'
                  : ''
              }`}
            />
            {state?.errors?.firstName && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                {state.errors.firstName[0]}
              </p>
            )}
          </div>

          <div className="flex-grow">
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Last
            </label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              placeholder="Last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`mt-1 -ml-px block w-full scroll-mt-24 rounded-l-none rounded-r-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
                !lastName || state?.errors?.lastName
                  ? 'bg-red-100 dark:bg-red-900'
                  : ''
              }`}
            />
            {state?.errors?.lastName && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                {state.errors.lastName[0]}
              </p>
            )}
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Gender
          </label>
          <div className="flex items-center gap-3">
            <input type="hidden" name="gender" value={gender || ''} />
            <button
              type="button"
              onClick={() => setGender(Gender.male)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                gender === Gender.male
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              He
            </button>
            <button
              type="button"
              onClick={() => setGender(Gender.female)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                gender === Gender.female
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              She
            </button>
            <button
              type="button"
              onClick={() => setGender(Gender.non_binary)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                gender === Gender.non_binary
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              They
            </button>
            {gender && (
              <button
                type="button"
                onClick={() => setGender(null)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>
          {state.errors?.gender && (
            <p className="mt-1 text-sm text-red-500">
              {state.errors.gender[0]}
            </p>
          )}
        </div>

        <div id="email" className="scroll-mt-24">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <div className="relative mt-1">
            <input
              id="email"
              type="email"
              name="email"
              value={displayEmail}
              placeholder="Email"
              onChange={(e) => {
                const newEmail = e.target.value
                setDisplayEmail(newEmail)
                if (newEmail === '') {
                  setIsEmailValid(true)
                } else {
                  const result = z.string().email().safeParse(newEmail)
                  setIsEmailValid(result.success)
                }
              }}
              className={`block w-full scroll-mt-24 rounded-md border-gray-300 py-2 pr-10 pl-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
                !isEmailValid || (state?.errors?.email && !isDirty)
                  ? 'bg-red-100 dark:bg-red-900'
                  : ''
              }`}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <TooltipProvider>
                {displayEmail && isVerifiedForDisplay && (
                  <Tooltip
                    open={isEmailTooltipOpen}
                    onOpenChange={setIsEmailTooltipOpen}
                  >
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="pointer-events-auto focus:outline-none"
                        onClick={() =>
                          setIsEmailTooltipOpen(!isEmailTooltipOpen)
                        }
                      >
                        <ShieldCheck
                          className="h-5 w-5 text-green-500"
                          aria-hidden="true"
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Email verified on{' '}
                        {new Date(user.emailVerified!).toLocaleDateString()}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          </div>
          {state?.errors?.email && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {state.errors.email[0]}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Saving an email is your consent to receive messages.
          </p>
        </div>
        <div id="password" className="scroll-mt-24">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              required={validation.passwordRequired}
              className={`block w-full min-w-0 flex-1 scroll-mt-24 rounded-none rounded-l-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
                passwordError ||
                (validation.passwordRequired && !password) ||
                state?.errors?.password
                  ? 'bg-red-100 dark:bg-red-900'
                  : ''
              }`}
              placeholder={
                validation.passwordRequired
                  ? 'New password required'
                  : 'Leave blank to keep current password'
              }
              onChange={(e) => {
                const newPassword = e.target.value
                setPassword(newPassword)
                validatePassword(newPassword)
              }}
            />
            {password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="inline-flex items-center border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            )}
            <TooltipProvider>
              <Tooltip
                open={isPasswordTooltipOpen}
                onOpenChange={setIsPasswordTooltipOpen}
              >
                <TooltipTrigger asChild>
                  {password && !passwordError ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyPassword()
                        setIsPasswordTooltipOpen(!isPasswordTooltipOpen)
                      }}
                      className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      aria-label="Copy password to clipboard"
                    >
                      {showCopySuccess ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleGeneratePassword()
                        setIsPasswordTooltipOpen(!isPasswordTooltipOpen)
                      }}
                      className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      aria-label="Generate a new password"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {password && !passwordError
                      ? showCopySuccess
                        ? 'Copied!'
                        : 'Copy Password'
                      : 'Generate Password'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {state?.errors?.password && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {state.errors.password[0]}
            </p>
          )}
          {passwordError ? (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {passwordError}
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {validation.passwordRequired
                ? 'Enter or generate a new password with at least six characters, letters, and numbers.'
                : ''}
            </p>
          )}
        </div>
        <div
          id="profile-photo-section"
          className={`scroll-mt-24 rounded-md p-4 ${
            validation.photoRequired &&
            previewUrl?.includes('dicebear.com') &&
            !fileSelected
              ? 'bg-red-100 dark:bg-red-900'
              : ''
          }`}
        >
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Profile Photo
          </label>
          <div className="mt-2 flex flex-col items-start gap-y-3">
            <div className="group relative h-32 w-32 cursor-pointer rounded-full">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Profile Photo Preview"
                  width={128}
                  height={128}
                  className="h-32 w-32 rounded-full object-cover"
                  onClick={handleChoosePhoto}
                />
              ) : (
                <div
                  className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-700"
                  onClick={handleChoosePhoto}
                />
              )}
              <div className="bg-opacity-50 pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black opacity-0 transition-opacity group-hover:opacity-100">
                <span className="px-2 text-center text-sm font-medium text-white">
                  Change Photo
                </span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              name="photo"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
            />
            <button
              id="change-photo-button"
              type="button"
              onClick={handleChoosePhoto}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-4 font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
            >
              Change Photo
            </button>
            {validation.photoRequired &&
              previewUrl?.includes('dicebear.com') &&
              !fileSelected && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Please add a real profile pic.
                </p>
              )}
          </div>
        </div>

        {isPushSupported && (
          <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
              Notifications
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Enable push notifications to receive updates from your groups.
            </p>
            <div className="mt-4">
              <PushManager />
            </div>
          </div>
        )}

        <div
          id="optional-details"
          className="scroll-mt-24 border-t border-gray-200 py-6 dark:border-gray-700"
        >
          <button
            type="button"
            onClick={() => setIsOptionalOpen(!isOptionalOpen)}
            className="flex w-full items-center justify-between text-left text-lg font-medium text-gray-900 dark:text-gray-100"
          >
            <div className="flex items-center gap-x-2">
              <span>Optional Fields</span>
              <Badge variant="secondary">
                {completedOptionalFields} of {totalOptionalFields}
              </Badge>
            </div>
            <ChevronDown
              className={`h-5 w-5 transform transition-transform ${
                isOptionalOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {isOptionalOpen && (
            <div className="mt-4 space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Optional info used in family groups. Family members may have
                provided initial values.
              </p>
              <div>
                <label
                  htmlFor="birthDate"
                  className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Birth Date
                  <TooltipProvider>
                    <Tooltip
                      open={isBirthDateTooltipOpen}
                      onOpenChange={setIsBirthDateTooltipOpen}
                    >
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="ml-2 rounded-full focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                          onClick={(e) => {
                            e.preventDefault()
                            setIsBirthDateTooltipOpen(!isBirthDateTooltipOpen)
                          }}
                        >
                          <Info className="h-4 w-4 text-gray-400" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-gray-800 text-white">
                        <p className="font-bold">Enter any date format:</p>
                        <ul className="list-disc pl-5">
                          <li>
                            A specific time:{' '}
                            <span className="font-mono">
                              Jul 9 1969 at 7:25 PM
                            </span>{' '}
                            or <span className="font-mono">... at 19:25</span>
                          </li>
                          <li>
                            A specific date:{' '}
                            <span className="font-mono">July 9, 1969</span>
                          </li>
                          <li>
                            A month and year:{' '}
                            <span className="font-mono">July 1969</span>
                          </li>
                          <li>
                            Just a year: <span className="font-mono">1969</span>
                          </li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="birthDate"
                    id="birthDate"
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value)
                    }}
                    className={`block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
                      state?.errors?.birthDate
                        ? 'border-red-500 bg-red-100 dark:bg-red-900'
                        : ''
                    }`}
                    placeholder="July 9, 1969, 7/9/69, 1969, etc."
                  />
                  {state?.errors?.birthDate && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {state.errors.birthDate[0]}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="birthPlace"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Birth Place
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="birthPlace"
                    id="birthPlace"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    placeholder="City, State, Country"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {!state?.success && state?.error && (
          <p className="text-red-500">{state.error}</p>
        )}
      </form>

      <StickySaveBar
        isDirty={isDirty}
        isFormValid={isFormValid}
        onSave={() => formRef.current?.requestSubmit()}
        onDiscard={handleDiscard}
      />
    </>
  )
}
