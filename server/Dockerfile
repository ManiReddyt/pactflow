# Multi-stage build for TypeScript compilation
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json yarn.lock ./

# Install all dependencies (including dev dependencies for build)
RUN yarn install --frozen-lockfile

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN yarn build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]