#!/bin/bash

echo "Testing Kafka Integration for TicTac Service"
echo "=============================================="
echo ""

USER_ID="test-user-$(date +%s)"
USERNAME="testuser_$(date +%s | tail -c 4)"

echo "Creating test user: $USER_ID with username: $USERNAME"
echo ""

# Create user-created event
EVENT_CREATED=$(cat <<EOF
{"type":"user-created","data":{"id":"$USER_ID","username":"$USERNAME","email":"test@example.com","createdAt":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}}
EOF
)

# Create user-updated event  
EVENT_UPDATED=$(cat <<EOF
{"type":"user-updated","data":{"id":"$USER_ID","username":"${USERNAME}_updated","updatedAt":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}}
EOF
)

# Run a temporary container to produce to Kafka
echo "Sending user-created event..."
docker run --rm --network ft_transc_ft_Transc \
  confluentinc/cp-kafka:latest \
  bash -c "echo '$EVENT_CREATED' | kafka-console-producer --bootstrap-server kafka:9092 --topic user-events"

if [ $? -eq 0 ]; then
  echo "✅ user-created event sent"
else
  echo "❌ Failed to send user-created event"
fi

sleep 2

echo ""
echo "Sending user-updated event..."
docker run --rm --network ft_transc_ft_Transc \
  confluentinc/cp-kafka:latest \
  bash -c "echo '$EVENT_UPDATED' | kafka-console-producer --bootstrap-server kafka:9092 --topic user-events"

if [ $? -eq 0 ]; then
  echo "✅ user-updated event sent"
else
  echo "❌ Failed to send user-updated event"
fi

echo ""
echo "Checking tictac service logs (last 20 lines)..."
docker logs --tail 20 tictac-service 2>&1 | grep -E "User|user-|Event|✅|📨" || echo "No user events in logs (check if service is running)"

echo ""
echo "Test completed!"
