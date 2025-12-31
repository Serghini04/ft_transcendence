#!/bin/bash

# ELK Stack Setup Script for ft_transcendence
# This script initializes the ELK stack with proper configurations

set -e

echo "🚀 Setting up ELK Stack for Log Management..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Wait for Elasticsearch to be ready
echo -e "${YELLOW}⏳ Waiting for Elasticsearch to be ready...${NC}"
until curl -s -X GET "http://localhost:9200/_cluster/health?wait_for_status=yellow&timeout=60s" > /dev/null; do
    echo "Waiting for Elasticsearch..."
    sleep 5
done
echo -e "${GREEN}✓ Elasticsearch is ready${NC}"

# Set default password for elastic user
echo -e "${YELLOW}🔐 Setting up Elasticsearch security...${NC}"
docker exec elasticsearch bin/elasticsearch-reset-password -u elastic -b -s --auto > /tmp/elastic-password.txt
ELASTIC_PASSWORD=$(cat /tmp/elastic-password.txt | tail -n 1)

# Set password for kibana_system user
docker exec elasticsearch bin/elasticsearch-reset-password -u kibana_system -b -s --auto > /tmp/kibana-password.txt
KIBANA_PASSWORD=$(cat /tmp/kibana-password.txt | tail -n 1)

echo -e "${GREEN}✓ Passwords generated${NC}"
echo "Elastic Password: $ELASTIC_PASSWORD"
echo "Kibana Password: $KIBANA_PASSWORD"

# Create ILM policy
echo -e "${YELLOW}📋 Creating Index Lifecycle Management policy...${NC}"
curl -X PUT "http://localhost:9200/_ilm/policy/logs-policy" \
  -u "elastic:$ELASTIC_PASSWORD" \
  -H 'Content-Type: application/json' \
  -d @./infra/log-management/elasticsearch/index-lifecycle-policy.json

echo -e "${GREEN}✓ ILM policy created${NC}"

# Create index template
echo -e "${YELLOW}📝 Creating index template...${NC}"
curl -X PUT "http://localhost:9200/_index_template/logs-template" \
  -u "elastic:$ELASTIC_PASSWORD" \
  -H 'Content-Type: application/json' \
  -d @./infra/log-management/elasticsearch/index-templates.json

echo -e "${GREEN}✓ Index template created${NC}"

# Create initial index
echo -e "${YELLOW}📚 Creating initial log index...${NC}"
curl -X PUT "http://localhost:9200/logs-000001" \
  -u "elastic:$ELASTIC_PASSWORD" \
  -H 'Content-Type: application/json' \
  -d '{
    "aliases": {
      "logs": {
        "is_write_index": true
      }
    }
  }'

echo -e "${GREEN}✓ Initial index created${NC}"

# Create error logs index
curl -X PUT "http://localhost:9200/errors-$(date +%Y.%m.%d)" \
  -u "elastic:$ELASTIC_PASSWORD" \
  -H 'Content-Type: application/json' \
  -d '{
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0
    }
  }'

# Create security logs index
curl -X PUT "http://localhost:9200/security-logs-$(date +%Y.%m.%d)" \
  -u "elastic:$ELASTIC_PASSWORD" \
  -H 'Content-Type: application/json' \
  -d '{
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0
    }
  }'

# Create role for log management
echo -e "${YELLOW}👤 Creating log management roles...${NC}"
curl -X POST "http://localhost:9200/_security/role/log_manager" \
  -u "elastic:$ELASTIC_PASSWORD" \
  -H 'Content-Type: application/json' \
  -d '{
    "cluster": ["manage_index_templates", "monitor", "manage_ilm"],
    "indices": [
      {
        "names": ["logs-*", "errors-*", "security-logs-*"],
        "privileges": ["all"]
      }
    ]
  }'

echo -e "${GREEN}✓ Roles created${NC}"

# Save passwords to env file
echo -e "${YELLOW}💾 Saving credentials...${NC}"
cat > .env.elk << EOF
ELASTIC_PASSWORD=$ELASTIC_PASSWORD
KIBANA_PASSWORD=$KIBANA_PASSWORD
ELASTICSEARCH_URL=http://localhost:9200
KIBANA_URL=http://localhost:5601
EOF

echo -e "${GREEN}✓ Credentials saved to .env.elk${NC}"

echo ""
echo -e "${GREEN}✅ ELK Stack setup completed successfully!${NC}"
echo ""
echo "📊 Access Points:"
echo "  - Elasticsearch: http://localhost:9200"
echo "  - Kibana: http://localhost:5601"
echo "  - Logstash: http://localhost:9600"
echo ""
echo "🔐 Credentials saved in .env.elk"
echo ""
echo "📖 Next steps:"
echo "  1. Access Kibana at http://localhost:5601"
echo "  2. Login with username: elastic"
echo "  3. Password is in .env.elk file"
echo "  4. Create index patterns: logs-*, errors-*, security-logs-*"
echo "  5. Import dashboards from infra/log-management/kibana/dashboards/"
echo ""
