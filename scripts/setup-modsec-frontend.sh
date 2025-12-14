#!/bin/bash

# Quick setup script for Frontend with ModSecurity

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Frontend + OWASP ModSecurity Setup       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Build frontend
echo -e "${BLUE}[1/5]${NC} Building frontend with ModSecurity..."
docker-compose build frontend
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 2: Start dependencies
echo -e "${BLUE}[2/5]${NC} Starting dependencies (Zookeeper, Kafka)..."
docker-compose up -d zookeeper kafka
echo -e "${YELLOW}⏳ Waiting 30s for Kafka to be ready...${NC}"
sleep 30
echo -e "${GREEN}✓ Dependencies ready${NC}"
echo ""

# Step 3: Start frontend
echo -e "${BLUE}[3/5]${NC} Starting frontend container..."
docker-compose up -d frontend
sleep 5
echo -e "${GREEN}✓ Frontend started${NC}"
echo ""

# Step 4: Verify
echo -e "${BLUE}[4/5]${NC} Verifying services..."
if docker ps | grep -q "frontend"; then
    echo -e "${GREEN}✓ Frontend container running${NC}"
else
    echo -e "${YELLOW}⚠ Frontend container not found${NC}"
fi

if curl -s http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend responding${NC}"
else
    echo -e "${YELLOW}⚠ Frontend not responding yet (may need more time)${NC}"
fi
echo ""

# Step 5: Test security
echo -e "${BLUE}[5/5]${NC} Running security tests..."
echo ""
./scripts/test-frontend-modsec.sh

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Setup Complete! 🎉               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Access your application:"
echo "  🌐 Frontend:    http://localhost/"
echo "  ❤️  Health:      http://localhost/health"
echo "  🔌 API:         http://localhost/api/"
echo ""
echo "View logs:"
echo "  📋 Container:   docker-compose logs -f frontend"
echo "  🛡️  ModSecurity: tail -f logs/modsec/audit.log"
echo ""
echo "Configuration:"
echo "  📄 Dockerfile:  app/frontend/Dockerfile"
echo "  ⚙️  NGINX:       app/frontend/nginx.conf"
echo "  🔒 ModSecurity: app/frontend/modsecurity-custom.conf"
echo ""
echo "Next steps:"
echo "  1. Test your application thoroughly"
echo "  2. Monitor logs for false positives"
echo "  3. Adjust PARANOIA level if needed (docker-compose.yml)"
echo "  4. Configure SSL/TLS for production"
echo ""
