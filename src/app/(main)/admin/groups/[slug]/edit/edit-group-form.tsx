'use client';

import { updateGroup } from './actions';
import type { Group } from '@/generated/prisma';
import Image from 'next/image';

export default function EditGroupForm({ group, logoUrl }: { group: Group; logoUrl?: string }) {
  return (
    <form action={updateGroup} className="space-y-6">
      <input type="hidden" name="groupId" value={group.id} />
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={group.name}
          required
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
      </div>
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Slug
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          defaultValue={group.slug}
          required
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Warning: Changing the slug can break existing group URLs.
        </p>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={group.description || ''}
          rows={3}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        ></textarea>
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          defaultValue={group.address || ''}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Phone
        </label>
        <input
          type="text"
          id="phone"
          name="phone"
          defaultValue={group.phone || ''}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
      </div>
      <div>
        <label htmlFor="logo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Logo
        </label>
        {logoUrl && (
          <div className="mt-2 mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Current Logo:</p>
            <Image
              src={logoUrl}
              alt={`${group.name} logo`}
              width={300}
              height={300}
              className="rounded-md object-cover"
            />
          </div>
        )}
        <input
          type="file"
          id="logo"
          name="logo"
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 dark:text-gray-400 dark:file:bg-indigo-700 dark:file:text-indigo-200 dark:hover:file:bg-indigo-600"
        />
      </div>
      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        Update Group
      </button>
    </form>
  );
}
