'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { State, createManagedUser, updateManagedUser } from '../users/actions'
import {
  ManagedStatus,
  Gender,
  User,
  Photo,
  DatePrecision,
  Group,
} from '@/generated/prisma/client'
import GroupsSection from '@/app/(main)/me/_components/groups-section'
import { Badge } from '@/components/ui/badge'
import { formatDateForInput } from '@/lib/utils'
import Image from 'next/image'
import {
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  Upload,
  ChevronDown,
  XCircle as XCircleIcon,
  Info,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type ManagedUserProfileFormProps = {
  user?: User & {
    photos: Photo[]
    groupMemberships: { group: Group }[]
  }
  authdUserGroups?: (Group & { members: { userId: string }[] })[]
  publicPhotoUrl?: string | null
}

function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-indigo-400 disabled:opacity-50 dark:focus:ring-offset-gray-800 dark:disabled:bg-indigo-800"
    >
      {pending
        ? isEditMode
          ? 'Updating...'
          : 'Creating...'
        : isEditMode
          ? 'Update'
          : 'Create'}
    </button>
  )
}

export default function ManagedUserProfileForm({
  user,
  authdUserGroups,
  publicPhotoUrl,
}: ManagedUserProfileFormProps) {
  const isEditMode = !!user
  const router = useRouter()
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const previewUrl = localPreview || publicPhotoUrl
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOptionalOpen, setIsOptionalOpen] = useState(false)
  const [managedStatus, setManagedStatus] = useState<ManagedStatus | null>(
    isEditMode ? user.managed : ManagedStatus.full,
  )
  const [gender, setGender] = useState<Gender | null>(user?.gender || null)
  const [birthDatePrecision, setBirthDatePrecision] = useState<DatePrecision>(
    user?.birthDatePrecision || DatePrecision.YEAR,
  )
  const [deathDatePrecision, setDeathDatePrecision] = useState<DatePrecision>(
    user?.deathDatePrecision || DatePrecision.YEAR,
  )
  const [birthDate, setBirthDate] = useState(
    user?.birthDate
      ? formatDateForInput(
          user.birthDate,
          user.birthDatePrecision || DatePrecision.DAY,
        )
      : '',
  )
  const [birthPlace, setBirthPlace] = useState(user?.birthPlace || '')
  const [deathDate, setDeathDate] = useState(
    user?.deathDate
      ? formatDateForInput(
          user.deathDate,
          user.deathDatePrecision || DatePrecision.DAY,
        )
      : '',
  )
  const [deathPlace, setDeathPlace] = useState(user?.deathPlace || '')

  const optionalFields = [
    birthDate,
    birthPlace,
    gender,
    managedStatus,
    deathDate,
    deathPlace,
  ]
  const completedOptionalFields = optionalFields.filter(
    (field) => field !== null && field !== '',
  ).length
  const totalOptionalFields = optionalFields.length

  const initialState: State = { message: null, errors: {}, success: false }
  const action = isEditMode
    ? updateManagedUser.bind(null, user.id)
    : createManagedUser
  const [state, formAction] = useActionState(async (prevState: State, formData: FormData) => {
    if (photoFile) {
      formData.append('photo', photoFile)
    }
    return action(prevState, formData)
  }, initialState)

  useEffect(() => {
    if (state.success && state.redirectUrl) {
      // You might want to show a toast message here
      router.push(state.redirectUrl)
    }
  }, [state, router])

  useEffect(() => {
    if (managedStatus === ManagedStatus.full) {
      setPassword('')
      setPasswordError(null)
    }
  }, [managedStatus])

  const validatePassword = (password: string) => {
    if (
      password &&
      (password.length < 6 || !/(?=.*\d)(?=.*[a-zA-Z])/.test(password))
    ) {
      setPasswordError('6+ characters with letters and numbers.')
    } else {
      setPasswordError(null)
    }
  }

  const handleGeneratePassword = () => {
    const newPassword = Math.random().toString(36).slice(-8) + 'a1'
    setPassword(newPassword)
    validatePassword(newPassword)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setLocalPreview(URL.createObjectURL(file))
    } else {
      setPhotoFile(null)
      setLocalPreview(null)
    }
  }

  const handleChoosePhoto = () => {
    fileInputRef.current?.click()
  }

  const handleDateChange =
    (
      setDate: (value: string) => void,
      setPrecision: (value: DatePrecision) => void,
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target
      setDate(value)

      if (/^\d{4}$/.test(value)) {
        setPrecision(DatePrecision.YEAR)
      } else if (/^\d{4}-\d{2}$/.test(value)) {
        setPrecision(DatePrecision.MONTH)
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        setPrecision(DatePrecision.DAY)
      }
    }

  const handleCopyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password).then(() => {
        setShowCopySuccess(true)
        setTimeout(() => setShowCopySuccess(false), 2000)
      })
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.errors && Object.keys(state.errors).length > 0 && (
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

      {/* First and Last Name */}
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
            defaultValue={user?.firstName || ''}
            required
            className={`mt-1 block w-full rounded-l-md rounded-r-none border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${state?.errors?.firstName ? 'bg-red-100 dark:bg-red-900' : ''}`}
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
            defaultValue={user?.lastName || ''}
            required
            className={`mt-1 -ml-px block w-full rounded-l-none rounded-r-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${state?.errors?.lastName ? 'bg-red-100 dark:bg-red-900' : ''}`}
          />
          {state?.errors?.lastName && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {state.errors.lastName[0]}
            </p>
          )}
        </div>
      </div>

      {managedStatus === ManagedStatus.partial && (
        <>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              defaultValue={user?.email || ''}
              required={managedStatus === ManagedStatus.partial}
              className={`mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${state?.errors?.email ? 'bg-red-100 dark:bg-red-900' : ''}`}
            />
            {state?.errors?.email && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                {state.errors.email[0]}
              </p>
            )}
          </div>

          {/* Password */}
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
                required={
                  managedStatus === ManagedStatus.partial && !isEditMode
                }
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  validatePassword(e.target.value)
                }}
                className={`block w-full min-w-0 flex-1 rounded-none rounded-l-md border border-gray-300 bg-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${state?.errors?.password ? 'bg-red-100 dark:bg-red-900' : ''}`}
                placeholder={
                  isEditMode ? 'New password (optional)' : 'New password'
                }
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
            {passwordError && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                {passwordError}
              </p>
            )}
            {state?.errors?.password && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                {state.errors.password[0]}
              </p>
            )}
          </div>
        </>
      )}

      {/* Profile Picture */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Profile Picture
        </label>
        <div className="mt-2 flex flex-col items-start space-y-4">
          <div
            className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"
            onClick={handleChoosePhoto}
          >
            {previewUrl ? (
              <Image
                key={previewUrl} // Add key to force re-render on src change
                src={previewUrl}
                alt="Profile preview"
                layout="fill"
                objectFit="cover"
                className="rounded-full"
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Upload className="h-8 w-8 text-white" />
              <span className="mt-1 text-xs font-semibold text-white">
                Change
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleChoosePhoto}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
          >
            Change Photo
          </button>
          <input
            type="file"
            id="photo"
            name="photo"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
          {state?.errors?.photo && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {state.errors.photo[0]}
            </p>
          )}
        </div>
      </div>

      {/* Optional Fields */}
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
            className={`h-5 w-5 transform transition-transform ${isOptionalOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <div hidden={!isOptionalOpen}>
          <div className="mt-4 space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Optional profile info.
            </p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="birthDate"
                  className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Birth Date
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="ml-2 rounded-full focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Info className="h-4 w-4 text-gray-400" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-gray-800 text-white">
                        <p className="font-bold">Enter any date format.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="birthDate"
                    name="birthDate"
                    value={birthDate}
                    onChange={handleDateChange(
                      setBirthDate,
                      setBirthDatePrecision,
                    )}
                    className="block w-full rounded-md border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="YYYY, YYYY-MM, or YYYY-MM-DD"
                  />
                  <input
                    type="hidden"
                    name="birthDatePrecision"
                    value={birthDatePrecision}
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
                <div className="mt-1">
                  <input
                    type="text"
                    id="birthPlace"
                    name="birthPlace"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    className="block w-full rounded-md border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="deathDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Death Date
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="deathDate"
                    name="deathDate"
                    value={deathDate}
                    onChange={handleDateChange(
                      setDeathDate,
                      setDeathDatePrecision,
                    )}
                    className="block w-full rounded-md border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="YYYY, YYYY-MM, or YYYY-MM-DD"
                  />
                  <input
                    type="hidden"
                    name="deathDatePrecision"
                    value={deathDatePrecision}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="deathPlace"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Death Place
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="deathPlace"
                    name="deathPlace"
                    value={deathPlace}
                    onChange={(e) => setDeathPlace(e.target.value)}
                    className="block w-full rounded-md border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gender
              </label>
              <input type="hidden" name="gender" value={gender || ''} />
              <div className="mt-2 flex space-x-2">
                {[
                  ['male', 'He'],
                  ['female', 'She'],
                  ['non_binary', 'They'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setGender(gender === value ? null : (value as Gender))
                    }
                    className={`rounded-md px-3 py-1 text-sm font-medium ${gender === value ? 'border-transparent bg-indigo-600 text-white hover:bg-indigo-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                Managed Level
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="ml-2 rounded-full focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Info className="h-4 w-4 text-gray-400" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-gray-800 text-white">
                      <p>
                        <b>Full:</b> For users who won't log in (e.g., a child).
                        <br />
                        <b>Partial:</b> For users who can log in under your
                        supervision.
                        <br />
                        <b>Unselected:</b> Don't select Full or Partial if
                        you're a Backup manager for an active user.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <div className="mt-2 flex space-x-2">
                <input
                  type="hidden"
                  name="managed"
                  value={managedStatus || ''}
                  required={!isEditMode || managedStatus !== null}
                />
                <button
                  type="button"
                  onClick={() => setManagedStatus(ManagedStatus.full)}
                  className={`rounded-md px-3 py-1 text-sm font-medium ${managedStatus === ManagedStatus.full ? 'border-transparent bg-indigo-600 text-white hover:bg-indigo-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                >
                  Full
                </button>
                <button
                  type="button"
                  onClick={() => setManagedStatus(ManagedStatus.partial)}
                  className={`rounded-md px-3 py-1 text-sm font-medium ${managedStatus === ManagedStatus.partial ? 'border-transparent bg-indigo-600 text-white hover:bg-indigo-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                >
                  Partial
                </button>
              </div>
              {state?.errors?.managed && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {state.errors.managed[0]}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditMode && user && authdUserGroups && (
        <GroupsSection managedUser={user} authdUserGroups={authdUserGroups} />
      )}

      <div className="flex items-center gap-x-4">
        <SubmitButton isEditMode={isEditMode} />
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
        >
          Cancel
        </button>
        {state.errors?._form && (
          <div
            id="form-error-message"
            aria-live="polite"
            aria-atomic="true"
            className="text-destructive mt-4 text-sm font-medium"
          >
            {state.errors._form.map((error: string) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
        {state.error && (
          <div
            id="form-error-message"
            aria-live="polite"
            aria-atomic="true"
            className="text-destructive mt-4 text-sm font-medium"
          >
            <p>{state.error}</p>
          </div>
        )}
      </div>
    </form>
  )
}
