'use client';

import { useActionState, useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useFormStatus } from 'react-dom';
import type { User } from '@/generated/prisma';
import Image from 'next/image';
import Link from 'next/link';

import { updateUser, type State } from './actions';

function generateRandomPassword(length: number) {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '123456789';
  const allChars = letters + numbers;
  let result = '';

  // Generate a random string of the given length
  for (let i = 0; i < length; i++) {
    result += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Check if it has at least one number
  const hasNumber = numbers.split('').some(num => result.includes(num));

  // If not, replace a random character with a random number
  if (!hasNumber) {
    const randomIndex = Math.floor(Math.random() * length);
    const randomNumber = numbers.charAt(Math.floor(Math.random() * numbers.length));
    result = result.substring(0, randomIndex) + randomNumber + result.substring(randomIndex + 1);
  }

  return result;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:focus:ring-offset-gray-800 dark:disabled:bg-indigo-800"
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

export default function EditUserForm({ user, photoUrl, hasPhoto }: { user: User; photoUrl: string; hasPhoto: boolean }) {
  const [previewUrl, setPreviewUrl] = useState<string>(photoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const { data: session, update } = useSession();

  const updateUserWithId = updateUser.bind(null, user.id);
  const [state, formAction] = useActionState(updateUserWithId, initialState);

  const formSubmitted = useRef(false);

  useEffect(() => {
    if (state.success && !formSubmitted.current) {
      // Set the flag to prevent re-running on fast refresh/re-render.
      formSubmitted.current = true;

      // Only update the session if the edited user is the currently logged-in user.
      if (session?.user?.id === user.id) {
        update({ user: { image: state.photoUrl } }).then(() => {
          window.location.href = '/admin/users';
        });
      } else {
        // If an admin is editing another user, just redirect.
        // The reload will show the updated data on the user list page.
        window.location.href = '/admin/users';
      }
    }
  }, [state.success, state.photoUrl, update, session, user.id]);

  const [password, setPassword] = useState('');

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
    if (password) {
      navigator.clipboard.writeText(password);
      alert('Password copied to clipboard!');
    }
  };

  const formValues = state.values || user;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(photoUrl); // Revert to original if no file is selected
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      {state.message && state.errors && <p className="text-red-500 mb-4">{state.message}</p>}
      {state.message && !state.errors && <p className="text-green-500 mb-4">{state.message}</p>}
      

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
          defaultValue={formValues.username || ''}
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
          defaultValue={formValues.firstName || ''}
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
          defaultValue={formValues.lastName || ''}
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
          defaultValue={formValues.email || ''}
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
          defaultValue={formValues.phone || ''}
        />
        {state.errors?.phone && <p className="text-red-500 text-sm mt-1">{state.errors.phone[0]}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          New Password
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            id="password"
            name="password"
            className="flex-1 block w-full min-w-0 rounded-none rounded-l-md px-3 py-2 bg-white border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            placeholder="Leave blank to keep current password"
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
            <Image src={previewUrl} alt="Profile photo preview" width={48} height={48} className="h-full w-full text-gray-300" />
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
        {hasPhoto && (
          <div className="mt-2 flex items-center">
            <input type="checkbox" id="removePhoto" name="removePhoto" value="true" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-900 dark:border-gray-600 dark:checked:bg-indigo-500" />
            <label htmlFor="removePhoto" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Remove existing photo
            </label>
          </div>
        )}
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
