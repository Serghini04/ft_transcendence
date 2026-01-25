FROM hashicorp/vault:1.15

RUN apk add --no-cache \
    curl \
    jq \
    openssl \
    ca-certificates \
    bash

RUN mkdir -p \
    /vault/data \
    /vault/logs \
    /vault/config \
    /vault/config/tls \
    /vault/policies \
    /vault/scripts

RUN chown -R vault:vault /vault

COPY config.hcl /vault/config/config.hcl
COPY policies/ /vault/policies/
COPY scripts/ /vault/scripts/

RUN chmod +x /vault/scripts/*.sh

EXPOSE 8200

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
    CMD vault status || exit 1

USER vault

ENTRYPOINT ["/bin/bash", "/vault/scripts/entrypoint.sh"]
