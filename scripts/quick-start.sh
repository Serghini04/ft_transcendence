#!/bin/bash

set -e

echo "🚀 ft_transcendence - Quick Setup"
echo "=================================="
echo ""

# Check if .env.vault exists
if [ ! -f ".env.vault" ]; then
    echo "⚠️  .env.vault not found!"
    echo ""
    echo "Creating .env.vault from template..."
    
    if [ -f ".env.vault.example" ]; then
        cp .env.vault.example .env.vault
        echo "✅ Created .env.vault"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env.vault with your actual secrets before continuing!"
        echo ""
        echo "Current default secrets:"
        cat .env.vault
        echo ""
        read -p "Do you want to edit .env.vault now? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env.vault
        else
            echo "⚠️  Remember to edit .env.vault before starting services!"
            exit 0
        fi
    else
        echo "❌ .env.vault.example not found!"
        exit 1
    fi
else
    echo "✅ .env.vault found"
fi

echo ""
echo "📦 Building and starting services..."
echo ""

# Build and start services
docker-compose up --build -d

echo ""
echo "⏳ Waiting for Vault to be ready..."

# Wait for Vault to be healthy
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker exec vault vault status > /dev/null 2>&1; then
        echo "✅ Vault is ready!"
        break
    fi
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Vault failed to start within timeout"
    echo "Check logs with: docker logs vault"
    exit 1
fi

echo ""
echo "🔍 Verifying Vault secrets..."
if docker exec vault vault kv get secret/app > /dev/null 2>&1; then
    echo "✅ Secrets loaded successfully!"
    echo ""
    docker exec vault vault kv get secret/app
else
    echo "⚠️  Secrets not found, trying to initialize..."
    docker exec vault /vault/scripts/auto-init-secrets.sh
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📍 Access the application:"
echo "   Frontend:    http://localhost:5173"
echo "   API Gateway: http://localhost:8080"
echo "   Grafana:     http://localhost:3030 (admin/admin)"
echo "   Kibana:      http://localhost:5601"
echo "   Prometheus:  http://localhost:9090"
echo "   Kafka UI:    http://localhost:9099"
echo ""
echo "📋 Useful commands:"
echo "   docker-compose logs -f        # View logs"
echo "   docker-compose ps             # Check services"
echo "   make vault-status             # Check Vault"
echo "   make vault-secrets            # View secrets"
echo ""
echo "📖 Documentation: docs/vault-automation.md"
