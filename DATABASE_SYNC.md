# Database Sync System

This document explains how to sync data between Manus sandbox and Railway production database.

## Overview

The sync system allows bidirectional data transfer between:
- **Manus Sandbox** (development database)
- **Railway Production** (production database)

## Prerequisites

1. **Railway MySQL Public URL**
   - Go to Railway → MySQL service → Variables
   - Copy `MYSQL_PUBLIC_URL` or `MYSQL_URL` (must be public, not `.internal`)
   - Format: `mysql://root:PASSWORD@HOST:PORT/railway`

2. **Environment Variable**
   - Set `RAILWAY_DATABASE_URL` with your Railway public URL

## Commands

### Sync Manus → Railway (Deploy to Production)

```bash
cd /home/ubuntu/orbidut
RAILWAY_DATABASE_URL="your-railway-url" pnpm sync:to-railway
```

**Use this when:**
- You've developed features in Manus sandbox
- You want to deploy test data to Railway
- You want to copy supplier configurations to production

### Sync Railway → Manus (Pull from Production)

```bash
cd /home/ubuntu/orbidut
RAILWAY_DATABASE_URL="your-railway-url" pnpm sync:from-railway
```

**Use this when:**
- You want to test with production data locally
- You need to debug issues with real data
- You want to restore Manus sandbox from production backup

## What Gets Synced

The following tables are synced (in dependency order):

1. **Base tables:**
   - `users`
   - `suppliers`

2. **Supplier configuration:**
   - `supplierCoverageCountries`
   - `supplierPriorityCities`
   - `supplierResponseTimes`
   - `supplierServiceExclusions`

3. **Dependent tables:**
   - `supplierUsers`
   - `supplierRates`

## Important Notes

⚠️ **Warning:** Sync completely replaces data in the target database. All existing data in synced tables will be deleted and replaced.

✅ **Safe:** Foreign key constraints are respected - tables are synced in the correct order.

🔒 **Security:** Never commit `RAILWAY_DATABASE_URL` to git. Always pass it as an environment variable.

## Troubleshooting

### Connection Error: "ENOTFOUND mysql.railway.internal"

**Problem:** You're using the internal Railway URL instead of the public URL.

**Solution:** Use the public URL from `MYSQL_PUBLIC_URL` variable (contains `proxy.rlwy.net`).

### Foreign Key Constraint Errors

**Problem:** Tables are being synced in the wrong order.

**Solution:** This should be fixed in the latest version. If you still see errors, check that you're using the updated `sync-db.mjs` script.

### Sync Takes Too Long

**Problem:** Large tables (like `supplierRates`) can take several minutes to sync.

**Solution:** This is normal. The script syncs row-by-row to ensure data integrity. Wait for completion or optimize by syncing only specific tables.

## Example Usage

```bash
# Export Railway URL for convenience
export RAILWAY_DATABASE_URL="mysql://root:PASSWORD@shortline.proxy.rlwy.net:24121/railway"

# Sync to Railway
pnpm sync:to-railway

# Sync from Railway
pnpm sync:from-railway
```

## Script Location

- Script: `/scripts/sync-db.mjs`
- Commands defined in: `package.json`

## Future Enhancements

- [ ] Add selective table sync (sync only specific tables)
- [ ] Add incremental sync (only changed rows)
- [ ] Add dry-run mode to preview changes
- [ ] Add backup before sync
- [ ] Add progress bar for large tables
