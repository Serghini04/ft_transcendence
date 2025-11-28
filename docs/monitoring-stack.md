# Monitoring Stack Documentation

This document provides in-depth documentation for the monitoring infrastructure of the ft_transcendence project.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prometheus](#prometheus)
4. [Alertmanager](#alertmanager)
5. [Node Exporter](#node-exporter)
6. [Grafana](#grafana)
7. [Metrics & Monitoring](#metrics--monitoring)
8. [Alerting Rules](#alerting-rules)
9. [Dashboards](#dashboards)
10. [Best Practices](#best-practices)

---

## Overview

The monitoring stack provides comprehensive observability for the ft_transcendence infrastructure. It collects, stores, visualizes, and alerts on metrics from all services.

### Components

- **Prometheus**: Metrics collection and storage
- **Alertmanager**: Alert handling and routing
- **Node Exporter**: System metrics collection
- **Grafana**: Visualization and dashboards

### Key Features

- Real-time metrics collection
- Long-term metric storage (30 days)
- Custom alerting rules
- Pre-configured dashboards
- JMX metrics from Kafka/Zookeeper
- System-level metrics
- Alert routing and management

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                          │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   Zookeeper  │      │    Kafka     │                   │
│  │  JMX:7072    │      │  JMX:7071    │                   │
│  └──────┬───────┘      └──────┬───────┘                   │
│         │                      │                            │
│         └──────────┬───────────┘                           │
│                    │ Scrape                                 │
│         ┌──────────▼───────────┐                           │
│         │     Prometheus        │                           │
│         │      :9090           │◄──────┐                   │
│         └──────────┬───────────┘       │                   │
│                    │                    │                   │
│                    │ Alerts             │ Scrape            │
│         ┌──────────▼───────────┐  ┌────┴────────┐         │
│         │   Alertmanager       │  │ Node Export │         │
│         │      :9093           │  │   :9101     │         │
│         └──────────────────────┘  └─────────────┘         │
│                    │                                        │
│                    │ Data Source                           │
│         ┌──────────▼───────────┐                           │
│         │      Grafana         │                           │
│         │      :3000           │                           │
│         └──────────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Metric Collection**:
   - Prometheus scrapes metrics from targets every 15s (default)
   - JMX exporters expose Kafka/Zookeeper metrics
   - Node Exporter exposes system metrics

2. **Storage**:
   - Prometheus stores time-series data locally
   - Data retention: 30 days or 10GB
   - Efficient compression and indexing

3. **Alerting**:
   - Prometheus evaluates alert rules
   - Alerts sent to Alertmanager
   - Alertmanager routes to receivers

4. **Visualization**:
   - Grafana queries Prometheus
   - Dashboards display real-time metrics
   - User-friendly interface

---

## Prometheus

### Configuration

**File**: `./infra/monitoring/prometheus/prometheus.yml`

#### Global Settings

```yaml
global:
  scrape_interval: 15s      # How often to scrape targets
  evaluation_interval: 15s   # How often to evaluate rules
  external_labels:
    cluster: 'ft_transcendence'
    environment: 'development'
```

#### Scrape Configurations

**Self-Monitoring**:
```yaml
- job_name: 'prometheus'
  static_configs:
    - targets: ['localhost:9090']
```

**Kafka Metrics**:
```yaml
- job_name: 'kafka'
  static_configs:
    - targets: ['kafka:7071']
```

**Zookeeper Metrics**:
```yaml
- job_name: 'zookeeper'
  static_configs:
    - targets: ['zookeeper:7072']
```

**System Metrics**:
```yaml
- job_name: 'node-exporter'
  static_configs:
    - targets: ['node-exporter:9100']
```

### Alert Rules

**File**: `./infra/monitoring/prometheus/alert.rules.yml`

Example rules structure:
```yaml
groups:
  - name: kafka_alerts
    interval: 30s
    rules:
      - alert: KafkaDown
        expr: up{job="kafka"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Kafka broker is down"
```

### Storage Configuration

- **Path**: `/prometheus` (in container)
- **Volume**: `prometheus-data` (persistent)
- **Retention Time**: 30 days
- **Retention Size**: 10GB
- **Compression**: Automatic

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/v1/query` | Instant query |
| `/api/v1/query_range` | Range query |
| `/api/v1/targets` | Scrape targets status |
| `/api/v1/alerts` | Active alerts |
| `/api/v1/rules` | Alert rules |
| `/-/reload` | Reload configuration |
| `/-/healthy` | Health check |

### Command-Line Flags

```bash
--config.file=/etc/prometheus/prometheus.yml
--storage.tsdb.path=/prometheus
--storage.tsdb.retention.time=30d
--storage.tsdb.retention.size=10GB
--web.console.libraries=/usr/share/prometheus/console_libraries
--web.console.templates=/usr/share/prometheus/consoles
--web.enable-lifecycle      # Enable reload via HTTP
--web.enable-admin-api      # Enable admin API
```

### PromQL Examples

**Kafka Metrics**:
```promql
# Bytes in per second
rate(kafka_server_brokertopicmetrics_bytesin_total[5m])

# Active controller count (should be 1)
kafka_controller_kafkacontroller_activecontrollercount

# Under-replicated partitions
kafka_server_replicamanager_underreplicatedpartitions
```

**System Metrics**:
```promql
# CPU usage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage percentage
100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))

# Disk usage
100 - ((node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100)
```

---

## Alertmanager

### Configuration

**File**: `./infra/monitoring/alertmanager/alertmanager.yml`

#### Route Configuration

```yaml
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s           # Wait time before sending initial notification
  group_interval: 10s       # Wait time before sending updates
  repeat_interval: 12h      # Resend interval for firing alerts
  receiver: 'default'       # Default receiver
```

#### Receivers

**Email**:
```yaml
receivers:
  - name: 'default'
    email_configs:
      - to: 'ops-team@example.com'
        from: 'alertmanager@ft-transcendence.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@example.com'
        auth_password: 'password'
```

**Slack**:
```yaml
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'
```

**PagerDuty**:
```yaml
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_SERVICE_KEY'
        severity: '{{ .CommonLabels.severity }}'
```

### Alert States

- **Inactive**: Alert condition not met
- **Pending**: Condition met but waiting for `for` duration
- **Firing**: Alert is active
- **Resolved**: Condition no longer met

### Silencing Alerts

**Via Web UI**:
1. Navigate to http://localhost:9093
2. Click "Silences" → "New Silence"
3. Add matchers (e.g., `alertname="KafkaDown"`)
4. Set duration and comment

**Via API**:
```bash
curl -XPOST http://localhost:9093/api/v2/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [{"name": "alertname", "value": "KafkaDown", "isRegex": false}],
    "startsAt": "2025-10-31T10:00:00Z",
    "endsAt": "2025-10-31T12:00:00Z",
    "createdBy": "admin",
    "comment": "Maintenance window"
  }'
```

---

## Node Exporter

### Collected Metrics

#### CPU Metrics
- `node_cpu_seconds_total`: CPU time in different modes
- `node_load1`, `node_load5`, `node_load15`: System load averages

#### Memory Metrics
- `node_memory_MemTotal_bytes`: Total memory
- `node_memory_MemAvailable_bytes`: Available memory
- `node_memory_Cached_bytes`: Cached memory
- `node_memory_Buffers_bytes`: Buffer memory

#### Disk Metrics
- `node_filesystem_size_bytes`: Total filesystem size
- `node_filesystem_avail_bytes`: Available space
- `node_disk_read_bytes_total`: Bytes read
- `node_disk_written_bytes_total`: Bytes written
- `node_disk_io_time_seconds_total`: I/O time

#### Network Metrics
- `node_network_receive_bytes_total`: Bytes received
- `node_network_transmit_bytes_total`: Bytes transmitted
- `node_network_receive_errs_total`: Receive errors
- `node_network_transmit_errs_total`: Transmit errors

### Collectors

Enabled collectors:
- `cpu`: CPU statistics
- `diskstats`: Disk statistics
- `filesystem`: Filesystem statistics
- `loadavg`: Load average
- `meminfo`: Memory statistics
- `netdev`: Network device statistics
- `netstat`: Network statistics
- `stat`: System statistics
- `time`: System time
- `uname`: System information

### Volume Mounts

```yaml
volumes:
  - /proc:/host/proc:ro       # Process info
  - /sys:/host/sys:ro         # System info
  - /:/rootfs:ro              # Root filesystem
```

---

## Grafana

### Authentication

**Default Credentials**:
- Username: `admin`
- Password: `SecurePassword123!`

**Security Settings**:
- Sign-up disabled: `GF_USERS_ALLOW_SIGN_UP=false`
- Anonymous access disabled: `GF_AUTH_ANONYMOUS_ENABLED=false`
- Secret key for signing: `GF_SECURITY_SECRET_KEY`

### Data Sources

**Prometheus** (auto-provisioned):
- **URL**: `http://prometheus:9090`
- **Type**: Prometheus
- **Access**: Proxy
- **Default**: Yes

Configuration file: `./infra/monitoring/grafana/provisioning/datasources/prometheus.yml`

### Dashboards

#### Pre-configured Dashboards

1. **Kafka Monitoring** (`kafka-monitoring.json`)
   - Broker metrics
   - Topic throughput
   - Consumer lag
   - Partition distribution
   - JVM metrics

2. **System Monitoring** (`system-monitoring.json`)
   - CPU usage
   - Memory utilization
   - Disk I/O
   - Network traffic
   - System load

#### Dashboard Provisioning

Configuration: `./infra/monitoring/grafana/provisioning/dashboards/default.yml`

```yaml
apiVersion: 1
providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /var/lib/grafana/dashboards
```

### Creating Custom Dashboards

1. **Via Web UI**:
   - Navigate to http://localhost:3000
   - Click "+" → "Dashboard"
   - Add panels with queries
   - Save dashboard

2. **Via JSON**:
   - Export existing dashboard
   - Modify JSON
   - Import via UI or place in `dashboards/` directory

### Variables

Common dashboard variables:
- `$datasource`: Data source selection
- `$instance`: Instance/node selection
- `$interval`: Time interval for aggregation
- `$job`: Job name filter

### Alerting

Grafana supports alerting on panel queries:

1. Edit panel
2. Go to "Alert" tab
3. Create alert rule
4. Configure notification channel
5. Set conditions and thresholds

### Plugins

Recommended plugins:
- `grafana-piechart-panel`: Pie chart visualization
- `grafana-worldmap-panel`: Geographic visualization
- `grafana-clock-panel`: Clock widget

Install via:
```bash
docker exec -it grafana grafana-cli plugins install <plugin-name>
docker-compose restart grafana
```

---

## Metrics & Monitoring

### Kafka Metrics

#### Broker Metrics

| Metric | Description | Type |
|--------|-------------|------|
| `kafka_server_brokertopicmetrics_bytesin_total` | Bytes received | Counter |
| `kafka_server_brokertopicmetrics_bytesout_total` | Bytes sent | Counter |
| `kafka_server_brokertopicmetrics_messagesin_total` | Messages received | Counter |
| `kafka_controller_kafkacontroller_activecontrollercount` | Active controllers | Gauge |
| `kafka_server_replicamanager_underreplicatedpartitions` | Under-replicated partitions | Gauge |
| `kafka_server_replicamanager_partitioncount` | Total partitions | Gauge |

#### JVM Metrics

| Metric | Description |
|--------|-------------|
| `jvm_memory_bytes_used` | JVM memory usage |
| `jvm_gc_collection_seconds_count` | GC collection count |
| `jvm_gc_collection_seconds_sum` | GC time spent |
| `jvm_threads_current` | Current thread count |

### Zookeeper Metrics

| Metric | Description |
|--------|-------------|
| `zookeeper_outstanding_requests` | Outstanding requests |
| `zookeeper_avg_latency` | Average latency |
| `zookeeper_num_alive_connections` | Active connections |
| `zookeeper_approximate_data_size` | Data size |

### System Metrics

| Category | Key Metrics |
|----------|-------------|
| **CPU** | Usage %, Load average |
| **Memory** | Used, Available, Cached |
| **Disk** | Usage %, I/O rate, Latency |
| **Network** | Throughput, Errors, Drops |

---

## Alerting Rules

### Critical Alerts

```yaml
# Service Down
- alert: ServiceDown
  expr: up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Service {{ $labels.job }} is down"
    description: "{{ $labels.job }} has been down for more than 1 minute"

# High Memory Usage
- alert: HighMemoryUsage
  expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High memory usage on {{ $labels.instance }}"
    description: "Memory usage is above 90%"

# Disk Space Low
- alert: DiskSpaceLow
  expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Low disk space on {{ $labels.instance }}"
    description: "Less than 10% disk space remaining"
```

### Kafka Alerts

```yaml
# No Active Controller
- alert: NoActiveController
  expr: kafka_controller_kafkacontroller_activecontrollercount == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "No active Kafka controller"
    description: "Kafka cluster has no active controller"

# Under-replicated Partitions
- alert: UnderReplicatedPartitions
  expr: kafka_server_replicamanager_underreplicatedpartitions > 0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Under-replicated partitions detected"
    description: "{{ $value }} partitions are under-replicated"
```

---

## Dashboards

### Kafka Dashboard Panels

1. **Broker Overview**
   - Active brokers
   - Topics count
   - Partitions count

2. **Throughput**
   - Bytes in/out per second
   - Messages in per second

3. **Performance**
   - Request latency
   - Response queue time
   - Network processor avg idle

4. **JVM Metrics**
   - Heap memory usage
   - GC count and time
   - Thread count

### System Dashboard Panels

1. **CPU**
   - CPU usage by mode
   - Load average
   - Context switches

2. **Memory**
   - Memory usage breakdown
   - Swap usage
   - Page faults

3. **Disk**
   - Disk usage by mount point
   - I/O operations
   - I/O latency

4. **Network**
   - Network throughput
   - Packet rates
   - Error rates

---

## Best Practices

### Prometheus

1. **Scrape Intervals**:
   - Use consistent intervals across jobs
   - Balance between freshness and load
   - Default 15s is good for most cases

2. **Label Management**:
   - Keep cardinality low
   - Avoid high-cardinality labels (timestamps, IDs)
   - Use consistent naming conventions

3. **Queries**:
   - Use `rate()` for counters
   - Use `irate()` for spiky metrics
   - Use recording rules for complex queries

4. **Storage**:
   - Monitor disk usage regularly
   - Adjust retention based on needs
   - Consider remote storage for long-term

### Alerting

1. **Alert Design**:
   - Alert on symptoms, not causes
   - Use appropriate `for` durations
   - Avoid alert fatigue
   - Document runbooks

2. **Severity Levels**:
   - **Critical**: Immediate action required
   - **Warning**: Attention needed soon
   - **Info**: Informational only

3. **Routing**:
   - Route critical alerts to on-call
   - Group related alerts
   - Use inhibition rules wisely

### Grafana

1. **Dashboard Design**:
   - Keep dashboards focused
   - Use consistent colors
   - Add descriptions to panels
   - Use variables for flexibility

2. **Performance**:
   - Limit time ranges
   - Use recording rules for complex queries
   - Set appropriate refresh intervals
   - Cache where possible

3. **Organization**:
   - Use folders for organization
   - Apply consistent naming
   - Tag dashboards appropriately
   - Document dashboard purpose

### Security

1. **Authentication**:
   - Change default passwords immediately
   - Use strong passwords
   - Enable OAuth/LDAP if available
   - Rotate credentials regularly

2. **Network**:
   - Don't expose metrics ports publicly
   - Use TLS for external access
   - Implement network policies
   - Audit access logs

3. **Data**:
   - Be mindful of sensitive data in metrics
   - Use relabeling to drop sensitive labels
   - Encrypt data at rest
   - Regular backups

---

## Troubleshooting

### Prometheus

**Issue**: Targets are down
- Check network connectivity
- Verify target configuration
- Check target application health
- Review target logs

**Issue**: High memory usage
- Reduce retention time/size
- Check for high cardinality
- Review scrape frequency
- Consider remote storage

**Issue**: Slow queries
- Use recording rules
- Optimize PromQL queries
- Reduce time range
- Check storage health

### Grafana

**Issue**: Dashboard not loading
- Check Prometheus data source
- Verify query syntax
- Check time range
- Review browser console

**Issue**: Can't login
- Verify credentials
- Check Grafana logs
- Reset password via CLI
- Check database connection

**Issue**: Missing data
- Verify Prometheus has data
- Check dashboard time range
- Review data source settings
- Check query syntax

### Alertmanager

**Issue**: Not receiving alerts
- Verify Prometheus is sending alerts
- Check receiver configuration
- Test receiver connectivity
- Review Alertmanager logs

**Issue**: Duplicate alerts
- Check grouping configuration
- Review `group_interval` setting
- Verify alert rules
- Check for multiple Alertmanagers

---

## Maintenance

### Backup

```bash
# Backup Prometheus data
docker run --rm \
  -v trancsendence_prometheus-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/prometheus-$(date +%Y%m%d).tar.gz /data

# Backup Grafana data
docker run --rm \
  -v trancsendence_grafana-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/grafana-$(date +%Y%m%d).tar.gz /data
```

### Restore

```bash
# Restore Prometheus
docker run --rm \
  -v trancsendence_prometheus-data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/prometheus-YYYYMMDD.tar.gz --strip 1"

# Restore Grafana
docker run --rm \
  -v trancsendence_grafana-data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/grafana-YYYYMMDD.tar.gz --strip 1"
```

### Updates

```bash
# Update images
docker-compose pull prometheus grafana alertmanager node-exporter

# Restart services
docker-compose up -d --no-deps prometheus grafana alertmanager node-exporter
```

---

## Performance Considerations

### Prometheus

- **Scrape Targets**: ~500 targets per Prometheus instance
- **Time Series**: Aim for < 1M active series
- **Query Concurrency**: Limited by CPU cores
- **Storage**: ~1-2 bytes per sample on disk

### Grafana

- **Concurrent Users**: 100+ with default settings
- **Dashboards**: 1000+ dashboards supported
- **Queries**: Parallel query execution
- **Caching**: Enable for better performance

---

*Last Updated: October 31, 2025*
