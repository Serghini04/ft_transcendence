FROM node:20-alpine


WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy service files into /app (build context is the service folder)
COPY . /app

# Install dependencies and build in /app so output goes to /app/dist
RUN npm install
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# If build emitted compiled files under dist/app (because rootDir referenced parent),
# move them up so `dist/src/index.js` path exists as expected by `npm start`.
RUN if [ -d dist/app ]; then mv dist/app/* dist/ || true; rm -rf dist/app || true; fi

CMD ["npm", "start"]
