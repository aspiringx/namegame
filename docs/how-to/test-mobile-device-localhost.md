# How to Test on a Mobile Device

There are two primary methods for testing the application on a mobile device connected to your local development server.

## Method 1: Using ngrok (Recommended for PWA features)

This method is **required** for testing Progressive Web App (PWA) features like the "Add to Home Screen" prompt, as they require a secure (HTTPS) connection. `ngrok` creates a secure tunnel to your localhost.

1.  **Install ngrok**:
    If you use Homebrew, you can install it with:
    ```bash
    brew install ngrok
    ```
    Otherwise, follow the installation instructions on the [ngrok website](https://ngrok.com/download).

2.  **Authenticate ngrok**:
    - Sign up for a free account at [ngrok.com](https://dashboard.ngrok.com/signup).
    - Find your authtoken on your [dashboard](https://dashboard.ngrok.com/get-started/your-authtoken).
    - Add the authtoken to your ngrok configuration:
      ```bash
      ngrok config add-authtoken <YOUR_AUTHTOKEN>
      ```

3.  **Start the development server**:
    In your project directory, run the app as usual:
    ```bash
    npm run dev
    ```

4.  **Start ngrok**:
    Open a new terminal window and start ngrok to tunnel your local port 3000:
    ```bash
    ngrok http 3000
    ```

5.  **Access on your mobile device**:
    `ngrok` will provide you with a public HTTPS URL (e.g., `https://random-string.ngrok-free.app`). Open this URL in the browser on your mobile device to test the application.

---

## Method 2: Using Local IP Address (For non-HTTPS testing)

This method works if your mobile device is on the same Wi-Fi network as your computer. It does not use HTTPS.

1.  **Get your local IP address**:
    - Click the Apple menu  at the top-left of your screen.
    - Go to System Settings > Network.
    - Select your active Wi-Fi connection.
    - Your IP address will be listed there (e.g., `192.168.50.177`).

2.  **Run the development server**:
    Start the server and bind it to all available network interfaces:
    ```bash
    npm run dev -- -H 0.0.0.0
    ```

3.  **Access on your mobile device**:
    Open your mobile device's browser and navigate to `http://<your-ip-address>:3000`.

---

## Testing Push Notifications

**Important Note**: To test push notifications in a development environment (either locally or on a mobile device), you must first enable PWA features. Open `next.config.js` and comment out the `disable` line inside the `withPWA` configuration block. Remember to uncomment it when you are done to reduce console noise.


Push notifications require a secure context. Here’s how to test them in different scenarios.

### Testing on Your Local Machine

For testing on the same computer you're developing on, you can use `localhost` directly. Modern browsers treat `localhost` as a secure context, so the Push API will work without any special setup.

1.  **Build and run the production server**: Run `npm run build` and then `npm start`.
2.  **Open your browser**: Navigate to `http://localhost:3000`.
3.  Go to your profile page (`/me`) to subscribe, then to the test page (`/me/push-test`) to send a test notification.

### Testing on a Mobile Device

To test on a different device (like a mobile phone), you must use a secure (HTTPS) public URL. The `ngrok` method described above is perfect for this.

1.  Follow the `ngrok` setup steps in Method 1 to start your server and create a secure tunnel.
2.  Open the `https://...ngrok-free.app` URL on your mobile device.
3.  Navigate to the profile and test pages to subscribe and send notifications.

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
