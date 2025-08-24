# UI Patterns to Repeat

This document contains established UI patterns and best practices to ensure consistency and avoid re-solving the same problems.

## Mobile-Friendly Tooltips

**Problem:** Standard tooltips that appear on hover are not accessible on mobile/touch devices.

**Solution:** Use a controlled `Tooltip` component from `shadcn/ui` that is managed by a state variable and toggled with an `onClick` event. This ensures the tooltip works on both hover (desktop) and tap (mobile).

### Example Implementation

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SomeIcon } from 'lucide-react'

export function ComponentWithTooltip() {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  return (
    <TooltipProvider>
      <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsTooltipOpen(!isTooltipOpen)}
          >
            <SomeIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>This tooltip works on mobile!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

### Key Points

1.  **State Management:** Use a `useState` hook (e.g., `isTooltipOpen`) to control the tooltip's visibility.
2.  **Controlled Component:** Pass the `open` and `onOpenChange` props to the `<Tooltip>` component.
3.  **Click Handler:** Add an `onClick` event to the `TooltipTrigger`'s child element to toggle the state.

## Custom Modal Component

**Problem:** Creating one-off modal dialogs or directly using third-party libraries like `shadcn/ui`'s `Dialog` leads to an inconsistent user experience and duplicated implementation effort.

**Solution:** Use the reusable `Modal` component located at `src/components/ui/modal.tsx`. It provides a consistent appearance and behavior for all modals across the application.

### Example Implementation

This example shows how to wrap content within our custom `Modal` component.

```tsx
'use client'

import React from 'react'
import Modal from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { X, Brain } from 'lucide-react'

interface NameQuizIntroModalProps {
  isOpen: boolean
  onClose: () => void
}

const NameQuizIntroModal: React.FC<NameQuizIntroModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <Brain className="h-16 w-16 text-orange-500 mb-4" />
          <h3 className="text-2xl font-bold">Welcome to the Name Quiz!</h3>
        </div>
        <div className="py-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Test your memory and see how many names you can remember. You'll be
            shown a photo and several names. Just pick the right one!
          </p>
        </div>
        <Button onClick={onClose} className="mt-4 w-full">Let's Go!</Button>
        <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Modal>
  )
}
```

### Key Points

1.  **Import:** Always import the `Modal` from ` '@/components/ui/modal' `.
2.  **Props:** The component requires `isOpen` (a boolean) and `onClose` (a function) to control its state.
3.  **Content:** Place all modal content inside the `<Modal>` tags as `children`.

---

## Known Build Issues

### ESLint `useEslintrc` and `extensions` Error

**Status:** Ignored
**Re-assessment Date:** February 23, 2026

**Description:** The `npm run build` command currently throws an ESLint error: `Invalid Options: - Unknown options: useEslintrc, extensions`. This is a known issue related to the transition to ESLint's new flat config format.

**Decision:** We have decided to ignore this error for now to avoid getting sidetracked. It does not block the build from completing successfully. We will re-assess the need to fix this on or after February 23, 2026.

## Lottie Animations

**Problem:** When using Lottie animations, links from `lottie.host` can be unreliable and result in `Access Denied` XML errors, breaking the build.

**Solution:** Use direct asset links from a stable source. The `assets*.lottiefiles.com` CDN has proven to be reliable.

### Example of a good URL:

```
https://assets4.lottiefiles.com/datafiles/U1I3rWEyksM9cCH/data.json
```

### How to find the URL:

1. Find an animation on [lottiefiles.com](https://lottiefiles.com).
2. Look for an example implementation or a web player that uses the animation.
3. Inspect the source code (e.g., an `index.html` file on a GitHub example) to find the direct asset URL, often ending in `data.json`.