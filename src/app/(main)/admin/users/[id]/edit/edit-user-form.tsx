'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useFormStatus } from 'react-dom'
import type { User } from '@/generated/prisma'
import { Gender, DatePrecision } from '@/generated/prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { RefreshCw, Copy, Check, ShieldCheck } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { updateUser, getUserUpdateRequirements, type State } from './actions'

function generateRandomPassword(length: number) {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '123456789'
  const allChars = letters + numbers
  let result = ''

  // Generate a random string of the given length
  for (let i = 0; i < length; i++) {
    result += allChars.charAt(Math.floor(Math.random() * allChars.length))
  }

  // Check if it has at least one number
  const hasNumber = numbers.split('').some((num) => result.includes(num))

  // If not, replace a random character with a random number
  if (!hasNumber) {
    const randomIndex = Math.floor(Math.random() * length)
    const randomNumber = numbers.charAt(
      Math.floor(Math.random() * numbers.length),
    )
    result =
      result.substring(0, randomIndex) +
      randomNumber +
      result.substring(randomIndex + 1)
  }

  return result
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-indigo-400 disabled:opacity-50 dark:focus:ring-offset-gray-800 dark:disabled:bg-indigo-800"
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  )
}

export default function EditUserForm({
  user,
  photoUrl,
  hasPhoto,
}: {
  user: User
  photoUrl: string
  hasPhoto: boolean
}) {
  const [previewUrl, setPreviewUrl] = useState<string>(photoUrl)
  const [photoPreview, setPhotoPreview] = useState<string>(photoUrl)
  const [fileSelected, setFileSelected] = useState(false)
  const [gender, setGender] = useState<Gender | null>(user.gender || null)
  const [birthDate, setBirthDate] = useState(user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '')
  const [birthPlace, setBirthPlace] = useState(user.birthPlace || '')
  const [deathDate, setDeathDate] = useState(user.deathDate ? new Date(user.deathDate).toISOString().split('T')[0] : '')
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const [isPasswordTooltipOpen, setIsPasswordTooltipOpen] = useState(false)
  const [isEmailTooltipOpen, setIsEmailTooltipOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [passwordRequired, setPasswordRequired] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initialState: State = {
    message: null,
    errors: {},
    values: {
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
    },
  }

  const { data: session, update } = useSession()

  const updateUserWithId = updateUser.bind(null, user.id)
  const [state, formAction] = useActionState(updateUserWithId, initialState)

  // Check password requirement on mount
  useEffect(() => {
    async function fetchRequirements() {
      try {
        const { passwordRequired } = await getUserUpdateRequirements(user.id)
        setPasswordRequired(passwordRequired)
      } catch (error) {
        console.error('Failed to check password requirement:', error)
        // Default to required if check fails
        setPasswordRequired(true)
      }
    }
    fetchRequirements()
  }, [user.id])

  const formSubmitted = useRef(false)

  useEffect(() => {
    if (state.success && !formSubmitted.current) {
      formSubmitted.current = true

      // Re-check password requirement after successful update
      async function recheckRequirements() {
        try {
          const { passwordRequired } = await getUserUpdateRequirements(user.id)
          setPasswordRequired(passwordRequired)
          // Clear the password field after successful save
          setPassword('')
        } catch (error) {
          console.error('Failed to recheck password requirement:', error)
        }
      }
      recheckRequirements()

      // If a photo was part of the successful update (either added or removed),
      // broadcast a message so the UserMenu can update everywhere.
      if (state.photoUrl !== undefined) {
        const channel = new BroadcastChannel('photo_updates')
        channel.postMessage('photo_updated')
        channel.close()
      }

      // Don't redirect - stay on the form so user can see the updated state
      // window.location.href = '/admin/users'
    }
  }, [state.success, state.photoUrl, user.id])

  const [password, setPassword] = useState('')

  useEffect(() => {
    // If the form fails validation and the server sends back a password value,
    // update the local password state to reflect it.
    if (state.values?.password) {
      setPassword(state.values.password)
    }
  }, [state.values?.password])

  const handleGeneratePassword = () => {
    setPassword(generateRandomPassword(6))
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

  // State for form field values
  const [formValues, setFormValues] = useState({
    username: user.username || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
  })

  // Track if form is dirty (changed from original values)
  useEffect(() => {
    const isUsernameDirty = formValues.username !== (user.username || '')
    const isFirstNameDirty = formValues.firstName !== (user.firstName || '')
    const isLastNameDirty = formValues.lastName !== (user.lastName || '')
    const isEmailDirty = formValues.email !== (user.email || '')
    const isPhoneDirty = formValues.phone !== (user.phone || '')
    const isGenderDirty = gender !== user.gender
    const isBirthDateDirty = birthDate !== (user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '')
    const isBirthPlaceDirty = birthPlace !== (user.birthPlace || '')
    const isDeathDateDirty = deathDate !== (user.deathDate ? new Date(user.deathDate).toISOString().split('T')[0] : '')
    const isPasswordDirty = password !== ''
    const isPhotoDirty = fileSelected

    const dirty = (
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
    )

    setIsDirty(dirty)
  }, [
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
    fileSelected,
    user.username,
    user.firstName,
    user.lastName,
    user.email,
    user.phone,
    user.gender,
    user.birthDate,
    user.birthPlace,
    user.deathDate
  ])

  // Check if all required fields are valid
  const isFormValid = formValues.username && formValues.firstName && (passwordRequired ? password : true)

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
      // If the user cancels file selection, revert to the original photo if it exists
      setPreviewUrl(photoUrl)
      setPhotoPreview(photoUrl)
      setFileSelected(false)
    }
  }

  const handleChoosePhoto = () => {
    fileInputRef.current?.click()
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.message && state.errors && (
        <p className="mb-4 text-red-500">{state.message}</p>
      )}
      {state.message && !state.errors && (
        <p className="mb-4 text-green-500">{state.message}</p>
      )}

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
          value={formValues.username}
          onChange={(e) => setFormValues(prev => ({ ...prev, username: e.target.value }))}
        />
        {state.errors?.username && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.username[0]}
          </p>
        )}
      </div>

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
          value={formValues.firstName}
          onChange={(e) => setFormValues(prev => ({ ...prev, firstName: e.target.value }))}
        />
        {state.errors?.firstName && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.firstName[0]}
          </p>
        )}
      </div>

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
          value={formValues.lastName}
          onChange={(e) => setFormValues(prev => ({ ...prev, lastName: e.target.value }))}
        />
        {state.errors?.lastName && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.lastName[0]}
          </p>
        )}
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
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            value={formValues.email}
            onChange={(e) => setFormValues(prev => ({ ...prev, email: e.target.value }))}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <TooltipProvider>
              {formValues.email && user.emailVerified && (
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
        {state.errors?.email && (
          <p className="mt-1 text-sm text-red-500">{state.errors.email[0]}</p>
        )}
      </div>

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
          value={formValues.phone}
          onChange={(e) => setFormValues(prev => ({ ...prev, phone: e.target.value }))}
        />
        {state.errors?.phone && (
          <p className="mt-1 text-sm text-red-500">{state.errors.phone[0]}</p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Gender
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setGender(Gender.male)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
              className="px-3 py-2 rounded-md text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
          <p className="mt-1 text-sm text-red-500">{state.errors.birthDate[0]}</p>
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
          <p className="mt-1 text-sm text-red-500">{state.errors.birthPlace[0]}</p>
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
          <p className="mt-1 text-sm text-red-500">{state.errors.deathDate[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          New Password {passwordRequired && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            id="password"
            name="password"
            className="block w-full min-w-0 flex-1 rounded-none rounded-l-md border border-gray-300 bg-white px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            placeholder={passwordRequired ? "Password required" : "Leave blank to keep current password"}
            required={passwordRequired}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TooltipProvider>
            <Tooltip
              open={isPasswordTooltipOpen}
              onOpenChange={setIsPasswordTooltipOpen}
            >
              <TooltipTrigger asChild>
                {password ? (
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

      <div className="flex items-center justify-end space-x-4 pt-8">
        <Link
          href="/admin/users"
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </Link>
        <SubmitButton disabled={!isDirty || !isFormValid} />
      </div>
    </form>
  )
}
