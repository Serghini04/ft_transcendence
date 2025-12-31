# ELK Stack Log Management - Documentation

## Overview

This document provides comprehensive information about the ELK (Elasticsearch, Logstash, Kibana) stack implementation for the ft_transcendence project.

## Architecture

The ELK stack consists of four main components:

1. **Elasticsearch**: Distributed search and analytics engine for storing and indexing logs
2. **Logstash**: Data processing pipeline that ingests, transforms, and sends data to Elasticsearch
3. **Kibana**: Visualization platform for exploring and analyzing data in Elasticsearch
4. **Filebeat**: Lightweight shipper for forwarding logs from containers to Logstash

## Features Implemented

### ✅ Log Collection
- Automatic collection of logs from all Docker containers
- Service-specific log parsing and enrichment
- Real-time log streaming to Elasticsearch

### ✅ Log Processing
- JSON log parsing
- Automatic log level extraction and normalization
- GeoIP enrichment for IP addresses
- Custom Grok patterns for microservices
- Error and security event tagging

### ✅ Data Storage
- Optimized Elasticsearch indices with proper mappings
- Index templates for consistent structure
- Separate indices for:
  - Service logs: `logs-{service-name}-YYYY.MM.DD`
  - Error logs: `errors-{service-name}-YYYY.MM.DD`
  - Security logs: `security-logs-YYYY.MM.DD`

### ✅ Data Retention Policies
- **Hot phase** (0-7 days): Active searching and indexing
- **Warm phase** (7-30 days): Optimized for storage, less frequent queries
- **Cold phase** (30-90 days): Frozen for long-term storage
- **Delete phase** (90+ days): Automatic deletion of old logs

### ✅ Security Measures
- X-Pack security enabled with authentication
- Role-based access control (RBAC)
- Encrypted saved objects in Kibana
- Network isolation through Docker networks
- Password-protected access to all components

### ✅ Visualization
- Kibana dashboards for each microservice
- Real-time log exploration
- Custom visualizations for:
  - Error rates
  - Response times
  - Service health
  - Security events

## Quick Start

### 1. Start the ELK Stack

```bash
# Start all services
docker-compose up -d elasticsearch logstash kibana filebeat

# Wait for services to be healthy
docker-compose ps
```

### 2. Initialize ELK Stack

```bash
# Run the setup script
chmod +x infra/log-management/setup-elk.sh
./infra/log-management/setup-elk.sh
```

This script will:
- Wait for Elasticsearch to be ready
- Generate and configure passwords
- Create Index Lifecycle Management (ILM) policies
- Create index templates
- Set up initial indices
- Create security roles
- Save credentials to `.env.elk`

### 3. Access Kibana

1. Open browser: http://localhost:5601
2. Login with:
   - Username: `elastic`
   - Password: (from `.env.elk` file)

### 4. Create Index Patterns

In Kibana:
1. Go to **Management** → **Stack Management** → **Index Patterns**
2. Create patterns:
   - `logs-*` for all service logs
   - `errors-*` for error logs
   - `security-logs-*` for security events

## Service Integration

### Logging from Microservices

#### Node.js/TypeScript Services

Install Winston or Pino for structured logging:

```bash
npm install winston
# or
npm install pino
```

**Winston Example:**

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'chat-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.Http({
      host: 'logstash',
      port: 5000,
      path: '/'
    })
  ]
});

// Usage
logger.info('User connected', { userId: '123', roomId: 'room1' });
logger.error('Database connection failed', { error: err.message });
```

**Pino Example:**

```typescript
import pino from 'pino';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-socket',
    options: {
      address: 'logstash',
      port: 5000,
      mode: 'tcp'
    }
  }
});

logger.info({ userId: '123', roomId: 'room1' }, 'User connected');
```

### Log Levels

Use standard log levels:
- `ERROR`: Error events that might still allow the application to continue
- `WARN`: Potentially harmful situations
- `INFO`: Informational messages highlighting progress
- `DEBUG`: Fine-grained informational events for debugging
- `TRACE`: Very detailed information

## Index Lifecycle Management

### Policies Applied

The `logs-policy` ILM policy manages log data through four phases:

#### Hot Phase (0-7 days)
- Active indexing and searching
- Rollover when:
  - Index size > 50GB
  - Index age > 7 days
  - Documents count > 10,000,000

#### Warm Phase (7-30 days)
- Force merge to 1 segment
- Shrink to 1 shard
- Lower priority for searches

#### Cold Phase (30-90 days)
- Freeze indices for long-term storage
- Minimal resource usage

#### Delete Phase (90+ days)
- Automatic deletion

### Viewing ILM Policies

```bash
# View policy
curl -X GET "http://localhost:9200/_ilm/policy/logs-policy?pretty" \
  -u elastic:YOUR_PASSWORD

# View index ILM status
curl -X GET "http://localhost:9200/logs-*/_ilm/explain?pretty" \
  -u elastic:YOUR_PASSWORD
```

## Querying Logs

### Elasticsearch REST API

```bash
# Search recent logs
curl -X GET "http://localhost:9200/logs-*/_search?pretty" \
  -u elastic:YOUR_PASSWORD \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "match": {
        "service_name": "chat-service"
      }
    },
    "size": 10,
    "sort": [
      { "@timestamp": "desc" }
    ]
  }'

