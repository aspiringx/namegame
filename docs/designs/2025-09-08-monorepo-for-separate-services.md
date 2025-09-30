# Monorepo for Separate Services on DigitalOcean

This document outlines the strategy for adding multiple backend services (e.g., a background worker, a real-time chat server) to the Name Game application while keeping the codebase unified and easy to manage.

## Envisioned Services

This monorepo architecture is intended to support multiple, distinct services that share common code:

-   **Web Service:** The main Next.js application that users interact with.
-   **Worker Service:** For asynchronous background jobs like sending emails, processing images, or handling other long-running tasks. This will use a queue (like BullMQ) and a Redis broker.
-   **Chat Service:** A real-time WebSocket server for user and group chat. This service would also need access to the shared database schema to handle user authentication and message persistence.

## The Problem: Sharing Code Between Services

Adding new backend services introduces a challenge: each service (like a worker or chat server) needs to interact with the database and therefore requires access to the Prisma schema and client. Creating a completely separate repository for the worker would lead to complexities:

- **Code Duplication:** The Prisma schema would need to be copied or synchronized.
- **Publishing Overhead:** Publishing the schema as a private npm package adds versioning and dependency management headaches.
- **Deployment Complexity:** Managing two separate deployment pipelines increases overhead.

## The Solution: A Monorepo

The best practice for this scenario is to structure the project as a **monorepo**. This allows us to keep all code in a single Git repository but define and deploy multiple services (e.g., the web app, a worker, and a chat server) from it.

DigitalOcean's App Platform is built to support this architecture.

**How it Works:**
1.  The repository is restructured into `apps` (for services) and `packages` (for shared code).
2.  A package manager feature like **pnpm workspaces** links the local packages together.
3.  The worker can import the Prisma client directly from the shared `packages/db` directory as if it were a local file—no publishing needed.
4.  The DigitalOcean App Spec is configured to build and deploy the web app and worker as distinct components from their respective directories.

### Recommended Stack

-   **Structure:** **pnpm Workspaces** (fast and efficient for monorepo management).
-   **Queue (Phase 1):** **Graphile Worker** (Postgres-based job queue, uses existing database).
-   **Chat (Phase 1):** **Postgres LISTEN/NOTIFY** (built-in pub/sub, no additional cost).
-   **Queue (Phase 2):** **BullMQ + Redis** (migrate when throughput demands it).
-   **Chat (Phase 2):** **Redis Pub/Sub** (migrate when real-time performance becomes critical).

### Phase 1: Postgres-Based Approach (No Additional Cost)

For a passion project, starting with Postgres for both job queuing and real-time messaging is the most cost-effective approach:

**Job Queue: Graphile Worker**
-   Built specifically for Postgres-based background jobs
-   Supports retries, priorities, cron jobs, and concurrency control
-   Battle-tested in production environments
-   Zero additional infrastructure cost
-   Performance is excellent for small-to-medium workloads (hundreds of jobs/minute)

**Real-Time Chat: Postgres LISTEN/NOTIFY**
-   Native Postgres pub/sub mechanism
-   Supports multi-instance deployments
-   Suitable for moderate message volumes
-   Zero additional infrastructure cost
-   Can be wrapped in Socket.io or similar WebSocket library

### Phase 2: When to Migrate to Redis

You'll know it's time to add Redis (DigitalOcean managed Redis starts at $15/month) when you experience:

**For Job Queue:**
-   Processing >1,000 jobs per minute consistently
-   Need sub-second job latency (Postgres queues typically have 100ms-1s latency)
-   Queue operations are causing noticeable database load
-   Revenue/usage justifies the $15/month cost

**For Chat:**
-   >100 concurrent chat users
-   High-frequency message broadcasts (multiple messages per second)
-   Postgres LISTEN/NOTIFY causing connection pool issues
-   Real-time features become a core product differentiator

**Migration Strategy:**
-   Abstract queue and pub/sub interfaces in shared packages
-   Swap implementations without changing application code
-   Run both systems in parallel during migration for safety
-   Monitor performance before and after to validate improvement

---

## Step-by-Step Implementation Plan

1.  **Restructure the Project:**
    -   Create an `apps` directory.
    -   Create a `packages` directory.
    -   Move the existing Next.js application source into `apps/web`.
    -   Move the `prisma` directory into a new `packages/db`.
    -   Create new directories under `apps/` for each service (e.g., `apps/worker`, `apps/chat`).

2.  **Configure Workspaces:**
    -   Create a `pnpm-workspace.yaml` file in the root to define the workspaces (`apps/*` and `packages/*`).
    -   Update the root `package.json` to manage the monorepo dependencies and scripts.

3.  **Set Up New Services:**
    -   For each new service (worker, chat), create a `package.json` in its respective directory (e.g., `apps/worker/package.json`).
    -   Add necessary dependencies:
        -   Worker: Graphile Worker, shared `db` package
        -   Chat: Socket.io (or ws), shared `db` package for auth/persistence
    -   Write the basic logic for each service.

4.  **Update DigitalOcean App Spec:**
    -   Modify the app configuration (e.g., via a `.do/app.yaml` file) to define multiple services:
        -   A **web service** pointing to `apps/web`.
        -   A **worker service** pointing to `apps/worker`.
        -   A **service** for each additional app, like a chat server pointing to `apps/chat`.
    -   Set the appropriate build and run commands for each service.

---

## Costs & Benefits

While the monorepo approach is powerful, it's important to understand the trade-offs. For a project of this scale, the benefits significantly outweigh the potential costs.

### The "Bigger Footprint" Concern: Myth vs. Reality

-   **Deployed Services (Minor Cost / Non-Issue):** Modern platforms like DigitalOcean build services from their specific directories. The deployed image for a worker service **will not** contain the Next.js frontend. The footprint of each deployed service remains lean.
-   **Local Development (Minor Cost):** The local checkout will contain all code, and `pnpm install` will install dependencies for all packages. This is a minor cost in disk space and initial install time.

### Other Downsides

| Downside                  | Description                                                                                                                                                                                            | Cost for This Project |
| :------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------- |
| **Tooling & Configuration** | Requires initial setup for workspace tooling (e.g., `pnpm-workspace.yaml`, root `package.json` scripts).                                                                                                 | **Minor.** A one-time setup cost. |
| **CI/CD Complexity**      | CI/CD pipelines can become more complex if you want to only rebuild services that have changed.                                                                                                        | **Minor to Medium.** Can start by rebuilding everything and optimize later. |
| **Unified Dependencies**  | All packages share a single lockfile, forcing dependency version consistency. This is generally a good thing but can be a constraint in rare cases.                                                     | **Minor.** More of a feature than a bug. |
| **Performance at Scale**  | For massive monorepos (thousands of engineers), IDEs and Git operations can slow down.                                                                                                                 | **Non-Issue.** Not a concern at this project's scale. |

### Conclusion

The simplicity of managing code in one repository **far outweighs** the minor costs for this project. The monorepo approach provides:
-   **Atomic Commits:** A single PR can update the database, worker, and frontend simultaneously.
-   **Simplified Dependencies:** No need to publish and version private packages.
-   **Consistent Developer Experience:** It's easier to run and test the entire system locally.
