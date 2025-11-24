# Kafka Shared Utilities

Reusable Kafka producer and consumer classes for all microservices.

## Structure

```
shared/
├── kafkaProducer.js      # Producer utility class (JavaScript)
├── kafkaProducer.ts      # Producer utility class (TypeScript)
├── kafkaConsumer.js      # Consumer utility class (JavaScript)
├── kafkaConsumer.ts      # Consumer utility class (TypeScript)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## TypeScript Support

The shared utilities are now available in both JavaScript and TypeScript!

### Setup for TypeScript

```bash
cd shared
npm install
npm run build  # Compile TypeScript to JavaScript
```

### Using TypeScript versions

```typescript
import KafkaProducerService from './shared/kafkaProducer';
import KafkaConsumerService from './shared/kafkaConsumer';

// Full type safety!
const producer = new KafkaProducerService({
  clientId: 'my-service',
  brokers: 'kafka:9092',
  topic: 'my-topic'
});
```

## KafkaProducerService

### Features
- Auto-reconnect on connection failure
- Send single or batch messages
- Status monitoring
- Graceful shutdown

### Usage

```javascript
const KafkaProducerService = require('../shared/kafkaProducer');

const producer = new KafkaProducerService({
  clientId: 'my-service',
  brokers: 'kafka:9092',  // or array ['kafka1:9092', 'kafka2:9092']
  topic: 'my-topic',
  logger: console
});

// Connect with auto-retry (5 seconds)
await producer.connect(5000);

// Send single message
await producer.send({
  event: 'USER_CREATED',
  userId: 123,
  timestamp: new Date().toISOString()
});

// Send to different topic
await producer.send(message, { topic: 'other-topic' });

// Send batch messages
await producer.sendBatch([msg1, msg2, msg3]);

// Get status
const status = producer.getStatus();

// Disconnect
await producer.disconnect();
```

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| clientId | string | 'default-producer' | Kafka client identifier |
| brokers | string/array | 'kafka:9092' | Kafka broker(s) |
| topic | string | 'userManagement' | Default topic |
| logger | object | console | Logger instance |

### Methods

- `connect(retryInterval)` - Connect to Kafka (returns Promise)
- `send(message, options)` - Send single message
- `sendBatch(messages, options)` - Send multiple messages
- `disconnect()` - Close connection
- `getStatus()` - Get connection status

## KafkaConsumerService

### Features
- Auto message storage with max limit
- Custom message handlers
- Subscribe to multiple topics
- Pagination support
- Stats and monitoring

### Usage

```javascript
const KafkaConsumerService = require('../shared/kafkaConsumer');

const consumer = new KafkaConsumerService({
  clientId: 'my-consumer',
  groupId: 'my-group',
  brokers: 'kafka:9092',
  topic: 'my-topic',
  fromBeginning: true,
  maxMessages: 100,
  logger: console,
  messageHandler: async (messageData) => {
    // Custom processing
    console.log('Received:', messageData.value);
  }
});

// Start consumer (connect + subscribe + run)
await consumer.start();

// Or do it step by step
await consumer.connect();
await consumer.subscribe(['topic1', 'topic2']);
await consumer.run();

// Get messages with pagination
const messages = consumer.getMessages(10, 0); // limit, offset

// Get latest message
const latest = consumer.getLatestMessage();

// Get stats
const stats = consumer.getStats();

// Reset stored messages
consumer.resetMessages();

// Disconnect
await consumer.disconnect();
```

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| clientId | string | 'default-consumer' | Kafka client identifier |
| groupId | string | 'default-group' | Consumer group ID |
| brokers | string/array | 'kafka:9092' | Kafka broker(s) |
| topic | string/array | 'userManagement' | Topic(s) to subscribe |
| fromBeginning | boolean | true | Read from beginning |
| maxMessages | number | 100 | Max messages to store |
| logger | object | console | Logger instance |
| messageHandler | function | null | Custom message processor |

### Methods

- `connect()` - Connect to Kafka
- `subscribe(topics)` - Subscribe to topic(s)
- `run(customHandler)` - Start consuming messages
- `start(topics)` - Connect + subscribe + run
- `disconnect()` - Close connection
- `getMessages(limit, offset)` - Get stored messages
- `getLatestMessage()` - Get most recent message
- `getStats()` - Get consumer statistics
- `resetMessages()` - Clear stored messages
- `getStatus()` - Get connection status

### Message Data Structure

```javascript
{
  topic: 'userManagement',
  partition: 0,
  offset: '42',
  value: { /* parsed JSON */ },
  rawValue: '{"event":"USER_CREATED"}',
  timestamp: '2025-11-23T10:30:00.000Z',
  key: 'user-123'  // or null
}
```

## Example Services

See the refactored examples:
- `service-a/producer-refactored.js` - Producer implementation
- `service-b/consumer-refactored.js` - Consumer implementation

## Migration Guide

### Before (Old Code)
```javascript
const kafka = new Kafka({ clientId: 'service-A', brokers: ['kafka:9092'] });
const producer = kafka.producer();
await producer.connect();
await producer.send({
  topic: 'userManagement',
  messages: [{ value: JSON.stringify(message) }]
});
```

### After (New Code)
```javascript
const producer = new KafkaProducerService({
  clientId: 'service-A',
  brokers: 'kafka:9092',
  topic: 'userManagement'
});
await producer.connect();
await producer.send(message);
```

## Benefits

1. **Less Code** - Reduce boilerplate by 60-70%
2. **Consistency** - Same patterns across all services
3. **Error Handling** - Built-in retry and error management
4. **Monitoring** - Easy status checks and stats
5. **Maintainability** - Fix bugs in one place
6. **Flexibility** - Easy to customize per service

## Testing

```bash
# Test producer
curl -X POST http://localhost:3010/send \
  -H "Content-Type: application/json" \
  -d '{"userId": 123, "userName": "Test"}'

# Test consumer
curl http://localhost:3011/messages?limit=5
curl http://localhost:3011/stats
```
