# Authentication and Profile Management

This document summarizes the key features and implementation details of the application's authentication and user profile management system.

### 1. Email-Based Authentication & Profile Management

- **Login:** Users can now log in using either their **email address or their username**. The system intelligently detects which identifier is being used during the authorization process in `src/auth.ts`.
- **Profile Updates:** The user profile page (`/me`) has been updated. The `username` field has been removed from the form, and a new **`email` field** has been added. This encourages users, especially those with temporary guest accounts, to add and verify an email to make their account permanent. The corresponding server action `updateUserProfile` in `src/app/(main)/me/actions.ts` was updated to handle the new `email` field.
- **Database Schema:** The `User` model in `prisma/schema.prisma` was updated to include an optional, unique `email` field and a timestamp `emailVerified` to support the new authentication flow.

### 2. Password Reset Functionality

A complete, self-service **password reset flow** has been implemented to improve user experience and security.

- **New Page & Component:** A new page at `/reset` and a corresponding `ResetForm` component have been created for users to initiate the password reset process.
- **Token Generation:** New logic in `src/lib/tokens.ts` securely generates and manages password reset tokens. These tokens are stored in the new `PasswordResetToken` table in the database, defined in `prisma/schema.prisma`.
- **Email Delivery:** A new mail service (`src/lib/mail.ts`) has been set up using `resend` to send the password reset link to the user's email address.

### 3. Email Verification Framework

The foundation for **email verification** has also been built, though it is not yet fully exposed in the UI. The backend is ready with:

- **Token Generation:** A `generateVerificationToken` function in `src/lib/tokens.ts`.
- **Database Model:** An `EmailVerificationToken` model in the Prisma schema.
- **Email Sending:** A `sendVerificationEmail` function in `src/lib/mail.ts`.

### 4. UI/UX Improvements

- On the user profile form (`user-profile-form.tsx`), the **First Name and Last Name** input fields have been refactored using Tailwind CSS to appear on a single line as a visually joined component. This was achieved by manipulating border-radius (`rounded-l-md`, `rounded-r-none`, etc.) and using a negative margin (`-ml-px`) to collapse the border between the inputs, creating a cleaner and more modern look.
