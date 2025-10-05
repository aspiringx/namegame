# PM2 + Digital Ocean Deployment Hell

**Date:** October 4, 2025  
**Context:** Deploying monorepo with multiple services (web, chat, worker) to Digital Ocean App Platform

## The Problem

Digital Ocean App Platform expects **one main process per app**, but our monorepo runs **3 processes via PM2**. This creates a fundamental mismatch.

## What Went Wrong

### Initial Setup

- **Build Command:** `pnpm build` (only built web app)
- **Run Command:** `pnpm start` (tries to start PM2 with 3 apps)
- **Result:** Chat server couldn't start (not built), PM2 processes showed as "disabled"

### After Fixing Build

- **Build Command:** `pnpm build:all` (builds all 3 apps)
- **Run Command:** `pnpm start` (PM2 daemon mode)
- **Result:** PM2 started successfully, but then deployment failed

### The Core Issue #1: PM2 Daemon Mode

```
1. ✅ PM2 starts successfully with all 3 apps
2. ❌ Digital Ocean detects the container "exited" (PM2 daemonizes)
3. 🔄 Digital Ocean restarts the container
4. 🔄 This repeats 3-4 times then fails with "container exited early with zero exit code"
```

**Why this happens:** PM2 in daemon mode forks processes then exits the main process. Digital Ocean thinks the container crashed and restarts it.

### The Core Issue #2: Monorepo Build Problems (Oct 5, 2025)

After fixing PM2 daemon mode, new errors emerged:

```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts" for /workspace/packages/db/src/index.ts
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/workspace/packages/queue/src/types'
```

**Root Cause:**

- Packages (db, queue) had no build scripts - exported raw `.ts` files
- Missing TypeScript declaration files (`.d.ts`)
- Import paths missing `.js` extensions for compiled output
- Build order: apps tried to build before packages were compiled

### The Core Issue #3: Prisma Generated Files Missing (Oct 5, 2025)

After fixing the TypeScript build issues, a new runtime error appeared:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/workspace/packages/db/dist/generated/prisma'
```

**Root Cause:**

- The `dist/` folder was missing the entire `generated/` directory
- Apps trying to import `@namegame/db` couldn't find the Prisma client

### The Core Issue #4: ERR_UNSUPPORTED_DIR_IMPORT & Prisma Bundling (Oct 5, 2025)
After fixing the missing files, a new error appeared:
```
Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '/workspace/packages/db/dist/generated/prisma' is not supported resolving ES modules
```

Then during Next.js build, webpack bundling errors:
```
Module build failed: UnhandledSchemeError: Reading from "node:crypto" is not handled by plugins
Module build failed: UnhandledSchemeError: Reading from "node:events" is not handled by plugins
```

**Root Cause:**
- Next.js webpack was trying to bundle server-side Prisma client for the browser
- Prisma client includes Node.js dependencies (`fs`, `crypto`, `events`, etc.)
- Client-side React components were importing from main `@namegame/db` package
- This pulled in the entire PrismaClient runtime, causing bundling failures

**The Solution: Separate Type-Only Exports**
- Created `@namegame/db/types` - exports only types and enum constants, no runtime code
- Client components import from `/types`, server code imports from main package
- Types are automatically derived from `schema.prisma` via Prisma generation
- No manual type maintenance required - schema remains single source of truth

- ✅ Deploys successfully
- ✅ Web app with chat API routes works
- ❌ No real-time chat (no Socket.IO server)
- ❌ No background worker

### Option 2: PM2 Foreground Mode + Fixed Monorepo Build (CURRENT SOLUTION)

**Build Command:** `pnpm install && pnpm db:generate && pnpm build:all`
**Run Command:** `pm2-runtime start ecosystem.config.js`

**What we fixed:**

- ✅ Added build scripts to packages/db and packages/queue
- ✅ Added TypeScript configs with `declaration: true`
- ✅ Fixed import extensions (`.ts` → `.js` for compiled output)
- ✅ Updated ecosystem.config.js to use shell commands instead of `--filter`
- ✅ Fixed Prisma generated files copying to dist folder
- ✅ Resolved ERR_UNSUPPORTED_DIR_IMPORT by fixing Prisma client bundling
- ✅ Created separate type-only exports to prevent client-side bundling issues

**Local PM2 Testing (Oct 5, 2025):**
```bash
# 1. Full build test
pnpm build:all
# ✅ All packages and apps build successfully
# ✅ Next.js build completes without bundling errors
# ✅ No more node:crypto or ERR_UNSUPPORTED_DIR_IMPORT errors

