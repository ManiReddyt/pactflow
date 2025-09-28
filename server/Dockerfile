# Simple single-stage build - using standard Node image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json yarn.lock ./

# Enable Corepack for Yarn 4.5.1
RUN corepack enable


# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build

# Expose port (adjust if needed)
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
