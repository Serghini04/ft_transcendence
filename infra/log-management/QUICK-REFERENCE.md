# ELK Stack - Quick Reference Guide

## 🚀 Getting Started (3 Steps)

```bash
# 1. Start ELK Stack
make elk-start

# 2. Wait 2 minutes, then initialize
make elk-setup

# 3. Verify everything is working
make elk-verify
```

## 📊 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Kibana** | http://localhost:5601 | elastic / (from .env.elk) |
| **Elasticsearch** | http://localhost:9200 | elastic / (from .env.elk) |
| **Logstash** | http://localhost:9600 | N/A (monitoring only) |

## 🔍 Common Commands

### Status & Health
```bash
make elk-status          # Check all services
make elk-verify          # Run full verification
make logs-elk            # View live logs
```

### Searching Logs
```bash
make elk-search          # Search recent logs
make elk-errors          # Search error logs only
make elk-indices         # List all indices
```

### Testing
```bash
make elk-test            # Send test logs
```

### Maintenance
```bash
make elk-restart         # Restart all services
make elk-clean           # Delete old indices
```

## 📝 Logging from Your Service

### 1. Install Winston
```bash
cd app/backend/services/your-service
npm install winston
```

### 2. Use Shared Logger
```typescript
import { createLogger, httpLogger } from '../shared/logger';

// Create logger instance
const logger = createLogger('your-service-name');

// Log events
logger.info('User logged in', { userId: '123' });
logger.error('Database error', { error: err.message });

// Add HTTP middleware (Express)
app.use(httpLogger('your-service-name'));
```

### 3. View Logs in Kibana
1. Open http://localhost:5601
2. Go to **Discover**
3. Search: `service_name:"your-service-name"`

## 🔍 Useful Kibana Queries (KQL)

```
# Find errors in specific service
service_name:"chat-service" AND log_level:"ERROR"

# Find slow responses
response_time_ms > 1000

# Find user activity
user_id:"12345"

# Last hour errors
log_level:"ERROR" AND @timestamp >= "now-1h"

# Security events
tags:"security"
```

## 📊 Index Patterns

| Pattern | Contains | Retention |
|---------|----------|-----------|
| `logs-*` | All service logs | 90 days |
| `errors-*` | Error logs only | 90 days |
| `security-logs-*` | Security events | 90 days |

## 🔧 Troubleshooting

### Elasticsearch won't start
```bash
# Fix vm.max_map_count
sudo sysctl -w vm.max_map_count=262144

# Check logs
docker logs elasticsearch
```

### No logs appearing
```bash
# Check Filebeat
docker logs filebeat

# Check Logstash pipeline
curl http://localhost:9600/_node/stats/pipelines?pretty

# Test log shipping
make elk-test
```

### Forgot password
```bash
# Reset elastic password
docker exec elasticsearch bin/elasticsearch-reset-password -u elastic
```

## 📈 Monitoring

### Check Cluster Health
```bash
curl http://localhost:9200/_cluster/health?pretty
```

### View Indices
```bash
curl http://localhost:9200/_cat/indices?v
```

### Count Documents
```bash
curl "http://localhost:9200/logs-*/_count?pretty"
```

## 🛡️ Security

- **Default User**: elastic
- **Password**: Check `.env.elk` file
- **Change Password**: Update in `.env` file and restart services
- **Add Users**: Use Kibana → Stack Management → Users

## 📚 Documentation

- **Full Guide**: `infra/log-management/README.md`
- **Implementation Summary**: `docs/ELK-IMPLEMENTATION-SUMMARY.md`
- **Logger Examples**: `app/backend/services/shared/logger-examples.ts`

## ⚡ Performance Tips

1. **Use structured logging** (JSON format)
2. **Add context** (user_id, request_id, etc.)
3. **Don't log sensitive data** (passwords, tokens)
4. **Use appropriate log levels**:
   - DEBUG: Detailed debug info
   - INFO: General information
   - WARN: Warning messages
   - ERROR: Error events
   - FATAL: Critical failures

## 🎯 Best Practices

### DO ✅
- Use consistent field names
- Add service_name to all logs
- Include timestamps
- Log structured data (JSON)
- Use appropriate log levels
- Add request/correlation IDs
- Log errors with stack traces

### DON'T ❌
- Log passwords or tokens
- Log PII without masking
- Use console.log in production
- Log too verbosely (DEBUG in prod)
- Duplicate logs to multiple places
- Log binary data

## 📞 Quick Help

**Issue**: Can't access Kibana  
**Solution**: Check if services are running: `docker-compose ps`

**Issue**: No logs showing up  
**Solution**: Send test logs: `make elk-test`

**Issue**: Elasticsearch disk full  
**Solution**: Clean old indices: `make elk-clean`

**Issue**: Slow queries  
**Solution**: Check index size: `make elk-indices`

---

## 🎓 Learning Path

1. ✅ Start ELK stack: `make elk-start`
2. ✅ Run setup: `make elk-setup`
3. ✅ Send test logs: `make elk-test`
4. ✅ Explore in Kibana: http://localhost:5601
5. ✅ Add logging to your service (see above)
6. ✅ Create custom dashboards
7. ✅ Set up alerts (advanced)

---

**Need more help?** Check the full documentation in `infra/log-management/README.md`
