#!/bin/bash

# Test ELK Stack - Send sample logs to test the pipeline

set -e

LOGSTASH_HOST=${LOGSTASH_HOST:-localhost}
LOGSTASH_PORT=${LOGSTASH_PORT:-5000}

echo "🧪 Testing ELK Stack Log Pipeline..."
echo "Target: $LOGSTASH_HOST:$LOGSTASH_PORT"
echo ""

# Test 1: Send INFO log
echo "📝 Test 1: Sending INFO log..."
echo '{
  "timestamp": "'$(date -Iseconds)'",
  "service_name": "test-service",
  "log_level": "INFO",
  "message": "Test INFO log message",
  "user_id": "test-user-123",
  "request_id": "req-001"
}' | nc $LOGSTASH_HOST $LOGSTASH_PORT
echo "✓ INFO log sent"

sleep 1

# Test 2: Send ERROR log
echo "📝 Test 2: Sending ERROR log..."
echo '{
  "timestamp": "'$(date -Iseconds)'",
  "service_name": "test-service",
  "log_level": "ERROR",
  "message": "Test error occurred",
  "error": {
    "message": "Connection timeout",
    "stack_trace": "at Connection.connect (connection.js:45)"
  },
  "request_id": "req-002"
}' | nc $LOGSTASH_HOST $LOGSTASH_PORT
echo "✓ ERROR log sent"

sleep 1

# Test 3: Send API Gateway log
echo "📝 Test 3: Sending API Gateway log..."
echo '{
  "timestamp": "'$(date -Iseconds)'",
  "service_name": "api-gateway",
  "log_level": "INFO",
  "client_ip": "203.0.113.42",
  "http_method": "GET",
  "request_path": "/api/users/123",
  "response_code": 200,
  "response_time_ms": 45.3
}' | nc $LOGSTASH_HOST $LOGSTASH_PORT
echo "✓ API Gateway log sent"

sleep 1

# Test 4: Send Security event
echo "📝 Test 4: Sending Security event..."
echo '{
  "timestamp": "'$(date -Iseconds)'",
  "service_name": "user-auth",
  "log_level": "WARN",
  "message": "Failed login attempt",
  "event_type": "authentication",
  "user_id": "user-456",
  "client_ip": "198.51.100.23",
  "tags": ["security"]
}' | nc $LOGSTASH_HOST $LOGSTASH_PORT
echo "✓ Security event sent"

sleep 1

# Test 5: Send slow response
echo "📝 Test 5: Sending slow response log..."
echo '{
  "timestamp": "'$(date -Iseconds)'",
  "service_name": "game-service",
  "log_level": "WARN",
  "message": "Slow database query",
  "response_time_ms": 5500,
  "query": "SELECT * FROM games WHERE status = active"
}' | nc $LOGSTASH_HOST $LOGSTASH_PORT
echo "✓ Slow response log sent"

echo ""
echo "✅ All test logs sent successfully!"
echo ""
echo "📊 To view logs in Kibana:"
echo "  1. Open http://localhost:5601"
echo "  2. Go to Discover"
echo "  3. Search for: service_name:\"test-service\""
echo ""
echo "🔍 To verify in Elasticsearch:"
echo "  curl -X GET 'http://localhost:9200/logs-*/_search?q=service_name:test-service&pretty' -u elastic:PASSWORD"
echo ""
