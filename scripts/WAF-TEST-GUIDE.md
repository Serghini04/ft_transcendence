# WAF Comprehensive Test Guide

## Overview
This document describes the comprehensive security test suite for your ModSecurity WAF implementation.

## Test File Location
```bash
scripts/waf-comprehensive-test.sh
```

## How to Run

### Basic Usage
```bash
# Test against localhost (default)
bash scripts/waf-comprehensive-test.sh

# Test against custom URL
bash scripts/waf-comprehensive-test.sh https://your-domain.com
```

### Make it executable
```bash
chmod +x scripts/waf-comprehensive-test.sh
./scripts/waf-comprehensive-test.sh
```

## Test Categories

### 1. SQL Injection Attacks (8 tests)
- **Union-based SQL injection**: Tests SELECT union attacks
- **Boolean-based blind SQL injection**: Tests conditional queries
- **Time-based blind SQL injection**: Tests SLEEP/WAITFOR attacks
- **Stacked queries**: Tests multiple query execution
- **Out-of-band techniques**: Tests DNS/HTTP exfiltration
- **Command execution**: Tests xp_cmdshell and similar
- **File operations**: Tests LOAD_FILE and INTO OUTFILE

**Expected Result**: All should return `403 Forbidden`

### 2. Cross-Site Scripting (XSS) - 8 tests
- **Basic XSS**: `<script>` tag injection
- **Event handlers**: onclick, onerror, onload
- **Protocol handlers**: javascript: and data: URIs
- **SVG/XML injection**: Vector graphics with scripts
- **Base64 encoded payloads**: Obfuscated scripts
- **DOM-based XSS**: Client-side injection
- **iframe injection**: Embedded malicious frames

**Expected Result**: All should return `403 Forbidden`

### 3. Command Injection - 7 tests
- **Shell separators**: `;`, `|`, `&&`, `||`
- **Command substitution**: ``` `` ``` and `$()`
- **Reverse shells**: netcat, bash, python
- **Data exfiltration**: Using curl, wget
- **File operations**: cat, ls, find

**Expected Result**: All should return `403 Forbidden`

### 4. Path Traversal - 6 tests
- **Unix path traversal**: `../../../etc/passwd`
- **Windows path traversal**: `..\..\..`
- **URL encoding**: `%2e%2e%2f`
- **Double encoding**: `%252e%252e`
- **Null byte injection**: `%00`
- **Absolute paths**: `/etc/passwd`

**Expected Result**: Most should return `403 Forbidden`

### 5. Remote Code Execution (RCE) - 5 tests
- **PHP code injection**: `<?php system() ?>`
- **eval() injection**: Python/JavaScript eval
- **Deserialization attacks**: Object injection
- **Template injection**: Jinja2, Twig, etc.
- **Server-Side Template Injection (SSTI)**

**Expected Result**: All should return `403 Forbidden`

### 6. Local File Inclusion (LFI) - 4 tests
- **Direct file inclusion**: Reading system files
- **PHP wrappers**: php://, data://, file://
- **Log poisoning**: Injecting code into logs
- **Filter bypass**: Using null bytes, encoding

**Expected Result**: All should return `403 Forbidden`

### 7. Remote File Inclusion (RFI) - 2 tests
- **HTTP inclusion**: Loading remote PHP files
- **FTP inclusion**: Using FTP protocol

**Expected Result**: All should return `403 Forbidden`

### 8. XML Attacks - 3 tests
- **XXE (XML External Entity)**: File disclosure
- **Billion Laughs**: XML bomb DoS
- **Parameter entities**: DTD-based attacks

**Expected Result**: All should return `403 Forbidden`

### 9. Server-Side Request Forgery (SSRF) - 5 tests
- **Internal IP access**: 127.0.0.1, localhost
- **Private network ranges**: 192.168.x.x, 10.x.x.x
- **Cloud metadata**: AWS/Azure/GCP endpoints
- **Protocol handlers**: file://, dict://, gopher://
- **DNS rebinding**: Time-based attacks

