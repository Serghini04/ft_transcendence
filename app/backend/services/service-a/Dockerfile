FROM node:20-alpine

WORKDIR /app


COPY shared /app/shared


COPY service-a/package*.json ./
RUN npm install


COPY service-a/ .


RUN npm run build

RUN npm prune --production

CMD ["npm", "start"]
