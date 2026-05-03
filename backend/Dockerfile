# Stage 1: Build Environment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Production Environment
FROM node:20-alpine

WORKDIR /app

# Only copy the package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the compiled JavaScript from the builder stage
COPY --from=builder /app/dist ./dist

# Copy drizzle config and schema for db:push migrations
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Expose the API port
EXPOSE 5000

# Run database migrations before starting the server
CMD npm run db:push && node dist/server.js
