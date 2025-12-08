#!/bin/bash

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  NGINX WAF Security Test${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if nginx-waf is running
if ! docker ps | grep -q "nginx-waf"; then
    echo -e "${RED}✗ NGINX WAF container is not running${NC}"
    echo "Start it with: docker-compose up -d nginx-waf"
    exit 1
fi

echo -e "${GREEN}✓ NGINX WAF container is running${NC}"
echo ""

# Test 1: Health Check
echo -e "${BLUE}[1/6] Health Check${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed (${response})${NC}"
fi
echo ""

# Test 2: Frontend Access
echo -e "${BLUE}[2/6] Frontend Access${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$response" == "200" ] || [ "$response" == "304" ]; then
    echo -e "${GREEN}✓ Frontend accessible${NC}"
else
    echo -e "${RED}✗ Frontend returned ${response}${NC}"
fi
echo ""

# Test 3: SQL Injection Protection
echo -e "${BLUE}[3/6] SQL Injection Protection${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/api/test?id=1' OR '1'='1")
if [ "$response" == "403" ]; then
    echo -e "${GREEN}✓ SQL Injection BLOCKED${NC}"
else
    echo -e "${RED}✗ SQL Injection NOT blocked (got ${response})${NC}"
fi
echo ""

# Test 4: XSS Protection
echo -e "${BLUE}[4/6] XSS Protection${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/?q=<script>alert('XSS')</script>")
if [ "$response" == "403" ]; then
    echo -e "${GREEN}✓ XSS BLOCKED${NC}"
else
    echo -e "${RED}✗ XSS NOT blocked (got ${response})${NC}"
fi
echo ""

# Test 5: Path Traversal Protection
echo -e "${BLUE}[5/6] Path Traversal Protection${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/../../../etc/passwd")
if [ "$response" == "403" ] || [ "$response" == "404" ]; then
    echo -e "${GREEN}✓ Path Traversal BLOCKED${NC}"
else
    echo -e "${RED}✗ Path Traversal NOT blocked (got ${response})${NC}"
fi
echo ""

# Test 6: Security Headers
echo -e "${BLUE}[6/6] Security Headers${NC}"
headers=$(curl -s -I http://localhost/ 2>/dev/null)
if echo "$headers" | grep -q "X-Frame-Options"; then
    echo -e "${GREEN}✓ X-Frame-Options present${NC}"
else
    echo -e "${RED}✗ X-Frame-Options missing${NC}"
fi
if echo "$headers" | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✓ X-Content-Type-Options present${NC}"
else
    echo -e "${RED}✗ X-Content-Type-Options missing${NC}"
fi
echo ""

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "View logs:"
echo "  docker-compose logs -f nginx-waf"
echo "  tail -f logs/nginx-waf/access.log"
echo "  tail -f logs/modsec/modsec_audit.log"
echo ""
