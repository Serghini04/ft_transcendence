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

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD vault status || exit 1

USER vault

ENTRYPOINT ["vault"]

# Dev mode - auto-initialized and unsealed
CMD ["server", "-dev", "-dev-root-token-id=dev-root-token", "-dev-listen-address=0.0.0.0:8200"]
