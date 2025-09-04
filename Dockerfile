FROM node:22
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm

# Install all dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build for production
RUN pnpm build

# Default to production, but can be overridden
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
