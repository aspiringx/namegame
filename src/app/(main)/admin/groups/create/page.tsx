'use client';

'use client';

import { useActionState, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { createGroup, type State } from './actions';
import Breadcrumbs from '@/components/Breadcrumbs';

const initialState: State = {
  message: null,
  errors: {},
  values: {
    name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
  },
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800"
    >
      {pending ? 'Creating...' : 'Create Group'}
    </button>
  );
}

export default function CreateGroupPage() {
  const [state, formAction] = useActionState(createGroup, initialState);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    let hiddenInput = formRef.current?.querySelector('input[name="logo"]') as HTMLInputElement | null;

    // Always ensure the hidden input exists
    if (!hiddenInput && formRef.current) {
      hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = 'logo';
      formRef.current.appendChild(hiddenInput);
    }

    if (!file) {
      setLogoBase64(null);
      if (hiddenInput) hiddenInput.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setLogoError('File is too large. Please select an image under 10MB.');
      setLogoBase64(null);
      if (hiddenInput) hiddenInput.value = '';
      event.target.value = '';
      return;
    }

    setLogoError(null);

    try {
      const options = {
        maxSizeMB: 0.95,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const base64String = await imageCompression.getDataUrlFromFile(compressedFile);
      const sizeInBytes = new Blob([base64String]).size;

      if (sizeInBytes > 1024 * 1024) {
        setLogoError('Image is still too large after compression. Please choose a smaller file.');
        setLogoBase64(null);
        if (hiddenInput) hiddenInput.value = '';
        return;
      }

      setLogoBase64(base64String);
      setLogoError(null);
      if (hiddenInput) {
        hiddenInput.value = base64String;
      }
    } catch (error) {
      console.error('Image compression error:', error);
      setLogoError('An error occurred while processing the image.');
      setLogoBase64(null);
      if (hiddenInput) hiddenInput.value = '';
    }
  };

  return (
        <div className="max-w-2xl mx-auto p-8 dark:bg-gray-900">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Create New Group</h1>
      {state.message && <p className="text-red-500 mb-4">{state.message}</p>}
      <form ref={formRef} action={formAction} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            defaultValue={state.values?.name}
          />
          {state.errors?.name && <p className="text-red-500 text-sm mt-1">{state.errors.name[0]}</p>}
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            defaultValue={state.values?.slug}
          />
          {state.errors?.slug && <p className="text-red-500 text-sm mt-1">{state.errors.slug[0]}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            defaultValue={state.values?.description}
          />
          {state.errors?.description && <p className="text-red-500 text-sm mt-1">{state.errors.description[0]}</p>}
        </div>

        <div>
          <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Logo
          </label>
          <div className="mt-1 flex items-center">
            <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
              <Image
                src={logoBase64 || '/images/default-avatar.png'}
                alt="Group logo preview"
                width={48}
                height={48}
                className="h-full w-full text-gray-300"
              />
            </span>
            <input
              type="file"
              id="logo-upload"
              name="logo-upload"
              accept="image/*"
              onChange={handleLogoChange}
              className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
            />
          </div>
          {logoError && <p className="text-red-500 text-sm mt-1">{logoError}</p>}
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            defaultValue={state.values?.address}
          />
          {state.errors?.address && <p className="text-red-500 text-sm mt-1">{state.errors.address[0]}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone
          </label>
          <input
            type="text"
            id="phone"
            name="phone"
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            defaultValue={state.values?.phone}
          />
          {state.errors?.phone && <p className="text-red-500 text-sm mt-1">{state.errors.phone[0]}</p>}
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
