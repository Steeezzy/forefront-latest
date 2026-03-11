# Forefront Shopify Integration API Documentation

## Overview

This document describes the APIs used for automatic Shopify app configuration without manual URL entry.

---

## 1. App Proxy Endpoint

### Purpose
Serves the backend URL to the Liquid app embed block on the storefront. Shopify automatically adds the `shop` parameter to all app proxy requests.

### Endpoint
```
GET /api/shopify/app-proxy
```

### Shopify Proxy Mapping
```
https://{shop}/apps/forefront/proxy → https://your-backend.com/api/shopify/app-proxy
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `shop` | string | Yes | Shopify store domain (e.g., `mystore.myshopify.com`) |

### Response (Success)

**Status**: 200 OK

```json
{
  "success": true,
  "backend_url": "https://your-backend.com",
  "shop": "mystore.myshopify.com",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Response (Error)

**Status**: 404 Not Found

```json
{
  "error": "Backend URL not configured for this store",
  "backend_url": null
}
```

**Status**: 400 Bad Request

```json
{
  "error": "Missing shop parameter",
  "backend_url": null
}
```

### Example Usage

**From Liquid Block**:
```javascript
fetch(`https://${shop}/apps/forefront/proxy?shop=${shop}`)
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      config.backendUrl = data.backend_url;
    }
  });
```

**From cURL**:
```bash
curl "https://mystore.myshopify.com/apps/forefront/proxy?shop=mystore.myshopify.com"
```

### Implementation Details

- **Authentication**: None (Shopify verifies requests)
- **Rate Limit**: Subject to Shopify's app proxy rate limits
- **Caching**: Response can be cached for 5-10 minutes
- **Timeout**: Should respond within 1 second

---

## 2. OAuth Callback Enhancement

### Purpose
Automatically saves the backend URL to metafields during app installation.

### Endpoint
```
GET /api/shopify/callback
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | OAuth authorization code |
| `shop` | string | Yes | Shopify store domain |
| `state` | string | Yes | State parameter for CSRF protection |
| `hmac` | string | Yes | HMAC signature for verification |
| `timestamp` | string | Yes | Request timestamp |

### Flow

1. **Merchant clicks "Install"** → Redirected to Shopify OAuth
2. **Shopify redirects back** → `/api/shopify/callback?code=...&shop=...`
3. **Backend exchanges code** → Gets access token
4. **Backend saves URL** → Calls `shopifyMetafieldsService.saveBackendUrl()`
5. **Redirect to Theme Editor** → Pre-selects app embed block

### Metafield Storage

**Namespace**: `forefront`
**Key**: `backend_url`
**Type**: `string`
**Value**: Backend URL (e.g., `https://your-backend.com`)

### Database Storage

**Table**: `shopify_metafields`

```sql
INSERT INTO shopify_metafields (
  store_id,
  namespace,
  key,
  value,
  value_type
) VALUES (
  'store-uuid',
  'forefront',
  'backend_url',
  'https://your-backend.com',
  'string'
);
```

**Table**: `shopify_configs`

```sql
UPDATE shopify_configs 
SET backend_url = 'https://your-backend.com'
WHERE id = 'store-uuid';
```

---

## 3. Metafields Service API

### Get Backend URL by Store ID

**Method**: Internal (TypeScript)

```typescript
const backendUrl = await shopifyMetafieldsService.getBackendUrl(storeId);
```

**Returns**: `string | null`

### Get Backend URL by Shop Domain

**Method**: Internal (TypeScript)

```typescript
const backendUrl = await shopifyMetafieldsService.getBackendUrlByShopDomain(shopDomain);
```

**Parameters**:
- `shopDomain` (string): Shopify store domain

**Returns**: `string | null`

### Save Backend URL

**Method**: Internal (TypeScript)

```typescript
await shopifyMetafieldsService.saveBackendUrl(
  storeId,
  shopDomain,
  accessToken,
  backendUrl
);
```

**Parameters**:
- `storeId` (string): UUID of store in database
- `shopDomain` (string): Shopify store domain
- `accessToken` (string): Shopify API access token
- `backendUrl` (string): Backend URL to save

**Returns**: `Promise<void>`

### Sync Metafields from Shopify

**Method**: Internal (TypeScript)

```typescript
await shopifyMetafieldsService.syncMetafieldsFromShopify(
  storeId,
  shopDomain,
  accessToken
);
```

**Parameters**:
- `storeId` (string): UUID of store
- `shopDomain` (string): Shopify store domain
- `accessToken` (string): Shopify API access token

**Returns**: `Promise<void>`

---

## 4. Resolve Agent Endpoint

### Purpose
Dynamically resolves a Shopify store to its primary chatbot agent ID.

### Endpoint
```
GET /api/shopify/resolve-agent
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `shop` | string | Yes | Shopify store domain |

### Response (Success)

**Status**: 200 OK

```json
{
  "success": true,
  "agentId": "agent-uuid-12345"
}
```

### Response (Error)

**Status**: 404 Not Found

```json
{
  "error": "Store not integrated or inactive"
}
```

### Implementation Details

- **Workspace Resolution**: Looks up workspace by shop domain
- **Agent Creation**: Creates default agent if none exists
- **Caching**: Can be cached for 1 hour
- **Fallback**: Creates agent on-demand if missing

---

## 5. Database Schema

### shopify_metafields Table

```sql
CREATE TABLE shopify_metafields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES shopify_configs(id) ON DELETE CASCADE,
  namespace VARCHAR(255) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  value_type VARCHAR(50) DEFAULT 'string',
  shopify_metafield_id VARCHAR(255),
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_id, namespace, key)
);
```

### shopify_configs Table (Updated)

```sql
ALTER TABLE shopify_configs 
ADD COLUMN backend_url VARCHAR(2048),
ADD COLUMN app_proxy_enabled BOOLEAN DEFAULT false;

