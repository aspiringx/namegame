# Operating System (OS), Device, Browser Detection

We need to detect a user's combination of OS and browser to understand available
features and give correct instructions.

## Operating Systems

Common operating systems. Features or APIs may differ by version.

- iOS
- Android
- ChromeOS
- Windows
- MacOS
- Linux

## Browsers

Top browsers. Features or APIs may differ by version and OS where they're
installed (e.g. Chrome on Android, iOS, Windows, MacOS, etc.).

- Safari
- Chrome
- Firefox
- Edge

## Device Types / Form Factors

Once we know the OS and browser, we can determine secondary information:

- Device Type - Mobile, Tablet, Chromebook, Desktop
- Form Factor - Orientation (Portrait, Landscape), Resolution

## Feature Detection

For each combination of OS and browser, we need to know features and give
correct instructions for Progressive Web App (PWA) features.

We use Next.js with the `next-pwa` package to implement PWA features.

### Add to Home Screen

#### Install Prompt

Do we invite the user to Add to Home Screen, Add to Dock, Install App, or save a
Bookmark?

#### Install Prompt Trigger

All users should see the prompt. The fallback is to tell them how to save a
bookmark, but ideally we show a button to install the app.

#### Enable/Disable Push Notifications

When the user clicks this, their browser will prompt them to grant permission
for push notifications. We store these as a PushSubscription in the database.

One user can have a push subscription per device and browser. For example, if
they use both Chrome and Firefox on their Macbook Pro, they will have two push
subscriptions, one for each browser. Then if they use their Android tablet and
iPhone, they will have two more push subscriptions, one for each device. If they
use both Safari and Chrome on their iPhone, they will have two more push
subscriptions, one for each browser on the device.
