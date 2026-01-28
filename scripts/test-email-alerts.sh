#!/bin/bash

# Test Email Alerts Script
# This script helps test Alertmanager email notifications

echo "========================================="
echo "Alertmanager Email Test"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}IMPORTANT: Before testing, you must configure Gmail App Password${NC}"
echo ""
echo "Steps to generate Gmail App Password:"
echo "1. Go to: https://myaccount.google.com/apppasswords"
echo "2. Select 'Mail' and 'Other (Custom name)'"
echo "3. Copy the 16-character password"
echo "4. Edit: infra/monitoring/alertmanager/alertmanager.yml"
echo "5. Replace 'your-16-char-app-password' with your actual password"
echo ""
echo -e "${YELLOW}Press Enter when ready to continue...${NC}"
read

# Check if alertmanager is running
echo ""
echo "Checking Alertmanager status..."
if ! docker ps | grep -q alertmanager; then
    echo -e "${RED}❌ Alertmanager is not running!${NC}"
    echo "Starting monitoring stack..."
    cd /Users/hdriouch/Mmaster
    docker compose up -d alertmanager prometheus
    sleep 5
else
    echo -e "${GREEN}✅ Alertmanager is running${NC}"
fi

# Restart alertmanager to apply config changes
echo ""
echo "Restarting Alertmanager to apply email configuration..."
docker compose restart alertmanager
sleep 3

# Check alertmanager logs
echo ""
echo "Checking Alertmanager logs for errors..."
docker compose logs --tail=20 alertmanager | grep -i error && echo -e "${RED}⚠️  Found errors in logs${NC}" || echo -e "${GREEN}✅ No errors in logs${NC}"

echo ""
echo "========================================="
echo "Test Options:"
echo "========================================="
echo "1. Wait for natural alerts (monitor your services)"
echo "2. Send a test alert via curl"
echo "3. Stop a service to trigger alert (e.g., stop chat-service)"
echo ""
echo "Select option (1-3): "
read option

case $option in
    1)
        echo ""
        echo -e "${GREEN}Monitoring for alerts...${NC}"
        echo "Alertmanager UI: http://localhost:9094"
        echo "Watch your email: hichamdriouch1337@gmail.com"
        echo ""
        echo "To trigger an alert quickly, try in another terminal:"
        echo "  docker compose stop chat-service"
        ;;
    2)
        echo ""
        echo "Sending test alert to Alertmanager..."
        
        # Send test alert
        curl -XPOST http://localhost:9094/api/v1/alerts -d '[
          {
            "labels": {
              "alertname": "TestAlert",
              "severity": "warning",
              "service": "test-service",
              "instance": "localhost"
            },
            "annotations": {
              "summary": "This is a test alert",
              "description": "Testing email notifications from Alertmanager"
            }
          }
        ]'
        
        echo ""
        echo -e "${GREEN}✅ Test alert sent!${NC}"
        echo "Check your email: hichamdriouch1337@gmail.com"
        echo "Check Alertmanager UI: http://localhost:9094"
        ;;
    3)
        echo ""
        echo "Which service do you want to stop?"
        echo "1. chat-service"
        echo "2. game-service"
        echo "3. notification-service"
        echo "4. user_auth"
        echo ""
        echo "Select (1-4): "
        read service_option
        
        case $service_option in
            1) SERVICE="chat-service" ;;
            2) SERVICE="game-service" ;;
            3) SERVICE="notification-service" ;;
            4) SERVICE="user_auth" ;;
            *) SERVICE="chat-service" ;;
        esac
        
        echo ""
        echo -e "${YELLOW}Stopping ${SERVICE}...${NC}"
        docker compose stop $SERVICE
        
        echo ""
        echo -e "${GREEN}Service stopped!${NC}"
        echo "Prometheus will detect the service is down in ~2 minutes"
        echo "Alertmanager will send email shortly after"
        echo ""
        echo "To restart the service later:"
        echo "  docker compose start $SERVICE"
        ;;
esac

echo ""
echo "========================================="
echo "Monitoring Resources:"
echo "========================================="
echo "Alertmanager UI: http://localhost:9094"
echo "Prometheus UI:   http://localhost:9090"
echo "Grafana:         http://localhost:3000"
echo ""
echo "View active alerts:"
echo "  curl http://localhost:9094/api/v1/alerts | jq"
echo ""
echo "View Alertmanager logs:"
echo "  docker compose logs -f alertmanager"
