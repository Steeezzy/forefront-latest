#!/bin/bash

# Questron Shopify Zero-Config Setup Script
# Automates deployment of the automatic configuration system

set -e

echo "🚀 Questron Shopify Zero-Config Setup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client not found. Please install psql."
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js."
    exit 1
fi
echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo ""

# Step 2: Run database migration
echo -e "${BLUE}Step 2: Running database migration...${NC}"
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Please set it in your environment."
    exit 1
fi

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL=$DATABASE_URL
psql "$DB_URL" -f questron-backend/migrations/038_shopify_metafields.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migration completed${NC}"
else
    echo "❌ Database migration failed"
    exit 1
fi
echo ""

# Step 3: Verify backend files
echo -e "${BLUE}Step 3: Verifying backend files...${NC}"
if [ ! -f "questron-backend/src/services/shopify/ShopifyMetafieldsService.ts" ]; then
    echo "❌ ShopifyMetafieldsService.ts not found"
    exit 1
fi
echo -e "${GREEN}✓ Backend files verified${NC}"
echo ""

# Step 4: Build backend
echo -e "${BLUE}Step 4: Building backend...${NC}"
cd questron-backend
npm install
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend build successful${NC}"
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..
echo ""

# Step 5: Verify Shopify configuration
echo -e "${BLUE}Step 5: Verifying Shopify configuration...${NC}"
if ! grep -q "write_metafields" shopify-app/shopify.app.toml; then
    echo "❌ Metafield scopes not found in shopify.app.toml"
    exit 1
fi
if ! grep -q "app_proxies" shopify-app/shopify.app.toml; then
    echo "❌ App proxy configuration not found in shopify.app.toml"
    exit 1
fi
echo -e "${GREEN}✓ Shopify configuration verified${NC}"
echo ""

# Step 6: Environment check
echo -e "${BLUE}Step 6: Checking environment variables...${NC}"
MISSING_VARS=0
for var in SHOPIFY_API_KEY SHOPIFY_API_SECRET SHOPIFY_APP_URL BACKEND_URL DATABASE_URL; do
    if [ -z "${!var}" ]; then
        echo "⚠️  $var not set"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
done

if [ $MISSING_VARS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some environment variables are missing. Please set them before deploying.${NC}"
else
    echo -e "${GREEN}✓ All environment variables set${NC}"
fi
echo ""

# Step 7: Summary
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy backend: npm run start"
echo "2. Deploy theme app extension: shopify app deploy"
echo "3. Test on a development store"
echo ""
echo "Documentation: See SHOPIFY_ZERO_CONFIG_SETUP.md"
echo ""
