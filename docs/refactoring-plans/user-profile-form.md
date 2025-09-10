# Refactoring Plan: `user-profile-form.tsx`

**Current State:** This component is over 1100 lines. It currently handles everything from form state management and complex validation to UI rendering for numerous fields, password generation, image uploads, and multiple modals.

**Proposed Refactoring:**

1.  **Extract UI Sections:** Break the monolithic form into smaller, self-contained components with clear responsibilities:
    *   `ProfilePhotoManager`: To encapsulate the photo upload, preview, and selection logic.
    *   `ProfileNameFields`: A simple component for first and last name inputs.
    *   `ProfileAuthFields`: To manage email and password fields, including the logic for password generation and validation.
    *   `ProfileOptionalInfo`: For the collapsible section containing birth date, birth place, and gender.

2.  **Extract Logic into a Custom Hook:**
    *   `useUserProfileForm`: Create a custom hook to manage the form's state (e.g., `firstName`, `lastName`, `password`), track the dirty state, and handle all validation logic. This will remove hundreds of lines from the main component and make the state management logic reusable and testable in isolation.

3.  **Generalize and Simplify Components:**
    *   `SubmitButton` and `StickySaveBar` can be reviewed and potentially generalized to be shared UI components across the application.
    *   The `ConfirmModal` can also be made more generic if similar confirmation flows exist elsewhere, reducing code duplication.
