'use client'

import { useState } from 'react'
import { updateGroup } from './actions'
import type { Group } from '@/generated/prisma'
import Image from 'next/image'

export default function EditGroupForm({
  group,
  logoUrl,
}: {
  group: Group
  logoUrl?: string
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [slugValue, setSlugValue] = useState(group.slug)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }
  return (
    <form action={updateGroup} className="space-y-6">
      <input type="hidden" name="groupId" value={group.id} />
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={group.name}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        />
      </div>
      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Slug
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          defaultValue={group.slug}
          onChange={(e) => setSlugValue(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        />
        {slugValue !== group.slug && (
          <p className="mt-2 text-sm text-red-500 dark:text-red-400">
            Warning: Changing the slug will break your current group URL and any
            bookmarks to it that members may have.
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={group.description || ''}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        ></textarea>
      </div>
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          defaultValue={group.address || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        />
      </div>
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Phone
        </label>
        <input
          type="text"
          id="phone"
          name="phone"
          defaultValue={group.phone || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        />
      </div>
      <div>
        <label
          htmlFor="logo"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Logo
        </label>
        <div className="mt-2 mb-4">
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            Logo Preview:
          </p>
          <Image
            src={previewUrl || logoUrl || '/images/default-avatar.png'}
            alt={`${group.name} logo`}
            width={300}
            height={300}
            className="rounded-md object-cover"
          />
        </div>
        <input
          type="file"
          id="logo"
          name="logo"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100 dark:text-gray-400 dark:file:bg-indigo-700 dark:file:text-indigo-200 dark:hover:file:bg-indigo-600"
        />
      </div>
      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800"
      >
        Update Group
      </button>
    </form>
  )
}
