interface KafkaProducerConfig {
    clientId?: string;
    brokers?: string | string[];
    topic?: string;
    logger?: Console;
}
interface SendOptions {
    topic?: string;
    key?: string;
}
interface SendResult {
    success: boolean;
    message: any;
    topic: string;
}
interface SendBatchResult {
    success: boolean;
    count: number;
    topic: string;
}
interface ProducerStatus {
    clientId: string;
    connected: boolean;
    topic: string;
}
declare class KafkaProducerService {
    private clientId;
    private topic;
    private logger;
    private isConnected;
    private kafka;
    private producer;
    constructor(config?: KafkaProducerConfig);
    connect(retryInterval?: number): Promise<boolean>;
    send(message: any, options?: SendOptions): Promise<SendResult>;
    sendBatch(messages: any[], options?: SendOptions): Promise<SendBatchResult>;
    disconnect(): Promise<void>;
    getStatus(): ProducerStatus;
}
export default KafkaProducerService;
export { KafkaProducerConfig, SendOptions, SendResult, SendBatchResult, ProducerStatus };
//# sourceMappingURL=kafkaProducer.d.ts.map