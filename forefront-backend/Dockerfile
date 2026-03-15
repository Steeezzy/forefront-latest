FROM node:20-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:20-slim AS runner

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y libgomp1 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy .env for production (contains SARVAM_API_KEY and other secrets)
COPY --from=builder /usr/src/app/.env ./.env

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/migrations ./migrations
COPY --from=builder /usr/src/app/src/db ./src/db


CMD ["npm", "start"]