# 2. PM2 runtime test
npm install -g pm2
pm2-runtime start ecosystem.config.js
```

**PM2 Local Test Results:**
```
2025-10-05T11:46:57: PM2 log: App [namegame-web:0] online
2025-10-05T11:46:57: PM2 log: App [namegame-worker:1] online  
2025-10-05T11:46:57: PM2 log: App [namegame-chat:2] online
[Worker] ✅ Graphile Worker database schema ready
[Chat] Connected to PostgreSQL
[Chat] Server running on 0.0.0.0:3001
▲ Next.js 15.5.4 - Local: http://localhost:3000
✓ Ready in 2.1s
```

**Expected DigitalOcean Result:**
- ✅ Deploys successfully (foreground process)
- ✅ All 3 services run in one container
- ✅ Full chat functionality works
- ✅ All TypeScript modules resolve correctly
- ✅ PM2 starts all services without errors (proven locally)
- ✅ Database connections work (proven locally)
- ⚠️ Limited scalability (can't scale services independently)
- ✅ Perfect for community-focused use case

### Option 3: Separate Apps (Future)

- **namegame-web** (Next.js on port 3000)
- **namegame-chat** (Socket.IO server on port 3001)
- **namegame-worker** (Background jobs)

**Pros:**

- ✅ Independent scaling
- ✅ Better resource allocation
- ✅ True microservices

**Cons:**

- ❌ More complex deployment
- ❌ Higher costs (3 apps vs 1)
- ❌ Network configuration between services

## Key Lessons

### 1. Digital Ocean App Platform Expectations

- Expects **one long-running foreground process**
- Daemon processes cause "container exited" failures
- Use `pm2-runtime` not `pm2` for containerized deployments

### 2. Monorepo Build Strategy

- `pnpm build` only builds web app
- `pnpm build:all` builds all workspace apps
- Must build all apps that ecosystem.config.js tries to start

### 3. Process Management in Containers

- **PM2 daemon mode** = container appears to exit
- **PM2 runtime mode** = container stays alive
- **Single process** = simplest but limited functionality

## Deployment Commands That Work

### Current Working Setup (Option 2 - Oct 5, 2025)

```bash
# Build Command
pnpm install && pnpm db:generate && pnpm build:all

# Run Command
pm2-runtime start ecosystem.config.js
```

**Key Changes Made:**

1. **Fixed package.json build scripts:**
   - `packages/db`: Added `"build": "tsc"` and TypeScript config
   - `packages/queue`: Added `"build": "tsc"` and `"declaration": true`
2. **Fixed build order in root package.json:**

   ```bash
   "build:all": "pnpm --filter \"./packages/*\" build && pnpm --filter \"./apps/*\" build"
   ```

3. **Fixed import extensions in packages/queue/src/index.ts:**

   ```typescript
   export * from "./types.js"; // Was './types'
   export { GraphileWorkerQueue } from "./graphile-worker.js"; // Was './graphile-worker'
   ```

4. **Fixed ecosystem.config.js PM2 args:**

   ```javascript
   // Before (broken):
   script: 'pnpm', args: '--filter chat start'

   // After (working):
   script: 'sh', args: '-c "cd apps/chat && npm start"'
   ```

5. **Fixed Prisma generated files in packages/db/package.json:**

   ```bash
   # Before (missing generated files):
   "build": "tsc"

   # After (copies Prisma files):
   "build": "tsc && cp -r src/generated dist/"
   ```

6. **Created separate type-only exports in packages/db:**

   ```json
   // package.json exports
   "exports": {
     ".": {
       "types": "./dist/index.d.ts",
       "import": "./dist/index.js"
     },
     "./types": {
       "types": "./dist/types.d.ts",
       "import": "./dist/types.js"
     }
   }
   ```

   ```typescript
   // src/types.ts - Client-safe exports (no PrismaClient runtime)
   export type * from "./generated/prisma/index.js";
   export const Gender = {
     male: "male",
     female: "female",
     non_binary: "non_binary",
   };
   // ... other enums manually defined to avoid runtime imports

   // src/index.ts - Full exports (server-only)
   export * from "./generated/prisma/index.js";
   export { PrismaClient } from "./generated/prisma/index.js";
   ```

7. **Updated client-side imports to use type-only path:**
   ```typescript
   // Before (caused bundling issues):
   import { Gender, DatePrecision } from '@namegame/db'
   
   // After (client-safe):
   import { Gender, DatePrecision } from '@namegame/db/types'
   ```

8. **Added enum validation to prevent schema drift:**
   ```javascript
   // packages/db/scripts/validate-enums.js
   // Compares schema.prisma enums with types.ts constants
   // Fails build with bright red error if out of sync
   
   // packages/db/package.json
   "build": "node scripts/validate-enums.js && tsc && cp -r src/generated dist/"
   ```

   **Example validation output:**
   ```bash
   🔍 Validating enum consistency between schema.prisma and types.ts...
   ✅ Gender: OK
   ✅ DatePrecision: OK
   ❌ ENUM MISMATCH: ManagedStatus
      Extra in types.ts: premium
   🚨 ENUM VALIDATION FAILED!
   📝 TO FIX: Update the enum constants in packages/db/src/types.ts to match schema.prisma
   ```

### Fallback Setup (Option 1)

```bash
{{ ... }}
pnpm install && pnpm db:generate && pnpm build

# Run Command
pnpm start:web
```

## ecosystem.config.js Structure

```js
module.exports = {
  apps: [
    {
      name: "namegame-web",
      script: "pnpm",
      args: "start:web",
      env: { NODE_ENV: "production", PORT: 3000 },
    },
    {
      name: "namegame-worker",
      script: "pnpm",
      args: "--filter worker start",
      env: { NODE_ENV: "production" },
    },
    {
      name: "namegame-chat",
      script: "pnpm",
      args: "--filter chat start",
      env: { NODE_ENV: "production", CHAT_PORT: 3001 },
    },
  ],
};
```

## Next Steps

1. **Immediate:** Use Option 2 (`pm2-runtime`) to get full chat working
2. **Future:** Consider Option 3 (separate apps) when scaling becomes important
3. **Monitor:** Watch resource usage with all 3 services in one container

## Related Issues

- Chat server needs `DATABASE_URL` and other env vars in production
- Socket.IO CORS must allow production domain
- Real-time features require both web app AND chat server running
- Mobile testing requires network access configuration (0.0.0.0 binding)

---

**Bottom Line:** Digital Ocean + PM2 daemon mode = deployment hell. Use `pm2-runtime` for containerized deployments.
