# WAF Implementation with ModSecurity & OWASP CRS

## Overview
This frontend uses the `owasp/modsecurity-crs:nginx` Docker image which provides:
- **ModSecurity WAF**: Web Application Firewall for protection against common attacks
- **OWASP Core Rule Set**: Pre-configured security rules
- **Nginx**: Web server with ModSecurity module

## Configuration

### Dockerfile
- Base image: `owasp/modsecurity-crs:nginx`
- ModSecurity enabled with Paranoia Level 2
- Anomaly scoring thresholds configured

### Environment Variables
- `MODSEC_RULE_ENGINE=On`: Enables ModSecurity
- `PARANOIA=2`: Balanced security (1=Low, 4=High)
- `ANOMALY_INBOUND=5`: Inbound anomaly threshold
- `ANOMALY_OUTBOUND=4`: Outbound anomaly threshold

## Security Features

✅ SQL Injection protection
✅ Cross-Site Scripting (XSS) protection
✅ Remote Code Execution (RCE) protection
✅ Local/Remote File Inclusion protection
✅ Security headers (X-Frame-Options, CSP, HSTS, etc.)

## Build & Run

```bash
# Build
docker build -t frontend-waf:latest .

# Run (using port 8888 to avoid conflicts)
docker run -d -p 8888:80 --name frontend-waf frontend-waf:latest

# View logs
docker logs -f frontend-waf

# Stop and remove
docker stop frontend-waf && docker rm frontend-waf
```

## Testing

### Automated Testing
Run the provided test script:
```bash
chmod +x test-waf.sh
./test-waf.sh
```

### Manual Testing
```bash
# Test normal access (Expected: 200 OK)
curl -I http://localhost:8888/

# Test XSS protection (Expected: 403 Forbidden)
curl "http://localhost:8888/?test=<script>alert('xss')</script>"

# Test SQL injection protection (Expected: 403 Forbidden)
curl "http://localhost:8888/?id=1%27%20OR%20%271%27%3D%271"

# Test command injection (Expected: 403 Forbidden)
curl "http://localhost:8888/?cmd=cat%20/etc/passwd"

# Test static assets (Expected: 200 OK)
curl -I http://localhost:8888/logo.png

# Health check (Expected: 200 OK)
curl http://localhost:8888/health
```

### View WAF Blocks
```bash
# View all blocked requests
docker logs frontend-waf 2>&1 | grep "ModSecurity: Access denied"

# View detailed JSON logs
docker logs frontend-waf 2>&1 | grep "transaction"
```

## Adjusting Security Level

Edit `PARANOIA` level in Dockerfile:
- `1`: Basic protection
- `2`: Balanced (recommended) ⭐
- `3`: High protection
- `4`: Maximum protection
