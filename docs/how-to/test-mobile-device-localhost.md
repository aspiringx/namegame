# How to test mobile device localhost

1. Get your local IP address:
   - Click the Apple menu  at the top-left of your screen.
   - Go to System Settings > Network.
   - Select your active Wi-Fi connection (three-dots, Network Settings)
   - Your IP address will be listed there (e.g., 192.168.50.177)
2. Run `npm run dev -- -H 0.0.0.0`
3. Open your mobile device and navigate to `http://<your-ip-address>:3000`