CREATE INDEX idx_shopify_configs_backend_url ON shopify_configs(backend_url);
```

---

## 6. Error Handling

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Missing shop parameter | 400 | App proxy called without shop | Verify Shopify proxy configuration |
| Backend URL not configured | 404 | Metafield not saved | Reinstall app or manually sync |
| Store not integrated | 404 | Shop domain not in database | Complete OAuth flow |
| Network error | 500 | Backend unreachable | Check backend health |

### Error Response Format

```json
{
  "error": "Error message",
  "backend_url": null,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 7. Security

### HMAC Verification
All OAuth callbacks are HMAC-verified using the Shopify API secret.

```typescript
const isValid = shopifyOAuthService.verifyWebhookSignature(rawBody, hmac);
```

### Access Token Storage
- Encrypted in database
- Never exposed in API responses
- Only used for server-to-server communication

### Metafield Scopes
Required scopes in `shopify.app.toml`:
```toml
scopes = "...write_metafields,read_metafields..."
```

### App Proxy Security
- No authentication required (Shopify verifies)
- Returns only non-sensitive data (backend URL)
- Rate limited by Shopify

---

## 8. Rate Limiting

### App Proxy
- **Limit**: 2 requests per second per store
- **Burst**: Up to 10 requests
- **Retry**: Exponential backoff recommended

### OAuth Callback
- **Limit**: 1 per installation
- **Timeout**: 30 seconds

### Metafields API
- **Limit**: 40 requests per second per store
- **Batch**: Up to 25 metafields per request

---

## 9. Monitoring & Logging

### Key Metrics to Track

1. **App Proxy Response Time**
   ```
   Average: < 100ms
   P95: < 500ms
   P99: < 1s
   ```

2. **OAuth Success Rate**
   ```
   Target: > 99%
   Alert if: < 95%
   ```

3. **Metafield Sync Success**
   ```
   Target: > 99%
   Alert if: < 95%
   ```

### Log Examples

**Successful app proxy call**:
```
[App Proxy] shop=mystore.myshopify.com backend_url=https://api.forefront.com response_time=45ms
```

**Failed metafield save**:
```
[Shopify] Failed to save backend URL to metafields: 429 Too Many Requests
```

**Successful OAuth**:
```
[Shopify Install] shop=mystore.myshopify.com workspace_id=ws-123 backend_url_saved=true
```

---

## 10. Testing

### Unit Tests

```typescript
describe('ShopifyMetafieldsService', () => {
  it('should save backend URL', async () => {
    await shopifyMetafieldsService.saveBackendUrl(
      'store-id',
      'mystore.myshopify.com',
      'token',
      'https://backend.com'
    );
    
    const url = await shopifyMetafieldsService.getBackendUrl('store-id');
    expect(url).toBe('https://backend.com');
  });
});
```

### Integration Tests

```bash
# Test app proxy
curl "http://localhost:3000/api/shopify/app-proxy?shop=test.myshopify.com"

# Test OAuth callback
curl "http://localhost:3000/api/shopify/callback?code=test&shop=test.myshopify.com&state=test&hmac=test"

# Test resolve agent
curl "http://localhost:3000/api/shopify/resolve-agent?shop=test.myshopify.com"
```

---

## 11. Deployment Checklist

- [ ] Database migration applied
- [ ] Environment variables set
- [ ] Backend built and tested
- [ ] App proxy endpoint responding
- [ ] Metafields service initialized
- [ ] OAuth callback tested
- [ ] Shopify app configuration updated
- [ ] Theme app extension deployed
- [ ] Test store installation successful
- [ ] Widget loads without manual URL entry
- [ ] Error handling tested
- [ ] Monitoring configured

---

## 12. Troubleshooting

### Widget shows "Backend URL not configured"

**Check**:
1. App proxy endpoint: `curl https://store.myshopify.com/apps/forefront/proxy?shop=store.myshopify.com`
2. Database: `SELECT * FROM shopify_metafields WHERE namespace='forefront' AND key='backend_url';`
3. Backend logs for OAuth errors

### App proxy returns 404

**Check**:
1. `shopify.app.toml` has correct proxy URL
2. Backend `/api/shopify/app-proxy` endpoint exists
3. Store exists in `shopify_configs` table

### OAuth callback fails

**Check**:
1. HMAC verification: `shopifyOAuthService.verifyWebhookSignature()`
2. Access token exchange: Check Shopify API response
3. Database connection: Can insert into `shopify_configs`

---

## Support & Resources

- **Shopify App Proxy Docs**: https://shopify.dev/docs/apps/build/online-store/app-proxies
- **Shopify Metafields API**: https://shopify.dev/docs/api/admin-rest/2024-01/resources/metafield
- **OAuth Documentation**: https://shopify.dev/docs/apps/auth-admin/oauth
