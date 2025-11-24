#!/bin/bash

# Service Testing Script
# Tests all Kafka microservices endpoints

echo "🧪 Testing Kafka Microservices"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
  local service=$1
  local port=$2
  local endpoint=$3
  local method=${4:-GET}
  
  echo -e "${BLUE}Testing ${service}${NC} - ${method} http://localhost:${port}${endpoint}"
  
  if [ "$method" == "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" http://localhost:${port}${endpoint})
  else
    response=$(curl -s -w "\n%{http_code}" -X ${method} http://localhost:${port}${endpoint} \
      -H "Content-Type: application/json" \
      -d '{"userId": 999, "userName": "TestUser", "event": "USER_CREATED"}')
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
    echo -e "${GREEN}✓ Success${NC} (HTTP $http_code)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}✗ Failed${NC} (HTTP $http_code)"
    echo "$body"
  fi
  echo ""
}

# Test Service-A (Producer)
echo "📤 SERVICE-A (Producer) - Port 3010"
echo "------------------------------------"
test_endpoint "Service-A" 3010 "/health"
test_endpoint "Service-A" 3010 "/status"
test_endpoint "Service-A" 3010 "/send" "POST"
echo ""

# Test Service-B (Consumer)
echo "📥 SERVICE-B (Consumer) - Port 3011"
echo "------------------------------------"
test_endpoint "Service-B" 3011 "/health"
test_endpoint "Service-B" 3011 "/status"
test_endpoint "Service-B" 3011 "/stats"
test_endpoint "Service-B" 3011 "/messages?limit=3"
test_endpoint "Service-B" 3011 "/messages/latest"
echo ""

# Test Service-C (Consumer)
echo "📥 SERVICE-C (Consumer) - Port 3012"
echo "------------------------------------"
test_endpoint "Service-C" 3012 "/health"
test_endpoint "Service-C" 3012 "/status"
test_endpoint "Service-C" 3012 "/stats"
test_endpoint "Service-C" 3012 "/messages?limit=3"
test_endpoint "Service-C" 3012 "/messages/latest"
echo ""

# Test Service-D (Consumer)
echo "📥 SERVICE-D (Consumer) - Port 3013"
echo "------------------------------------"
test_endpoint "Service-D" 3013 "/health"
test_endpoint "Service-D" 3013 "/status"
test_endpoint "Service-D" 3013 "/stats"
test_endpoint "Service-D" 3013 "/messages?limit=3"
test_endpoint "Service-D" 3013 "/messages/latest"
echo ""

echo "================================"
echo "✅ Testing Complete!"
echo ""
echo "Quick Commands:"
echo "  - Send message:  curl -X POST http://localhost:3010/send -H 'Content-Type: application/json' -d '{\"userId\": 123, \"userName\": \"Ali\"}'"
echo "  - View messages: curl http://localhost:3011/messages"
echo "  - Check stats:   curl http://localhost:3011/stats"
echo "  - Reset history: curl -X POST http://localhost:3011/reset"
