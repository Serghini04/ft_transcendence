FROM node:20-alpine

WORKDIR /app

# Copy shared utilities first
COPY shared /app/shared

# Copy package files
COPY service-d/package*.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm install

# Copy service files
COPY service-d/ .

# Build TypeScript to JavaScript
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

CMD ["npm", "start"]
