# Multi-stage build for TypeScript compilation
FROM node:20.9.0

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

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