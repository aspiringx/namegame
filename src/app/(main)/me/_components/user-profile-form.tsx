'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Badge } from '@/components/ui/badge'
import { PushManager } from '@/components/PushManager'
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
  ShieldAlert,
  ShieldCheck,
  Copy,
  Check,
  Upload,
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
import { DatePrecision, Gender } from '@/generated/prisma/client'
import { format } from 'date-fns'
import Link from 'next/link'

export type UserProfile = {
  id: string
  username: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  emailVerified: string | null // Pass date as ISO string
  photos: { url: string }[]
  gender: 'male' | 'female' | 'non_binary' | null
  birthDate: string | null
  birthDatePrecision: DatePrecision | null
  birthPlace: string | null
}

type Group = {
  id: number
  name: string
  slug: string
}

function SubmitButton({
  onNewSubmission,
  disabled,
}: {
  onNewSubmission: () => void
  disabled?: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      onClick={onNewSubmission}
      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-indigo-400 disabled:opacity-50 dark:focus:ring-offset-gray-800 dark:disabled:bg-indigo-800"
    >
      {pending ? 'Saving...' : 'Save'}
    </button>
  )
}

export default function UserProfileForm({
  user,
  groups,
}: {
  user: UserProfile
  groups: Group[]
}) {
  const [displayEmail, setDisplayEmail] = useState(user.email || '')
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user.photos[0]?.url ?? null,
  )
  const [firstName, setFirstName] = useState(user.firstName || '')
  const [lastName, setLastName] = useState(user.lastName || '')
  const [gender, setGender] = useState<Gender | null>(user.gender || null)
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
  const [isEmailValid, setIsEmailValid] = useState(
    !!user.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email),
  )
  const [isEmailTooltipOpen, setIsEmailTooltipOpen] = useState(false)
  const [isPasswordTooltipOpen, setIsPasswordTooltipOpen] = useState(false)
  const [isBirthDateTooltipOpen, setIsBirthDateTooltipOpen] = useState(false)

  const optionalFields = [birthDate, birthPlace, gender]
  const completedOptionalFields = optionalFields.filter(
    (field) => field !== null && field !== '',
  ).length
  const totalOptionalFields = optionalFields.length

  const validatePassword = (password: string) => {
    if (password && password === 'password123') {
      setPasswordError('For security, please choose a different password.')
    } else if (
      password &&
      validation.passwordRequired &&
      (password.length < 6 || !/(?=.*\d)(?=.*[a-zA-Z])/.test(password))
    ) {
      // This is a basic check, server has the final say
      setPasswordError('6+ characters with letters and numbers.')
    } else {
      setPasswordError(null)
    }
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

  const [state, formAction] = useActionState(updateUserProfile, initialState)

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
      const { passwordRequired, photoRequired } =
        await getUserUpdateRequirements()
      setValidation((v) => ({ ...v, passwordRequired, photoRequired }))
    }
    fetchRequirements()
  }, [user.id])

  useEffect(() => {
    if (state.success && !formSubmitted.current) {
      formSubmitted.current = true
      window.scrollTo(0, 0)
      setShowSuccessMessage(true)

      if (state.newPhotoUrl) {
        setPreviewUrl(state.newPhotoUrl)
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
          router.refresh()
        }
      })
    }
  }, [state, updateSession, router, password, fileSelected])

  const handleNewSubmission = () => {
    setValidation((v) => ({ ...v, submitted: true }))
    formSubmitted.current = false
    const params = new URLSearchParams(searchParams)
    if (params.has('welcome')) {
      params.delete('welcome')
      const queryString = params.toString()
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
    }
  }

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
      setPreviewUrl(user.photos[0]?.url ?? null)
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

  // The email is considered verified for display purposes only if the original email
  // was verified AND the email in the input hasn't been changed.
  const isVerifiedForDisplay =
    !!user.emailVerified && displayEmail === user.email

  return (
    <>
      <h3 className="mb-6">My Profile</h3>
      <form action={formAction} className="space-y-6">
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
                    {state.emailUpdated && !isVerifiedForDisplay && (
                      <p className="mt-2">
                        We sent you a verification email. Find it and click the
                        link to complete the process.
                      </p>
                    )}
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
            {groups.length > 0 && (
              <div className="overflow-hidden rounded-md bg-white shadow sm:rounded-md dark:bg-gray-800">
                <p className="max-w-2xl p-4 text-sm text-gray-500 dark:text-gray-400">
                  Now you can return to a group here:
                </p>
                <ul
                  role="list"
                  className="divide-y divide-gray-200 dark:divide-gray-700"
                >
                  {groups.map((group) => (
                    <li key={group.id}>
                      <Link
                        href={`/groups/${group.slug}`}
                        className="block px-4 py-4 hover:bg-gray-50 sm:px-6 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {group.name}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
              id="firstName"
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
              type="text"
              id="lastName"
              name="lastName"
              placeholder="Last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`mt-1 -ml-px block w-full rounded-l-none rounded-r-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
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

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Gender
          </label>
          <input type="hidden" name="gender" value={gender ?? ''} />
          <div className="mt-2 flex space-x-2">
            {[
              ['male', 'He'],
              ['female', 'She'],
              ['non_binary', 'They'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  const newGender =
                    gender === value ? null : (value as Gender)
                  setGender(newGender)
                }}
                className={`rounded-md px-3 py-1 text-sm font-medium ${
                  gender === value
                    ? 'border-transparent bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <div className="relative mt-1">
            <input
              type="email"
              id="email"
              name="email"
              value={displayEmail}
              placeholder="Email"
              required
              onChange={(e) => {
                const newEmail = e.target.value
                setDisplayEmail(newEmail)
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                setIsEmailValid(emailRegex.test(newEmail))
              }}
              className={`block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
                !isEmailValid || (state?.errors?.email && !isDirty)
                  ? 'bg-red-100 dark:bg-red-900'
                  : ''
              }`}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <TooltipProvider>
                <Tooltip
                  open={isEmailTooltipOpen}
                  onOpenChange={setIsEmailTooltipOpen}
                >
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="pointer-events-auto focus:outline-none"
                      onClick={() => setIsEmailTooltipOpen(!isEmailTooltipOpen)}
                    >
                      {isVerifiedForDisplay ? (
                        <ShieldCheck
                          className="h-5 w-5 text-green-500"
                          aria-hidden="true"
                        />
                      ) : (
                        <ShieldAlert
                          className="h-5 w-5 text-red-500"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isVerifiedForDisplay ? (
                      <p>
                        Email verified on{' '}
                        {new Date(user.emailVerified!).toLocaleDateString()}
                      </p>
                    ) : (
                      <p>Email not verified</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {state?.errors?.email ? (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {state.errors.email[0]}
            </p>
          ) : (
            displayEmail &&
            !isVerifiedForDisplay && (
              <p className="mt-1 rounded-md bg-yellow-50 p-2 text-sm text-xs text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                Email not yet verified. Save this and check email for a link to
                complete verification.
              </p>
            )
          )}
          <p className="mt-1 text-xs text-gray-500 italic dark:text-gray-400">
            By saving and verifying my email address, I consent to receiving
            messages from my NameGame groups.
          </p>
        </div>

        <div>
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
              className={`block w-full min-w-0 flex-1 rounded-none rounded-l-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
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
                ? 'Enter or generate a new password.'
                : ''}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Profile Picture
          </label>
          <div
            className={`mt-2 flex flex-col items-start space-y-4 ${
              validation.photoRequired &&
              previewUrl?.includes('dicebear.com') &&
              !fileSelected
                ? 'rounded-md bg-red-100 p-4 dark:bg-red-900'
                : ''
            }`}
          >
            <label
              htmlFor="photo"
              className="group relative inline-block h-32 w-32 cursor-pointer overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"
            >
              <div
                className={`h-full w-full ${
                  validation.photoRequired && !previewUrl
                    ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-gray-800'
                    : ''
                } rounded-full`}
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Profile photo preview"
                    width={128}
                    height={128}
                    className="h-full w-full object-cover text-gray-300"
                  />
                ) : (
                  <svg
                    className="h-full w-full text-gray-300 dark:text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <div className="bg-opacity-50 absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Upload className="h-8 w-8 text-white" />
                <span className="mt-1 text-xs font-semibold text-white">
                  Change
                </span>
              </div>
            </label>
            <input
              type="file"
              id="photo"
              name="photo"
              accept="image/*"
              required={validation.photoRequired}
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleChoosePhoto}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-4 font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
            >
              Change Photo
            </button>
            <p className={`-mt-3 text-xs text-gray-500 dark:text-gray-400`}>
              {validation.photoRequired &&
              previewUrl?.includes('dicebear.com') &&
              !fileSelected
                ? 'Add a real profile pic so people recognize you.'
                : ''}
            </p>
          </div>
        </div>

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

        <div className="border-t border-gray-200 py-6 dark:border-gray-700">
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
                Optional profile info. Family members may have provided initial
                values you can change.
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
                    className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    placeholder="July 9, 1969, 7/9/69, 1969, etc."
                  />
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
                    className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
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

        <div className="flex items-center gap-x-4">
          <SubmitButton
            onNewSubmission={handleNewSubmission}
            disabled={
              !isDirty ||
              !firstName ||
              !lastName ||
              !isEmailValid ||
              !!passwordError ||
              (validation.passwordRequired && !password) ||
              (validation.photoRequired && previewUrl?.includes('dicebear.com'))
            }
          />
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  )
}
