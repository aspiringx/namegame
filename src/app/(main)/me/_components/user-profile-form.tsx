'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateUserProfile, State, getUserUpdateRequirements } from '../actions'
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
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type UserProfile = {
  id: string
  username: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  emailVerified: string | null // Pass date as ISO string
  photos: { url: string }[]
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

export default function UserProfileForm({ user }: { user: UserProfile }) {
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
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
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
    success: false,
    newFirstName: null,
    newPhotoUrl: null,
  }

  const [state, formAction] = useActionState(updateUserProfile, initialState)

  useEffect(() => {
    // Determine if the form is dirty
    const isFirstNameDirty = firstName !== user.firstName
    const isLastNameDirty = lastName !== user.lastName
    const isPasswordDirty = !!password
    const isPhotoDirty = fileSelected

    setIsDirty(
      isFirstNameDirty || isLastNameDirty || isPasswordDirty || isPhotoDirty,
    )
  }, [
    firstName,
    lastName,
    password,
    fileSelected,
    user.firstName,
    user.lastName,
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
  }, [state, updateSession, router])

  useEffect(() => {
    if (showSuccessMessage) {
      setIsFadingOut(false)
      const fadeOutTimer = setTimeout(() => {
        setIsFadingOut(true)
      }, 2500) // Start fading out after 2.5 seconds

      const hideTimer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000) // Hide completely after 3 seconds

      return () => {
        clearTimeout(fadeOutTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [showSuccessMessage])

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
    <form action={formAction} className="space-y-6">
      {showSuccessMessage && state?.message && (
        <p
          className={`text-green-500 transition-opacity duration-500 ease-in-out ${
            isFadingOut ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="flex">
        <div className="flex-grow">
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            First <span className="text-red-500">*</span>
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
              !firstName ? 'bg-red-100 dark:bg-red-900' : ''
            }`}
          />
        </div>

        <div className="flex-grow">
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Last <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            placeholder="Last name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={`mt-1 -ml-px block w-full rounded-l-none rounded-r-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
              !lastName ? 'bg-red-100 dark:bg-red-900' : ''
            }`}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <input
            type="email"
            id="email"
            name="email"
            value={displayEmail}
            placeholder="Email"
            required
            onChange={(e) => setDisplayEmail(e.target.value)}
            className={`block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
              !displayEmail ? 'bg-red-100 dark:bg-red-900' : ''
            }`}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <TooltipProvider disableHoverableContent={true}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="pointer-events-auto focus:outline-none"
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
        {displayEmail && !isVerifiedForDisplay && (
          <p className="mt-1 rounded-md bg-green-50 p-2 text-sm text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
            Your email is not verified. After saving, check your email for a
            link to complete this.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          New Password
          {validation.passwordRequired && (
            <span className="text-red-500"> *</span>
          )}
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            required={validation.passwordRequired}
            className={`block w-full min-w-0 flex-1 rounded-none rounded-l-md border border-gray-300 bg-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
              validation.passwordRequired && !password
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
            <Tooltip>
              <TooltipTrigger asChild>
                {password && !passwordError ? (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
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
                    onClick={handleGeneratePassword}
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
          {validation.photoRequired && <span className="text-red-500"> *</span>}
        </label>
        <div className="mt-2 flex flex-col items-start space-y-4">
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
          <p
            className={`-mt-3 text-xs text-red-500 dark:text-red-400 ${
              validation.photoRequired ? 'text-red-500 dark:text-red-400' : ''
            }`}
          >
            {validation.photoRequired && previewUrl?.includes('dicebear.com')
              ? 'Add a real profile pic so people recognize you.'
              : ''}
          </p>
        </div>
      </div>

      {!state?.success && state?.error && (
        <p className="text-red-500">{state.error}</p>
      )}

      <div className="flex items-center gap-x-4">
        <SubmitButton
          onNewSubmission={handleNewSubmission}
          disabled={
            !isDirty ||
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
  )
}
