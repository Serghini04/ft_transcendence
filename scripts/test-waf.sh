#!/bin/bash

# Quick Test Script for WAF/ModSecurity
# Tests basic security features

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=================================="
echo "WAF/ModSecurity Quick Test"
echo "=================================="
echo ""

# Check if WAF is running
if ! docker ps | grep -q "waf"; then
    echo -e "${RED}✗ WAF container is not running${NC}"
    echo "Start it with: docker-compose up -d waf"
    exit 1
fi

echo -e "${GREEN}✓ WAF container is running${NC}"
echo ""

# Test 1: Normal Request
echo "Test 1: Normal Request"
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$response" == "200" ] || [ "$response" == "302" ]; then
    echo -e "${GREEN}✓ Normal request works (${response})${NC}"
else
    echo -e "${YELLOW}⚠ Normal request returned ${response}${NC}"
fi

# Test 2: SQL Injection
echo "Test 2: SQL Injection Protection"
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/api/test?id=1' OR '1'='1")
if [ "$response" == "403" ]; then
    echo -e "${GREEN}✓ SQL Injection blocked (403)${NC}"
else
    echo -e "${RED}✗ SQL Injection NOT blocked (got ${response})${NC}"
fi

# Test 3: XSS
echo "Test 3: XSS Protection"
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/api/test?q=<script>alert(1)</script>")
if [ "$response" == "403" ]; then
    echo -e "${GREEN}✓ XSS blocked (403)${NC}"
else
    echo -e "${RED}✗ XSS NOT blocked (got ${response})${NC}"
fi

# Test 4: Path Traversal
echo "Test 4: Path Traversal Protection"
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/../../../etc/passwd")
if [ "$response" == "403" ]; then
    echo -e "${GREEN}✓ Path Traversal blocked (403)${NC}"
else
    echo -e "${RED}✗ Path Traversal NOT blocked (got ${response})${NC}"
fi

# Test 5: Rate Limiting
echo "Test 5: Rate Limiting (sending 15 requests)"
count=0
for i in {1..15}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/api/test" 2>/dev/null)
    if [ "$response" == "503" ]; then
        count=$((count + 1))
    fi
    sleep 0.1
done

if [ $count -gt 0 ]; then
    echo -e "${GREEN}✓ Rate limiting active (${count} requests limited)${NC}"
else
    echo -e "${YELLOW}⚠ Rate limiting not triggered${NC}"
fi

echo ""
echo "=================================="
echo "Test Summary"
echo "=================================="
echo ""
echo "Check logs for details:"
echo "  Access log:  tail -f logs/waf/access.log"
echo "  Audit log:   tail -f logs/modsec/audit.log"
echo ""
echo "For more tests, run: ./scripts/waf-manager.sh"
