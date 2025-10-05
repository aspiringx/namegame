'use client'

import React, { useActionState, useState, useRef, useEffect } from 'react'
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
import { Gender } from '@namegame/db/types'
import { z } from 'zod'

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
    gender?: Gender | null
    birthDate?: Date | null
    birthPlace?: string | null
    deathDate?: Date | null
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
      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:bg-indigo-400 disabled:opacity-50 dark:focus:ring-offset-gray-800 dark:disabled:bg-indigo-800"
    >
      {pending ? pendingText : text}
    </button>
  )
}

export default function GlobalUserForm({
  mode,
  user,
  photoUrl,
  onSubmit,
  initialState,
  onPasswordRequirementCheck,
  submitButtonText,
  submitButtonPendingText,
}: UserFormProps) {
  // --- State Management ---
  const getInitialFormState = () => ({
    username: user?.username || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    gender: user?.gender || null,
    email: user?.email || '',
    phone: user?.phone || '',
    birthDate: user?.birthDate
      ? new Date(user.birthDate).toISOString().split('T')[0]
      : '',
    birthPlace: user?.birthPlace || '',
    deathDate: user?.deathDate
      ? new Date(user.deathDate).toISOString().split('T')[0]
      : '',
    password: '', // Password always starts empty
  })

  type InternalFormState = ReturnType<typeof getInitialFormState>

  const [formState, setFormState] = useState<InternalFormState>(
    getInitialFormState(),
  )
  const initialFormStateRef = useRef(getInitialFormState())

  const [photoPreview, setPhotoPreview] = useState<string>(photoUrl || '')
  const [fileSelected, setFileSelected] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const [isPasswordTooltipOpen, setIsPasswordTooltipOpen] = useState(false)
  const [isEmailTooltipOpen, setIsEmailTooltipOpen] = useState(false)
  const [passwordRequired, setPasswordRequired] = useState(mode === 'create')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [firstNameError, setFirstNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const [state, formAction] = useActionState(onSubmit, initialState)
  const formSubmittedRef = useRef(false)

  // --- Event Handlers ---
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenderChange = (gender: Gender | null) => {
    setFormState((prev) => ({ ...prev, gender }))
  }

  const handleGeneratePassword = () => {
    setFormState((prev) => ({ ...prev, password: generateRandomPassword(6) }))
  }

  const handleCopyPassword = () => {
    if (formState.password) {
      navigator.clipboard.writeText(formState.password).then(() => {
        setShowCopySuccess(true)
        setTimeout(() => setShowCopySuccess(false), 2000)
      })
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFileSelected(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFileSelected(false)
      setPhotoPreview(photoUrl || '')
    }
  }

  const handleChoosePhoto = () => {
    fileInputRef.current?.click()
  }

  // --- Validation ---
  const validateUsername = React.useCallback((username: string) => {
    if (!username) {
      return 'Username is required.'
    }
    if (username.length < 2) {
      return 'Username must be at least 2 characters long.'
    }
    return null
  }, [])

  const validateFirstName = React.useCallback((firstName: string) => {
    if (!firstName) {
      return 'First name is required.'
    }
    return null
  }, [])

  const validateEmail = React.useCallback((email: string) => {
    if (!email) {
      return null
    }
    const result = z.string().email('Invalid email address.').safeParse(email)
    if (!result.success) {
      return result.error.issues[0].message
    }
    return null
  }, [])

  const validatePassword = React.useCallback(
    (password: string) => {
      if (!password && !passwordRequired) {
        return null
      }
      if (!password && passwordRequired) {
        return 'Password is required.'
      }
      if (!/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/.test(password)) {
        return 'Password must have 6+ characters with letters and numbers.'
      }
      if (password.toLowerCase().includes('pass')) {
        return 'Password cannot contain the word "pass".'
      }
      return null
    },
    [passwordRequired],
  )

  // --- Effects ---

  // Check password requirement on mount (edit mode only)
  useEffect(() => {
    if (mode === 'edit' && user?.id && onPasswordRequirementCheck) {
      onPasswordRequirementCheck(user.id)
        .then(({ passwordRequired }) => setPasswordRequired(passwordRequired))
        .catch((error) => {
          console.error('Failed to check password requirement:', error)
          setPasswordRequired(true) // Default to required on error
        })
    }
  }, [mode, user?.id, onPasswordRequirementCheck])

  // Handle post-submission logic
  useEffect(() => {
    // This effect should only run after a form submission has occurred.
    // We use a ref to track this, as the `state` from `useActionState` is
    // the same object on initial render and after submission, making it
    // unsuitable for a dependency array check alone.
    if (!formSubmittedRef.current) {
      return
    }

    if (state.success) {
      if (mode === 'edit') {
        setFileSelected(false)

        // After a successful save, we need to reset the form to a clean state.
        // The `state.values` from the server action contains the just-saved data,
        // so we use it as the new source of truth for both the visible form
        // and the initial state reference used for the 'isDirty' check.
        if (state.values) {
          const newCleanState: InternalFormState = {
            username: state.values.username || '',
            firstName: state.values.firstName || '',
            lastName: state.values.lastName || '',
            gender: state.values.gender || null,
            email: state.values.email || '',
            phone: state.values.phone || '',
            birthDate: state.values.birthDate
              ? new Date(state.values.birthDate).toISOString().split('T')[0]
              : '',
            birthPlace: state.values.birthPlace || '',
            deathDate: state.values.deathDate
              ? new Date(state.values.deathDate).toISOString().split('T')[0]
              : '',
            password: '', // Always clear password
          }
          setFormState(newCleanState)
          initialFormStateRef.current = newCleanState
        }

        // Then, re-check if a password is now required (e.g. after setting an email)
        if (user?.id && onPasswordRequirementCheck) {
          onPasswordRequirementCheck(user.id).then(({ passwordRequired }) => {
            setPasswordRequired(passwordRequired)
          })
        }
      }

      // If a new photo was uploaded, broadcast an update
      if (state.photoUrl !== undefined) {
        const channel = new BroadcastChannel('photo_updates')
        channel.postMessage('photo_updated')
        channel.close()
      }
    } else if (state.values) {
      // If the form submission failed, restore the previous non-password values,
      // but preserve the password that the user may have been typing.
      setFormState((prev) => ({
        ...prev,
        ...state.values,
        // The server doesn't return all fields on failure, so we keep the existing ones
        // to prevent type errors and preserve user input.
        gender: prev.gender,
        birthDate: prev.birthDate,
        birthPlace: prev.birthPlace,
        deathDate: prev.deathDate,
        password: prev.password,
      }))
    }
  }, [state, mode, user?.id, onPasswordRequirementCheck])

  // --- Client-Side Validation Effects ---
  useEffect(() => {
    setUsernameError(validateUsername(formState.username))
  }, [formState.username, validateUsername])

  useEffect(() => {
    setFirstNameError(validateFirstName(formState.firstName))
  }, [formState.firstName, validateFirstName])

  useEffect(() => {
    setEmailError(validateEmail(formState.email))
  }, [formState.email, validateEmail])

  // Validate password on change
  useEffect(() => {
    if (formState.password) {
      setPasswordError(validatePassword(formState.password))
    } else {
      // Clear error if password field is empty (unless it's required and empty)
      setPasswordError(passwordRequired ? 'Password is required.' : null)
    }
  }, [formState.password, passwordRequired, validatePassword])

  // Detect browser password autofill
  useEffect(() => {
    if (mode === 'create') {
      const intervalId = setInterval(() => {
        const input = passwordInputRef.current
        if (input && input.value && input.value !== formState.password) {
          setFormState((prev) => ({ ...prev, password: input.value }))
          clearInterval(intervalId)
        }
      }, 250)

      // Stop polling after 2 seconds
      const timeoutId = setTimeout(() => clearInterval(intervalId), 2000)

      return () => {
        clearInterval(intervalId)
        clearTimeout(timeoutId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // --- Derived State ---

  // Check if the form is dirty by comparing to the initial state.
  const isDirty = React.useMemo(() => {
    // In create mode, any interaction makes it dirty.
    if (mode === 'create') {
      return (
        JSON.stringify(formState) !==
        JSON.stringify(initialFormStateRef.current)
      )
    }
    // In edit mode, photo selection also counts.
    return (
      JSON.stringify(formState) !==
        JSON.stringify(initialFormStateRef.current) || fileSelected
    )
  }, [formState, fileSelected, mode])

  // Check if all required fields are valid.
  const isFormValid = React.useMemo(() => {
    const isPasswordValid = !validatePassword(formState.password)
    const isUsernameValid = !validateUsername(formState.username)
    const isFirstNameValid = !validateFirstName(formState.firstName)
    const isEmailValid = !validateEmail(formState.email)

    return (
      isUsernameValid && isFirstNameValid && isPasswordValid && isEmailValid
    )
  }, [
    formState.username,
    formState.firstName,
    formState.email,
    formState.password,
    validatePassword,
    validateUsername,
    validateFirstName,
    validateEmail,
  ])

  return (
    <form
      action={(formData) => {
        formSubmittedRef.current = true
        formAction(formData)
      }}
      className="space-y-6"
    >
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
          value={formState.username}
          onChange={handleInputChange}
        />
        {(state.errors?.username || usernameError) && (
          <p className="mt-1 text-sm text-red-500">
            {usernameError || state.errors?.username?.[0]}
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
          value={formState.firstName}
          onChange={handleInputChange}
        />
        {(state.errors?.firstName || firstNameError) && (
          <p className="mt-1 text-sm text-red-500">
            {firstNameError || state.errors?.firstName?.[0]}
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
          value={formState.lastName}
          onChange={handleInputChange}
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
            onClick={() => handleGenderChange(Gender.male)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              formState.gender === Gender.male
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            He
          </button>
          <button
            type="button"
            onClick={() => handleGenderChange(Gender.female)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              formState.gender === Gender.female
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            She
          </button>
          <button
            type="button"
            onClick={() => handleGenderChange(Gender.non_binary)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              formState.gender === Gender.non_binary
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            They
          </button>
          {formState.gender && (
            <button
              type="button"
              onClick={() => handleGenderChange(null)}
              className="rounded-md px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear
            </button>
          )}
        </div>
        <input type="hidden" name="gender" value={formState.gender || ''} />
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
            value={formState.email}
            onChange={handleInputChange}
          />
          {mode === 'edit' && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <TooltipProvider>
                {formState.email && user?.emailVerified && (
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
        {(state.errors?.email || emailError) && (
          <p className="mt-1 text-sm text-red-500">
            {emailError || state.errors?.email?.[0]}
          </p>
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
            value={formState.password}
            onChange={handleInputChange}
          />
          {formState.password && (
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
                {formState.password ? (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className={`inline-flex items-center border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${
                      formState.password ? 'rounded-r-md' : ''
                    }`}
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
                  {formState.password
                    ? showCopySuccess
                      ? 'Copied!'
                      : 'Copy Password'
                    : 'Generate Password'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {(state.errors?.password || passwordError) && (
          <p className="mt-1 text-sm text-red-500">
            {passwordError || state.errors?.password?.[0]}
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
          value={formState.phone}
          onChange={handleInputChange}
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
          value={formState.birthDate}
          onChange={handleInputChange}
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
          value={formState.birthPlace}
          onChange={handleInputChange}
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
          value={formState.deathDate}
          onChange={handleInputChange}
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
          disabled={mode === 'edit' ? !isDirty || !isFormValid : !isFormValid}
          text={submitButtonText}
          pendingText={submitButtonPendingText}
        />
      </div>
    </form>
  )
}
