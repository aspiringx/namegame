# PWA and Push Notifications Design

This document outlines the implementation for Progressive Web App (PWA) features, including app installation and push notifications.

## 1. PWA Installation ("Add to Home Screen")

To make the application installable on users' devices, we've configured it as a Progressive Web App.

### Key Components:

*   **Web App Manifest (`/public/manifest.json`)**: This JSON file provides the browser with metadata about the app, such as its name, icons, start URL, and display mode. This is essential for the "Add to Home Screen" prompt.

*   **Service Worker (`/src/worker/index.ts`)**: A service worker is required for an app to be installable. It runs in the background, enabling offline capabilities and push notifications. We use `@ducanh2912/next-pwa` to generate and manage the service worker from this source file.

*   **Next.js PWA Plugin (`next.config.js`)**: The `next-pwa` plugin is configured in our Next.js config to automatically generate the production-ready service worker (`sw.js`) and integrate it into the application build process.

*   **UI Prompt (`/src/components/AddToHomescreenPrompt.tsx`)**: A custom component that detects when the app can be installed and provides a user-friendly button to trigger the installation prompt.

## 2. Push Notifications

We have implemented an end-to-end system for users to subscribe to and receive push notifications.

### Architecture:

1.  **Client-Side Subscription**: A user clicks a button on their profile page to enable notifications. The browser asks for permission.
2.  **Subscription Object**: If permission is granted, the browser's Push Service provides a unique subscription object containing an endpoint URL and security keys.
3.  **Store Subscription**: This object is sent to our server via a server action and stored securely in the `PushSubscription` table in our database, linked to the user's ID.
4.  **Sending Notifications**: To send a notification, a server action retrieves all active subscriptions for a user. It then uses the `web-push` library to send a payload to each subscription endpoint.
5.  **Receiving Notifications**: The browser's Push Service receives the message and wakes up our service worker, which then displays the notification to the user.

### Key Components:

*   **VAPID Keys**: Secure keys stored in environment variables (`.env`) that authenticate our application server with the push service, ensuring that only our server can send notifications to our users.

*   **Service Worker (`/src/worker/index.ts`)**: The service worker listens for `push` events in the background and displays the notification to the user using `self.registration.showNotification()`.

*   **Database (`/prisma/schema.prisma`)**: A `PushSubscription` model was added to store the endpoint, keys, and associated user for each subscription.

*   **Client-Side Logic (`/src/hooks/usePushNotifications.ts`)**: A custom hook that encapsulates all client-side functionality: checking permissions, requesting permissions, subscribing, unsubscribing, and interacting with the server.

*   **UI Component (`/src/components/PushManager.tsx`)**: A React component that uses the `usePushNotifications` hook to provide a button for users to enable or disable notifications.

*   **Server Actions (`/src/actions/push.ts`)**: A set of server actions to handle:
    *   `saveSubscription`: Validates and saves a new subscription to the database.
    *   `deleteSubscription`: Removes a subscription from the database.
    *   `sendNotification`: Sends a notification payload to all of a user's registered devices.

*   **Web-Push Library (`/src/lib/web-push.ts`)**: A configuration file that initializes the `web-push` library with our VAPID keys.
