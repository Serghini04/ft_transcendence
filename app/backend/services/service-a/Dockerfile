FROM node:20-alpine

WORKDIR /app

# Copy shared utilities
COPY shared /app/shared

# Copy package files and install all dependencies (including devDependencies for build)
COPY service-a/package*.json ./
RUN npm install

# Copy TypeScript source files
COPY service-a/ .

# Build TypeScript to JavaScript
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

CMD ["npm", "start"]
