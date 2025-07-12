'use client';

import { useActionState, useState, useRef, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { createUser, type State } from './actions';

const initialState: State = {
  message: null,
  errors: {},
  values: {
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  },
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:focus:ring-offset-gray-800 dark:disabled:bg-indigo-800"
    >
      {pending ? 'Creating...' : 'Create User'}
    </button>
  );
}

function generateRandomPassword(length: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function CreateUserForm() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction] = useActionState(createUser, initialState);

  const [password, setPassword] = useState(() => generateRandomPassword(6));

  useEffect(() => {
    // If the form fails validation and the server sends back a password value,
    // update the local password state to reflect it.
    if (state.values?.password) {
      setPassword(state.values.password);
    }
  }, [state.values?.password]);

  const handleGeneratePassword = () => {
    setPassword(generateRandomPassword(6));
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    alert('Password copied to clipboard!');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      {state.message && <p className="text-red-500 mb-4">{state.message}</p>}

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Username <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="username"
          name="username"
          required
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          defaultValue={state.values.username}
        />
        {state.errors?.username && <p className="text-red-500 text-sm mt-1">{state.errors.username[0]}</p>}
      </div>

      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          defaultValue={state.values.firstName}
        />
        {state.errors?.firstName && <p className="text-red-500 text-sm mt-1">{state.errors.firstName[0]}</p>}
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          defaultValue={state.values.lastName}
        />
        {state.errors?.lastName && <p className="text-red-500 text-sm mt-1">{state.errors.lastName[0]}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          defaultValue={state.values.email}
        />
        {state.errors?.email && <p className="text-red-500 text-sm mt-1">{state.errors.email[0]}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Phone
        </label>
        <input
          type="text"
          id="phone"
          name="phone"
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          defaultValue={state.values.phone}
        />
        {state.errors?.phone && <p className="text-red-500 text-sm mt-1">{state.errors.phone[0]}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            id="password"
            name="password"
            required
            className="flex-1 block w-full min-w-0 rounded-none rounded-l-md px-3 py-2 bg-white border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="inline-flex items-center px-3 rounded-none border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Generate
          </button>
          <button
            type="button"
            onClick={handleCopyPassword}
            className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Copy
          </button>
        </div>
        {state.errors?.password && <p className="text-red-500 text-sm mt-1">{state.errors.password[0]}</p>}
      </div>

      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Profile Picture
        </label>
        <div className="mt-1 flex items-center">
          <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
            <Image
              src={previewUrl || '/images/default-avatar.png'}
              alt="Profile photo preview"
              width={48}
              height={48}
              className="h-full w-full text-gray-300"
            />
          </span>
          <input
            type="file"
            id="photo"
            name="photo"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
          />
        </div>
        {state.errors?.photo && <p className="text-red-500 text-sm mt-1">{state.errors.photo[0]}</p>}
      </div>

      <div className="flex items-center justify-end space-x-4">
        <Link href="/admin/users" className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
          Cancel
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
