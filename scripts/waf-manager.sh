#!/bin/bash

# WAF Management Script for ft_transcendence
# This script helps manage and monitor the WAF/ModSecurity deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Helper functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if WAF is running
check_waf_status() {
    print_header "WAF Status"
    
    if docker ps | grep -q "waf"; then
        print_success "WAF container is running"
        docker ps --filter "name=waf" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        return 0
    else
        print_error "WAF container is not running"
        return 1
    fi
}

# Start WAF
start_waf() {
    print_header "Starting WAF"
    
    if docker ps | grep -q "waf"; then
        print_warning "WAF is already running"
    else
        print_success "Building and starting WAF..."
        docker-compose up -d waf
        sleep 5
        check_waf_status
    fi
}

# Stop WAF
stop_waf() {
    print_header "Stopping WAF"
    
    if docker ps | grep -q "waf"; then
        docker-compose stop waf
        print_success "WAF stopped"
    else
        print_warning "WAF is not running"
    fi
}

# Restart WAF
restart_waf() {
    print_header "Restarting WAF"
    stop_waf
    sleep 2
    start_waf
}

# View logs
view_logs() {
    print_header "WAF Logs"
    
    echo "Select log to view:"
    echo "1) Access log"
    echo "2) Error log"
    echo "3) ModSecurity audit log"
    echo "4) ModSecurity debug log"
    echo "5) All logs (tail -f)"
    echo "6) Back"
    
    read -p "Choice: " choice
    
    case $choice in
        1)
            if [ -f "logs/waf/access.log" ]; then
                tail -f logs/waf/access.log
            else
                print_error "Access log not found"
            fi
            ;;
        2)
            if [ -f "logs/waf/error.log" ]; then
                tail -f logs/waf/error.log
            else
                print_error "Error log not found"
            fi
            ;;
        3)
            if [ -f "logs/modsec/audit.log" ]; then
                tail -f logs/modsec/audit.log
            else
                print_error "Audit log not found"
            fi
            ;;
        4)
            if [ -f "logs/modsec/debug.log" ]; then
                tail -f logs/modsec/debug.log
            else
                print_error "Debug log not found (may not be enabled)"
            fi
            ;;
        5)
            docker-compose logs -f waf
            ;;
        *)
            return
            ;;
    esac
}

# Test WAF rules
test_rules() {
    print_header "Testing WAF Rules"
    
    if ! check_waf_status > /dev/null 2>&1; then
        print_error "WAF is not running. Please start it first."
        return 1
    fi
    
    echo "Running security tests..."
    echo ""
    
    # Test 1: SQL Injection
    echo "1. Testing SQL Injection protection..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/api/test?id=1' OR '1'='1")
    if [ "$response" == "403" ]; then
        print_success "SQL Injection blocked (403)"
    else
        print_error "SQL Injection NOT blocked (got $response)"
    fi
    
    # Test 2: XSS
    echo "2. Testing XSS protection..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/api/test?q=<script>alert(1)</script>")
    if [ "$response" == "403" ]; then
        print_success "XSS blocked (403)"
    else
        print_error "XSS NOT blocked (got $response)"
    fi
    
    # Test 3: Path Traversal
    echo "3. Testing Path Traversal protection..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/../../../etc/passwd")
    if [ "$response" == "403" ]; then
        print_success "Path Traversal blocked (403)"
    else
        print_error "Path Traversal NOT blocked (got $response)"
    fi
    
    # Test 4: Rate Limiting
    echo "4. Testing Rate Limiting..."
    count=0
    for i in {1..15}; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/api/test")
        if [ "$response" == "503" ]; then
            count=$((count + 1))
        fi
    done
    
    if [ $count -gt 0 ]; then
        print_success "Rate limiting active (got $count rate limit responses)"
    else
        print_warning "Rate limiting not triggered"
    fi
    
    # Test 5: Normal request
    echo "5. Testing legitimate request..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/")
    if [ "$response" == "200" ]; then
        print_success "Legitimate request allowed (200)"
    else
        print_warning "Legitimate request returned $response"
    fi
    
    echo ""
    print_success "Security tests completed"
}

