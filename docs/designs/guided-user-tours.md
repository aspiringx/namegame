# How to Add a Guided Tour

This document outlines the steps to add a new guided tour to any page or component in the application using the centralized `useTourManagement` hook.

## 1. Define the Tour Steps

First, create a new file to define the steps for your tour. This is typically done in the `src/components/tours/` directory. Each step is an object with a `selector` (a CSS selector for the element to highlight) and `content` (the text to display).

**Example:** `src/components/tours/MyNewTour.ts`

```typescript
import { StepType } from '@reactour/tour'

export const steps: StepType[] = [
  {
    selector: '[data-tour="step-1"]',
    content: 'This is the first step of the tour.',
  },
  {
    selector: '[data-tour="step-2"]',
    content: 'This is the second step.',
  },
]
```

## 2. Add Selectors to Your Component

In the component you want to add the tour to, add the `data-tour` attributes to the elements you defined in your steps file.

**Example:** `MyComponent.tsx`

```tsx
function MyComponent() {
  return (
    <div>
      <button data-tour="step-1">Feature One</button>
      <p data-tour="step-2">Some important information.</p>
    </div>
  )
}
```

## 3. Wrap Your Component with `TourProvider`

The component that will have the tour needs to be wrapped by the `TourProvider`. You must pass the `steps` you defined to the provider.

**Example:** `MyPage.tsx`

```tsx
import { TourProvider } from '@reactour/tour'
import { steps } from '@/components/tours/MyNewTour'
import MyComponentWithTour from './MyComponentWithTour'

export default function MyPage() {
  return (
    <TourProvider steps={steps}>
      <MyComponentWithTour />
    </TourProvider>
  )
}
```

## 4. Use the `useTourManagement` Hook

Inside your component (`MyComponentWithTour` in this example), use the `useTourManagement` hook to control the tour. Pass a unique string ID for your tour. This hook will automatically handle showing the tour to first-time users and provides a `startTour` function to trigger it manually.

**Example:** `MyComponentWithTour.tsx`

```tsx
import { useTourManagement } from '@/hooks/useTourManagement'

function MyComponentWithTour() {
  // Use a unique ID for this tour
  const { startTour } = useTourManagement('myNewTour')

  return (
    <div>
      <button onClick={startTour}>Start Tour Manually</button>
      {/* The rest of your component with data-tour attributes */}
      <div data-tour="step-1">...</div>
      <p data-tour="step-2">...</p>
    </div>
  )
}
```

By following these steps, you can easily add a guided tour to any part of the application while keeping the logic centralized and reusable.