**Expected Result**: All should return `403 Forbidden`

### 10. LDAP Injection - 2 tests
- **Authentication bypass**: `*)(uid=*`
- **Filter injection**: Modifying LDAP queries

**Expected Result**: All should return `403 Forbidden`

### 11. Security Scanner Detection - 5 tests
- **SQLMap**: Automated SQL injection tool
- **Nikto**: Web server scanner
- **Nmap**: Network scanner
- **Acunetix**: Vulnerability scanner
- **Burp Suite**: Penetration testing proxy

**Expected Result**: All should return `403 Forbidden`

### 12. Protocol Violations - 3 tests
- **Invalid HTTP methods**: TRACE, TRACK
- **Content-Type mismatch**: Wrong MIME types
- **Missing required headers**: Host header

**Expected Result**: Most should return `403 Forbidden` or `405 Method Not Allowed`

### 13. Session Attacks - 2 tests
- **Session fixation**: Forcing session IDs
- **Cookie injection**: Privilege escalation via cookies

**Expected Result**: Should return `403 Forbidden`

### 14. Code Injection - 3 tests
- **JavaScript injection**: Node.js code execution
- **Python injection**: Python code execution
- **Ruby injection**: Ruby code execution

**Expected Result**: All should return `403 Forbidden`

### 15. HTTP Request Smuggling - 1 test
- **Content-Length mismatch**: Desync attacks

**Expected Result**: Should return `403 Forbidden`

### 16. Buffer Overflow / DoS - 2 tests
- **Large headers**: Oversized HTTP headers
- **Parameter flooding**: Excessive parameters

**Expected Result**: Should return `403 Forbidden` or `413 Payload Too Large`

### 17. Shellshock - 1 test
- **CGI exploit**: Bash environment variable injection

**Expected Result**: Should return `403 Forbidden`

### 18. Malicious File Upload - 2 tests
- **PHP shell upload**: Web shell files
- **Double extension bypass**: shell.php.jpg

**Expected Result**: Should return `403 Forbidden`

### 19. HTTP Response Splitting - 1 test
- **Header injection**: CRLF injection

**Expected Result**: Should return `403 Forbidden`

### 20. Legitimate Traffic - 3 tests
- **Normal GET request**: Regular page access
- **Normal POST request**: Form submission
- **Valid JSON API**: RESTful API calls

**Expected Result**: Should return `200 OK` or `201 Created` (NOT blocked)

## Understanding the Results

### Status Codes
- ✅ **✓ BLOCKED (403)**: Attack successfully blocked by WAF
- ❌ **✗ NOT BLOCKED (200)**: Attack was NOT blocked (security issue!)
- ⚠️ **⚠ UNEXPECTED**: Unexpected response code
- ✅ **✓ ALLOWED (200)**: Legitimate traffic correctly allowed

### Test Results Summary
- **Passed**: Attacks that were correctly blocked or allowed
- **Failed**: Attacks that got through or legitimate traffic blocked
- **Warnings**: Unexpected responses (may need investigation)
- **Protection Rate**: Percentage of attacks blocked

### Example Output
```
============================================================================
                         TEST SUMMARY
============================================================================
Passed:  89
Failed:  0
Warnings: 5
Total:   94

Protection Rate: 94%

🎉 All critical security tests passed! WAF is working correctly.
```

## Viewing Detailed Logs

### ModSecurity Audit Logs
```bash
# View recent audit events
docker exec frontend tail -50 /var/log/modsec/audit.log

# View debug logs
docker exec frontend tail -50 /var/log/modsec/debug.log

# Follow logs in real-time
docker logs -f frontend
```

