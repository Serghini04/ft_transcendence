
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM owasp/modsecurity-crs:nginx

# Install OpenSSL for certificate generation
RUN apk add --no-cache openssl

# Create SSL directory and generate self-signed certificate
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx-selfsigned.key \
    -out /etc/nginx/ssl/nginx-selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=production.transcendence"

COPY ../../infra/nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

ENV MODSEC_RULE_ENGINE=On
ENV PARANOIA=2
ENV ANOMALY_INBOUND=5
ENV ANOMALY_OUTBOUND=4

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider --no-check-certificate https://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
