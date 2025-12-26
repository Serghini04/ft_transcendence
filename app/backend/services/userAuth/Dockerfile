FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY ./package*.json ./

# Install dependencies
RUN npm install

COPY ./src ./src
COPY ./tsconfig.json ./

RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

CMD ["npm", "start"]
