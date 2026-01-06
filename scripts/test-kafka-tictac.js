const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['127.0.0.1:9092']
});

const producer = kafka.producer();

async function sendUserCreatedEvent() {
  try {
    await producer.connect();
    console.log('✅ Producer connected');
    
    const userId = `test-user-${Date.now()}`;
    const event = {
      type: 'user-created',
      data: {
        id: userId,
        username: `testuser_${Date.now()}`,
        email: 'test@example.com',
        createdAt: new Date().toISOString()
      }
    };
    
    await producer.send({
      topic: 'user-events',
      messages: [
        { value: JSON.stringify(event) }
      ]
    });
    
    console.log('✅ User-created event sent:', event);
    
    // Wait a bit, then send update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updateEvent = {
      type: 'user-updated',
      data: {
        id: userId,
        username: `updated_${Date.now()}`,
        updatedAt: new Date().toISOString()
      }
    };
    
    await producer.send({
      topic: 'user-events',
      messages: [
        { value: JSON.stringify(updateEvent) }
      ]
    });
    
    console.log('✅ User-updated event sent:', updateEvent);
    
    await producer.disconnect();
    console.log('✅ Producer disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

sendUserCreatedEvent();