### Analyzing Blocked Requests
Each blocked request is logged in JSON format with:
- **Rule ID**: Which OWASP CRS rule was triggered
- **Attack Type**: XSS, SQLi, RCE, etc.
- **Anomaly Score**: Total score (threshold is typically 5)
- **Request Details**: Full HTTP request information
- **Response**: How the WAF responded

## Customizing Tests

### Test Against Different URL
```bash
./scripts/waf-comprehensive-test.sh https://production.example.com
```

### Add Custom Tests
Edit the script and add:
```bash
test_attack "My Custom Test" \
    "${BASE_URL}/api/endpoint?param=malicious_payload" \
    "GET" \
    "" \
    "403"
```

### Modify Expected Behavior
Some tests may need adjustment based on your application:
```bash
# If path traversal returns 200 (SPA routing)
test_attack "Path - Basic traversal" \
    "${BASE_URL}/files?file=../../../etc/passwd" \
    "GET" \
    "" \
    "200"  # Changed from 403
```

## Troubleshooting

### High False Positive Rate
If legitimate traffic is being blocked:
1. Check ModSecurity paranoia level (currently set to 2)
2. Review audit logs to identify triggering rules
3. Add exclusions in `security/waf/custom-rules.conf`
4. Lower anomaly threshold in `docker-compose.yml`

### Low Protection Rate
If attacks are getting through:
1. Verify ModSecurity is enabled: `docker exec frontend nginx -V`
2. Check rules are loaded: `docker logs frontend | grep "rules loaded"`
3. Increase paranoia level (1-4) in `docker-compose.yml`
4. Lower anomaly threshold for stricter blocking

### Connection Errors
If tests show "CONNECTION ERROR":
1. Verify frontend is running: `docker ps | grep frontend`
2. Check port mapping: Should be 80 and 443
3. Test manually: `curl -k https://localhost/`

## ModSecurity Configuration

### Current Settings
Located in `docker-compose.yml`:
```yaml
environment:
  PARANOIA: 2                    # Protection level (1-4)
  ANOMALY_INBOUND: 5            # Blocking threshold
  ANOMALY_OUTBOUND: 4           # Response threshold
  ALLOWED_METHODS: "GET HEAD POST OPTIONS PUT DELETE PATCH"
  MAX_FILE_SIZE: 10485760       # 10 MB
```

### Protection Levels
- **PARANOIA=1**: Basic protection, few false positives
- **PARANOIA=2**: Balanced (recommended for production)
- **PARANOIA=3**: Strict protection, may have false positives
- **PARANOIA=4**: Maximum protection, high false positive rate

## Integration with CI/CD

### Run in Pipeline
```yaml
# .gitlab-ci.yml or .github/workflows/security.yml
test:security:
  script:
    - docker-compose up -d frontend
    - sleep 10
    - bash scripts/waf-comprehensive-test.sh
  allow_failure: false
```

### Automated Testing
```bash
# Run tests and save results
./scripts/waf-comprehensive-test.sh > waf-test-results.txt 2>&1

# Check exit code
if [ $? -eq 0 ]; then
  echo "All tests passed"
else
  echo "Some tests failed"
  exit 1
fi
```

## Best Practices

1. **Run tests regularly**: After any WAF configuration changes
2. **Test in staging first**: Before deploying to production
3. **Monitor false positives**: Review audit logs regularly
4. **Keep CRS updated**: Update OWASP CRS rules periodically
5. **Document exclusions**: If you whitelist rules, document why
6. **Test legitimate traffic**: Ensure your app works correctly
7. **Adjust thresholds carefully**: Balance security vs usability

## Additional Resources

- **OWASP CRS Documentation**: https://coreruleset.org/docs/
- **ModSecurity Reference Manual**: https://github.com/SpiderLabs/ModSecurity/wiki
- **WAF Testing Guide**: https://owasp.org/www-project-web-security-testing-guide/

## Support

If you encounter issues:
1. Check the logs: `docker logs frontend`
2. Review test output carefully
3. Consult ModSecurity documentation
4. Test individual attacks manually with curl
