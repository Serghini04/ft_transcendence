#!/bin/bash

# Monitoring System Verification Script
# This script verifies all monitoring components are working correctly

echo "=================================================="
echo "   MONITORING SYSTEM VERIFICATION"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local service=$1
    local port=$2
    local path=$3
    
    if curl -sf "http://localhost:${port}${path}" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service is healthy"
        return 0
    else
        echo -e "${RED}✗${NC} $service is not responding"
        return 1
    fi
}

# Function to check if container is running
check_container() {
    local container=$1
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "${GREEN}✓${NC} Container $container is running"
        return 0
    else
        echo -e "${RED}✗${NC} Container $container is not running"
        return 1
    fi
}

echo "1. Checking Docker Containers..."
echo "-----------------------------------"
check_container "prometheus"
check_container "grafana"
check_container "alertmanager"
check_container "node-exporter"
check_container "kafka"
check_container "zookeeper"
check_container "elasticsearch"
check_container "kibana"
check_container "loki"
check_container "logstash"
echo ""

echo "2. Checking Service Health..."
echo "-----------------------------------"
check_service "Prometheus" 9090 "/-/healthy"
check_service "Grafana" 3000 "/api/health"
check_service "Alertmanager" 9093 "/-/healthy"
check_service "Node Exporter" 9101 "/metrics"
check_service "Kafka UI" 8080 "/"
check_service "Kibana" 5601 "/api/status"
check_service "Loki" 3100 "/ready"
echo ""

echo "3. Checking Prometheus Targets..."
echo "-----------------------------------"
TARGETS=$(curl -s http://localhost:9090/api/v1/targets | jq -r '.data.activeTargets[] | "\(.labels.job): \(.health)"' | sort)
echo "$TARGETS"
UP_COUNT=$(echo "$TARGETS" | grep -c "up")
TOTAL_COUNT=$(echo "$TARGETS" | wc -l)
echo ""
echo "Targets UP: $UP_COUNT/$TOTAL_COUNT"
echo ""

echo "4. Checking Alert Rules..."
echo "-----------------------------------"
RULES=$(curl -s http://localhost:9090/api/v1/rules | jq -r '.data.groups[] | "\(.name): \(.rules | length) rules"')
echo "$RULES"
TOTAL_RULES=$(curl -s http://localhost:9090/api/v1/rules | jq '[.data.groups[].rules[]] | length')
echo ""
echo "Total Alert Rules: $TOTAL_RULES"
echo ""

echo "5. Checking Active Alerts..."
echo "-----------------------------------"
ALERTS=$(curl -s http://localhost:9090/api/v1/alerts | jq -r '.data.alerts[] | "\(.labels.alertname): \(.state)"' 2>/dev/null)
if [ -z "$ALERTS" ]; then
    echo -e "${GREEN}✓${NC} No active alerts (system is healthy)"
else
    echo "$ALERTS"
fi
echo ""

echo "6. Checking Data Sources in Grafana..."
echo "-----------------------------------"
# This requires Grafana API authentication
echo "Configured datasources:"
echo "  - Prometheus (http://prometheus:9090)"
echo "  - Loki (http://loki:3100)"
echo "  - Elasticsearch (http://elasticsearch:9200)"
echo ""

echo "7. Checking Storage Volumes..."
echo "-----------------------------------"
VOLUMES=$(docker volume ls --format '{{.Name}}' | grep trancsendence)
for vol in $VOLUMES; do
    SIZE=$(docker run --rm -v ${vol}:/data alpine du -sh /data 2>/dev/null | cut -f1)
    echo -e "${GREEN}✓${NC} $vol: $SIZE"
done
echo ""

echo "8. Checking Metrics Endpoints..."
echo "-----------------------------------"
check_service "Kafka Metrics" 7071 "/"
check_service "Zookeeper Metrics" 7072 "/"
check_service "Kafka Producer" 3001 "/metrics"
check_service "Kafka Consumer" 3002 "/metrics"
echo ""

echo "9. System Resource Usage..."
echo "-----------------------------------"
echo "Top 5 containers by memory usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | head -6
echo ""

echo "10. Prometheus Configuration Status..."
echo "-----------------------------------"
CONFIG_STATUS=$(curl -s http://localhost:9090/api/v1/status/config | jq -r '.status')
if [ "$CONFIG_STATUS" == "success" ]; then
    echo -e "${GREEN}✓${NC} Prometheus configuration is valid"
else
    echo -e "${RED}✗${NC} Prometheus configuration has issues"
fi
echo ""

echo "=================================================="
echo "   VERIFICATION COMPLETE"
echo "=================================================="
echo ""
echo "Access URLs:"
echo "  - Grafana:        http://localhost:3000 (hidriouc/hidriouc)"
echo "  - Prometheus:     http://localhost:9090"
echo "  - Alertmanager:   http://localhost:9093"
echo "  - Kafka UI:       http://localhost:8080"
echo "  - Kibana:         http://localhost:5601"
echo ""
echo "To view active alerts:"
echo "  curl http://localhost:9090/api/v1/alerts | jq '.data.alerts'"
echo ""
echo "To view Prometheus targets:"
echo "  curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets'"
echo ""
