FROM node:20-alpine

WORKDIR /app


COPY shared /app/shared


COPY service-d/package*.json ./


RUN npm install


COPY service-d/ .


RUN npm run build


RUN npm prune --production

CMD ["npm", "start"]
