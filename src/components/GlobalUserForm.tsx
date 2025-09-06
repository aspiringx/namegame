'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import {
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  CheckCircleIcon,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Gender } from '@/generated/prisma/client'

export type UserFormData = {
  id?: string
  username: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  gender?: Gender | null
  birthDate?: Date | null
  birthPlace?: string | null
  deathDate?: Date | null
  password?: string | null
  emailVerified?: Date | null
}

export type UserFormState = {
  errors: {
    username?: string[]
    firstName?: string[]
    lastName?: string[]
    email?: string[]
    phone?: string[]
    password?: string[]
    photo?: string[]
    gender?: string[]
    birthDate?: string[]
    birthPlace?: string[]
    deathDate?: string[]
  } | null
  message: string | null
  success?: boolean
  photoUrl?: string | null
  values?: {
    username: string
    firstName: string
    lastName: string
    email: string
    phone: string
    password?: string
  }
}

type UserFormProps = {
  mode: 'create' | 'edit'
  user?: UserFormData
  photoUrl?: string | null
  hasPhoto?: boolean
  onSubmit: (
    prevState: UserFormState,
    formData: FormData,
  ) => Promise<UserFormState>
  initialState: UserFormState
  passwordRequired?: boolean
  onPasswordRequirementCheck?: (
    userId: string,
  ) => Promise<{ passwordRequired: boolean }>
  submitButtonText?: string
  submitButtonPendingText?: string
}

function generateRandomPassword(length: number) {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '123456789'
  const allChars = letters + numbers
  let result = ''

  for (let i = 0; i < length; i++) {
    result += allChars.charAt(Math.floor(Math.random() * allChars.length))
  }
  return result
}

function SubmitButton({
  disabled,
  text = 'Save',
  pendingText = 'Saving...',
}: {
  disabled?: boolean
  text?: string
  pendingText?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:bg-indigo-400 dark:focus:ring-offset-gray-800 dark:disabled:bg-indigo-800"
    >
      {pending ? pendingText : text}
    </button>
  )
}

