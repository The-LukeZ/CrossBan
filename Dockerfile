FROM node:22 AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN pnpm install
COPY . .
CMD ["pnpm", "run", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production
RUN pnpm install --prod --frozen-lockfile
COPY . .
RUN pnpm build
CMD ["node", "dist/index.js"]