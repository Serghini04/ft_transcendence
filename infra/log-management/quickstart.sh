#!/bin/bash

# Quick Start Guide for ELK Stack

echo "==================================="
echo "ELK Stack Quick Start Guide"
echo "==================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✓ Docker is running"
echo ""

# Set system parameters for Elasticsearch
echo "📋 Setting system parameters for Elasticsearch..."
sudo sysctl -w vm.max_map_count=262144 2>/dev/null || echo "⚠️  Could not set vm.max_map_count (may need sudo)"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp infra/log-management/.env.example .env
    echo "⚠️  Please update passwords in .env file before production use!"
    echo ""
fi

# Start ELK stack
echo "🚀 Starting ELK Stack..."
echo ""
docker-compose up -d elasticsearch

echo "⏳ Waiting for Elasticsearch to be ready (this may take 1-2 minutes)..."
until curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; do
    echo -n "."
    sleep 5
done
echo ""
echo "✓ Elasticsearch is ready"
echo ""

# Start other components
echo "🚀 Starting Logstash, Kibana, and Filebeat..."
docker-compose up -d logstash kibana filebeat

echo "⏳ Waiting for services to be healthy..."
sleep 15

echo ""
echo "✅ ELK Stack is starting up!"
echo ""
echo "📊 Access URLs:"
echo "  - Elasticsearch: http://localhost:9200"
echo "  - Kibana:        http://localhost:5601"
echo "  - Logstash:      http://localhost:9600"
echo ""
echo "🔐 Default Credentials:"
echo "  Username: elastic"
echo "  Password: changeme (update in .env file)"
echo ""
echo "📖 Next Steps:"
echo "  1. Wait for all services to be fully ready (~2 minutes)"
echo "  2. Run: ./infra/log-management/setup-elk.sh"
echo "  3. Access Kibana: http://localhost:5601"
echo "  4. Test logging: ./infra/log-management/test-elk.sh"
echo ""
echo "📚 Full documentation: infra/log-management/README.md"
echo ""