# Search error logs
curl -X GET "http://localhost:9200/errors-*/_search?pretty" \
  -u elastic:YOUR_PASSWORD \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "range": {
        "@timestamp": {
          "gte": "now-1h"
        }
      }
    }
  }'
```

### Kibana Query Language (KQL)

In Kibana Discover, use KQL queries:

```
# Find errors in chat service
service_name:"chat-service" AND log_level:"ERROR"

# Find slow responses
response_time_ms > 1000

# Find security events
tags:"security" AND log_level:"WARN"

# Find specific user activity
user_id:"12345"

# Combine conditions
service_name:"api-gateway" AND response_code >= 400 AND @timestamp >= "now-1h"
```

## Monitoring and Alerting

### Built-in Monitoring

Access X-Pack monitoring:
1. Kibana → **Stack Monitoring**
2. View health of:
   - Elasticsearch cluster
   - Logstash pipelines
   - Kibana instances
   - Filebeat shippers

### Health Checks

```bash
# Elasticsearch health
curl http://localhost:9200/_cluster/health?pretty

# Logstash health
curl http://localhost:9600/?pretty

# Kibana health
curl http://localhost:5601/api/status
```

## Troubleshooting

### Elasticsearch Issues

**Problem**: Elasticsearch won't start

```bash
# Check logs
docker logs elasticsearch

# Common issue: vm.max_map_count too low
sudo sysctl -w vm.max_map_count=262144

# Make permanent
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

**Problem**: Out of disk space

```bash
# Check disk usage
curl http://localhost:9200/_cat/allocation?v

# Delete old indices
curl -X DELETE "http://localhost:9200/logs-old-service-2024.01.01" \
  -u elastic:YOUR_PASSWORD
```

### Logstash Issues

**Problem**: Logs not appearing in Elasticsearch

```bash
# Check Logstash pipeline
curl http://localhost:9600/_node/stats/pipelines?pretty

# Check configuration
docker exec logstash bin/logstash --config.test_and_exit \
  --path.config=/usr/share/logstash/pipeline/logstash.conf
```

### Filebeat Issues

**Problem**: Container logs not being collected

```bash
# Check Filebeat status
docker exec filebeat filebeat test config

# Check connection to Logstash
docker exec filebeat filebeat test output
```

## Performance Tuning

### Elasticsearch

```yaml
# In elasticsearch.yml
indices.memory.index_buffer_size: 30%
indices.memory.min_index_buffer_size: 96mb
indices.queries.cache.size: 15%
```

### Logstash

```yaml
# In logstash.yml
pipeline.workers: 4  # Number of CPU cores
pipeline.batch.size: 250
pipeline.batch.delay: 50
```

### Filebeat

```yaml
# In filebeat.yml
queue.mem:
  events: 4096
  flush.min_events: 2048
  flush.timeout: 1s
```

## Backup and Restore

### Creating Snapshots

```bash
# Register snapshot repository
curl -X PUT "http://localhost:9200/_snapshot/backup_repo?pretty" \
  -u elastic:YOUR_PASSWORD \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "fs",
    "settings": {
      "location": "/usr/share/elasticsearch/backup"
    }
  }'

# Create snapshot
curl -X PUT "http://localhost:9200/_snapshot/backup_repo/snapshot_1?wait_for_completion=true&pretty" \
  -u elastic:YOUR_PASSWORD
```

### Restoring from Snapshot

```bash
# Restore all indices
curl -X POST "http://localhost:9200/_snapshot/backup_repo/snapshot_1/_restore?pretty" \
  -u elastic:YOUR_PASSWORD
```

## Security Best Practices

1. **Change Default Passwords**: Always change the default passwords in production
2. **Use HTTPS**: Enable SSL/TLS for all ELK components
3. **Network Isolation**: Keep ELK stack in private network
4. **Access Control**: Implement RBAC with minimal privileges
5. **Audit Logging**: Enable audit logs for security events
6. **Regular Updates**: Keep ELK components updated

## API Endpoints

### Elasticsearch
- Health: `GET http://localhost:9200/_cluster/health`
- Indices: `GET http://localhost:9200/_cat/indices?v`
- Search: `POST http://localhost:9200/{index}/_search`

### Logstash
- Stats: `GET http://localhost:9600/_node/stats`
- Health: `GET http://localhost:9600/?pretty`

### Kibana
- Status: `GET http://localhost:5601/api/status`
- Saved Objects: `GET http://localhost:5601/api/saved_objects/_find`

## Useful Commands

```bash
# View all logs in real-time
docker logs -f filebeat

# Check ELK stack health
docker-compose ps elasticsearch logstash kibana filebeat

# Restart specific service
docker-compose restart logstash

# View Elasticsearch indices
curl -s http://localhost:9200/_cat/indices?v

# Count documents in index
curl -s "http://localhost:9200/logs-*/_count?pretty"

# Delete specific index
curl -X DELETE "http://localhost:9200/logs-old-index"
```

## Environment Variables

Create a `.env` file with:

```env
ELASTIC_PASSWORD=your_secure_password
KIBANA_PASSWORD=your_kibana_password
ES_JAVA_OPTS=-Xms1g -Xmx1g
LS_JAVA_OPTS=-Xms512m -Xmx512m
```

## Support and Resources

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Logstash Documentation](https://www.elastic.co/guide/en/logstash/current/index.html)
- [Kibana Documentation](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Filebeat Documentation](https://www.elastic.co/guide/en/beats/filebeat/current/index.html)

## License

This implementation is part of the ft_transcendence project.
