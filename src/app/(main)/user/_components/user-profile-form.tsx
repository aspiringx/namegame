'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateUserProfile, State, getUserUpdateRequirements } from '../actions';
import Image from 'next/image';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type UserProfile = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  emailVerified: string | null; // Pass date as ISO string
  photos: { url: string }[];
};

function SubmitButton({ onNewSubmission, disabled }: { onNewSubmission: () => void; disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      onClick={onNewSubmission}
      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 dark:focus:ring-offset-gray-800 dark:disabled:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

export default function UserProfileForm({ user }: { user: UserProfile }) {
  const [displayEmail, setDisplayEmail] = useState(user.email || '');
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.photos[0]?.url ?? null);
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const formSubmitted = useRef(false);
  const [validation, setValidation] = useState({ submitted: false, passwordRequired: false, photoRequired: false });
  const [fileSelected, setFileSelected] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
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
    // Determine if the form is dirty
    const isFirstNameDirty = firstName !== user.firstName;
    const isLastNameDirty = lastName !== user.lastName;
    const isPasswordDirty = !!password;
    const isPhotoDirty = fileSelected;

    setIsDirty(isFirstNameDirty || isLastNameDirty || isPasswordDirty || isPhotoDirty);
  }, [firstName, lastName, password, fileSelected, user.firstName, user.lastName]);

  useEffect(() => {
    async function fetchRequirements() {
      const { passwordRequired, photoRequired } = await getUserUpdateRequirements();
      setValidation(v => ({ ...v, passwordRequired, photoRequired }));
    }
    fetchRequirements();
  }, [user.id]);

  useEffect(() => {
    if (state.success && !formSubmitted.current) {
      formSubmitted.current = true;
      window.scrollTo(0, 0);
      setShowSuccessMessage(true);

      if (state.newPhotoUrl) {
        setPreviewUrl(state.newPhotoUrl);
      }

      // Clear the password field on successful submission
      if (password) {
        setPassword('');
      }

      if (fileSelected) {
        setFileSelected(false);
      }

      // We pass `newFirstName` as `name` to session.update to mirror the admin flow.
      // The `auth.ts` jwt callback will handle updating both `name` and `firstName` in the token.
      updateSession({ name: state.newFirstName, image: state.newPhotoUrl }).then(async () => {
        // After updating, re-fetch the requirements to see if they've changed
        const { passwordRequired, photoRequired } = await getUserUpdateRequirements();
        setValidation(v => ({ ...v, passwordRequired, photoRequired }));

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
    setValidation(v => ({ ...v, submitted: true }));
    formSubmitted.current = false;
    const params = new URLSearchParams(searchParams);
    if (params.has('welcome')) {
      params.delete('welcome');
      const queryString = params.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
    }
  };

  const handleGeneratePassword = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '123456789';
    const allChars = letters + numbers;
    let result = '';

    // Generate a random string of the given length
    for (let i = 0; i < 6; i++) {
      result += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Check if it has at least one number
    const hasNumber = numbers.split('').some(num => result.includes(num));

    // If not, replace a random character with a random number
    if (!hasNumber) {
      const randomIndex = Math.floor(Math.random() * 6);
      const randomNumber = numbers.charAt(Math.floor(Math.random() * numbers.length));
      result = result.substring(0, randomIndex) + randomNumber + result.substring(randomIndex + 1);
    }

    setPassword(result);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setFileSelected(true);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(user.photos[0]?.url ?? null);
    }
  };

  const handleChoosePhoto = () => {
    fileInputRef.current?.click();
  };

  // The email is considered verified for display purposes only if the original email
  // was verified AND the email in the input hasn't been changed.
    const isVerifiedForDisplay = !!user.emailVerified && displayEmail === user.email;

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

      <div className="flex">
        <div className="flex-grow">
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            First <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            placeholder="First name"
            required
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-l-md rounded-r-none shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
              !firstName ? 'bg-red-100 dark:bg-red-900' : ''
            }`}
          />
        </div>

        <div className="flex-grow">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Last <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            placeholder="Last name"
            required
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className={`mt-1 -ml-px block w-full px-3 py-2 bg-white border border-gray-300 rounded-r-md rounded-l-none shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
              !lastName ? 'bg-red-100 dark:bg-red-900' : ''
            }`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <input
            type="email"
            id="email"
            name="email"
            value={displayEmail}
            placeholder="Email"
            required
            onChange={(e) => setDisplayEmail(e.target.value)}
            className={`block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white  dark:placeholder-gray-400 ${
              !displayEmail ? 'bg-red-100 dark:bg-red-900' : ''
            }`}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <TooltipProvider disableHoverableContent={true}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="pointer-events-auto focus:outline-none">
                    {isVerifiedForDisplay ? (
                      <ShieldCheck className="h-5 w-5 text-green-500" aria-hidden="true" />
                    ) : (
                      <ShieldAlert className="h-5 w-5 text-red-500" aria-hidden="true" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isVerifiedForDisplay ? (
                    <p>Email verified on {new Date(user.emailVerified!).toLocaleDateString()}</p>
                  ) : (
                    <p>Email not verified</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {displayEmail && !isVerifiedForDisplay && (
          <p className="mt-1 rounded-md text-xs bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-300">
            Your email is not verified. After saving, check email for a verification link.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          New Password{validation.passwordRequired && <span className="text-red-500"> *</span>}
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="password"
            id="password"
            name="password"
            required={validation.passwordRequired}
            className={`flex-1 block w-full min-w-0 rounded-none rounded-l-md px-3 py-2 bg-white border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
              validation.passwordRequired && !password ? 'bg-red-100 dark:bg-red-900' : ''
            }`}
            placeholder={validation.passwordRequired ? 'New password required' : 'Leave blank to keep current password'}
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const newPassword = e.target.value;
              setPassword(newPassword);

              if (newPassword && newPassword === 'password123') {
                setPasswordError('For security, please choose a different password.');
              } else if (newPassword && validation.passwordRequired && newPassword.length < 6) {
                // This is a basic check, server has the final say
                setPasswordError('Password must be at least 6 characters.');
              } else {
                setPasswordError(null);
              }
            }}
          />
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Generate
          </button>
        </div>
        {passwordError ? (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{passwordError}</p>
        ) : (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {validation.passwordRequired
              ? 'Enter or generate a new password (6+ chars with letters and numbers).'
              : ''}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Profile Picture{validation.photoRequired && <span className="text-red-500"> *</span>}
        </label>
        <div className="mt-2 flex flex-col items-start space-y-4">
          <span
            className={`inline-block h-64 w-64 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 ${
              validation.photoRequired && !previewUrl ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-gray-800' : ''
            }`}
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Profile photo preview"
                width={256}
                height={256}
                className="h-full w-full object-cover text-gray-300"
              />
            ) : (
              <svg className="h-full w-full text-gray-300 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </span>
          <input
            type="file"
            id="photo"
            name="photo"
            accept="image/*"
            required={validation.photoRequired}
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleChoosePhoto}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
          >
            Update My Pic
          </button>
          <p
            className={`text-xs -mt-3 text-gray-500 dark:text-gray-400 ${validation.photoRequired ? 'text-red-500 dark:text-red-400' : ''
              }`}
          >
            {validation.photoRequired && previewUrl && !previewUrl.includes('dicebear.com')
              ? 'A new profile picture is required because you are using a default avatar.'
              : ''}
          </p>
        </div>
      </div>

      {!state?.success && state?.error && <p className="text-red-500">{state.error}</p>}

      <SubmitButton
        onNewSubmission={handleNewSubmission}
        disabled={
          !isDirty ||
          !!passwordError ||
          (validation.passwordRequired && !password) ||
          (validation.photoRequired && !fileSelected)
        }
      />
    </form>
  );
}
