# Services Documentation

This document provides comprehensive documentation for all services defined in the `docker-compose.yml` file.

## Table of Contents

1. [Overview](#overview)
2. [Kafka Infrastructure](#kafka-infrastructure)
   - [Zookeeper](#zookeeper)
   - [Kafka Broker](#kafka-broker)
   - [Kafka UI](#kafka-ui)
   - [Kafka Producer](#kafka-producer)
   - [Kafka Consumer](#kafka-consumer)
3. [Monitoring Stack](#monitoring-stack)
   - [Prometheus](#prometheus)
   - [Alertmanager](#alertmanager)
   - [Node Exporter](#node-exporter)
   - [Grafana](#grafana)
4. [Network Configuration](#network-configuration)
5. [Volumes](#volumes)
6. [Quick Start](#quick-start)

---

## Overview

The ft_transcendence project uses a microservices architecture with Docker Compose orchestration. The infrastructure consists of:

- **Kafka Infrastructure**: Message broker system with Zookeeper coordination
- **Monitoring Stack**: Full observability with Prometheus, Grafana, and Alertmanager
- **Network**: Isolated Docker bridge network (`ft_Transc`)

All services are containerized and connected through the `ft_Transc` network for seamless communication.

---

## Kafka Infrastructure

### Zookeeper

**Purpose**: Distributed coordination service for Kafka, managing cluster metadata and leader election.

**Container Details**:
- **Image**: `zookeeper:latest`
- **Container Name**: `zookeeper`
- **Build Context**: `./infra/zookeeper`

**Ports**:
- `2181`: Client port for Zookeeper connections
- `7072`: JMX Exporter metrics endpoint
- `9998`: JMX management port

**Environment Variables**:
| Variable | Value | Description |
|----------|-------|-------------|
| `ZOOKEEPER_CLIENT_PORT` | `2181` | Port for client connections |
| `ZOOKEEPER_TICK_TIME` | `2000` | Basic time unit in milliseconds |
| `KAFKA_JMX_PORT` | `9998` | JMX remote monitoring port |
| `KAFKA_JMX_HOSTNAME` | `zookeeper` | Hostname for JMX connections |
| `KAFKA_OPTS` | `-javaagent:/usr/share/jmx_prometheus_javaagent.jar=7072:/etc/jmx-exporter/config.yml` | JVM options for metrics export |

**Monitoring**:
- JMX metrics exposed on port 7072 for Prometheus scraping
- Includes JMX Prometheus Java agent for metrics collection

**Dependencies**: None (base service)

**Network**: `ft_Transc`

---

### Kafka Broker

**Purpose**: Distributed streaming platform for building real-time data pipelines and streaming applications.

**Container Details**:
- **Image**: `kafka:latest`
- **Container Name**: `kafka`
- **Build Context**: `./infra/kafka`

**Ports**:
- `9092`: Kafka broker port (PLAINTEXT protocol)
- `7071`: JMX Exporter metrics endpoint
- `9999`: JMX management port

**Environment Variables**:
| Variable | Value | Description |
|----------|-------|-------------|
| `KAFKA_BROKER_ID` | `1` | Unique broker identifier |
| `KAFKA_ZOOKEEPER_CONNECT` | `zookeeper:2181` | Zookeeper connection string |
| `KAFKA_LISTENERS` | `PLAINTEXT://0.0.0.0:9092` | Listener configuration |
| `KAFKA_ADVERTISED_LISTENERS` | `PLAINTEXT://kafka:9092` | Advertised address for clients |
| `KAFKA_LISTENER_SECURITY_PROTOCOL_MAP` | `PLAINTEXT:PLAINTEXT` | Protocol mapping |
| `KAFKA_INTER_BROKER_LISTENER_NAME` | `PLAINTEXT` | Inter-broker communication protocol |
| `KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR` | `1` | Replication factor for offsets topic |
| `KAFKA_JMX_PORT` | `9999` | JMX remote monitoring port |
| `KAFKA_JMX_HOSTNAME` | `kafka` | Hostname for JMX connections |
| `KAFKA_OPTS` | `-javaagent:/usr/share/jmx_prometheus_javaagent.jar=7071:/etc/jmx-exporter/config.yml` | JVM options for metrics export |

**Monitoring**:
- JMX metrics exposed on port 7071 for Prometheus scraping
- Comprehensive broker metrics available

**Dependencies**: 
- `zookeeper` (required for coordination)

**Network**: `ft_Transc`

**Notes**:
- Single-broker setup (replication factor = 1)
- Suitable for development; increase replication for production

---

### Kafka UI

**Purpose**: Web-based interface for monitoring and managing Kafka clusters.

**Container Details**:
- **Image**: `kafka-ui:latest`
- **Container Name**: `kafka-ui`
- **Build Context**: `./infra/kafka-ui`

**Ports**:
- `8080`: Web interface

**Environment Variables**:
| Variable | Value | Description |
|----------|-------|-------------|
| `KAFKA_CLUSTERS_0_NAME` | `local` | Display name for the cluster |
| `KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS` | `kafka:9092` | Kafka bootstrap servers |

**Features**:
- View topics, partitions, and consumer groups
- Monitor message throughput and lag
- Browse messages
- Manage cluster configuration

**Access**: http://localhost:8080

**Dependencies**: 
- `kafka` (requires Kafka broker)

**Network**: `ft_Transc`

---

### Kafka Producer

**Purpose**: Demo/testing service that produces messages to Kafka topics.

**Container Details**:
- **Image**: `kafka-producer:latest`
- **Container Name**: `kafka-producer`
- **Build Context**: `./infra/kafka-producer`

**Ports**:
- `3001`: Producer service API

**Environment Variables**:
| Variable | Value | Description |
|----------|-------|-------------|
| `KAFKA_BROKERS` | `kafka:9092` | Kafka broker connection |
| `KAFKA_TOPIC` | `test-topic` | Target topic for messages |

**Dependencies**: 
- `kafka` (requires Kafka broker)

**Network**: `ft_Transc`

**Usage**:
- Produces test messages to configured topic
- Can be used for testing and development
- API available at http://localhost:3001

---

### Kafka Consumer

**Purpose**: Demo/testing service that consumes messages from Kafka topics.

**Container Details**:
- **Image**: `kafka-consumer:latest`
- **Container Name**: `kafka-consumer`
- **Build Context**: `./infra/kafka-consumer`

**Ports**:
- `3002`: Consumer service API

**Environment Variables**:
| Variable | Value | Description |
|----------|-------|-------------|
| `KAFKA_BROKERS` | `kafka:9092` | Kafka broker connection |
| `KAFKA_TOPIC` | `test-topic` | Source topic for consumption |

**Dependencies**: 
- `kafka` (requires Kafka broker)

**Network**: `ft_Transc`

**Usage**:
- Consumes messages from configured topic
- Can be used for testing and development
- API available at http://localhost:3002

---

## Monitoring Stack

### Prometheus

**Purpose**: Time-series database and monitoring system for collecting and storing metrics.

**Container Details**:
- **Image**: `prometheus:latest`
- **Container Name**: `prometheus`
- **Build Context**: `./infra/monitoring/prometheus`

**Ports**:
- `9090`: Prometheus web UI and API

**Volumes**:
- `prometheus-data:/prometheus` - Persistent metrics storage
- `./infra/monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml` - Configuration file
- `./infra/monitoring/prometheus/alert.rules.yml:/etc/prometheus/alert.rules.yml` - Alert rules

**Command Arguments**:
- `--config.file=/etc/prometheus/prometheus.yml` - Configuration file path
- `--storage.tsdb.path=/prometheus` - Data storage path
- `--storage.tsdb.retention.time=30d` - Keep metrics for 30 days
- `--storage.tsdb.retention.size=10GB` - Maximum storage size
- `--web.console.libraries=/usr/share/prometheus/console_libraries` - Console libraries
- `--web.console.templates=/usr/share/prometheus/consoles` - Console templates
- `--web.enable-lifecycle` - Enable lifecycle management API
- `--web.enable-admin-api` - Enable admin API endpoints

**Features**:
- Scrapes metrics from all monitored targets
- Evaluates alerting rules
- Stores time-series data
- Provides PromQL query interface

**Access**: http://localhost:9090

**Scrape Targets**:
- Kafka JMX metrics (port 7071)
- Zookeeper JMX metrics (port 7072)
- Node Exporter metrics (port 9100)
- Self-monitoring

**Dependencies**: None (base monitoring service)

**Network**: `ft_Transc`

**Restart Policy**: `unless-stopped`

---

### Alertmanager

**Purpose**: Handles alerts sent by Prometheus, managing deduplication, grouping, and routing.

**Container Details**:
- **Image**: `alertmanager:latest`
- **Container Name**: `alertmanager`
- **Build Context**: `./infra/monitoring/alertmanager`

**Ports**:
- `9093`: Alertmanager web UI and API

**Volumes**:
- `alertmanager-data:/alertmanager` - Persistent alert state
- `./infra/monitoring/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml` - Configuration

**Command Arguments**:
- `--config.file=/etc/alertmanager/alertmanager.yml` - Configuration file path
- `--storage.path=/alertmanager` - Data storage path

**Features**:
- Receives alerts from Prometheus
- Groups related alerts
- Routes alerts to receivers (email, Slack, PagerDuty, etc.)
- Handles alert silencing and inhibition

**Access**: http://localhost:9093

**Dependencies**: 
- Typically receives alerts from `prometheus`

**Network**: `ft_Transc`

**Restart Policy**: `unless-stopped`

---

### Node Exporter

**Purpose**: Prometheus exporter for hardware and OS metrics from Linux systems.

**Container Details**:
- **Image**: `node-exporter:latest`
- **Container Name**: `node-exporter`
- **Build Context**: `./infra/monitoring/node-exporter`

**Ports**:
- `9101:9100` - Metrics endpoint (host port 9101 to avoid conflicts)

**Volumes** (Read-Only):
- `/proc:/host/proc:ro` - Process information
- `/sys:/host/sys:ro` - System information
- `/:/rootfs:ro` - Root filesystem

**Command Arguments**:
- `--path.procfs=/host/proc` - Path to proc filesystem
- `--path.sysfs=/host/sys` - Path to sys filesystem
- `--path.rootfs=/rootfs` - Path to root filesystem
- `--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)` - Exclude system mounts

**Metrics Collected**:
- CPU usage
- Memory utilization
- Disk I/O
- Network statistics
- Filesystem usage
- System load

**Access**: http://localhost:9101/metrics

**Dependencies**: None (system metrics collector)

**Network**: `ft_Transc`

**Restart Policy**: `unless-stopped`

---

### Grafana

**Purpose**: Analytics and visualization platform for creating dashboards and exploring metrics.

**Container Details**:
- **Image**: `grafana:latest`
- **Container Name**: `grafana`
- **Build Context**: `./infra/monitoring/grafana`

**Ports**:
- `3000`: Grafana web UI

**Volumes**:
- `grafana-data:/var/lib/grafana` - Persistent dashboard and configuration data
- `./infra/monitoring/grafana/provisioning:/etc/grafana/provisioning` - Automated provisioning
- `./infra/monitoring/grafana/dashboards:/var/lib/grafana/dashboards` - Dashboard definitions
- `./infra/monitoring/grafana/grafana.ini:/etc/grafana/grafana.ini` - Main configuration

**Environment Variables**:
| Variable | Value | Description |
|----------|-------|-------------|
| `GF_SECURITY_ADMIN_USER` | `admin` | Default admin username |
| `GF_SECURITY_ADMIN_PASSWORD` | `SecurePassword123!` | Default admin password |
| `GF_SECURITY_SECRET_KEY` | `SW2YcwTIb9zpOOhoPsMm` | Secret key for signing |
| `GF_USERS_ALLOW_SIGN_UP` | `false` | Disable user registration |
| `GF_AUTH_ANONYMOUS_ENABLED` | `false` | Disable anonymous access |

**Pre-configured Dashboards**:
- `kafka-monitoring.json` - Kafka cluster metrics
- `system-monitoring.json` - System and infrastructure metrics

**Features**:
- Visualization of Prometheus metrics
- Pre-configured dashboards
- Alerting capabilities
- User management
- Team collaboration

**Access**: http://localhost:3000

**Default Credentials**:
- Username: `admin`
- Password: `SecurePassword123!`

**Dependencies**: 
- `prometheus` (data source)
- `alertmanager` (alert routing)

**Network**: `ft_Transc`

**Restart Policy**: `unless-stopped`

---

## Network Configuration

**Network Name**: `ft_Transc`

**Type**: Bridge

**Purpose**: Isolated network for all services to communicate securely

**Services on Network**:
- zookeeper
- kafka
- kafka-ui
- kafka-producer
- kafka-consumer
- prometheus
- alertmanager
- node-exporter
- grafana

**Benefits**:
- Service discovery by container name
- Network isolation from host and other Docker networks
- Automatic DNS resolution

---

## Volumes

The following named volumes provide persistent storage:

### prometheus-data
- **Mount**: `/prometheus` in Prometheus container
- **Purpose**: Stores time-series metrics data
- **Retention**: 30 days / 10GB (whichever comes first)

### alertmanager-data
- **Mount**: `/alertmanager` in Alertmanager container
- **Purpose**: Stores alert state and silences

### grafana-data
- **Mount**: `/var/lib/grafana` in Grafana container
- **Purpose**: Stores dashboards, users, and Grafana configuration

---

## Quick Start

### Starting All Services

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Accessing Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Kafka UI | http://localhost:8080 | None |
| Prometheus | http://localhost:9090 | None |
| Alertmanager | http://localhost:9093 | None |
| Grafana | http://localhost:3000 | admin / SecurePassword123! |
| Node Exporter | http://localhost:9101/metrics | None |
| Kafka Producer | http://localhost:3001 | None |
| Kafka Consumer | http://localhost:3002 | None |

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Rebuilding Services

```bash
# Rebuild specific service
docker-compose build <service-name>

# Rebuild all services
docker-compose build

# Rebuild and restart
docker-compose up -d --build
```

### Monitoring Health

```bash
# Check Kafka topics
docker exec -it kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# View Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Grafana health
curl http://localhost:3000/api/health
```

---

## Troubleshooting

### Common Issues

**Zookeeper not starting**:
- Check if port 2181 is already in use
- Verify Docker daemon is running
- Check logs: `docker-compose logs zookeeper`

**Kafka connection refused**:
- Ensure Zookeeper is healthy first
- Wait 30-60 seconds for Kafka to fully start
- Verify `KAFKA_ADVERTISED_LISTENERS` is correct

**Prometheus not scraping targets**:
- Check Prometheus configuration: `./infra/monitoring/prometheus/prometheus.yml`
- Verify JMX exporters are running on Kafka/Zookeeper
- Check Prometheus logs: `docker-compose logs prometheus`

**Grafana dashboards not loading**:
- Ensure Prometheus data source is configured
- Check provisioning files in `./infra/monitoring/grafana/provisioning`
- Verify dashboard JSON files exist in `./infra/monitoring/grafana/dashboards`

### Log Access

```bash
# View logs for specific service
docker-compose logs -f <service-name>

# View logs for all services
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100 <service-name>
```

---

## Maintenance

### Backup Procedures

**Prometheus Data**:
```bash
# Backup Prometheus data
docker run --rm -v trancsendence_prometheus-data:/data -v $(pwd):/backup alpine tar czf /backup/prometheus-backup.tar.gz /data
```

**Grafana Data**:
```bash
# Backup Grafana data
docker run --rm -v trancsendence_grafana-data:/data -v $(pwd):/backup alpine tar czf /backup/grafana-backup.tar.gz /data
```

### Updates

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

---

## Security Considerations

1. **Change Default Passwords**: Update Grafana admin password in production
2. **Network Isolation**: Services are isolated in `ft_Transc` network
3. **JMX Ports**: JMX ports (9998, 9999) should not be exposed in production
4. **Volume Permissions**: Ensure proper permissions on mounted volumes
5. **Secret Management**: Use Docker secrets or environment files for sensitive data

---

## Performance Tuning

### Kafka
- Adjust `KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR` for production (typically 3)
- Configure appropriate partition counts for topics
- Monitor consumer lag in Kafka UI

### Prometheus
- Adjust retention time based on disk space: `--storage.tsdb.retention.time`
- Configure scrape intervals in `prometheus.yml`
- Use recording rules for frequently queried metrics

### Grafana
- Enable caching in `grafana.ini`
- Optimize dashboard queries
- Set appropriate refresh intervals

---

## Additional Resources

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

*Last Updated: October 31, 2025*
