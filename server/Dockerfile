# Simple single-stage build - using standard Node image
FROM node:20

# Set working directory
WORKDIR /app

# Enable Corepack for Yarn 4.5.1
RUN corepack enable

# Copy package files first for better caching
COPY package.json yarn.lock ./
COPY .yarnrc.yml ./ 2>/dev/null || true

# Install all dependencies with node-modules linker for better Docker compatibility
RUN YARN_ENABLE_GLOBAL_CACHE=false yarn install

# Copy rest of source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application using your existing dev script
CMD ["yarn", "dev"]