# Questron Shopify Zero-Config — Code Examples

## Table of Contents
1. [Backend Integration](#backend-integration)
2. [Frontend/Liquid](#frontendliquid)
3. [Testing](#testing)
4. [Debugging](#debugging)

---

## Backend Integration

### Using the Metafields Service

#### Save Backend URL (Called in OAuth Callback)

```typescript
import { shopifyMetafieldsService } from '../../services/shopify/ShopifyMetafieldsService.js';

// In OAuth callback handler
const backendUrl = process.env.BACKEND_URL || 'https://your-backend.com';

await shopifyMetafieldsService.saveBackendUrl(
  storeId,           // UUID from shopify_configs
  params.shop,       // e.g., "mystore.myshopify.com"
  accessToken,       // From OAuth exchange
  backendUrl         // Backend URL to save
);

console.log(`✅ Backend URL saved for ${params.shop}`);
```

#### Fetch Backend URL (Called by App Proxy)

```typescript
import { shopifyMetafieldsService } from '../../services/shopify/ShopifyMetafieldsService.js';

// In app proxy endpoint
const shopDomain = 'mystore.myshopify.com';
const backendUrl = await shopifyMetafieldsService.getBackendUrlByShopDomain(shopDomain);

if (!backendUrl) {
  return reply.code(404).send({ 
    error: 'Backend URL not configured',
    backend_url: null 
  });
}

return reply.send({ 
  success: true,
  backend_url: backendUrl,
  shop: shopDomain
});
```

#### Sync Metafields from Shopify

```typescript
import { shopifyMetafieldsService } from '../../services/shopify/ShopifyMetafieldsService.js';

// Sync all metafields from Shopify to local cache
await shopifyMetafieldsService.syncMetafieldsFromShopify(
  storeId,
  shopDomain,
  accessToken
);

console.log(`✅ Metafields synced for ${shopDomain}`);
```

---

## Frontend/Liquid

### Liquid Block with Auto-Fetch

#### Basic Implementation

```liquid
<script>
  (function() {
    const config = {
      chatbotId: "{{ block.settings.chatbot_id }}",
      backendUrl: "{{ block.settings.backend_url }}", // Optional override
      shopDomain: "{{ shop.permanent_domain }}"
    };

    // If no manual URL, fetch from app proxy
    if (!config.backendUrl) {
      fetch(`https://${config.shopDomain}/apps/questron/proxy?shop=${config.shopDomain}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            config.backendUrl = data.backend_url;
            initWidget();
          } else {
            console.error('Failed to fetch backend URL:', data.error);
          }
        })
        .catch(err => {
          console.error('App proxy error:', err);
        });
    } else {
      initWidget();
    }

    function initWidget() {
      // Initialize chat widget with config
      console.log('Widget initialized with:', config);
    }
  })();
</script>
```

#### With Error Handling

```liquid
<script>
  (function() {
    const config = {
      chatbotId: "{{ block.settings.chatbot_id }}",
      backendUrl: "{{ block.settings.backend_url }}",
      shopDomain: "{{ shop.permanent_domain }}"
    };

    let retryCount = 0;
    const MAX_RETRIES = 3;

    async function fetchBackendUrl() {
      try {
        const response = await fetch(
          `https://${config.shopDomain}/apps/questron/proxy?shop=${config.shopDomain}`,
          { timeout: 5000 }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.backend_url) {
          config.backendUrl = data.backend_url;
          return true;
        } else {
          throw new Error(data.error || 'No backend URL returned');
        }
      } catch (error) {
        console.warn(`Attempt ${retryCount + 1} failed:`, error.message);

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryCount - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchBackendUrl();
        }

        return false;
      }
    }

    async function init() {
      // Try to fetch URL if not manually set
      if (!config.backendUrl) {
        const success = await fetchBackendUrl();
        if (!success) {
          console.error('Failed to fetch backend URL after retries');
          showErrorMessage('Chat widget unavailable');
          return;
        }
      }

      initWidget();
    }

    function initWidget() {
      console.log('Widget ready:', config);
      // Initialize chat widget
    }

    function showErrorMessage(message) {
      const div = document.createElement('div');
      div.textContent = message;
      div.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#f87171;color:white;padding:16px;border-radius:8px;z-index:99999;';
      document.body.appendChild(div);
    }

    // Start initialization
    init();
  })();
