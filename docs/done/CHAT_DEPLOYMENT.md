# Chat Service Deployment Guide

## Overview
The chat service is deployed as a separate DigitalOcean App at `chat.namegame.app` for clean separation and independent scaling.

## Architecture
- **Web App**: `www.namegame.app` (main app, port 8080)
- **Chat Service**: `chat.namegame.app` (separate app, port 8080)
- **Worker Service**: Runs alongside web app in same container

## DigitalOcean Setup

### Step 1: Create New App for Chat Service

1. Go to DigitalOcean Apps dashboard
2. Click "Create App"
3. **Source**: 
   - Repository: `aspiringx/namegame`
   - Branch: `main`
   - Source Directory: `/apps/chat`
4. **App Name**: `namegame-chat`
5. **Plan**: Basic ($5/month, 512MB RAM)
6. **Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=[your-production-database-url]
   NEXTAUTH_URL=https://www.namegame.app
   ```
7. **Build Command**: `npm install && npm run build`
8. **Run Command**: `npm start`
9. **HTTP Port**: `8080` (chat service listens on CHAT_PORT but DO expects 8080)

### Step 2: Configure Custom Domain

1. In the chat app settings, go to "Domains"
2. Add custom domain: `chat.namegame.app`
3. DigitalOcean will provide a CNAME target (e.g., `namegame-chat-xxxxx.ondigitalocean.app`)

### Step 3: Update GoDaddy DNS

1. Log into GoDaddy
2. Go to DNS Management for `namegame.app`
3. Add CNAME record:
   - **Type**: CNAME
   - **Name**: `chat`
   - **Value**: [the CNAME target from DigitalOcean]
   - **TTL**: 1 Hour

### Step 4: Update Web App Environment Variables

In your main web app (`namegame`), add:
```
NEXT_PUBLIC_CHAT_URL=https://chat.namegame.app
```

This allows you to override the chat URL if needed (though it defaults to `chat.namegame.app` in production).

## Deployment Workflow

### Automatic Deployments
When you push to `main` branch:
1. **Both apps** (web and chat) detect the push
2. **Both apps** start building simultaneously
3. Each app only rebuilds if its files changed
4. Deployments are independent

### Manual Deployments
- Web app: DigitalOcean dashboard → `namegame` → Deploy
- Chat app: DigitalOcean dashboard → `namegame-chat` → Deploy

## Testing

### Local Development
```bash
# Terminal 1: Start web app
pnpm dev:web

# Terminal 2: Start chat service
pnpm dev:chat

# Terminal 3: Start worker
pnpm dev:worker
```

Web app connects to `http://localhost:3001` for chat in development.

### Production Testing
1. Open browser console on `www.namegame.app`
2. Check for Socket.IO connection logs
3. Should see: `[Socket] Connected to chat service`
4. Try sending a message in chat
5. Check both app logs in DigitalOcean

## Troubleshooting

### Chat not connecting
- Check DNS propagation: `nslookup chat.namegame.app`
- Check chat app is running in DigitalOcean
- Check browser console for CORS errors
- Verify `NEXT_PUBLIC_CHAT_URL` is set correctly

### CORS errors
- Ensure `NEXTAUTH_URL` is set in chat app env vars
- Check chat service CORS configuration in `apps/chat/src/index.ts`

### Database connection issues
- Verify `DATABASE_URL` is set in chat app
- Check SSL mode is `sslmode=no-verify` for managed database
- Verify database permissions for chat tables

## Cost
- **Web App**: ~$12-25/month (existing)
- **Chat App**: $5/month (new)
- **Database**: ~$15-35/month (existing, shared)
- **Total Additional Cost**: $5/month

## Benefits of Separate App
1. ✅ Clean separation of concerns
2. ✅ Independent scaling
3. ✅ Simpler debugging (separate logs)
4. ✅ No complex custom server setup
5. ✅ WebSocket connections work natively
6. ✅ Can deploy chat updates without affecting web app
