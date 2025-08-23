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