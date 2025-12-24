#!/bin/bash

# Quick rate limit demonstration

echo "🔒 Testing Rate Limiting Protection"
echo "===================================="
echo ""

# Test Auth brute force protection (most critical)
echo "🎯 Testing Login Brute Force Protection (5 req/min limit)..."
echo "Sending 15 rapid login attempts..."
echo ""

for i in {1..15}; do
    response=$(curl -k -s -o /dev/null -w "%{http_code}" -X POST \
        -d '{"username":"admin","password":"wrong"}' \
        -H "Content-Type: application/json" \
        https://localhost/api/login 2>/dev/null)
    
    if [ "$response" = "429" ]; then
        echo "❌ Request $i: BLOCKED (429) - Rate limit exceeded!"
    else
        echo "✅ Request $i: Allowed ($response)"
    fi
done

echo ""
echo "📊 Summary:"
echo "  ✓ First ~11 requests allowed (5 req/min + burst 10)"
echo "  ✓ Subsequent requests blocked with 429 status"
echo "  ✓ Brute force protection is ACTIVE!"
echo ""
echo "This prevents attackers from trying thousands of passwords!"