</script>
```

---

## Testing

### Unit Test: Metafields Service

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { shopifyMetafieldsService } from '../ShopifyMetafieldsService';
import { pool } from '../../config/db';

describe('ShopifyMetafieldsService', () => {
  const testStoreId = 'test-store-uuid';
  const testShopDomain = 'test.myshopify.com';
  const testBackendUrl = 'https://test-backend.com';

  beforeEach(async () => {
    // Create test store
    await pool.query(
      `INSERT INTO shopify_configs (id, shop_domain, workspace_id, access_token, scopes, is_active)
       VALUES ($1, $2, 'ws-test', 'token', 'read_products', true)`,
      [testStoreId, testShopDomain]
    );
  });

  afterEach(async () => {
    // Cleanup
    await pool.query('DELETE FROM shopify_metafields WHERE store_id = $1', [testStoreId]);
    await pool.query('DELETE FROM shopify_configs WHERE id = $1', [testStoreId]);
  });

  it('should save and retrieve backend URL', async () => {
    // Save
    await shopifyMetafieldsService.saveBackendUrl(
      testStoreId,
      testShopDomain,
      'test-token',
      testBackendUrl
    );

    // Retrieve
    const url = await shopifyMetafieldsService.getBackendUrl(testStoreId);
    expect(url).toBe(testBackendUrl);
  });

  it('should retrieve URL by shop domain', async () => {
    // Save
    await shopifyMetafieldsService.saveBackendUrl(
      testStoreId,
      testShopDomain,
      'test-token',
      testBackendUrl
    );

    // Retrieve by domain
    const url = await shopifyMetafieldsService.getBackendUrlByShopDomain(testShopDomain);
    expect(url).toBe(testBackendUrl);
  });

  it('should return null for non-existent store', async () => {
    const url = await shopifyMetafieldsService.getBackendUrl('non-existent-id');
    expect(url).toBeNull();
  });

  it('should update existing URL', async () => {
    const newUrl = 'https://new-backend.com';

    // Save first URL
    await shopifyMetafieldsService.saveBackendUrl(
      testStoreId,
      testShopDomain,
      'test-token',
      testBackendUrl
    );

    // Update with new URL
    await shopifyMetafieldsService.saveBackendUrl(
      testStoreId,
      testShopDomain,
      'test-token',
      newUrl
    );

    // Verify update
    const url = await shopifyMetafieldsService.getBackendUrl(testStoreId);
    expect(url).toBe(newUrl);
  });
});
```

### Integration Test: App Proxy Endpoint

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { fastify } from '../app';

describe('App Proxy Endpoint', () => {
  beforeEach(async () => {
    await fastify.ready();
  });

  it('should return backend URL for configured store', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/shopify/app-proxy?shop=test.myshopify.com'
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.success).toBe(true);
    expect(data.backend_url).toBeDefined();
  });

  it('should return 404 for unconfigured store', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/shopify/app-proxy?shop=unconfigured.myshopify.com'
    });

    expect(response.statusCode).toBe(404);
    const data = JSON.parse(response.body);
    expect(data.error).toBeDefined();
  });

  it('should return 400 for missing shop parameter', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/shopify/app-proxy'
    });

    expect(response.statusCode).toBe(400);
    const data = JSON.parse(response.body);
    expect(data.error).toContain('shop');
  });
});
```

### E2E Test: Full Installation Flow

```typescript
import { describe, it, expect } from '@jest/globals';
import { shopifyOAuthService } from '../services/shopify/ShopifyOAuthService';
import { shopifyMetafieldsService } from '../services/shopify/ShopifyMetafieldsService';
import { pool } from '../config/db';

describe('E2E: App Installation Flow', () => {
  it('should complete full installation and save backend URL', async () => {
    const testShop = 'e2e-test.myshopify.com';
    const testCode = 'test-auth-code';

    // 1. Simulate OAuth callback
    const oauthResult = await shopifyOAuthService.handleCallback({
      code: testCode,
      shop: testShop,
      state: 'test-state',
      hmac: 'test-hmac',
      timestamp: String(Date.now())
    });

    expect(oauthResult.accessToken).toBeDefined();

    // 2. Get store ID
    const storeRes = await pool.query(
      'SELECT id FROM shopify_configs WHERE shop_domain = $1',
      [testShop]
    );
    const storeId = storeRes.rows[0].id;

    // 3. Save backend URL (as done in callback)
    const backendUrl = 'https://e2e-test-backend.com';
    await shopifyMetafieldsService.saveBackendUrl(
      storeId,
      testShop,
      oauthResult.accessToken,
      backendUrl
    );

    // 4. Verify URL is saved
    const savedUrl = await shopifyMetafieldsService.getBackendUrlByShopDomain(testShop);
    expect(savedUrl).toBe(backendUrl);

    // 5. Verify app proxy returns URL
    const response = await fetch(
      `http://localhost:3000/api/shopify/app-proxy?shop=${testShop}`
    );
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.backend_url).toBe(backendUrl);
  });
});
```

---

## Debugging

### Check Database State

```sql
-- View all metafields
SELECT * FROM shopify_metafields;

