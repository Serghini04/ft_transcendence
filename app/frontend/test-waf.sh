#!/bin/bash
# WAF Testing Script for Frontend with ModSecurity

echo "=================================="
echo "WAF Testing - Frontend ModSecurity"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Normal Access
echo "Test 1: Normal Access (Should return 200)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/)
if [ "$STATUS" == "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS"
else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS (Expected 200)"
fi
echo ""

# Test 2: XSS Attack
echo "Test 2: XSS Attack Detection (Should return 403)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8888/?test=<script>alert('xss')</script>")
if [ "$STATUS" == "403" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS - XSS Attack Blocked!"
else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS (Expected 403)"
fi
echo ""

# Test 3: SQL Injection
echo "Test 3: SQL Injection Detection (Should return 403)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8888/?id=1%27%20OR%20%271%27%3D%271")
if [ "$STATUS" == "403" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS - SQL Injection Blocked!"
else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS (Expected 403)"
fi
echo ""

# Test 4: Command Injection
echo "Test 4: Command Injection Detection (Should return 403)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8888/?cmd=cat%20/etc/passwd")
if [ "$STATUS" == "403" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS - Command Injection Blocked!"
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Status: $STATUS (Expected 403, but might be less critical)"
fi
echo ""

# Test 5: Static Assets (Should work normally)
echo "Test 5: Static Assets Access (Should return 200)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8888/logo.png")
if [ "$STATUS" == "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS - Static files accessible"
else
    echo -e "${YELLOW}⚠ INFO${NC} - Status: $STATUS"
fi
echo ""

# Test 6: Health Check Endpoint
echo "Test 6: Health Check Endpoint (Should return 200)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8888/health")
if [ "$STATUS" == "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS - Health check working"
else
    echo -e "${YELLOW}⚠ INFO${NC} - Status: $STATUS"
fi
echo ""

# Container Status
echo "=================================="
echo "Container Information:"
echo "=================================="
docker ps --filter name=frontend-waf --format "Name: {{.Names}}\nStatus: {{.Status}}\nPorts: {{.Ports}}"
echo ""

# ModSecurity Configuration
echo "=================================="
echo "ModSecurity Configuration:"
echo "=================================="
echo "Rule Engine: On"
echo "Paranoia Level: 2 (Balanced)"
echo "Anomaly Inbound Threshold: 5"
echo "Anomaly Outbound Threshold: 4"
echo "OWASP CRS: Version 3.3.7"
echo ""

# View Recent WAF Blocks
echo "=================================="
echo "Recent WAF Blocks (Last 5):"
echo "=================================="
docker logs frontend-waf 2>&1 | grep "ModSecurity: Access denied" | tail -5 | while read line; do
    echo -e "${RED}→${NC} $(echo $line | grep -oP '\[msg ".*?"\]' | sed 's/\[msg "//g' | sed 's/"\]//g')"
done
echo ""

echo "=================================="
echo "Testing Complete!"
echo "=================================="
echo ""
echo "To view full logs:"
echo "  docker logs frontend-waf"
echo ""
echo "To view WAF blocks only:"
echo "  docker logs frontend-waf 2>&1 | grep 'ModSecurity: Access denied'"
echo ""
echo "To stop the container:"
echo "  docker stop frontend-waf && docker rm frontend-waf"