# Show blocked requests
show_blocked() {
    print_header "Recently Blocked Requests"
    
    if [ -f "logs/modsec/audit.log" ]; then
        echo "Last 10 blocked requests:"
        grep -A 5 "ModSecurity: Access denied" logs/modsec/audit.log | tail -50
    else
        print_error "Audit log not found"
    fi
}

# Statistics
show_stats() {
    print_header "WAF Statistics"
    
    if [ -f "logs/waf/access.log" ]; then
        total_requests=$(wc -l < logs/waf/access.log)
        echo "Total requests: $total_requests"
        
        echo ""
        echo "Top 10 IPs:"
        awk '{print $1}' logs/waf/access.log | sort | uniq -c | sort -rn | head -10
        
        echo ""
        echo "Status codes:"
        awk '{print $9}' logs/waf/access.log | sort | uniq -c | sort -rn
        
        echo ""
        echo "Top requested URLs:"
        awk '{print $7}' logs/waf/access.log | sort | uniq -c | sort -rn | head -10
    else
        print_error "Access log not found"
    fi
    
    if [ -f "logs/modsec/audit.log" ]; then
        blocked=$(grep -c "Access denied" logs/modsec/audit.log || echo "0")
        echo ""
        echo "Total blocked requests: $blocked"
    fi
}

# Enable/Disable detection only mode
toggle_detection_mode() {
    print_header "Toggle Detection Mode"
    
    echo "Current mode can be checked in: security/waf/modsecurity.conf"
    echo ""
    echo "1) Enable Blocking Mode (SecRuleEngine On)"
    echo "2) Enable Detection Only Mode (SecRuleEngine DetectionOnly)"
    echo "3) Back"
    
    read -p "Choice: " choice
    
    case $choice in
        1)
            sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' security/waf/modsecurity.conf
            print_success "Blocking mode enabled"
            print_warning "Restart WAF for changes to take effect"
            ;;
        2)
            sed -i 's/SecRuleEngine On/SecRuleEngine DetectionOnly/' security/waf/modsecurity.conf
            print_success "Detection only mode enabled"
            print_warning "Restart WAF for changes to take effect"
            ;;
        *)
            return
            ;;
    esac
}

# Clean logs
clean_logs() {
    print_header "Clean Logs"
    
    read -p "Are you sure you want to delete all WAF logs? (y/N): " confirm
    
    if [ "$confirm" == "y" ] || [ "$confirm" == "Y" ]; then
        rm -f logs/waf/*.log
        rm -f logs/modsec/*.log
        print_success "Logs cleaned"
    else
        print_warning "Cancelled"
    fi
}

# Main menu
show_menu() {
    clear
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════╗"
    echo "║   WAF/ModSecurity Management Console      ║"
    echo "║   ft_transcendence                        ║"
    echo "╚═══════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo "1)  Check WAF Status"
    echo "2)  Start WAF"
    echo "3)  Stop WAF"
    echo "4)  Restart WAF"
    echo "5)  View Logs"
    echo "6)  Test WAF Rules"
    echo "7)  Show Blocked Requests"
    echo "8)  Show Statistics"
    echo "9)  Toggle Detection/Blocking Mode"
    echo "10) Clean Logs"
    echo "11) Exit"
    echo ""
}

# Main loop
main() {
    while true; do
        show_menu
        read -p "Select option: " choice
        
        case $choice in
            1) check_waf_status ;;
            2) start_waf ;;
            3) stop_waf ;;
            4) restart_waf ;;
            5) view_logs ;;
            6) test_rules ;;
            7) show_blocked ;;
            8) show_stats ;;
            9) toggle_detection_mode ;;
            10) clean_logs ;;
            11) 
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main menu
main
