#!/bin/bash

# Grafana Dashboard Access Guide
# This script helps you access and verify Grafana dashboards

echo "=========================================="
echo "   GRAFANA DASHBOARDS - ACCESS GUIDE"
echo "=========================================="
echo ""

# Check if Grafana is running
if ! docker ps | grep -q grafana; then
    echo "❌ Grafana is not running!"
    echo "   Start it with: docker-compose up -d grafana"
    exit 1
fi

echo "✅ Grafana is running"
echo ""

# Wait for Grafana to be ready
echo "Checking Grafana health..."
sleep 2

# Get dashboard list
echo ""
echo "📊 Available Dashboards:"
echo "=========================================="

DASHBOARDS=$(curl -s -u hidriouc:hidriouc http://localhost:3000/api/search?query=\&type=dash-db)

if [ $? -eq 0 ]; then
    echo "$DASHBOARDS" | jq -r '.[] | "  \(.id). \(.title)\n     URL: http://localhost:3000\(.url)\n     UID: \(.uid)\n"'
else
    echo "❌ Could not retrieve dashboards"
    exit 1
fi

echo "=========================================="
echo ""
echo "🔐 Grafana Credentials:"
echo "   Username: hidriouc"
echo "   Password: hidriouc"
echo ""
echo "🌐 Access Grafana:"
echo "   http://localhost:3000"
echo ""
echo "📋 Quick Links:"
echo "   - Home: http://localhost:3000"
echo "   - Dashboards: http://localhost:3000/dashboards"
echo "   - Data Sources: http://localhost:3000/datasources"
echo "   - Explore: http://localhost:3000/explore"
echo ""
echo "🔧 Dashboard Management:"
echo "   - Import Dashboard: http://localhost:3000/dashboard/import"
echo "   - Create Dashboard: http://localhost:3000/dashboard/new"
echo ""
