# Resolving Prisma Migration Failures on DigitalOcean Managed Databases

## Problem Summary
When attempting to run `npx prisma migrate deploy` for a production database hosted on DigitalOcean, the migration failed with a permissions error: `ERROR: must be owner of table <table_name>`.

This issue occurs because the application's database user (e.g., `namegame1`) does not have ownership of the tables, which is required to execute `ALTER TABLE` commands during a migration.

## Troubleshooting Steps & Dead Ends
Several standard PostgreSQL commands were attempted while connected as the administrative user (`doadmin`), but all failed due to platform-level security restrictions on DigitalOcean's managed service:
1.  **Changing Table Owner Directly**: `ALTER TABLE ... OWNER TO namegame1;` failed with `permission denied for schema public`.
2.  **Changing Schema Owner**: `ALTER SCHEMA public OWNER TO doadmin;` succeeded, but subsequent attempts to change table ownership still failed.
3.  **Granting Role Permissions**: `GRANT doadmin TO namegame1;` failed because the `doadmin` user itself lacks the `ADMIN` option to delegate its role.

These failures confirmed that the `doadmin` user is not a true superuser and cannot manage object ownership in the way required by the migration.

## Solution
The successful workaround was to bypass the DigitalOcean App Platform's console/connection pool and run the Prisma commands from a local machine, connecting directly to the database as the `doadmin` user.

### Step 1: Run Migration with Admin Credentials
The `DATABASE_URL` was temporarily overridden in the local terminal to use the `doadmin` user's connection string.

```bash
DATABASE_URL="<doadmin_connection_string>" npx prisma migrate deploy
```

This first attempt failed with a new error (`P3009`), indicating the database was now in a "dirty" state from the initial failed migration.

### Step 2: Resolve the Failed Migration State
The `prisma migrate resolve` command was used to mark the previously failed migration as "applied," cleaning the database's state.

```bash
DATABASE_URL="<doadmin_connection_string>" npx prisma migrate resolve --applied "<failed_migration_name>"
```

### Step 3: Re-run the Migration
With the database state cleaned, the `migrate deploy` command was run one final time.

```bash
DATABASE_URL="<doadmin_connection_string>" npx prisma migrate deploy
```

This successfully applied all pending migrations.

## Key Takeaway
For DigitalOcean managed databases, migrations that involve schema changes (`ALTER TABLE`) must be run by a user with table ownership privileges. Since the platform restricts changing ownership, the most reliable solution is to run `npx prisma migrate deploy` from a local environment using the administrative `doadmin` user's credentials.
