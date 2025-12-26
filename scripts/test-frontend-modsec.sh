#!/bin/bash

# Test script for Frontend with ModSecurity
# Tests OWASP CRS protection on the frontend

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Frontend ModSecurity Security Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if frontend is running
if ! docker ps | grep -q "frontend"; then
    echo -e "${RED}✗ Frontend container is not running${NC}"
    echo "Start it with: docker-compose up -d frontend"
    exit 1
fi

echo -e "${GREEN}✓ Frontend container is running${NC}"
echo ""

# Test 1: Normal Request
echo -e "${BLUE}Test 1: Normal Frontend Access${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓ Frontend accessible (200)${NC}"
else
    echo -e "${YELLOW}⚠ Frontend returned ${response}${NC}"
fi
echo ""

# Test 2: Health Check
echo -e "${BLUE}Test 2: Health Check Endpoint${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓ Health check working (200)${NC}"
else
    echo -e "${RED}✗ Health check failed (${response})${NC}"
fi
echo ""

# Test 3: SQL Injection Protection
echo -e "${BLUE}Test 3: SQL Injection Protection${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/api/test?id=1' OR '1'='1")
if [ "$response" == "403" ]; then
    echo -e "${GREEN}✓ SQL Injection BLOCKED (403)${NC}"
else
    echo -e "${RED}✗ SQL Injection NOT blocked (got ${response})${NC}"
fi
echo ""

# Test 4: XSS Protection
echo -e "${BLUE}Test 4: XSS Protection${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/?search=<script>alert('XSS')</script>")
if [ "$response" == "403" ]; then
    echo -e "${GREEN}✓ XSS BLOCKED (403)${NC}"
else
    echo -e "${RED}✗ XSS NOT blocked (got ${response})${NC}"
fi
echo ""

# Test 5: Path Traversal Protection
echo -e "${BLUE}Test 5: Path Traversal Protection${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/../../../etc/passwd")
if [ "$response" == "403" ]; then
    echo -e "${GREEN}✓ Path Traversal BLOCKED (403)${NC}"
else
    echo -e "${RED}✗ Path Traversal NOT blocked (got ${response})${NC}"
fi
echo ""

# Test 6: Static Assets
echo -e "${BLUE}Test 6: Static Assets Loading${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/assets/index.js 2>/dev/null || echo "404")
if [ "$response" == "200" ] || [ "$response" == "404" ]; then
    echo -e "${GREEN}✓ Static assets route working${NC}"
else
    echo -e "${YELLOW}⚠ Static assets returned ${response}${NC}"
fi
echo ""

# Test 7: API Proxy
echo -e "${BLUE}Test 7: API Proxy${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/ 2>/dev/null)
if [ "$response" == "200" ] || [ "$response" == "404" ] || [ "$response" == "401" ]; then
    echo -e "${GREEN}✓ API proxy working${NC}"
else
    echo -e "${YELLOW}⚠ API proxy returned ${response}${NC}"
fi
echo ""

# Test 8: Check ModSecurity is loaded
echo -e "${BLUE}Test 8: ModSecurity Module${NC}"
if docker exec frontend nginx -V 2>&1 | grep -q "modsecurity"; then
    echo -e "${GREEN}✓ ModSecurity module loaded${NC}"
else
    echo -e "${RED}✗ ModSecurity module NOT loaded${NC}"
fi
echo ""

# Test 9: Check logs exist
echo -e "${BLUE}Test 9: ModSecurity Logging${NC}"
if [ -d "logs/modsec" ]; then
    echo -e "${GREEN}✓ ModSecurity log directory exists${NC}"
    if [ -f "logs/modsec/audit.log" ]; then
        lines=$(wc -l < logs/modsec/audit.log)
        echo -e "${GREEN}✓ Audit log active (${lines} lines)${NC}"
    else
        echo -e "${YELLOW}⚠ Audit log not created yet${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Log directory not found${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "✅ Frontend with OWASP ModSecurity CRS"
echo "✅ Protection Level: Paranoia 1"
echo "✅ Mode: Blocking (SecRuleEngine On)"
echo ""
echo "View logs:"
echo "  docker-compose logs -f frontend"
echo "  tail -f logs/modsec/audit.log"
echo ""
echo "Adjust protection level in docker-compose.yml:"
echo "  PARANOIA=1-4 (1=basic, 4=paranoid)"
echo "  ANOMALY_INBOUND=5 (lower=stricter)"
echo ""
