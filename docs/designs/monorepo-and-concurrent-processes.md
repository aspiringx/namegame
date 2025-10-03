# Concurrent Process Management

**Date:** October 3, 2025  
**Context:** Multi-service architecture requires orchestrating web, worker, and chat services

## Problem Statement

NameGame consists of multiple services that must run simultaneously:
- **Web app** (Next.js) - Main user interface
- **Worker service** (Graphile Worker) - Background job processing  
- **Chat service** (Socket.io) - Real-time messaging

Each service needs different management strategies for development vs production environments.

## Tool Selection & Rationale

### Development: `concurrently`

**Why concurrently for local development:**
- **Single command startup** - `pnpm dev` starts all services at once
- **Colored output** - Each service gets distinct colors (blue/green/yellow) for easy log identification
- **Process naming** - Clear prefixes show which service generated each log line
- **Development-focused** - Optimized for file watching and hot reloading
- **Simple termination** - Ctrl+C kills all processes cleanly

```json
"dev": "concurrently --names \"web,worker,chat\" --prefix-colors \"blue,green,yellow\" \"pnpm dev:web\" \"pnpm dev:worker\" \"pnpm dev:chat\""
```

### Production: `PM2`

**Why PM2 for production:**
- **Process monitoring** - Automatic restart on crashes
- **Resource management** - Memory limits and CPU monitoring per service
- **Log management** - Separate log files with timestamps
- **Zero-downtime deployment** - Graceful restarts without service interruption
- **Production-grade** - Battle-tested for high-availability applications
- **Clustering support** - Can scale individual services if needed

```javascript
// ecosystem.config.js
apps: [
  { name: 'namegame-web', script: 'pnpm', args: 'start:web' },
  { name: 'namegame-worker', script: 'pnpm', args: '--filter worker start' },
  { name: 'namegame-chat', script: 'pnpm', args: '--filter chat start' }
]
```

## Service Auto-Initialization

### Graphile Worker Tables
The worker service automatically creates its required database tables on startup using `runMigrations()`. This ensures new environments don't require manual setup steps.

```typescript
// Auto-initialize on worker startup
await runMigrations({ connectionString: DATABASE_URL });
```

### Environment Configuration
All services use standardized `.env` symlinks pointing to the root environment file, ensuring consistent configuration across the monorepo.

## Deployment Integration

### DigitalOcean App Platform
PM2 integrates well with DigitalOcean's process management:
- **Single entry point** - `pnpm start` launches all services
- **Health monitoring** - PM2 reports process status to platform
- **Resource allocation** - Each service can have different memory/CPU limits
- **Log aggregation** - Centralized logging through PM2's file system

### Future Kubernetes Consideration
The current PM2 setup provides a migration path to Kubernetes:
- Each PM2 app maps to a Kubernetes deployment
- Service separation is already established
- Environment configuration patterns are container-ready

## Script Architecture

```json
{
  "dev": "Start all services for local development",
  "dev:web": "Individual service development", 
  "start": "Production multi-service startup",
  "stop": "Graceful shutdown of all services",
  "restart": "Zero-downtime service restart"
}
```

This approach provides optimal developer experience locally while ensuring production reliability and maintainability.
