FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY ./package*.json ./

# Clean install to ensure native modules are built for Alpine Linux
RUN npm ci --only=production=false

COPY ./src ./src
COPY ./tsconfig.json ./

RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

CMD ["npm", "start"]
