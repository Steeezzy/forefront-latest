# Quick Deployment Guide — Widget Embed Fix

## What Was Fixed

The widget now **automatically fetches the backend URL from the app proxy** instead of requiring manual entry. Merchants only need to enter the Chatbot ID.

---

## Deploy in 2 Steps

### Step 1: Deploy Theme Extension
```bash
cd shopify-app
shopify app deploy
```

**Expected output**:
```
✓ Deployed theme app extension
✓ Updated widget_embed_block
```

### Step 2: Test on Dev Store

1. Go to **Theme Editor**
2. Add **App Embed Block**
3. Verify:
   - ✅ No "Backend URL" field
   - ✅ Only "Chatbot ID" field
   - ✅ Widget appears
   - ✅ Chat works

---

## Verify It's Working

### Check Browser Console
Open DevTools (F12) → Console tab

Should see:
```
[Quoston] Fetching backend URL from app proxy...
[Quoston] Backend URL fetched successfully: https://...
[Quoston] Agent ID resolved: ...
```

### Test App Proxy
```bash
curl "https://mystore.myshopify.com/apps/questron/proxy?shop=mystore.myshopify.com"
```

Should return:
```json
{
  "success": true,
  "backend_url": "https://your-backend.com",
  "shop": "mystore.myshopify.com"
}
```

---

## If It Doesn't Work

### Widget is blank
1. Check browser console for errors
2. Verify app proxy is responding
3. Verify backend URL is saved in database

### App proxy returns 404
1. Verify `shopify.app.toml` has proxy config
2. Verify backend `/api/shopify/app-proxy` endpoint exists
3. Restart backend

### Backend URL not found
1. Reinstall app (triggers OAuth callback)
2. Or manually sync: `UPDATE shopify_configs SET backend_url = '...' WHERE shop_domain = '...';`

---

## File Changed

**Only one file updated**:
- `shopify-app/extensions/theme-app-extension/blocks/widget_embed_block.liquid`

**Changes**:
- ✅ Removed `backend_url` from schema
- ✅ Removed `data-backend-url` attribute
- ✅ Added `fetchBackendUrl()` function
- ✅ Updated `initChatbot()` to fetch URL

---

## Rollback (if needed)

```bash
git checkout shopify-app/extensions/theme-app-extension/blocks/widget_embed_block.liquid
cd shopify-app && shopify app deploy
```

---

## Done! 🎉

Merchants can now install the app and it works automatically!

**No manual URL entry needed.**