export default function GlobalUserForm({
  mode,
  user,
  photoUrl,
  hasPhoto,
  onSubmit,
  initialState,
  passwordRequired: initialPasswordRequired = true,
  onPasswordRequirementCheck,
  submitButtonText,
  submitButtonPendingText,
}: UserFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(photoUrl || null)
  const [photoPreview, setPhotoPreview] = useState<string>(photoUrl || '')
  const [fileSelected, setFileSelected] = useState(false)
  const [gender, setGender] = useState<Gender | null>(
    mode === 'edit' ? user?.gender || null : null,
  )
  const [birthDate, setBirthDate] = useState(
    mode === 'edit' && user?.birthDate
      ? new Date(user.birthDate).toISOString().split('T')[0]
      : '',
  )
  const [birthPlace, setBirthPlace] = useState(
    mode === 'edit' ? user?.birthPlace || '' : '',
  )
  const [deathDate, setDeathDate] = useState(
    mode === 'edit' && user?.deathDate
      ? new Date(user.deathDate).toISOString().split('T')[0]
      : '',
  )
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const [isPasswordTooltipOpen, setIsPasswordTooltipOpen] = useState(false)
  const [isEmailTooltipOpen, setIsEmailTooltipOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [passwordRequired, setPasswordRequired] = useState(
    mode === 'create' ? true : false,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [state, formAction] = useActionState(onSubmit, initialState)

  // Check password requirement on mount (edit mode only)
  useEffect(() => {
    if (mode === 'edit' && user?.id && onPasswordRequirementCheck) {
      async function fetchRequirements() {
        try {
          const { passwordRequired } = await onPasswordRequirementCheck!(
            user!.id!,
          )
          setPasswordRequired(passwordRequired)
        } catch (error) {
          console.error('Failed to check password requirement:', error)
          setPasswordRequired(true)
        }
      }
      fetchRequirements()
    }
  }, [mode, user?.id, onPasswordRequirementCheck])

  const formSubmitted = useRef(false)

  useEffect(() => {
    if (state.success && !formSubmitted.current) {
      formSubmitted.current = true

      // Re-check password requirement after successful update (edit mode only)
      if (mode === 'edit' && user?.id && onPasswordRequirementCheck) {
        async function recheckRequirements() {
          try {
            const { passwordRequired } = await onPasswordRequirementCheck!(
              user!.id!,
            )
            setPasswordRequired(passwordRequired)
            setPassword('')
          } catch (error) {
            console.error('Failed to recheck password requirement:', error)
          }
        }
        recheckRequirements()
      }

      if (state.photoUrl !== undefined) {
        const channel = new BroadcastChannel('photo_updates')
        channel.postMessage('photo_updated')
        channel.close()
      }
    }
  }, [
    state.success,
    state.photoUrl,
    mode,
    user?.id,
    onPasswordRequirementCheck,
  ])

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [initialPassword] = useState('')
  const passwordInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.values?.password) {
      setPassword(state.values.password)
    }
  }, [state.values?.password])

  // Detect browser extension password autofill in create mode. This uses
  // a short-lived polling mechanism because autofill events are inconsistent.
  useEffect(() => {
    if (mode === 'create') {
      let attempts = 0
      const maxAttempts = 20 // Poll for 2 seconds (20 * 100ms)

      const intervalId = setInterval(() => {
        const inputElement = passwordInputRef.current
        if (inputElement && inputElement.value) {
          // Use functional update to get the latest state and avoid stale closures.
          setPassword(currentPassword => {
            if (inputElement.value !== currentPassword) {
              // A new value was found, so we update the state and stop polling.
              clearInterval(intervalId)
              return inputElement.value
            }
            // No change, keep the current state.
            return currentPassword
          })
        }

        if (++attempts >= maxAttempts) {
          clearInterval(intervalId)
        }
      }, 100)

      return () => clearInterval(intervalId)
    }
    // We only want this to run once on mount in create mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])


  const handleGeneratePassword = () => {
    setPassword(generateRandomPassword(6))
  }

  const handleCopyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password).then(() => {
        setShowCopySuccess(true)
        setTimeout(() => {
          setShowCopySuccess(false)
        }, 2000)
      })
    }
  }

  // State for form field values (edit mode uses controlled components)
  const [formValues, setFormValues] = useState({
    username: mode === 'edit' ? user?.username || '' : '',
    firstName: mode === 'edit' ? user?.firstName || '' : '',
    lastName: mode === 'edit' ? user?.lastName || '' : '',
    email: mode === 'edit' ? user?.email || '' : '',
    phone: mode === 'edit' ? user?.phone || '' : '',
  })

  // Track if form is dirty (edit mode only)
  useEffect(() => {
    if (mode === 'edit' && user) {
      const isUsernameDirty = formValues.username !== (user.username || '')
      const isFirstNameDirty = formValues.firstName !== (user.firstName || '')
      const isLastNameDirty = formValues.lastName !== (user.lastName || '')
      const isEmailDirty = formValues.email !== (user.email || '')
      const isPhoneDirty = formValues.phone !== (user.phone || '')
      const isGenderDirty = gender !== user.gender
      const isBirthDateDirty =
        birthDate !==
        (user.birthDate
          ? new Date(user.birthDate).toISOString().split('T')[0]
          : '')
      const isBirthPlaceDirty = birthPlace !== (user.birthPlace || '')
      const isDeathDateDirty =
        deathDate !==
        (user.deathDate
          ? new Date(user.deathDate).toISOString().split('T')[0]
          : '')
      const isPasswordDirty = password !== ''
      const isPhotoDirty = fileSelected

      const dirty =
        isUsernameDirty ||
        isFirstNameDirty ||
        isLastNameDirty ||
        isEmailDirty ||
        isPhoneDirty ||
        isGenderDirty ||
        isBirthDateDirty ||
        isBirthPlaceDirty ||
        isDeathDateDirty ||
        isPasswordDirty ||
        isPhotoDirty

      setIsDirty(dirty)
    } else if (mode === 'create') {
      // Create mode: check if password has been changed from initial
      const isPasswordDirty = password !== initialPassword
      setIsDirty(isPasswordDirty)
    }
  }, [
    mode,
    formValues.username,
    formValues.firstName,
    formValues.lastName,
    formValues.email,
    formValues.phone,
    gender,
    birthDate,
    birthPlace,
    deathDate,
    password,
    initialPassword,
    fileSelected,
    user?.username,
    user?.firstName,
    user?.lastName,
    user?.email,
    user?.phone,
    user?.gender,
    user?.birthDate,
    user?.birthPlace,
    user?.deathDate,
  ])

  // Check if all required fields are valid
  const isFormValid =
    formValues.username &&
    formValues.firstName &&
    (passwordRequired ? password : true)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFileSelected(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      if (photoUrl) {
        setPreviewUrl(photoUrl)
        setPhotoPreview(photoUrl)
      } else {
        setPreviewUrl(null)
        setPhotoPreview('')
      }
      setFileSelected(false)
    }
  }

  const handleChoosePhoto = () => {
    fileInputRef.current?.click()
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <div className="space-y-4">
          {state.success ? (
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
              </div>
            </div>
          ) : (
            <p className="mb-4 text-red-500">{state.message}</p>
          )}
        </div>
      )}

      {/* Username */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Username <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="username"
          name="username"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          {...(mode === 'edit'
            ? {
                value: formValues.username,
                onChange: (e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    username: e.target.value,
                  })),
              }
            : {
                defaultValue: state.values?.username || '',
              })}
        />
        {state.errors?.username && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.username[0]}
          </p>
        )}
      </div>

      {/* First Name */}
      <div>
        <label
          htmlFor="firstName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          First Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          {...(mode === 'edit'
            ? {
                value: formValues.firstName,
                onChange: (e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  })),
              }
            : {
                defaultValue: state.values?.firstName || '',
              })}
        />
        {state.errors?.firstName && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.firstName[0]}
          </p>
        )}
      </div>

      {/* Last Name */}
      <div>
        <label
          htmlFor="lastName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          {...(mode === 'edit'
            ? {
                value: formValues.lastName,
                onChange: (e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  })),
              }
            : {
                defaultValue: state.values?.lastName || '',
              })}
        />
        {state.errors?.lastName && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.lastName[0]}
          </p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Gender
        </label>
        <div className="flex gap-3">
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
                ? 'bg-pink-600 text-white'
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
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            They
          </button>
          {gender && (
            <button
              type="button"
              onClick={() => setGender(null)}
              className="rounded-md px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear
            </button>
          )}
        </div>
        <input type="hidden" name="gender" value={gender || ''} />
        {state.errors?.gender && (
          <p className="mt-1 text-sm text-red-500">{state.errors.gender[0]}</p>
        )}
      </div>

      {/* Email */}
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
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            {...(mode === 'edit'
              ? {
                  value: formValues.email,
                  onChange: (e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      email: e.target.value,
                    })),
                }
              : {
                  defaultValue: state.values?.email || '',
                })}
          />
          {mode === 'edit' && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <TooltipProvider>
                {formValues.email && user?.emailVerified && (
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
                      <p>Email verified</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          )}
        </div>
        {state.errors?.email && (
          <p className="mt-1 text-sm text-red-500">{state.errors.email[0]}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {mode === 'create' ? 'Password' : 'New Password'}{' '}
          {passwordRequired && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            ref={passwordInputRef}
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            className="block w-full min-w-0 flex-1 rounded-none rounded-l-md border border-gray-300 bg-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            placeholder={
              passwordRequired
                ? 'New password required'
                : 'Leave blank to keep current password'
            }
            required={passwordRequired}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
                {password ? (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className={`inline-flex items-center border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${password ? 'rounded-r-md' : ''}`}
                    aria-label="Copy password to clipboard"
                  >
                    {showCopySuccess ? (
                      <Check className="h-5 w-5" />
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
                  {password
                    ? showCopySuccess
                      ? 'Copied!'
                      : 'Copy Password'
                    : 'Generate Password'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {state.errors?.password && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      {/* Profile Photo */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
          Profile Photo
        </label>
        <div className="mt-2 flex flex-col items-start gap-y-3">
          <div className="group relative h-32 w-32 cursor-pointer rounded-full">
            {photoPreview ? (
              <Image
                src={photoPreview}
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
            type="button"
            onClick={handleChoosePhoto}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-4 font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
          >
            Change Photo
          </button>
        </div>
        {state.errors?.photo && (
          <p className="mt-1 text-sm text-red-500">{state.errors.photo[0]}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          {...(mode === 'edit'
            ? {
                value: formValues.phone,
                onChange: (e) =>
                  setFormValues((prev) => ({ ...prev, phone: e.target.value })),
              }
            : {
                defaultValue: state.values?.phone || '',
              })}
        />
        {state.errors?.phone && (
          <p className="mt-1 text-sm text-red-500">{state.errors.phone[0]}</p>
        )}
      </div>

      {/* Birth Date */}
      <div>
        <label
          htmlFor="birthDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Birth Date
        </label>
        <input
          type="date"
          id="birthDate"
          name="birthDate"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
        {state.errors?.birthDate && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.birthDate[0]}
          </p>
        )}
      </div>

      {/* Birth Place */}
      <div>
        <label
          htmlFor="birthPlace"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Birth Place
        </label>
        <input
          type="text"
          id="birthPlace"
          name="birthPlace"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          value={birthPlace}
          onChange={(e) => setBirthPlace(e.target.value)}
          placeholder="e.g., New York, NY"
        />
        {state.errors?.birthPlace && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.birthPlace[0]}
          </p>
        )}
      </div>

      {/* Death Date */}
      <div>
        <label
          htmlFor="deathDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Death Date
        </label>
        <input
          type="date"
          id="deathDate"
          name="deathDate"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          value={deathDate}
          onChange={(e) => setDeathDate(e.target.value)}
        />
        {state.errors?.deathDate && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.deathDate[0]}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end space-x-4 pt-8">
        <Link
          href="/admin/users"
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </Link>
        <SubmitButton
          disabled={!isDirty || !isFormValid}
          text={submitButtonText}
          pendingText={submitButtonPendingText}
        />
      </div>
    </form>
  )
}
