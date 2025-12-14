
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM owasp/modsecurity-crs:nginx

COPY nginx.conf /etc/nginx/templates/conf.d/default.conf.template

COPY --from=builder /app/dist /usr/share/nginx/html

ENV MODSEC_RULE_ENGINE=On
ENV PARANOIA=2
ENV ANOMALY_INBOUND=5
ENV ANOMALY_OUTBOUND=4

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
