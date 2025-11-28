# Kafka Infrastructure Documentation

This document provides comprehensive documentation for the Apache Kafka infrastructure in the ft_transcendence project.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Zookeeper](#zookeeper)
4. [Kafka Broker](#kafka-broker)
5. [Kafka UI](#kafka-ui)
6. [Kafka Producer](#kafka-producer)
7. [Kafka Consumer](#kafka-consumer)
8. [Topics Management](#topics-management)
9. [Monitoring & Metrics](#monitoring--metrics)
10. [Performance Tuning](#performance-tuning)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Overview

Apache Kafka is a distributed streaming platform used in ft_transcendence for real-time data processing and event-driven architecture.

### Key Capabilities

- **High Throughput**: Handles millions of messages per second
- **Scalability**: Horizontally scalable architecture
- **Durability**: Persistent message storage with replication
- **Fault Tolerance**: Automatic failover and data recovery
- **Real-time Processing**: Sub-millisecond latency

### Use Cases in ft_transcendence

- Event streaming for microservices
- Real-time game updates
- Chat message delivery
- User activity tracking
- Notification distribution
- Audit logging

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Kafka Cluster Architecture                  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                     Zookeeper                            │ │
│  │  - Cluster coordination                                  │ │
│  │  - Leader election                                       │ │
│  │  - Configuration management                              │ │
│  │  - Port: 2181                                           │ │
│  └──────────────────────┬──────────────────────────────────┘ │
│                         │                                     │
│                         │ Manages                             │
│                         │                                     │
│  ┌──────────────────────▼──────────────────────────────────┐ │
│  │                  Kafka Broker                            │ │
│  │  - Message storage                                       │ │
│  │  - Topic management                                      │ │
│  │  - Producer/Consumer handling                            │ │
│  │  - Port: 9092                                           │ │
│  └──────────┬────────────────────────────┬─────────────────┘ │
│             │                             │                   │
│             │ Produces                    │ Consumes          │
│             │                             │                   │
│  ┌──────────▼─────────┐       ┌──────────▼─────────┐        │
│  │  Kafka Producer    │       │  Kafka Consumer    │        │
│  │  Port: 3001       │       │  Port: 3002       │        │
│  └────────────────────┘       └────────────────────┘        │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                    Kafka UI                               ││
│  │  - Web interface for monitoring                           ││
│  │  - Topic browsing                                         ││
│  │  - Consumer group management                              ││
│  │  - Port: 8080                                            ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                  Prometheus JMX Exporter                  ││
│  │  - Kafka metrics: :7071                                   ││
│  │  - Zookeeper metrics: :7072                               ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### Components

1. **Zookeeper**: Coordination service for the Kafka cluster
2. **Kafka Broker**: Message broker that stores and serves data
3. **Kafka UI**: Web interface for cluster management
4. **Producer Service**: Example service for producing messages
5. **Consumer Service**: Example service for consuming messages

---

## Zookeeper

### Purpose

Zookeeper is a centralized service for:
- Maintaining configuration information
- Distributed synchronization
- Group services coordination
- Leader election for Kafka brokers

### Configuration

**Environment Variables**:

```yaml
ZOOKEEPER_CLIENT_PORT: 2181          # Client connection port
ZOOKEEPER_TICK_TIME: 2000            # Basic time unit (ms)
KAFKA_JMX_PORT: 9998                 # JMX monitoring port
KAFKA_JMX_HOSTNAME: zookeeper        # JMX hostname
KAFKA_OPTS: -javaagent:/usr/share/jmx_prometheus_javaagent.jar=7072:/etc/jmx-exporter/config.yml
```

### Ports

| Port | Purpose |
|------|---------|
| 2181 | Client connections |
| 7072 | Prometheus JMX metrics |
| 9998 | JMX remote monitoring |

### Data Structure

Zookeeper stores Kafka metadata in a hierarchical namespace:

```
/brokers
  /ids              # Live broker IDs
  /topics           # Topic metadata
    /{topic}
      /partitions   # Partition info
/controller         # Controller broker info
/config             # Configuration data
  /topics           # Topic configurations
  /brokers          # Broker configurations
/consumers          # Consumer group metadata (deprecated)
/controller_epoch   # Controller election epoch
```

### Health Check

```bash
# Check Zookeeper status
echo ruok | nc localhost 2181
# Response: imok

# Get Zookeeper stats
echo stat | nc localhost 2181

# List all znodes
docker exec -it zookeeper zkCli.sh -server localhost:2181 ls /
```

### Common Commands

```bash
# Connect to Zookeeper CLI
docker exec -it zookeeper zkCli.sh -server localhost:2181

# Inside zkCli:
ls /brokers/ids                    # List broker IDs
get /brokers/ids/1                # Get broker 1 info
ls /brokers/topics                # List all topics
get /controller                   # Get controller info
```

### Monitoring

Key metrics to monitor:
- `zookeeper_outstanding_requests`: Pending requests
- `zookeeper_avg_latency`: Average request latency
- `zookeeper_num_alive_connections`: Active connections
- `zookeeper_packets_received`: Total packets received
- `zookeeper_packets_sent`: Total packets sent

---

## Kafka Broker

### Purpose

The Kafka broker is responsible for:
- Receiving messages from producers
- Storing messages on disk
- Serving messages to consumers
- Managing topic partitions
- Handling replication (in multi-broker setup)

### Configuration

**Environment Variables**:

```yaml
KAFKA_BROKER_ID: 1                           # Unique broker identifier
KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181      # Zookeeper connection string
KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092    # Listener addresses
KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092  # Advertised addresses
KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT
KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1   # __consumer_offsets replication
KAFKA_JMX_PORT: 9999
KAFKA_JMX_HOSTNAME: kafka
KAFKA_OPTS: -javaagent:/usr/share/jmx_prometheus_javaagent.jar=7071:/etc/jmx-exporter/config.yml
```

### Ports

| Port | Purpose |
|------|---------|
| 9092 | Kafka client connections (PLAINTEXT) |
| 7071 | Prometheus JMX metrics |
| 9999 | JMX remote monitoring |

### Key Concepts

#### Topics
- Logical channel for messages
- Can have multiple partitions
- Named streams of records

#### Partitions
- Ordered, immutable sequence of records
- Each partition is replicated across brokers (in multi-broker setup)
- Messages within partition are ordered

#### Offsets
- Unique sequential ID for each message in partition
- Consumers track their position using offsets
- Stored in special topic `__consumer_offsets`

#### Replication
- Each partition can have multiple replicas
- One replica is the leader, others are followers
- Leader handles all reads/writes
- Current setup: replication factor = 1 (no replication)

### Startup Sequence

1. Broker connects to Zookeeper
2. Registers itself with unique broker ID
3. Participates in controller election
4. Loads partition metadata
5. Starts serving requests
6. Begins replication (if configured)

### Log Structure

```
/var/lib/kafka/data/
  topic-partition-0/
    00000000000000000000.log      # Segment file
    00000000000000000000.index    # Offset index
    00000000000000000000.timeindex # Time index
    leader-epoch-checkpoint       # Leader epoch info
```

### Important Internal Topics

| Topic | Purpose |
|-------|---------|
| `__consumer_offsets` | Stores consumer group offsets |
| `__transaction_state` | Transaction coordinator state |

### Kafka Commands

```bash
# List topics
docker exec -it kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# Create topic
docker exec -it kafka kafka-topics.sh --create \
  --bootstrap-server localhost:9092 \
  --topic my-topic \
  --partitions 3 \
  --replication-factor 1

# Describe topic
docker exec -it kafka kafka-topics.sh --describe \
  --bootstrap-server localhost:9092 \
  --topic my-topic

# Delete topic
docker exec -it kafka kafka-topics.sh --delete \
  --bootstrap-server localhost:9092 \
  --topic my-topic

# List consumer groups
docker exec -it kafka kafka-consumer-groups.sh --list \
  --bootstrap-server localhost:9092

# Describe consumer group
docker exec -it kafka kafka-consumer-groups.sh --describe \
  --bootstrap-server localhost:9092 \
  --group my-consumer-group

# Producer console
docker exec -it kafka kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic test-topic

# Consumer console
docker exec -it kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic test-topic \
  --from-beginning
```

---

## Kafka UI

### Purpose

Kafka UI provides a web-based interface for:
- Monitoring cluster health
- Browsing topics and messages
- Managing consumer groups
- Viewing broker configurations
- Schema registry management (if enabled)

### Access

**URL**: http://localhost:8080

### Features

#### Topics View
- List all topics
- View topic configurations
- Browse messages
- Message filtering
- Partition distribution

#### Consumer Groups
- Active consumer groups
- Consumer lag monitoring
- Offset management
- Group member details

#### Brokers
- Broker list and status
- Configuration viewing
- Metrics overview
- Log directory info

#### Messages
- Browse messages by topic
- Filter by partition
- Search by key/value
- View headers and metadata
- Jump to specific offset

### Configuration

```yaml
KAFKA_CLUSTERS_0_NAME: local                    # Cluster display name
KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092   # Kafka connection
```

### Advanced Configuration (Optional)

```yaml
# Multiple clusters
KAFKA_CLUSTERS_0_NAME: local
KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
KAFKA_CLUSTERS_1_NAME: production
KAFKA_CLUSTERS_1_BOOTSTRAPSERVERS: prod-kafka:9092

# Schema Registry
KAFKA_CLUSTERS_0_SCHEMAREGISTRY: http://schema-registry:8081

# KSQL
KAFKA_CLUSTERS_0_KSQLDBSERVER: http://ksqldb:8088

# Authentication (if Kafka has SASL)
KAFKA_CLUSTERS_0_PROPERTIES_SECURITY_PROTOCOL: SASL_PLAINTEXT
KAFKA_CLUSTERS_0_PROPERTIES_SASL_MECHANISM: PLAIN
```

### Usage Examples

#### Creating a Topic via UI
1. Navigate to Topics
2. Click "Add a Topic"
3. Enter topic name
4. Set partitions and replication factor
5. Configure retention and cleanup policies
6. Click "Create"

#### Viewing Messages
1. Go to Topics
2. Select a topic
3. Click "Messages" tab
4. Choose partition (or all)
5. Select offset position
6. Click "Load Messages"

#### Monitoring Consumer Lag
1. Navigate to Consumer Groups
2. Select a consumer group
3. View lag per partition
4. Identify slow consumers

---

## Kafka Producer

### Purpose

Example service demonstrating Kafka message production. Can be used for:
- Testing Kafka connectivity
- Generating test data
- Demonstrating producer patterns
- Load testing

### Configuration

```yaml
KAFKA_BROKERS: kafka:9092      # Kafka broker address
KAFKA_TOPIC: test-topic        # Target topic
```

### API Endpoints

```bash
# Send single message
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Kafka!", "key": "user123"}'

# Send batch of messages
curl -X POST http://localhost:3001/send-batch \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"value": "Message 1", "key": "key1"}, {"value": "Message 2", "key": "key2"}]}'

# Health check
curl http://localhost:3001/health

# Prometheus metrics
curl http://localhost:3001/metrics
```

### Producer Configuration Options

```javascript
const producerConfig = {
  // Client identification
  clientId: 'ft-transcendence-producer',
  
  // Broker connection
  brokers: ['kafka:9092'],
  
  // Retry configuration
  retry: {
    retries: 5,
    initialRetryTime: 100,
    maxRetryTime: 30000
  },
  
  // Compression
  compression: 'gzip', // or 'snappy', 'lz4', 'zstd'
  
  // Idempotence (exactly-once semantics)
  idempotent: true,
  
  // Batching
  batch: {
    size: 16384,        // bytes
    maxMessages: 1000
  },
  
  // Timeout
  requestTimeout: 30000,
  
  // Acknowledgements
  acks: 1  // 0: no ack, 1: leader ack, -1: all replicas
}
```

### Message Format

```javascript
// Simple message
{
  topic: 'user-events',
  messages: [
    { value: 'User logged in' }
  ]
}

// Message with key (for partitioning)
{
  topic: 'user-events',
  messages: [
    { 
      key: 'user-123',
      value: JSON.stringify({ event: 'login', timestamp: Date.now() })
    }
  ]
}

// Message with headers
{
  topic: 'user-events',
  messages: [
    {
      key: 'user-123',
      value: JSON.stringify({ event: 'login' }),
      headers: {
        'correlation-id': '12345',
        'source': 'auth-service'
      }
    }
  ]
}

// Message to specific partition
{
  topic: 'user-events',
  messages: [
    {
      partition: 2,
      key: 'user-123',
      value: JSON.stringify({ event: 'login' })
    }
  ]
}
```

### Producer Patterns

#### Fire and Forget
```javascript
await producer.send({
  topic: 'logs',
  messages: [{ value: 'Log entry' }]
})
// Don't wait for acknowledgement
```

#### Synchronous Send
```javascript
const result = await producer.send({
  topic: 'critical-events',
  messages: [{ value: 'Important event' }]
})
console.log('Offset:', result[0].offset)
```

#### Batch Send
```javascript
const batch = []
for (let i = 0; i < 1000; i++) {
  batch.push({ value: `Message ${i}` })
}
await producer.send({
  topic: 'bulk-data',
  messages: batch
})
```

---

## Kafka Consumer

### Purpose

Example service demonstrating Kafka message consumption. Shows:
- Consumer group patterns
- Offset management
- Message processing
- Error handling

### Configuration

```yaml
KAFKA_BROKERS: kafka:9092      # Kafka broker address
KAFKA_TOPIC: test-topic        # Source topic
```

### API Endpoints

```bash
# Get consumed messages (with pagination)
curl "http://localhost:3002/messages?limit=10&offset=0"

# Get latest message
curl http://localhost:3002/messages/latest

# Get statistics
curl http://localhost:3002/stats

# Clear stored messages
curl -X DELETE http://localhost:3002/messages

# Health check
curl http://localhost:3002/health

# Prometheus metrics
curl http://localhost:3002/metrics
```

**Note**: The consumer starts automatically when the service launches. It continuously listens for messages and stores the last 1000 messages in memory.

### Consumer Configuration Options

```javascript
const consumerConfig = {
  // Consumer group ID (important!)
  groupId: 'ft-transcendence-consumer',
  
  // Broker connection
  brokers: ['kafka:9092'],
  
  // Session timeout
  sessionTimeout: 30000,
  rebalanceTimeout: 60000,
  heartbeatInterval: 3000,
  
  // Offset management
  autoCommit: true,
  autoCommitInterval: 5000,
  
  // Starting position
  fromBeginning: false, // true to start from earliest, false for latest
  
  // Max bytes per partition per fetch
  maxBytesPerPartition: 1048576,
  
  // Max wait time for fetch
  maxWaitTimeInMs: 5000,
  
  // Retry configuration
  retry: {
    retries: 5,
    initialRetryTime: 100
  }
}
```

### Consumer Patterns

#### Simple Consumer
```javascript
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    console.log({
      topic,
      partition,
      offset: message.offset,
      value: message.value.toString()
    })
  }
})
```

#### Batch Processing
```javascript
await consumer.run({
  eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
    for (const message of batch.messages) {
      // Process message
      await processMessage(message)
      
      // Commit offset
      resolveOffset(message.offset)
      
      // Send heartbeat to keep consumer alive
      await heartbeat()
    }
  }
})
```

#### Manual Offset Management
```javascript
const consumer = kafka.consumer({
  groupId: 'manual-commit-group',
  autoCommit: false
})

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    try {
      await processMessage(message)
      
      // Manually commit offset
      await consumer.commitOffsets([{
        topic,
        partition,
        offset: (parseInt(message.offset) + 1).toString()
      }])
    } catch (error) {
      // Don't commit on error
      console.error('Processing failed:', error)
    }
  }
})
```

#### Multiple Topics
```javascript
await consumer.subscribe({ 
  topics: ['user-events', 'system-events', 'notification-events'],
  fromBeginning: false 
})
```

#### Topic Pattern
```javascript
await consumer.subscribe({ 
  topics: /.*-events$/,  // Subscribe to all topics ending with -events
  fromBeginning: false 
})
```

### Consumer Groups

Consumer groups enable:
- **Load balancing**: Partitions distributed among consumers
- **Fault tolerance**: Automatic rebalancing on consumer failure
- **Scalability**: Add/remove consumers dynamically

#### Group Coordination

```
Topic: user-events (3 partitions)

Consumer Group: user-events-processors (3 consumers)
  Consumer 1: Partition 0
  Consumer 2: Partition 1
  Consumer 3: Partition 2

If Consumer 2 fails:
  Consumer 1: Partition 0, Partition 1
  Consumer 3: Partition 2
```

### Offset Management

#### Commit Strategies

1. **Auto-commit** (default):
   - Commits every `autoCommitInterval`
   - Risk: Messages may be processed twice on failure

2. **Manual commit after processing**:
   - Commit after successful processing
   - At-least-once delivery guarantee

3. **Manual commit before processing**:
   - Commit before processing
   - At-most-once delivery guarantee

4. **Transactional commits**:
   - Exactly-once semantics with transactions

---

## Topics Management

### Topic Configuration

Key topic configurations:

| Configuration | Description | Default | Recommendation |
|--------------|-------------|---------|----------------|
| `retention.ms` | How long to keep messages | 7 days | Based on use case |
| `retention.bytes` | Max size per partition | Unlimited | Set limit for critical topics |
| `segment.ms` | Time before segment rolls | 7 days | Smaller for frequent compaction |
| `cleanup.policy` | delete or compact | delete | compact for state topics |
| `compression.type` | Compression algorithm | producer | gzip or lz4 |
| `min.insync.replicas` | Min replicas for write | 1 | 2+ for production |
| `max.message.bytes` | Max message size | 1MB | Increase for large messages |

### Creating Topics

```bash
# Basic topic
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic user-events \
  --partitions 3 \
  --replication-factor 1

# Topic with configuration
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic chat-messages \
  --partitions 6 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config compression.type=lz4 \
  --config cleanup.policy=delete

# Compacted topic (for state)
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic user-state \
  --partitions 3 \
  --replication-factor 1 \
  --config cleanup.policy=compact \
  --config min.cleanable.dirty.ratio=0.01
```

### Modifying Topics

```bash
# Add partitions (cannot decrease!)
kafka-topics.sh --alter \
  --bootstrap-server kafka:9092 \
  --topic user-events \
  --partitions 6

# Update configuration
kafka-configs.sh --alter \
  --bootstrap-server kafka:9092 \
  --entity-type topics \
  --entity-name user-events \
  --add-config retention.ms=86400000

# Delete configuration
kafka-configs.sh --alter \
  --bootstrap-server kafka:9092 \
  --entity-type topics \
  --entity-name user-events \
  --delete-config retention.ms
```

### Partition Strategy

#### Choosing Partition Count

Factors to consider:
- **Throughput**: More partitions = higher throughput
- **Consumer parallelism**: One partition per consumer max
- **Broker capacity**: Balance partitions across brokers
- **Operations overhead**: Too many partitions = more metadata

Rule of thumb:
```
Partitions = max(
  Target throughput / Throughput per partition,
  Number of consumers
)
```

Example:
- Target: 1 GB/s throughput
- Per partition: 50 MB/s
- Minimum partitions: 1000/50 = 20

#### Partitioning Strategies

**Round-robin** (no key):
```javascript
producer.send({
  topic: 'logs',
  messages: [{ value: 'Log entry' }]  // No key = round-robin
})
```

**Key-based** (consistent partitioning):
```javascript
producer.send({
  topic: 'user-events',
  messages: [{ 
    key: userId,      // Same user always goes to same partition
    value: eventData 
  }]
})
```

**Custom partitioner**:
```javascript
const customPartitioner = () => {
  return ({ topic, partitionMetadata, message }) => {
    // Custom logic to select partition
    const partition = hashCode(message.key) % partitionMetadata.length
    return partition
  }
}
```

---

## Monitoring & Metrics

### JMX Metrics

Kafka exposes comprehensive metrics via JMX, scraped by Prometheus.

#### Broker Metrics

**Throughput**:
- `kafka_server_brokertopicmetrics_bytesin_total`: Bytes in per second
- `kafka_server_brokertopicmetrics_bytesout_total`: Bytes out per second
- `kafka_server_brokertopicmetrics_messagesin_total`: Messages in per second

**Request Metrics**:
- `kafka_network_requestmetrics_requests_total`: Total requests
- `kafka_network_requestmetrics_requestqueuetimems`: Time in request queue
- `kafka_network_requestmetrics_localtimems`: Local processing time
- `kafka_network_requestmetrics_remotetimems`: Remote processing time

**Partition Metrics**:
- `kafka_server_replicamanager_partitioncount`: Total partitions
- `kafka_server_replicamanager_leadercount`: Leader partitions
- `kafka_server_replicamanager_underreplicatedpartitions`: Under-replicated partitions

**Controller Metrics**:
- `kafka_controller_kafkacontroller_activecontrollercount`: Active controllers (should be 1)
- `kafka_controller_kafkacontroller_offlinepartitionscount`: Offline partitions

#### Producer Metrics

- `kafka_producer_request_rate`: Requests per second
- `kafka_producer_request_latency_avg`: Average request latency
- `kafka_producer_batch_size_avg`: Average batch size
- `kafka_producer_compression_rate_avg`: Compression ratio
- `kafka_producer_record_error_rate`: Error rate

#### Consumer Metrics

- `kafka_consumer_fetch_manager_records_consumed_rate`: Records consumed per second
- `kafka_consumer_fetch_manager_bytes_consumed_rate`: Bytes consumed per second
- `kafka_consumer_fetch_manager_records_lag`: Consumer lag
- `kafka_consumer_fetch_manager_records_lag_max`: Max lag across partitions
- `kafka_consumer_coordinator_commit_latency_avg`: Commit latency

### Health Indicators

| Metric | Status | Action |
|--------|--------|--------|
| Active controller count | = 1 | Good |
| Active controller count | ≠ 1 | Critical - investigate immediately |
| Under-replicated partitions | = 0 | Good |
| Under-replicated partitions | > 0 | Warning - check broker health |
| Consumer lag | < threshold | Good |
| Consumer lag | > threshold | Warning - scale consumers |
| Request queue time | < 100ms | Good |
| Request queue time | > 500ms | Warning - check broker load |

### Monitoring Queries (PromQL)

```promql
# Bytes in per second
rate(kafka_server_brokertopicmetrics_bytesin_total[5m])

# Messages in per second
rate(kafka_server_brokertopicmetrics_messagesin_total[5m])

# Consumer lag
kafka_consumer_fetch_manager_records_lag_max

# Under-replicated partitions
kafka_server_replicamanager_underreplicatedpartitions

# Request rate
rate(kafka_network_requestmetrics_requests_total[5m])

# Average request latency
kafka_network_requestmetrics_requestqueuetimems
```

---

## Performance Tuning

### Producer Tuning

**High Throughput**:
```javascript
{
  acks: 1,                    // Wait for leader only
  compression: 'lz4',         // Fast compression
  batch: {
    size: 32768,              // Larger batches
    maxMessages: 10000
  },
  linger: 10,                 // Wait 10ms to batch
  maxInFlightRequests: 5      // More concurrent requests
}
```

**Low Latency**:
```javascript
{
  acks: 1,
  compression: 'none',        // No compression overhead
  batch: {
    size: 0                   // Send immediately
  },
  linger: 0,                  // No batching delay
  maxInFlightRequests: 1      // Preserve order
}
```

**High Durability**:
```javascript
{
  acks: -1,                   // Wait for all replicas
  idempotent: true,           // Exactly-once
  compression: 'gzip',        // Best compression
  maxInFlightRequests: 5,
  retries: Number.MAX_VALUE   // Retry forever
}
```

### Consumer Tuning

**High Throughput**:
```javascript
{
  maxBytesPerPartition: 2097152,  // 2MB per partition
  maxWaitTimeInMs: 500,           // Wait less
  sessionTimeout: 60000,          // Longer session
  heartbeatInterval: 3000,
  fetch: {
    minBytes: 1024,                // Min bytes per fetch
    maxBytes: 52428800             // 50MB max
  }
}
```

**Low Latency**:
```javascript
{
  maxBytesPerPartition: 1048576,  // 1MB
  maxWaitTimeInMs: 100,           // Wait less
  fetch: {
    minBytes: 1                    // Return immediately
  }
}
```

### Broker Tuning

**OS Level**:
```bash
# Increase file descriptors
ulimit -n 100000

# Disable swapping
swappiness=1

# Increase network buffers
net.core.rmem_max=134217728
net.core.wmem_max=134217728
```

**Kafka Configuration**:
```properties
# Increase threads
num.network.threads=8
num.io.threads=16

# Adjust replica fetcher
num.replica.fetchers=4

# Socket buffer sizes
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600

# Log configuration
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000
```

---

## Best Practices

### Topic Design

1. **Naming Convention**:
   - Use dots: `domain.entity.event` (e.g., `user.profile.updated`)
   - Or hyphens: `domain-entity-event` (e.g., `user-profile-updated`)
   - Be consistent across organization

2. **Partition Count**:
   - Start with moderate count (3-6)
   - Plan for growth (can only increase)
   - Consider max consumer count

3. **Replication**:
   - Production: min 2, ideally 3
   - Critical data: 3+
   - Development: 1 is acceptable

4. **Retention**:
   - Event streams: 1-7 days
   - Audit logs: 30+ days
   - State topics: Use compaction

### Producer Best Practices

1. **Always set a key** for related messages
2. **Use compression** (lz4 or snappy for speed)
3. **Enable idempotence** for exactly-once
4. **Handle errors** with retry logic
5. **Monitor metrics** (especially error rate)
6. **Use async sends** for better throughput
7. **Batch appropriately** for your use case

### Consumer Best Practices

1. **Use consumer groups** for scaling
2. **Handle rebalancing** gracefully
3. **Commit offsets** after processing
4. **Monitor lag** continuously
5. **Implement idempotent processing** (for at-least-once)
6. **Use appropriate poll timeout**
7. **Handle poison pills** (bad messages)
8. **Implement dead letter queue** pattern

### Operations Best Practices

1. **Monitor continuously**:
   - Broker health
   - Consumer lag
   - Disk usage
   - Network throughput

2. **Plan capacity**:
   - Disk I/O capacity
   - Network bandwidth
   - Storage requirements

3. **Regular maintenance**:
   - Update Kafka version
   - Clean up old topics
   - Optimize configurations

4. **Disaster recovery**:
   - Regular backups
   - Documented recovery procedures
   - Test failover scenarios

---

## Troubleshooting

### Common Issues

#### Zookeeper Connection Failed

**Symptoms**: Kafka broker can't start

**Diagnosis**:
```bash
# Check Zookeeper is running
docker ps | grep zookeeper

# Check Zookeeper logs
docker logs zookeeper

# Test connection
echo ruok | nc localhost 2181
```

**Solutions**:
- Ensure Zookeeper started before Kafka
- Check network connectivity
- Verify Zookeeper port (2181)
- Check Docker network configuration

#### Consumer Lag Growing

**Symptoms**: Messages piling up, delays in processing

**Diagnosis**:
```bash
# Check consumer group lag
kafka-consumer-groups.sh --describe \
  --bootstrap-server localhost:9092 \
  --group my-group

# Check if consumers are active
docker logs kafka-consumer
```

**Solutions**:
- Add more consumers (up to partition count)
- Optimize message processing
- Increase consumer resources
- Check for errors in consumer logs
- Review consumer configuration (fetch size, poll timeout)

#### Under-Replicated Partitions

**Symptoms**: Data at risk, performance degradation

**Diagnosis**:
```bash
# Check under-replicated partitions
kafka-topics.sh --describe \
  --bootstrap-server localhost:9092 \
  --under-replicated-partitions

# Check broker status
kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

**Solutions**:
- Check broker health
- Increase replica.lag.time.max.ms
- Check network between brokers
- Verify disk I/O performance
- Check for broker overload

#### Kafka Running Out of Disk Space

**Symptoms**: Broker crashes, write failures

**Diagnosis**:
```bash
# Check disk usage
docker exec kafka df -h /var/lib/kafka

# Check log segment sizes
docker exec kafka du -sh /var/lib/kafka/data/*
```

**Solutions**:
- Reduce retention time
- Enable log compaction
- Increase disk capacity
- Delete old topics
- Archive old data

#### Message Loss

**Symptoms**: Messages not appearing in topic

**Diagnosis**:
- Check producer error rate
- Verify acknowledgement settings
- Check topic retention settings
- Review producer logs

**Solutions**:
- Use `acks=-1` for durability
- Enable producer idempotence
- Increase replication factor
- Check for topic deletion policy
- Review producer retry configuration

### Debugging Commands

```bash
# Get broker information
kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# Check topic configuration
kafka-configs.sh --describe \
  --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name my-topic

# Verify producer can connect
kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic test \
  --property "parse.key=true" \
  --property "key.separator=:"

# Verify consumer can connect
kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic test \
  --from-beginning \
  --property "print.key=true"

# Check log segments
docker exec kafka ls -lh /var/lib/kafka/data/my-topic-0/

# View JMX metrics
curl http://localhost:7071/metrics
```

---

## Migration Path

### Moving to Production

Current setup is single-broker development configuration. For production:

1. **Multi-broker Cluster**:
   - Deploy 3+ brokers
   - Update replication factor to 3
   - Configure rack awareness

2. **Security**:
   - Enable SSL/TLS
   - Configure SASL authentication
   - Set up ACLs (Access Control Lists)
   - Enable encryption at rest

3. **High Availability**:
   - Multiple Zookeeper nodes (3 or 5)
   - Cross-AZ deployment
   - Load balancer for client connections

4. **Monitoring**:
   - Enhanced alerting rules
   - Automated remediation
   - Capacity planning alerts

5. **Backup & Recovery**:
   - Implement backup strategy
   - Test recovery procedures
   - Document runbooks

---

## Additional Resources

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Kafka Improvement Proposals (KIPs)](https://cwiki.apache.org/confluence/display/KAFKA/Kafka+Improvement+Proposals)
- [Confluent Kafka Tutorials](https://kafka-tutorials.confluent.io/)
- [Zookeeper Documentation](https://zookeeper.apache.org/doc/current/)

---

*Last Updated: October 31, 2025*
