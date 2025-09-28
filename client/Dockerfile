# Simple Node.js server Dockerfile
FROM node:20

# Set working directory
WORKDIR /app

# Enable Corepack and prepare Yarn 4.5.1 explicitly
RUN corepack enable && corepack prepare yarn@4.5.1 --activate

# Copy package files for dependency caching
COPY package.json yarn.lock ./

# Configure yarn to use node_modules (avoids PnP issues in Docker)
RUN yarn config set nodeLinker node-modules && \
    yarn config set enableGlobalCache false

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start with dev script (uses ts-node-dev with --transpile-only)
CMD ["yarn", "dev"]