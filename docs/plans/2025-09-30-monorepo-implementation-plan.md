# Monorepo Implementation Plan

**Date:** 2025-09-30  
**Objective:** Restructure the NameGame application as a monorepo to support multiple services (web, worker, chat) while sharing common code and database schema.

**Key Decision:** Start with Postgres-based solutions (Graphile Worker for jobs, LISTEN/NOTIFY for chat) to avoid additional infrastructure costs. Migrate to Redis later when performance demands justify the expense.

---

## Phase 1: Preparation & Analysis
**Goal:** Understand current structure and prepare for migration

### Step 1.1: Audit Current Dependencies
- Document all dependencies in current `package.json`
- Identify which dependencies are dev vs. runtime
- Note any custom scripts that need to be preserved

### Step 1.2: Backup Current State
- Create feature branch: `feature/monorepo-migration`
- Tag current working state: `git tag pre-monorepo`

### Step 1.3: Install pnpm
- Install pnpm globally: `npm install -g pnpm`
- Verify compatibility with current Node.js version

---

## Phase 2: Create Monorepo Structure
**Goal:** Set up directory structure without breaking existing code

### Step 2.1: Create New Directory Structure
```
/
├── apps/
│   ├── web/          (current Next.js app)
│   ├── worker/       (background jobs)
│   └── chat/         (WebSocket server)
├── packages/
│   ├── db/           (Prisma schema)
│   └── queue/        (job queue abstraction)
└── pnpm-workspace.yaml
```

