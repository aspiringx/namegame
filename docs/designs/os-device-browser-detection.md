# Operating System (OS), Device, and Browser Detection

This document outlines the strategy for detecting a user's environment to provide tailored instructions and enable or disable features accordingly.

## Implementation: The `useDeviceInfo` Hook

To centralize and standardize environment detection, we have implemented the `useDeviceInfo` hook, located at `src/hooks/useDeviceInfo.ts`.

This hook is the **single source of truth** for all client-side environment information. All components that need to adapt their behavior based on the user's OS, browser, or device capabilities **must** use this hook.

### How It Works

1.  **Client-Side Execution**: The hook runs exclusively on the client and is initialized within a context provider (`DeviceInfoProvider`) in the root layout. This ensures the data is available to all components without re-computing.
2.  **Browser/OS Detection**: It uses the `bowser` library to parse the `User-Agent` string and identify the browser (e.g., Chrome, Safari) and operating system (e.g., iOS, Android, macOS).
3.  **PWA Detection**: It checks if the app is running in standalone mode (i.e., as an installed PWA).
4.  **Feature Detection**: It performs runtime checks for key PWA and browser APIs:
    *   **Add to Home Screen (A2HS)**: It listens for the `beforeinstallprompt` event to determine if the browser's native installation prompt is available.
    *   **Push Notifications**: It checks for the existence of `navigator.serviceWorker` and `window.PushManager`.

### Data Provided

The hook returns a `DeviceInfo` object with a clean, easy-to-consume interface:

```typescript
interface DeviceInfo {
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser: 'chrome' | 'safari' | 'firefox' | 'edge' | 'unknown';
  isMobile: boolean;
  isDesktop: boolean;
  isPWA: boolean;
  pwaPrompt: {
    isReady: boolean; // Is the beforeinstallprompt event ready?
    prompt: () => void; // Function to trigger the browser's install prompt
  };
  push: {
    isSupported: boolean; // Are Push Notifications supported?
  };
  a2hs: { // Add to Home Screen
    isSupported: boolean; // Is there any way to install the app?
    actionLabel: string; // e.g., 'Install App', 'Add to Home Screen', 'Add to Dock'
    instructions: string; // Human-readable instructions
  };
}
```

### Usage

Components should consume the `useDeviceInfo` hook to make decisions. This replaces all previous, fragmented detection logic.

**Example: Displaying an install prompt**

```tsx
import { useDeviceInfo } from '@/hooks/useDeviceInfo';

function MyComponent() {
  const deviceInfo = useDeviceInfo();

  if (deviceInfo && !deviceInfo.isPWA && deviceInfo.a2hs.isSupported) {
    return (
      <button onClick={() => deviceInfo.pwaPrompt.prompt()}>
        {deviceInfo.a2hs.actionLabel}
      </button>
    );
  }

  return null;
}
```

### Refactored Components

The following components have been refactored to use the new hook, serving as examples of its intended use:

*   `src/components/AddToHomescreenPrompt.tsx`
*   `src/components/InstallAppPrompt.tsx`
*   `src/components/PushManager.tsx`
*   `src/components/UserMenu.tsx`
*   `src/hooks/usePushNotifications.ts`

