# Scaling Database and App Considerations

**Last Updated:** 2025-10-06  
**Context:** Analysis of current infrastructure limits and capacity planning

---

## Current Infrastructure (As of Oct 2025)

### Database: DigitalOcean Managed PostgreSQL
- **Tier:** Basic - $15/month
- **Specs:** 1 vCPU, 1GB RAM, 10GB SSD
- **Connection Limit:** 22 total backend connections
- **Connection Pool:** PgBouncer in "transaction" mode
  - Pool Size: 18 (increased from 10 on 2025-10-06)
  - Pool Mode: Transaction (connections released after each transaction)
  - Database: defaultdb
  - Port: 25061 (pooled)

### Web + Worker Apps
- **Connection String:** Uses pooled connection (port 25061)
- **Shared Pool:** 18 connections available for all web/worker requests
- **Connection Usage:** 18 of 22 total connections allocated to pool

### Chat Service
- **Connection String:** Uses direct connection (port 25060)
- **Connection Type:** Single persistent connection for PostgreSQL LISTEN/NOTIFY
- **Connection Count:** 1 of 22 total connections
- **Architecture:** One connection shared by all users (WebSocket connections don't use DB connections)

### Total Connection Usage
- **Web/Worker Pool:** 18 connections
- **Chat Service:** 1 connection
- **Available:** 3 connections (for admin, monitoring, spikes)
- **Total:** 22 connections

---

## Performance Optimizations Completed (2025-10-06)

### Transaction Optimization
**Problem:** Long-running transactions were holding database connections for 3-5+ seconds, causing timeout errors.

**Root Cause:** `getCodeTable()` lookups were being called inside `prisma.$transaction()` blocks, adding unnecessary latency.

**Solution:** Moved all `getCodeTable()` calls outside transactions in 8 files:
1. `apps/web/src/app/(main)/me/actions.ts`
2. `apps/web/src/app/(anonymous)/signup/actions.ts`
3. `apps/web/src/app/(main)/admin/users/create/actions.ts`
4. `apps/web/src/app/(main)/admin/groups/create/actions.ts`
5. `apps/web/src/app/(main)/admin/groups/[slug]/edit/actions.ts`
6. `apps/web/src/app/(main)/admin/groups/[slug]/edit/members/page.tsx` (removed unnecessary transaction)
7. `apps/web/src/app/(main)/me/users/actions.ts` (3 transactions optimized)
8. `apps/web/src/app/g/[slug]/admin/actions.ts`

**Impact:**
- Transaction time reduced from 3-5+ seconds to <1 second
- Connections released much faster
- Significantly reduced risk of pool exhaustion

### Read-Only Query Optimization
**Problem:** Read-only queries wrapped in `prisma.$transaction()` unnecessarily held connections.

**Solution:** Changed to `Promise.all()` for parallel execution without holding connections.

**Example:**
```typescript
// BEFORE (Bad - holds connection)
const [members, roles] = await prisma.$transaction([
  prisma.groupUser.findMany(...),
  prisma.groupUserRole.findMany(),
])

// AFTER (Good - parallel without transaction)
const [members, roles] = await Promise.all([
  prisma.groupUser.findMany(...),
  prisma.groupUserRole.findMany(),
])
```

---

## Current Capacity Limits

### Comfortable Capacity (Current Setup)
- **10-20 concurrent active users** - Smooth experience
- **30-50 concurrent users** - Acceptable with some delays
- **50-100 concurrent users** - Degraded performance, timeouts likely

### Real-World Scenarios

#### Scenario 1: QR Code at Church (50 simultaneous users)
**What happens:**
1. 50 users scan QR code and load app
2. 50 HTTP requests hit web server
3. With 18-connection pool, only 18 can execute DB queries simultaneously
4. Remaining 32 requests queue and wait

**Expected Experience:**
- First 18 users: Fast (<500ms)
- Next 32 users: 1-3 second delays
- If all users save profiles simultaneously: Some timeouts possible

**Verdict:** ✅ Will work, but users will notice slowness

#### Scenario 2: Multiple Groups (10 groups × 30 users = 300 concurrent)
**Verdict:** ❌ Current setup insufficient - system will struggle significantly

#### Scenario 3: Viral Growth (100 groups × 30 users = 3,000 concurrent)
**Verdict:** ❌ Not possible with current infrastructure

---

## Chat Service Capacity

### Current Architecture
- **Chat Server:** Single Node.js process (smallest DigitalOcean App size)
- **Database Connection:** 1 persistent PostgreSQL connection using LISTEN/NOTIFY
- **WebSocket Connections:** Handled by Socket.IO (in-memory, no DB connection per user)

### How It Scales

#### Database Connection
- ✅ **1 connection serves unlimited users** - LISTEN/NOTIFY is shared
- ✅ **No additional DB connections** as users join
- ✅ **Efficient architecture** - standard pattern for real-time messaging

#### Chat Server (Node.js Process)
**Current Limits (smallest app size):**
- **Memory:** ~512MB
- **CPU:** Shared
- **WebSocket Connections:** ~1,000-2,000 concurrent connections per instance

**What happens at scale:**
- Each active user = 1 WebSocket connection
- WebSocket overhead: ~5-10KB per connection
- 100 users = ~1MB memory
- 1,000 users = ~10MB memory

**Bottleneck:** CPU for message broadcasting, not database connections

### Chat Scaling Path

#### Phase 1: Current (0-500 users)
- ✅ Single chat server instance
- ✅ 1 database connection
- **Capacity:** 500-1,000 concurrent WebSocket connections

#### Phase 2: Medium Scale (500-2,000 users)
- Upgrade chat server to larger app size (more CPU/memory)
- Still 1 database connection
- **Capacity:** 2,000-5,000 concurrent connections

#### Phase 3: High Scale (2,000+ users)
- Multiple chat server instances behind load balancer
- Redis adapter for Socket.IO (share state across instances)
- Still 1 database connection per chat instance (2-3 total)
- **Capacity:** 10,000+ concurrent connections

**Key Insight:** Chat service scales independently of database connections. The LISTEN/NOTIFY pattern is highly efficient.

---

## Scaling Roadmap

### Phase 1: Current State (Now)
**Infrastructure:**
- Database: $15/month (22 connections)
- Pool Size: 18
- Chat: Smallest app size

**Capacity:**
- 1-2 pilot groups
- 20-30 concurrent users comfortably
- 50 users with noticeable delays

**Actions:**
- ✅ Set pool size to 18 (completed 2025-10-06)
- ✅ Optimize transactions (completed 2025-10-06)
- Monitor connection usage (set alerts at 80% = 16/18)
- Limit to 1-2 pilot groups

### Phase 2: Multi-Group Launch (Before 5+ Active Groups)
**Infrastructure Upgrades:**
- **Database:** Upgrade to $55/month tier
  - 2GB RAM, 2 vCPU
  - 60 connection limit (vs 22)
  - Set pool size to 50-55
- **Chat:** Upgrade to medium app size
  - More CPU for message broadcasting
  - Still 1 database connection

**Capacity:**
- 5-10 active groups
- 100-150 concurrent users
- Smooth experience for QR code scenarios

**Cost:** ~$70/month total infrastructure

### Phase 3: Regional/Viral Growth (10+ Active Groups)
**Infrastructure Upgrades:**
- **Database:** $120/month tier
  - 4GB RAM, 2 vCPU
  - 97 connection limit
  - Set pool size to 85-90
- **Web:** Multiple app instances behind load balancer
- **Chat:** Multiple instances with Redis adapter
- **Caching:** Redis for session/photo URLs
- **CDN:** Cloudflare for static assets

**Capacity:**
- 50+ active groups
- 500-1,000+ concurrent users
- Production-ready for viral scenarios

**Cost:** $200-500/month total infrastructure

### Phase 4: Enterprise Scale (100+ Groups)
**Infrastructure:**
- Dedicated database cluster
- Auto-scaling web/chat instances
- Full CDN implementation
- Monitoring and alerting (DataDog, Sentry)

**Capacity:**
- Unlimited groups
- 5,000+ concurrent users

**Cost:** $1,000+/month

---

## Monitoring and Alerts

### Key Metrics to Track

#### Database Connections
- **Current Usage:** Monitor via DigitalOcean dashboard
- **Alert Threshold:** 80% pool usage (16/18 connections)
- **Critical Threshold:** 90% pool usage (17/18 connections)

#### Transaction Performance
- **Target:** <500ms average transaction time
- **Alert:** >2 second average transaction time
- **Tool:** Application Performance Monitoring (APM)

#### Chat Service
- **WebSocket Connections:** Monitor active connections
- **Memory Usage:** Alert at 80% memory
- **Message Latency:** Target <100ms

### Recommended Tools
- **DigitalOcean Monitoring:** Built-in metrics (free)
- **Sentry:** Error tracking and performance monitoring
- **DataDog/New Relic:** Full APM (when budget allows)

---

## Load Testing Recommendations

### Before Next Demo (50 users)
```bash
# Use k6 or Artillery to simulate load
# Test scenario: 50 users join simultaneously
artillery quick --count 50 --num 10 https://your-app.com/g/group-slug
```

### Before Multi-Group Launch
- Simulate 150 concurrent users
- Test profile updates (database writes)
- Test photo uploads (storage + database)
- Test chat message broadcasting

### Metrics to Capture
- Response time (p50, p95, p99)
- Error rate
- Database connection pool usage
- Memory/CPU usage

---

## Cost Projections

| Phase | Groups | Concurrent Users | Monthly Cost | Notes |
|-------|--------|------------------|--------------|-------|
| Current | 1-2 | 20-30 | $15 | Pilot/demo only |
| Phase 2 | 5-10 | 100-150 | $70 | Multi-group launch |
| Phase 3 | 50+ | 500-1,000 | $200-500 | Regional growth |
| Phase 4 | 100+ | 5,000+ | $1,000+ | Enterprise scale |

---

## Key Takeaways

1. **Current setup is suitable for 1-2 pilot groups** with controlled rollout
2. **Connection pool optimization completed** - transactions now release connections quickly
3. **Chat architecture is efficient** - 1 database connection serves unlimited users
4. **Before general release:** Upgrade to $55/month database tier (60 connections)
5. **Monitor connection usage** to avoid surprises during demos
6. **Plan infrastructure budget** based on growth trajectory

---

## Related Documents
- [Connection Pool Management (DigitalOcean)](https://docs.digitalocean.com/products/databases/postgresql/how-to/manage-connection-pools/)
- Transaction optimization commits: 2025-10-06
- Chat architecture: `apps/chat/src/index.ts`
