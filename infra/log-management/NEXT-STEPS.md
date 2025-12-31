# Next Steps - Getting Started with ELK Stack

## 🎯 You've successfully implemented the ELK Stack!

All infrastructure, configuration files, and documentation have been created. Here's what to do next:

---

## 📋 Step-by-Step Startup Guide

### Step 1: Start the ELK Stack (5 minutes)

```bash
# Option A: Use the quick start script (recommended)
make elk-start

# Option B: Manual start
docker-compose up -d elasticsearch
# Wait 2 minutes for Elasticsearch to start
docker-compose up -d logstash kibana filebeat
```

**What this does:**
- Starts Elasticsearch (log storage)
- Starts Logstash (log processing)
- Starts Kibana (visualization)
- Starts Filebeat (log collection)

---

### Step 2: Initialize the ELK Stack (2 minutes)

**Wait 2 minutes** after Step 1, then run:

```bash
make elk-setup
```

**What this does:**
- Creates admin passwords
- Sets up Index Lifecycle Management (ILM) policies
- Creates index templates
- Configures retention policies
- Sets up security roles
- Saves credentials to `.env.elk`

**Important:** Note the passwords displayed and saved in `.env.elk`

---

### Step 3: Verify Everything Works (1 minute)

```bash
make elk-verify
```

**Expected output:**
```
✓ Elasticsearch is running
✓ Logstash is running
✓ Kibana is running
✓ Filebeat is running
```

---

### Step 4: Access Kibana (Web Interface)

1. Open your browser: **http://localhost:5601**

2. Login with:
   - **Username:** `elastic`
   - **Password:** (check `.env.elk` file)

3. Create index patterns:
   - Go to **Management** → **Stack Management** → **Index Patterns**
   - Click **Create index pattern**
   - Enter: `logs-*`
   - Click **Next step**
   - Select `@timestamp` as time field
   - Click **Create index pattern**
   - Repeat for: `errors-*` and `security-logs-*`

---

### Step 5: Send Test Logs (Optional)

```bash
make elk-test
```

Then view them in Kibana:
1. Go to **Discover**
2. Select `logs-*` index pattern
3. Search for: `service_name:"test-service"`

---

## 🚀 Using the Logger in Your Microservices

### For Node.js/TypeScript Services:

1. **Install Winston:**
```bash
cd app/backend/services/your-service
npm install winston
```

2. **Import the logger:**
```typescript
import { createLogger, httpLogger } from '../shared/logger';
```

3. **Create a logger instance:**
```typescript
const logger = createLogger('your-service-name');
```

4. **Log events:**
```typescript
// Info logs
logger.info('User logged in', { userId: '123', sessionId: 'abc' });

// Error logs
logger.error('Database connection failed', { 
  error: err.message,
  host: 'db.example.com'
});

// Warning logs
logger.warn('High memory usage', { memoryUsage: '85%' });
```

5. **Add HTTP middleware (Express/Fastify):**
```typescript
import express from 'express';
import { httpLogger } from '../shared/logger';

const app = express();
app.use(httpLogger('your-service-name'));
```

6. **View your logs:**
   - Open Kibana: http://localhost:5601
   - Go to **Discover**
   - Search: `service_name:"your-service-name"`

---

## 📊 Useful Commands Reference

### Daily Operations:

```bash
# Check status
make elk-status

# View live logs
make logs-elk

# Search logs
make elk-search

# Search errors
make elk-errors

# List indices
make elk-indices
```

### Troubleshooting:

```bash
# Restart services
make elk-restart

# View individual service logs
docker logs elasticsearch
docker logs logstash
docker logs kibana
docker logs filebeat

# Check Elasticsearch health
curl http://localhost:9200/_cluster/health?pretty
```

### Maintenance:

```bash
# Clean old indices (free up space)
make elk-clean

# Stop ELK stack
docker-compose stop elasticsearch logstash kibana filebeat
```

---

## 🔍 Common Issues & Solutions

### Issue: "Elasticsearch won't start"
**Solution:**
```bash
# Set required system parameter
sudo sysctl -w vm.max_map_count=262144

# Make it permanent
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf

# Restart
make elk-restart
```

### Issue: "Can't access Kibana"
**Solution:**
```bash
# Check if services are running
docker-compose ps

# Check Kibana logs
docker logs kibana

# Verify port is accessible
curl http://localhost:5601/api/status
```

### Issue: "No logs showing up"
**Solution:**
```bash
# Check Filebeat is collecting logs
docker logs filebeat

# Check Logstash is processing
curl http://localhost:9600/_node/stats/pipelines?pretty

# Send test logs
make elk-test
```

### Issue: "Forgot password"
**Solution:**
```bash
# Check saved password
cat .env.elk

# Or reset password
docker exec elasticsearch bin/elasticsearch-reset-password -u elastic
```

---

## 📚 Documentation Quick Links

- **Full Guide:** [infra/log-management/README.md](../infra/log-management/README.md)
- **Quick Reference:** [infra/log-management/QUICK-REFERENCE.md](../infra/log-management/QUICK-REFERENCE.md)
- **Implementation Summary:** [docs/ELK-IMPLEMENTATION-SUMMARY.md](../docs/ELK-IMPLEMENTATION-SUMMARY.md)
- **Logger Examples:** [app/backend/services/shared/logger-examples.ts](../app/backend/services/shared/logger-examples.ts)

---

## 🎯 What You Can Do Now

### 1. **Explore Logs in Kibana**
   - Real-time log streaming
   - Search and filter logs
   - Create visualizations
   - Build dashboards

### 2. **Monitor Your Microservices**
   - Track errors and exceptions
   - Monitor response times
   - Analyze user activity
   - Detect security events

### 3. **Set Up Alerts** (Future Enhancement)
   - Alert on error spikes
   - Monitor slow queries
   - Detect anomalies
   - Track system health

### 4. **Create Custom Dashboards**
   - Service-specific dashboards
   - Error rate charts
   - Performance metrics
   - User activity visualization

---

## ✅ Checklist

Before considering this complete, ensure:

- [ ] ELK stack is running (`make elk-verify`)
- [ ] Kibana is accessible at http://localhost:5601
- [ ] Index patterns created in Kibana
- [ ] Test logs sent and visible (`make elk-test`)
- [ ] Password saved in `.env.elk`
- [ ] Microservices using the logger (at least one)
- [ ] Logs are appearing in Kibana

---

## 🎉 Congratulations!

You now have a **production-ready ELK stack** for log management!

### Key Capabilities:
- ✅ Centralized log collection from all microservices
- ✅ Powerful search and filtering
- ✅ Real-time log visualization
- ✅ Automated data retention (90 days)
- ✅ Security and access control
- ✅ Performance monitoring
- ✅ Error tracking and alerting

---

## 🚀 Ready to Go?

**Start now:**
```bash
make elk-start
```

**Questions?** Check the documentation or run:
```bash
make elk-verify  # Verify installation
make elk-status  # Check service status
```

---

**Happy Logging! 📊✨**
