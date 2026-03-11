# Forefront Shopify App — Zero-Configuration Setup Implementation

## Overview

This implementation enables merchants to install the Forefront chatbot app and have it work automatically without manually entering a backend URL. The solution uses:

1. **Shopify App Proxy** — Maps `mystore.myshopify.com/apps/forefront` to your backend
2. **Metafields Storage** — Saves backend URL during OAuth install
3. **Auto-Configuration** — Liquid block fetches URL from app proxy on page load
4. **Zero Manual Entry** — Merchants just enable the app embed block and it works

---

## Architecture

### Flow Diagram

```
1. Merchant installs app
   ↓
2. OAuth callback saves backend URL to metafields
   ↓
3. Liquid block loads on storefront
   ↓
4. Block fetches backend URL from app proxy
   ↓
5. Widget connects to backend automatically
```

### Key Components

#### 1. **Shopify App Proxy** (`shopify.app.toml`)
- **Endpoint**: `GET /api/shopify/app-proxy`
- **Maps to**: `mystore.myshopify.com/apps/forefront/proxy`
- **Returns**: JSON with `backend_url`
- **No authentication needed** (Shopify handles verification)

#### 2. **Metafields Service** (`ShopifyMetafieldsService.ts`)
- Stores backend URL in local database
- Syncs to Shopify metafields for transparency
- Provides quick lookup by shop domain

#### 3. **OAuth Callback Enhancement** (`shopify.routes.ts`)
- Automatically saves backend URL after install
- Calls `shopifyMetafieldsService.saveBackendUrl()`
- Runs in background (non-blocking)

#### 4. **Liquid Block Update** (`widget_embed_block.liquid`)
- Removed manual `backend_url` requirement from schema
- Fetches URL from app proxy on widget initialization
- Falls back gracefully if URL unavailable

---

## File Changes Summary

### 1. Database Migration
**File**: `forefront-backend/migrations/038_shopify_metafields.sql`

Creates:
- `shopify_metafields` table — stores app configuration
- Adds `backend_url` column to `shopify_configs`
- Adds `app_proxy_enabled` flag

### 2. Metafields Service
**File**: `forefront-backend/src/services/shopify/ShopifyMetafieldsService.ts`

Methods:
- `saveBackendUrl()` — Save URL during OAuth
- `getBackendUrl()` — Fetch from local cache
- `getBackendUrlByShopDomain()` — Used by app proxy
- `syncMetafieldToShopify()` — Optional sync to Shopify admin
- `syncMetafieldsFromShopify()` — Fetch from Shopify

### 3. Shopify Routes
**File**: `forefront-backend/src/modules/shopify/shopify.routes.ts`

Changes:
- Import `shopifyMetafieldsService`
- Add `/app-proxy` endpoint (public, no auth)
- Call `saveBackendUrl()` in OAuth callback
- Add metafield scopes to `shopify.app.toml`

### 4. App Configuration
**File**: `shopify-app/shopify.app.toml`

Changes:
- Add `write_metafields` and `read_metafields` scopes
- Add `[app_proxies]` section with proxy configuration

### 5. Liquid Block
**File**: `shopify-app/extensions/theme-app-extension/blocks/widget_embed_block.liquid`

Changes:
- Remove `backend_url` from required settings
- Keep it optional for manual override
- Block now only requires `chatbot_id`

---

## Implementation Steps

### Step 1: Run Database Migration

```bash
cd forefront-backend
psql -U postgres -d forefront_db -f migrations/038_shopify_metafields.sql
```

Or if using a migration runner:
```bash
npm run migrate
```

### Step 2: Update Shopify Configuration

Update `shopify-app/shopify.app.toml`:

```toml
[access_scopes]
scopes = "read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_script_tags,write_script_tags,read_inventory,read_fulfillments,write_fulfillments,read_checkouts,read_shipping,write_draft_orders,write_metafields,read_metafields"

[app_proxies]
  [[app_proxies]]
  api_version = "2024-01"
  prefix = "apps/forefront"
  subpath = "proxy"
  url = "https://your-backend-url.com/api/shopify/app-proxy"
```

### Step 3: Deploy Backend Changes

1. Copy `ShopifyMetafieldsService.ts` to backend
2. Update `shopify.routes.ts` with new imports and endpoints
3. Rebuild and deploy backend

```bash
npm run build
npm run start
```

### Step 4: Update Theme App Extension

Replace the Liquid block with the new version that:
- Removes `backend_url` from required settings
- Fetches URL from app proxy dynamically

### Step 5: Test Installation Flow

