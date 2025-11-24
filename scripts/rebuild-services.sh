#!/bin/bash

# Rebuild and restart Kafka services
# Usage: ./rebuild-services.sh [service-name]
# Example: ./rebuild-services.sh service-a
# Or: ./rebuild-services.sh all

SERVICE=$1

if [ -z "$SERVICE" ]; then
  echo "Usage: $0 [service-name|all]"
  echo "Available services: service-a, service-b, service-c, service-d, all"
  exit 1
fi

echo "🔨 Rebuilding Kafka Services"
echo "=============================="
echo ""

rebuild_service() {
  local service=$1
  echo "🔄 Rebuilding $service..."
  docker-compose build --no-cache $service
  echo "🚀 Restarting $service..."
  docker-compose up -d $service
  echo "✅ $service restarted"
  echo ""
}

if [ "$SERVICE" == "all" ]; then
  echo "📦 Rebuilding all services..."
  rebuild_service service-a
  rebuild_service service-b
  rebuild_service service-c
  rebuild_service service-d
else
  rebuild_service $SERVICE
fi

echo "=============================="
echo "✅ Rebuild Complete!"
echo ""
echo "Check logs with:"
echo "  docker logs -f $SERVICE"
echo ""
echo "Test services with:"
echo "  ./scripts/test-services.sh"