### Step 2.2: Move Next.js App to `apps/web`
Move to `apps/web/`:
- `src/` directory
- `public/` directory
- `next.config.js`
- `tsconfig.json`
- `.env.local` (create new, don't move original)

Do NOT move yet:
- `prisma/` (next step)
- Root `package.json` (will be replaced)
- `node_modules/` (will be regenerated)

### Step 2.3: Extract Prisma to `packages/db`
1. Move `prisma/` to `packages/db/prisma/`
2. Create `packages/db/package.json`
3. Create `packages/db/src/index.ts` to export Prisma client
4. Update schema output path

---

## Phase 3: Configure Workspace
**Goal:** Wire up pnpm workspaces

### Step 3.1: Create `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Step 3.2: Create Root `package.json`
```json
{
  "name": "namegame-monorepo",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter web dev",
    "dev:worker": "pnpm --filter worker dev",
    "dev:chat": "pnpm --filter chat dev",
    "build": "pnpm --filter web build",
    "build:all": "pnpm -r build",
    "db:generate": "pnpm --filter @namegame/db db:generate",
    "db:push": "pnpm --filter @namegame/db db:push",
    "db:migrate": "pnpm --filter @namegame/db db:migrate"
  }
}
```

### Step 3.3: Create `apps/web/package.json`
Add workspace dependency:
```json
{
  "dependencies": {
    "@namegame/db": "workspace:*",
    // ... existing dependencies
  }
}
```

### Step 3.4: Initial pnpm Install
1. Delete `node_modules/` and `package-lock.json`
2. Run `pnpm install`
3. Verify workspace linking

---

## Phase 4: Update Import Paths
**Goal:** Fix all broken imports in web app

### Step 4.1: Update Prisma Imports
Change from local imports to package imports:
```typescript
// Old: import { prisma } from '@/lib/prisma'
// New: import { PrismaClient } from '@namegame/db'
```

### Step 4.2: Update TypeScript Configuration
Update `apps/web/tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@namegame/db": ["../packages/db/src"]
    }
  }
}
```

### Step 4.3: Update Next.js Configuration
```javascript
const nextConfig = {
  transpilePackages: ['@namegame/db'],
  // ... rest of config
};
```

---

## Phase 5: Verify Web App Works
**Goal:** Ensure existing functionality intact

### Step 5.1: Test Local Development
1. Run `pnpm dev`
2. Verify all pages load
3. Test database operations
4. Check authentication flows

### Step 5.2: Test Production Build
1. Run `pnpm build`
2. Verify build succeeds
3. Test production mode

**🛑 CHECKPOINT:** Do not proceed until web app is fully functional

---

## Phase 6: Create Queue Abstraction Package
**Goal:** Create reusable queue interface for easy Redis migration later

### Step 6.1: Create `packages/queue/` Structure
```
packages/queue/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── types.ts
    ├── graphile-worker.ts
    └── bullmq.ts (for future)
```

### Step 6.2: Define Queue Interface
```typescript
// packages/queue/src/types.ts
export interface JobQueue {
  addJob<T>(jobName: string, payload: T, options?: JobOptions): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface JobOptions {
  priority?: number;
  runAt?: Date;
  maxAttempts?: number;
}

export type JobHandler<T = any> = (payload: T) => Promise<void>;

export interface JobRegistry {
  [jobName: string]: JobHandler;
}
```

### Step 6.3: Implement Graphile Worker Adapter
Create Postgres-based implementation that matches the interface.

### Step 6.4: Package Configuration
```json
{
  "name": "@namegame/queue",
  "dependencies": {
    "graphile-worker": "^0.16.0"
  }
}
```

---

## Phase 7: Create Worker Service
**Goal:** Add background job processing using Postgres queue

### Step 7.1: Create `apps/worker/` Structure
```
apps/worker/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    └── jobs/
        ├── send-email.ts
        └── index.ts
```

### Step 7.2: Define Job Handlers
```typescript
// apps/worker/src/jobs/send-email.ts
export const sendEmail: JobHandler = async (payload) => {
  console.log(`Sending email to ${payload.to}`);
  // TODO: Implement email sending
};
```

### Step 7.3: Create Worker Entry Point
```typescript
// apps/worker/src/index.ts
import { GraphileWorkerQueue } from '@namegame/queue';
import { jobs } from './jobs';

const queue = new GraphileWorkerQueue(process.env.DATABASE_URL, jobs);
await queue.start();
```

### Step 7.4: Package Configuration
```json
{
  "name": "worker",
  "dependencies": {
    "@namegame/db": "workspace:*",
    "@namegame/queue": "workspace:*"
  }
}
```

### Step 7.5: Initialize Graphile Worker Database
```bash
DATABASE_URL="..." npx graphile-worker --schema-only
```

### Step 7.6: Test Worker Locally
1. Start worker: `pnpm dev:worker`
2. Add test job from web app
3. Verify worker processes it

**🛑 CHECKPOINT:** Verify worker service before proceeding

---

## Phase 8: Create Chat Service (Optional - Can Defer)
**Goal:** Add WebSocket service using Postgres LISTEN/NOTIFY

### Step 8.1: Create `apps/chat/` Structure
```
apps/chat/
├── package.json
└── src/
    ├── index.ts
    ├── auth.ts
    └── handlers/
        └── message.ts
```

### Step 8.2: Implement Chat Server
Use Socket.io with Postgres LISTEN/NOTIFY for pub/sub:
```typescript
// Set up Postgres LISTEN
pgClient.query('LISTEN new_message');

// Broadcast on notification
pgClient.on('notification', (msg) => {
  io.to(`group:${msg.groupId}`).emit('message', msg);
});

// Trigger NOTIFY when message sent
await prisma.$executeRaw`
  SELECT pg_notify('new_message', ${JSON.stringify(message)})
`;
```

### Step 8.3: Package Configuration
```json
{
  "name": "chat",
  "dependencies": {
    "@namegame/db": "workspace:*",
    "socket.io": "^4.7.0",
    "pg": "^8.11.0"
  }
}
```

**🛑 CHECKPOINT:** Test chat service locally

---

## Phase 9: Update DigitalOcean Configuration
**Goal:** Configure deployment for multiple services

### Step 9.1: Create `.do/app.yaml`
```yaml
name: namegame
region: nyc

services:
  - name: web
    build_command: pnpm install && pnpm db:generate && cd apps/web && pnpm build
    run_command: cd apps/web && pnpm start
    http_port: 3000
    routes:
      - path: /

  - name: worker
    build_command: pnpm install && pnpm db:generate && cd apps/worker && pnpm build
    run_command: cd apps/worker && pnpm start

  - name: chat
    build_command: pnpm install && pnpm db:generate && cd apps/chat && pnpm build
    run_command: cd apps/chat && pnpm start
    http_port: 3001
    routes:
      - path: /socket.io

databases:
  - name: namegame-db
    engine: PG
    version: "15"

# Note: No Redis in Phase 1
```

### Step 9.2: Configure Environment Variables
In DigitalOcean dashboard:
- `DATABASE_URL` (from managed Postgres)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

---

## Phase 10: Deploy & Verify
**Goal:** Ensure everything works in production

### Step 10.1: Deploy
1. Commit changes
2. Push to main branch
3. Monitor DigitalOcean build logs
4. Verify all services start

### Step 10.2: Test End-to-End
- **Web:** Test authentication, database ops
- **Worker:** Trigger job, verify processing
- **Chat:** Send messages, verify real-time delivery

### Step 10.3: Monitor Performance
- Check service metrics
- Monitor database connections
- Watch for errors

---

## Phase 11: Documentation & Cleanup

### Step 11.1: Update Documentation
- Document new directory structure
- Add development setup instructions
- Document how to add new services
- Document queue usage patterns

### Step 11.2: Create Migration Guide
Document how to migrate to Redis when needed:
1. Add Redis to DigitalOcean app spec
2. Implement BullMQ adapter in `packages/queue/`
3. Update worker to use new adapter
4. Run both systems in parallel
5. Cut over when validated

---

## Future: Migration to Redis

### When to Migrate
**Job Queue:**
- Processing >1,000 jobs/minute
- Need sub-second latency
- Database load from queue operations

**Chat:**
- >100 concurrent users
- High-frequency broadcasts
- Connection pool issues

### Migration Steps
1. Add Redis managed database ($15/mo)
2. Implement BullMQ adapter in `packages/queue/src/bullmq.ts`
3. Update worker to use BullMQ adapter
4. Implement Redis pub/sub for chat
5. Run parallel for validation
6. Cut over and monitor

### Cost-Benefit Analysis
- **Cost:** $15/month for managed Redis
- **Benefit:** 10x throughput, <100ms latency
- **Decision Point:** When performance justifies cost

---

## Estimated Timeline

- **Phase 1-5** (Core migration): 4-8 hours
- **Phase 6-7** (Worker with Graphile): 3-4 hours
- **Phase 8** (Chat with Postgres): 4-6 hours
- **Phase 9-11** (Deploy & docs): 2-4 hours

**Total: 13-22 hours**

---

## Success Criteria

✅ Web app runs unchanged in monorepo  
✅ Worker processes background jobs via Postgres queue  
✅ Chat service handles real-time messages via Postgres pub/sub  
✅ All services deployed to DigitalOcean  
✅ Zero additional infrastructure costs  
✅ Clear migration path to Redis documented