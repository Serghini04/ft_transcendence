FROM node:20-alpine AS builder

WORKDIR /app


COPY package*.json ./
COPY tsconfig.json ./


RUN npm install


COPY src ./src


RUN npm run build


FROM node:20-alpine

WORKDIR /app


COPY package*.json ./


RUN npm install --omit=dev


COPY --from=builder /app/dist ./dist


RUN mkdir -p /app/data && chown -R node:node /app/data


USER node


EXPOSE 3030


HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"


CMD ["node", "dist/server.js"]
