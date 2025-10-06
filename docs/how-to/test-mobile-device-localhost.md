# How to Test on a Mobile Device

This guide covers testing the application on mobile devices (iOS and Android) with full PWA features enabled.

---

## Quick Start: Production Mode on iPhone

This is the **recommended method** for testing PWA features like pull-to-refresh, refresh button, and optimistic saving.

### 1. Build and Start Production Mode

Be sure the right env vars are set locally, like NEXT_PUBLIC_CHAT_URL which
may change over time.

```bash
# From the root of your monorepo
cd /path/to/namegame

# Build all apps (web, chat, worker)
pnpm build:all

# Start all services (web, chat, worker)
# This runs in the foreground with colored logs
pnpm start:local
```

**Note:** `start:local` uses `concurrently` to run all three services with colored output. Press `Ctrl+C` to stop all services. Production uses PM2 with `ecosystem.config.js` which only starts web + worker (chat runs as a separate DigitalOcean app).

**To restart without rebuilding:**

```bash
# Stop with Ctrl+C, then:
pnpm start:local
```

### 2. Find Your Local IP Address

```bash
# Quick command to find your IP
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for an address like `192.168.1.100` or `192.168.50.177`.

**Alternative (GUI method):**

- Click the Apple menu at the top-left of your screen
- Go to System Settings > Network
- Select your active Wi-Fi connection
- Your IP address will be listed there

### 3. Access from iPhone

1. **Open Safari** on your iPhone (must be on same WiFi network)
2. Navigate to `http://YOUR_IP:3000` (e.g., `http://192.168.1.100:3000`)
3. Test the app in Safari first

### 4. Install as PWA

1. Tap the **Share** button (square with arrow pointing up)
2. Scroll down and tap **"Add to Home Screen"**
3. Tap **"Add"**
4. Open the app from your home screen (not Safari)

### 5. Test PWA Features

Once installed as PWA, you should see:

- ✅ **Refresh button** in the header (only visible in PWA mode)
- ✅ **Pull-to-refresh** gesture (swipe down from top)
- ✅ **Optimistic saving** with loading states
- ✅ **15-second transaction timeout** (handles slow connections)

---

## Development Mode Testing

For rapid iteration without rebuilding:

```bash
# Start dev server accessible on network
pnpm dev -- -H 0.0.0.0
```

Then access via `http://YOUR_IP:3000` on your mobile device.

**Note:** Some PWA features may not work in development mode. Use production mode for full PWA testing.

---

## Method 2: Using ngrok (For HTTPS/Public Testing)

Use this method when you need:

- HTTPS for testing secure features
- Testing from a device not on your local network
- Sharing a preview with others

### 1. Install ngrok

```bash
brew install ngrok
```

Or download from [ngrok.com](https://ngrok.com/download).

### 2. Authenticate ngrok

1. Sign up at [ngrok.com](https://dashboard.ngrok.com/signup)
2. Get your authtoken from the [dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Add the authtoken:
   ```bash
   ngrok config add-authtoken <YOUR_AUTHTOKEN>
   ```

### 3. Start Your Server and ngrok

```bash
# Terminal 1: Start production server
pnpm build
pnpm start

# Terminal 2: Start ngrok tunnel
ngrok http 3000
```

### 4. Access on Mobile

ngrok will provide an HTTPS URL like `https://random-string.ngrok-free.app`. Open this URL on any device to test.

---

## Testing Push Notifications

Push notifications require a secure context (HTTPS or localhost).

### On Your Local Machine

```bash
# Build and start production
pnpm build
pnpm start

# Open browser
open http://localhost:3000
```

Modern browsers treat `localhost` as secure, so Push API will work.

1. Go to `/me` to subscribe to notifications
2. Go to `/me/push-test` to send a test notification

### On Mobile Device

Use the **ngrok method** above to get an HTTPS URL, then:

1. Open the `https://...ngrok-free.app` URL on your mobile device
2. Navigate to `/me` to subscribe
3. Navigate to `/me/push-test` to send a test notification

---

## Method 3: Local SSL with Android Emulator (ngrok Alternative)

This method allows you to test secure (HTTPS) features like PWA installation and Push Notifications on a simulated Android device without using `ngrok`. It uses `mkcert` and `local-ssl-proxy` to create a trusted local environment.

For a full setup guide, see [Local Network SSL Testing](./local-network-ssl-like-ngrok.md). The key steps for Android are summarized below.

### 1. Install and Set Up Android Studio

If you don't have it, download and install [Android Studio](https://developer.android.com/studio).

- **Create a Virtual Device (AVD):**
  - In Android Studio, go to **Tools > Device Manager** and create a new device.
  - **Important**: When selecting a system image, choose one where the "Target" column includes **"(Google APIs)"** instead of "(Google Play)". This avoids the mandatory Google login.

### 2. Generate a Certificate for the Emulator

Your SSL certificate must be valid for the special IP address the Android emulator uses to access your host machine (`10.0.2.2`).

- In your project's root directory on your Mac, run this command to create/overwrite your certificate:
  ```bash
  mkcert -key-file local.namegame.app-key.pem -cert-file local.namegame.app.pem local.namegame.app 10.0.2.2
  ```

### 3. Install the Root CA on the Emulator

The emulator needs to trust your local Certificate Authority (CA).

1.  **Find your CA file:** Run `mkcert -CAROOT` on your Mac to find the `rootCA.pem` file.
2.  **Start your emulator.**
3.  **Install the CA:** Drag the `rootCA.pem` file from your Mac's Finder directly onto the running emulator screen. Android should prompt you to install it. If it doesn't, you can install it manually:
    - In the emulator, go to **Settings**.
    - Search for and select **"CA certificate"**.
    - Tap **"Install anyway"** and browse to the **Downloads** folder to select the `rootCA.pem` file.

### 4. Run and Test

1.  **Start your app's production server**:
    ```bash
    npm run build
    npm start
    ```
2.  **Start the SSL proxy** in a new terminal:

    ```bash
    npm run start:ssl
    ```

    Ensure your `package.json` script for `start:ssl` is `npx local-ssl-proxy --key local.namegame.app-key.pem --cert local.namegame.app.pem --source 3001 --target 3000`.

3.  **Access the site in the emulator's browser**:
    Navigate to **`https://10.0.2.2:3001`**. The site should load securely, and all PWA features will be functional.
