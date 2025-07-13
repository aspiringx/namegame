'use client';

import { useActionState, useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { User } from '@/generated/prisma';
import Image from 'next/image';
import { updateUserProfile, type State } from '../actions';

interface UserWithPhoto extends User {
  photoUrl?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 dark:focus:ring-offset-gray-800 dark:disabled:bg-indigo-800"
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

export default function UserProfileForm({ user, photoUrl }: { user: UserWithPhoto; photoUrl: string }) {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string>(photoUrl);
  const formSubmitted = useRef(false);

  const initialState: State = {
    message: null,
    error: null,
    success: false,
    newFirstName: null,
    newPhotoUrl: null,
  };

  const [state, formAction] = useActionState(updateUserProfile, initialState);

  useEffect(() => {
    if (state.success && !formSubmitted.current) {
      formSubmitted.current = true;
      // We pass `newFirstName` as `name` to session.update to mirror the admin flow.
      // The `auth.ts` jwt callback will handle updating both `name` and `firstName` in the token.
      updateSession({ name: state.newFirstName, image: state.newPhotoUrl }).then(() => {
        router.push('/user');
      });
    }
  }, [state, updateSession, router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(photoUrl);
    }
  };

  return (
    <form action={formAction} className="space-y-6">

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Username <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="username"
          name="username"
          required
          defaultValue={user.username}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          First Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          required
          defaultValue={user.firstName || ''}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          defaultValue={user.lastName || ''}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
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
            onChange={handleFileChange}
            className="ml-5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
          />
        </div>
      </div>

      {state.error && <p className="text-red-500">{state.error}</p>}
      {state.message && <p className="text-green-500">{state.message}</p>}

      <SubmitButton />
    </form>
  );
}
