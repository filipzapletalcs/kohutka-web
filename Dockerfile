# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code (including .env file for Vite to read VITE_* variables)
# IMPORTANT: .env must be in the same directory as docker-compose.yml/Dockerfile
COPY . .

# Build the application
# Vite will automatically read .env file and embed VITE_* variables into the bundle
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine

WORKDIR /app

# Install production dependencies for server
COPY package*.json ./
RUN npm ci --production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Copy API routes
COPY api ./api

# Copy server file
COPY server.js ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "server.js"]
