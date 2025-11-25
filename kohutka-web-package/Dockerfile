# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for Vite (client-side variables)
# These MUST be available at build time for Vite to embed them
ARG VITE_FACEBOOK_APP_ID
ARG VITE_FACEBOOK_PAGE_ACCESS_TOKEN
ARG VITE_FACEBOOK_PAGE_ID

# Set as environment variables for the build process
ENV VITE_FACEBOOK_APP_ID=$VITE_FACEBOOK_APP_ID
ENV VITE_FACEBOOK_PAGE_ACCESS_TOKEN=$VITE_FACEBOOK_PAGE_ACCESS_TOKEN
ENV VITE_FACEBOOK_PAGE_ID=$VITE_FACEBOOK_PAGE_ID

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (Vite will use the ENV variables above)
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
