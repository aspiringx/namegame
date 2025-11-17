'use client'

import { useActionState, useState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'
import type { GroupType } from '@namegame/db'
import { createGroup, type State } from './actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const initialState: State = {
  message: null,
  errors: {},
  values: {
    name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
    groupTypeId: 0,
  },
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:bg-indigo-400 disabled:bg-indigo-800"
    >
      {pending ? 'Creating...' : 'Create Group'}
    </button>
  )
}

export default function CreateGroupForm({
  groupTypes,
}: {
  groupTypes: GroupType[]
}) {
  const [state, formAction] = useActionState(createGroup, initialState)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [selectedGroupType, setSelectedGroupType] = useState<string>(
    state.values?.groupTypeId ? String(state.values.groupTypeId) : '',
  )
  const formRef = useRef<HTMLFormElement>(null)

  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    let hiddenInput = formRef.current?.querySelector(
      'input[name="logo"]',
    ) as HTMLInputElement | null

    if (!hiddenInput && formRef.current) {
      hiddenInput = document.createElement('input')
      hiddenInput.type = 'hidden'
      hiddenInput.name = 'logo'
      formRef.current.appendChild(hiddenInput)
    }

    if (!file) {
      setLogoBase64(null)
      if (hiddenInput) hiddenInput.value = ''
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setLogoError('File is too large. Please select an image under 10MB.')
      setLogoBase64(null)
      if (hiddenInput) hiddenInput.value = ''
      event.target.value = ''
      return
    }

    setLogoError(null)

    try {
      const options = {
        maxSizeMB: 0.95,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      }

      const compressedFile = await imageCompression(file, options)
      const base64String = await imageCompression.getDataUrlFromFile(
        compressedFile,
      )
      const sizeInBytes = new Blob([base64String]).size

      if (sizeInBytes > 1024 * 1024) {
        setLogoError(
          'Image is still too large after compression. Please choose a smaller file.',
        )
        setLogoBase64(null)
        if (hiddenInput) hiddenInput.value = ''
        return
      }

      setLogoBase64(base64String)
      setLogoError(null)
      if (hiddenInput) {
        hiddenInput.value = base64String
      }
    } catch (error) {
      console.error('Image compression error:', error)
      setLogoError('An error occurred while processing the image.')
      setLogoBase64(null)
      if (hiddenInput) hiddenInput.value = ''
    }
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-300"
        >
          Group Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm border-gray-600 bg-gray-800 text-white placeholder-gray-400"
          defaultValue={state.values?.name}
        />
        {state.errors?.name && (
          <p className="mt-1 text-sm text-red-500">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-gray-300"
        >
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm border-gray-600 bg-gray-800 text-white placeholder-gray-400"
          defaultValue={state.values?.slug}
        />
        {state.errors?.slug && (
          <p className="mt-1 text-sm text-red-500">{state.errors.slug[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="groupTypeId"
          className="block text-sm font-medium text-gray-300"
        >
          Group Type <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedGroupType}
          onValueChange={setSelectedGroupType}
          required
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select a group type" />
          </SelectTrigger>
          <SelectContent>
            {groupTypes.map((groupType) => (
              <SelectItem key={groupType.id} value={String(groupType.id)}>
                {groupType.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="groupTypeId" value={selectedGroupType} />
        {state.errors?.groupTypeId && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.groupTypeId[0]}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-300"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm border-gray-600 bg-gray-800 text-white placeholder-gray-400"
          defaultValue={state.values?.description}
        />
        {state.errors?.description && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.description[0]}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="logo-upload"
          className="block text-sm font-medium text-gray-300"
        >
          Logo
        </label>
        <div className="mt-1 space-y-3">
          <div className="justify-left flex">
            <span className="inline-block h-30 w-30 overflow-hidden rounded-full bg-gray-700">
              <Image
                src={logoBase64 || '/images/default-avatar.png'}
                alt="Group logo preview"
                width={120}
                height={120}
                className="h-full w-full text-gray-300"
              />
            </span>
          </div>
          <input
            type="file"
            id="logo-upload"
            name="logo-upload"
            accept="image/*"
            onChange={handleLogoChange}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-4 font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-offset-gray-800"
          />
        </div>
        {logoError && <p className="mt-1 text-sm text-red-500">{logoError}</p>}
      </div>

      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-300"
        >
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm border-gray-600 bg-gray-800 text-white placeholder-gray-400"
          defaultValue={state.values?.address}
        />
        {state.errors?.address && (
          <p className="mt-1 text-sm text-red-500">{state.errors.address[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-300"
        >
          Phone
        </label>
        <input
          type="text"
          id="phone"
          name="phone"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm border-gray-600 bg-gray-800 text-white placeholder-gray-400"
          defaultValue={state.values?.phone}
        />
        {state.errors?.phone && (
          <p className="mt-1 text-sm text-red-500">{state.errors.phone[0]}</p>
        )}
      </div>

      <SubmitButton />
    </form>
  )
}
