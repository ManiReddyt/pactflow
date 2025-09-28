# Multi-stage build for TypeScript compilation
FROM node:20.9.0-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Install Yarn 4.5.1
RUN corepack enable && corepack prepare yarn@4.5.1 --activate

# Copy package files
COPY . .

# Install all dependencies (including dev dependencies for build)
RUN yarn install

# Build TypeScript
RUN yarn build

# Start the application
CMD ["node", "dist/index.js"]