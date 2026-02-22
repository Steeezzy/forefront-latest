# 10 — Deployment & Operations

## Current State
- ✅ Backend runs locally via `tsx watch`
- ✅ Frontend runs via `next dev`
- ❌ No Docker configuration
- ❌ No CI/CD pipeline
- ❌ No production build scripts
- ❌ No monitoring or logging infrastructure
- ❌ No rate limiting or security hardening
- ❌ No SSL/TLS configuration
- ❌ No database backup strategy

---

## Implementation Plan

### Step 1: Docker Setup

**`docker-compose.yml` (Development):**
```yaml
version: '3.8'
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: forefront
      POSTGRES_USER: forefront
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./forefront-backend/src/db/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./forefront-backend/migrations:/docker-entrypoint-initdb.d/migrations

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

  backend:
    build:
      context: ./forefront-backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://forefront:${DB_PASSWORD}@postgres:5432/forefront
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend

volumes:
  pgdata:
  redisdata:
```

**Backend `Dockerfile`:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### Step 2: Production Build

**Backend build script:**
```json
// package.json
{
  "scripts": {
    "build": "tsc --project tsconfig.build.json",
    "start": "node dist/server.js",
    "migrate": "node scripts/run-migrations.js"
  }
}
```

**Frontend build:**
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

### Step 3: Environment Configuration

```env
# Production .env template
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/forefront
REDIS_URL=redis://host:6379

# Auth
JWT_SECRET=<strong-random-256-bit-key>
COOKIE_DOMAIN=.yourdomain.com

# AI
SARVAM_API_KEY=<key>
OPENAI_API_KEY=<key-for-embeddings>

# Billing
STRIPE_SECRET_KEY=<key>
STRIPE_WEBHOOK_SECRET=<key>
RAZORPAY_KEY_ID=<key>
RAZORPAY_KEY_SECRET=<key>

# Channels
FACEBOOK_APP_SECRET=<key>
FACEBOOK_PAGE_TOKEN=<key>
WHATSAPP_ACCESS_TOKEN=<key>

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=<sendgrid-key>

# Widget CDN
WIDGET_CDN_URL=https://widget.yourdomain.com

# Monitoring
SENTRY_DSN=<dsn>
```

### Step 4: Security Hardening

**Rate Limiting:**
```typescript
// Using @fastify/rate-limit
app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.ip, // or workspace ID
});

// Stricter limits for auth endpoints
app.register(rateLimit, {
  max: 5,
  timeWindow: '15 minutes',
  routeConfig: { url: '/auth/login' }
});
```

**Security Headers:**
```typescript
import helmet from '@fastify/helmet';
app.register(helmet);
```

**CORS (Production):**
```typescript
app.register(cors, {
  origin: [
    'https://app.yourdomain.com',
    'https://yourdomain.com'
  ],
  credentials: true,
});
```

**Input Sanitization:**
- XSS protection on all text inputs
- SQL injection prevention (already using parameterized queries)
- File upload validation (type, size limits)

### Step 5: Logging & Monitoring

**Structured Logging:**
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'production'
    ? undefined // JSON output for production log aggregators
    : { target: 'pino-pretty' },
});
```

**Error Tracking:**
- Sentry integration for error reporting
- Custom error classes with context

**Health Checks:**
```typescript
app.get('/health', async () => ({
  status: 'ok',
  version: process.env.npm_package_version,
  database: await checkDbConnection(),
  redis: await checkRedisConnection(),
  uptime: process.uptime(),
}));
```

**Metrics (Optional):**
- Prometheus metrics endpoint
- Grafana dashboards for: request rate, error rate, response time, active connections

### Step 6: Database Operations

**Migration Runner:**
```typescript
// scripts/run-migrations.ts
async function runMigrations() {
  const migrations = fs.readdirSync('./migrations')
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of migrations) {
    const alreadyRun = await checkMigrationLog(file);
    if (!alreadyRun) {
      const sql = fs.readFileSync(`./migrations/${file}`, 'utf8');
      await pool.query(sql);
      await logMigration(file);
      console.log(`✅ Ran migration: ${file}`);
    }
  }
}
```

**Backup Strategy:**
```bash
# Daily automated backup (cron)
pg_dump $DATABASE_URL | gzip > backups/forefront_$(date +%Y%m%d).sql.gz

# Retain last 30 days
find backups/ -mtime +30 -delete
```

### Step 7: CI/CD Pipeline

**GitHub Actions (`.github/workflows/deploy.yml`):**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Backend
        run: cd forefront-backend && npm ci && npm run build
      - name: Build Frontend
        run: npm ci && npm run build
      - name: Build Docker Images
        run: docker compose build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS/Cloud
        run: |
          # Push images to registry
          # SSH/kubectl deploy
          # Run migrations
          # Restart services
```

### Step 8: Scaling Considerations

| Component | Strategy |
|-----------|----------|
| Backend API | Horizontal scaling (multiple instances behind load balancer) |
| Socket.IO | Redis adapter for multi-instance Socket.IO |
| Database | Read replicas for analytics queries |
| Redis | Redis Cluster for high availability |
| Widget CDN | CloudFront / Cloudflare for global distribution |
| Background Jobs | BullMQ workers on separate instances |
| File Storage | S3-compatible storage (AWS S3, DigitalOcean Spaces) |

---

## Deployment Options

| Option | Cost | Complexity | Best For |
|--------|------|------------|----------|
| **VPS (DigitalOcean/Hetzner)** | $20-100/mo | Low | MVP/Early stage |
| **Railway/Render** | $25-200/mo | Low | Quick deployment |
| **AWS (ECS/EKS)** | $100-500/mo | High | Scale |
| **Vercel + Railway** | $20-100/mo | Low | Frontend on Vercel, backend on Railway |

---

## Recommended First Deployment

```
Frontend  → Vercel (free tier for Next.js)
Backend   → Railway or DigitalOcean App Platform
Database  → Supabase (free Postgres + pgvector) or Neon
Redis     → Upstash (free tier)
Widget    → Cloudflare Pages / Vercel Edge
```
