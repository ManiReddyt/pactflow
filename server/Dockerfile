# Simple single-stage build - using standard Node image
FROM node:20

# Set working directory
WORKDIR /app

# Enable Corepack for Yarn 4.5.1
RUN corepack enable

# Copy package files first for better caching
COPY package.json yarn.lock .yarnrc.yml  ./


# Install all dependencies with node-modules linker for better Docker compatibility
RUN YARN_ENABLE_GLOBAL_CACHE=false yarn install

# Copy rest of source code
COPY . .

# Build TypeScript
RUN yarn build

# Start the application
CMD ["node", "dist/index.js"]