-- View backend URLs
SELECT shop_domain, backend_url FROM shopify_configs WHERE backend_url IS NOT NULL;

-- Check specific store
SELECT * FROM shopify_metafields 
WHERE store_id = (SELECT id FROM shopify_configs WHERE shop_domain = 'mystore.myshopify.com');

-- Count stores with backend URL
SELECT COUNT(*) FROM shopify_configs WHERE backend_url IS NOT NULL;
```

### Test App Proxy Manually

```bash
# Test with curl
curl -v "https://mystore.myshopify.com/apps/questron/proxy?shop=mystore.myshopify.com"

# Test locally
curl -v "http://localhost:3000/api/shopify/app-proxy?shop=test.myshopify.com"

# With headers
curl -v \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/shopify/app-proxy?shop=test.myshopify.com"
```

### Monitor Logs

```bash
# Backend logs
docker logs -f questron-backend | grep -i "app proxy\|metafield\|shopify"

# Database logs
docker logs -f postgres | grep -i "shopify_metafields"

# Real-time monitoring
tail -f /var/log/questron/backend.log | grep -i "shopify"
```

### Debug Widget Loading

```javascript
// Add to Liquid block for debugging
(function() {
  window.QUESTRON_DEBUG = true;

  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    if (args[0].includes('questron')) {
      console.log('[QUESTRON] Fetch:', args[0]);
    }
    return originalFetch.apply(this, args);
  };

  console.log('[QUESTRON] Widget initialization started');
  console.log('[QUESTRON] Shop domain:', "{{ shop.permanent_domain }}");
  console.log('[QUESTRON] Chatbot ID:', "{{ block.settings.chatbot_id }}");
  console.log('[QUESTRON] Backend URL:', "{{ block.settings.backend_url }}");
})();
```

### Performance Profiling

```javascript
// Measure app proxy response time
const start = performance.now();
const response = await fetch(`https://${shop}/apps/questron/proxy?shop=${shop}`);
const end = performance.now();
console.log(`App proxy response time: ${end - start}ms`);

// Measure widget initialization
const initStart = performance.now();
initWidget();
const initEnd = performance.now();
console.log(`Widget init time: ${initEnd - initStart}ms`);
```

---

## Common Issues & Solutions

### Issue: "Backend URL not configured"

**Debug**:
```bash
# Check database
psql $DATABASE_URL -c "SELECT * FROM shopify_metafields WHERE key='backend_url';"

# Check app proxy
curl "https://store.myshopify.com/apps/questron/proxy?shop=store.myshopify.com"

# Check logs
docker logs questron-backend | grep "saveBackendUrl"
```

**Solution**:
1. Reinstall app
2. Check OAuth callback logs
3. Manually sync: `UPDATE shopify_configs SET backend_url = '...' WHERE shop_domain = '...';`

### Issue: App proxy returns 404

**Debug**:
```bash
# Verify endpoint
curl "http://localhost:3000/api/shopify/app-proxy?shop=test.myshopify.com"

# Check route registration
grep -n "app-proxy" questron-backend/src/modules/shopify/shopify.routes.ts
```

**Solution**:
1. Verify endpoint is registered
2. Check `shopify.app.toml` proxy URL
3. Restart backend

### Issue: Metafield sync fails

**Debug**:
```bash
# Check Shopify API response
curl -H "X-Shopify-Access-Token: $TOKEN" \
  "https://store.myshopify.com/admin/api/2024-01/metafields.json?namespace=questron"

# Check logs
docker logs questron-backend | grep "syncMetafield"
```

**Solution**:
1. Verify access token is valid
2. Check metafield scopes in `shopify.app.toml`
3. Retry sync manually

---

## Performance Optimization

### Caching Strategy

```typescript
// Cache backend URL for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map();

async function getBackendUrlCached(shopDomain) {
  const cached = cache.get(shopDomain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }

  const url = await shopifyMetafieldsService.getBackendUrlByShopDomain(shopDomain);
  cache.set(shopDomain, { url, timestamp: Date.now() });
  return url;
}
```

### Batch Operations

```typescript
// Sync multiple stores' metafields
async function syncAllStores() {
  const stores = await pool.query('SELECT id, shop_domain, access_token FROM shopify_configs WHERE is_active = true');
  
  for (const store of stores.rows) {
    await shopifyMetafieldsService.syncMetafieldsFromShopify(
      store.id,
      store.shop_domain,
      store.access_token
    );
  }
}
```

---

This covers the main code patterns and examples for the zero-config implementation!