1. **Local Testing**:
   ```bash
   cd shopify-app
   npm run dev
   ```

2. **Install on test store**:
   - Go to `https://your-test-store.myshopify.com/admin/apps`
   - Click "Install app"
   - Complete OAuth flow
   - Verify backend URL saved to metafields

3. **Test widget**:
   - Add app embed block to theme
   - Verify chatbot appears without manual URL entry
   - Test chat functionality

---

## API Endpoints

### App Proxy Endpoint

**GET** `/api/shopify/app-proxy`

**Query Parameters**:
- `shop` (required) — Shopify store domain

**Response**:
```json
{
  "success": true,
  "backend_url": "https://your-backend.com",
  "shop": "mystore.myshopify.com",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response**:
```json
{
  "error": "Backend URL not configured for this store",
  "backend_url": null
}
```

### Metafields Endpoints (Protected)

**GET** `/api/shopify/stores/:storeId/metafields`
- Fetch all metafields for a store

**POST** `/api/shopify/stores/:storeId/metafields`
- Create/update metafield

---

## Environment Variables

Add to `.env`:

```bash
# Shopify App Configuration
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-backend-url.com
BACKEND_URL=https://your-backend-url.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/forefront_db
```

---

## Merchant Experience

### Before (Manual Setup)
1. Install app
2. Go to Theme Editor
3. Add app embed block
4. Manually enter backend URL
5. Enter chatbot ID
6. Save and enable

### After (Zero Configuration)
1. Install app ✅ (backend URL auto-saved)
2. Go to Theme Editor
3. Add app embed block
4. Enter chatbot ID only
5. Save and enable ✅ (URL auto-fetched)

---

## Troubleshooting

### Widget shows "Backend URL not configured"

**Cause**: Metafield not saved during OAuth

**Solution**:
1. Check backend logs for OAuth callback errors
2. Verify `shopifyMetafieldsService.saveBackendUrl()` is called
3. Manually trigger sync:
   ```bash
   curl -X POST https://your-backend.com/api/shopify/stores/{storeId}/sync-metafields
   ```

### App Proxy returns 404

**Cause**: Backend URL not in database

**Solution**:
1. Verify store exists in `shopify_configs`
2. Check `backend_url` column is populated
3. Verify app proxy URL in `shopify.app.toml` matches backend route

### Widget still requires manual URL entry

**Cause**: Old Liquid block cached

**Solution**:
1. Clear theme cache
2. Redeploy theme app extension
3. Hard refresh storefront (Ctrl+Shift+R)

---

## Security Considerations

### App Proxy
- ✅ No authentication required (Shopify verifies requests)
- ✅ Returns only backend URL (no sensitive data)
- ✅ Rate limited by Shopify

### Metafields
- ✅ Stored in encrypted database
- ✅ Only accessible to authenticated users
- ✅ Synced to Shopify with proper scopes

### OAuth Callback
- ✅ HMAC verified
- ✅ State parameter validated
- ✅ Access token stored securely

---

## Future Enhancements

1. **Multi-Backend Support**
   - Store multiple backend URLs per workspace
   - Allow merchants to switch backends

2. **Metafield UI**
   - Dashboard to view/edit metafields
   - Sync status indicator

3. **Webhook Sync**
   - Auto-sync when metafields change in Shopify admin
   - Bidirectional sync

4. **Analytics**
   - Track app proxy requests
   - Monitor configuration errors

---

## Rollback Plan

If issues occur:

1. **Revert Liquid Block**:
   - Restore old `widget_embed_block.liquid`
   - Merchants can manually enter backend URL again

2. **Disable App Proxy**:
   - Comment out app proxy section in `shopify.app.toml`
   - Remove `/app-proxy` endpoint

3. **Keep Metafields**:
   - Data remains in database
   - Can be used for future features

---

## Testing Checklist

- [ ] Database migration runs without errors
- [ ] Metafields service initializes correctly
- [ ] OAuth callback saves backend URL
- [ ] App proxy endpoint returns correct URL
- [ ] Liquid block fetches URL on page load
- [ ] Widget connects to backend automatically
- [ ] Manual URL entry still works (fallback)
- [ ] Error messages are helpful
- [ ] Performance is acceptable (< 100ms)
- [ ] Works on mobile devices

---

## Support

For issues or questions:
1. Check backend logs: `docker logs forefront-backend`
2. Verify database: `SELECT * FROM shopify_metafields;`
3. Test app proxy: `curl https://store.myshopify.com/apps/forefront/proxy?shop=store.myshopify.com`
4. Review Shopify app logs in Partner Dashboard
