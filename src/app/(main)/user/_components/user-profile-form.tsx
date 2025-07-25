'use client';

import { useActionState, useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useFormStatus } from 'react-dom';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { User } from '@/generated/prisma';
import Image from 'next/image';
import { updateUserProfile, type State } from '../actions';

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

interface UserWithPhoto extends User {
  photoUrl?: string;
}

function SubmitButton({ onNewSubmission }: { onNewSubmission: () => void }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={onNewSubmission}
      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 dark:focus:ring-offset-gray-800 dark:disabled:bg-indigo-800"
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

export default function UserProfileForm({ user, photoUrl }: { user: UserWithPhoto; photoUrl: string }) {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [previewUrl, setPreviewUrl] = useState<string>(photoUrl);
  const [password, setPassword] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const formSubmitted = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      window.scrollTo(0, 0);
      setShowSuccessMessage(true);

      if (state.newPhotoUrl) {
        setPreviewUrl(state.newPhotoUrl);
      }

      // We pass `newFirstName` as `name` to session.update to mirror the admin flow.
      // The `auth.ts` jwt callback will handle updating both `name` and `firstName` in the token.
      updateSession({ name: state.newFirstName, image: state.newPhotoUrl }).then(() => {
        if (state.redirectUrl) {
          router.push(state.redirectUrl);
        } else {
          router.refresh();
        }
      });
    }
  }, [state, updateSession, router]);

  useEffect(() => {
    if (showSuccessMessage) {
      setIsFadingOut(false);
      const fadeOutTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 2500); // Start fading out after 2.5 seconds

      const hideTimer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000); // Hide completely after 3 seconds

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [showSuccessMessage]);

  const handleNewSubmission = () => {
    formSubmitted.current = false;
    const params = new URLSearchParams(searchParams);
    if (params.has('welcome')) {
      params.delete('welcome');
      const queryString = params.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
    }
  };

  const handleGeneratePassword = () => {
    setPassword(generateRandomPassword(6));
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
      setPreviewUrl(photoUrl);
    }
  };

  const handleUpdatePicClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <form action={formAction} className="space-y-6">
      {showSuccessMessage && state?.message && (
        <p
          className={`text-green-500 transition-opacity duration-500 ease-in-out ${
            isFadingOut ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {state.message}
        </p>
      )}

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
        {user.username.startsWith('guest-') && (
          <p className="mt-1 rounded-md text-xs bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-300">
            This is a random guest username. You should update it.
          </p>
         )}
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
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          At least 3 character. 
        </p>
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
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Not required for guests. Recommended for full features.
        </p>
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
            className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Generate
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Enter or generate a new password (6+ chars with letters and numbers).
        </p>
      </div>

      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Profile Picture
        </label>
        <div className="mt-2 flex flex-col items-start space-y-4">
          <span className="inline-block h-64 w-64 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
            <Image src={previewUrl} alt="Profile photo preview" width={256} height={256} className="h-full w-full object-cover text-gray-300" />
          </span>
          <input
            type="file"
            id="photo"
            name="photo"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleUpdatePicClick}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
          >
            Update My Pic
          </button>
          <p className="text-xs -mt-3 text-gray-500 dark:text-gray-400">
            Not required for guests. Recommended for full features.
          </p>
        </div>
      </div>

      {!state?.success && state?.error && <p className="text-red-500">{state.error}</p>}

      <SubmitButton onNewSubmission={handleNewSubmission} />
    </form>
  );
}
