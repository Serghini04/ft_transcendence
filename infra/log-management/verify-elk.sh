#!/bin/bash

# Verify ELK Stack is running properly

echo "🔍 Verifying ELK Stack Installation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Check Elasticsearch
echo -n "Checking Elasticsearch... "
if curl -s http://localhost:9200/_cluster/health > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
    CLUSTER_HEALTH=$(curl -s http://localhost:9200/_cluster/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "  Cluster status: $CLUSTER_HEALTH"
else
    echo -e "${RED}✗ Not responding${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Logstash
echo -n "Checking Logstash... "
if curl -s http://localhost:9600/?pretty > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
    PIPELINE_STATUS=$(curl -s http://localhost:9600/_node/stats/pipelines?pretty | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  Pipeline status: ${PIPELINE_STATUS:-active}"
else
    echo -e "${RED}✗ Not responding${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Kibana
echo -n "Checking Kibana... "
if curl -s http://localhost:5601/api/status > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Filebeat
echo -n "Checking Filebeat... "
if docker ps | grep filebeat | grep -q Up; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check indices
echo "📚 Checking Elasticsearch indices..."
INDICES=$(curl -s "http://localhost:9200/_cat/indices?v" 2>/dev/null)
if [ -n "$INDICES" ]; then
    echo "$INDICES" | head -5
else
    echo -e "${YELLOW}⚠️  No indices found yet${NC}"
fi

echo ""

# Summary
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All ELK components are running properly!${NC}"
    echo ""
    echo "📊 You can now:"
    echo "  1. Access Kibana: http://localhost:5601"
    echo "  2. Send test logs: ./infra/log-management/test-elk.sh"
    echo "  3. Query logs: curl http://localhost:9200/logs-*/_search?pretty"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS issue(s)${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "  - Check logs: docker-compose logs elasticsearch logstash kibana"
    echo "  - Restart services: docker-compose restart elasticsearch logstash kibana"
    echo "  - View documentation: infra/log-management/README.md"
    exit 1
fi
