# ft_transcendence Architecture

## System Overview

ft_transcendence is a microservices-based web application with real-time features, comprehensive monitoring, and enterprise-grade security.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Internet/Client                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS/HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  WAF/ModSecurity (NGINX)                         │
│  - Web Application Firewall                                      │
│  - OWASP Core Rule Set                                          │
│  - Rate Limiting                                                │
│  - SSL/TLS Termination                                          │
│  - Reverse Proxy                                                │
│  Port: 80, 443                                                  │
└────────────┬───────────────┬───────────────┬────────────────────┘
             │               │               │
             │               │               │
    ┌────────▼─────┐  ┌─────▼──────┐  ┌────▼──────┐
    │   Frontend   │  │    API     │  │  Kafka UI │
    │   (React)    │  │  Gateway   │  │           │
    │   :80        │  │   :8080    │  │  :8080    │
    └──────────────┘  └─────┬──────┘  └───────────┘
                            │
                   ┌────────┴────────┐
                   │  Socket.IO      │
                   │  Namespaces     │
                   └────┬────────┬───┘
                        │        │
            ┌───────────▼──┐  ┌─▼────────────┐
            │     Chat     │  │ Notification │
            │   Service    │  │   Service    │
            │   :3003      │  │   :3005      │
            └──────┬───────┘  └──────┬───────┘
                   │                 │
                   └────┬────────────┘
                        │
                   ┌────▼──────┐
                   │   Kafka   │
                   │  Message  │
                   │   Broker  │
                   │   :9092   │
                   └────┬──────┘
                        │
                   ┌────▼──────┐
                   │ Zookeeper │
                   │   :2181   │
                   └───────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Additional Services                           │
├─────────────────────────────────────────────────────────────────┤
│  • User Authentication Service                                   │
│  • Game Service                                                  │
│  • Leaderboard Service                                          │
│  • Monitoring Stack (Prometheus, Grafana, ELK)                  │
└─────────────────────────────────────────────────────────────────┘
```

## Security Layer (NEW)

### WAF/ModSecurity
The Web Application Firewall is the first line of defense:

**Location**: `security/waf/`

**Features**:
- ✅ SQL Injection Protection
- ✅ XSS Protection
- ✅ Path Traversal Protection
- ✅ Command Injection Protection
- ✅ Rate Limiting (10 req/s general, 20 req/s API, 5 req/min auth)
- ✅ File Upload Restrictions
- ✅ OWASP Top 10 Coverage
- ✅ Custom Application Rules

**Configuration**:
- `Dockerfile` - Builds NGINX with ModSecurity v3
- `nginx.conf` - NGINX configuration with security hardening
- `modsecurity.conf` - ModSecurity engine settings
- `custom-rules.conf` - Application-specific security rules
- `waf-proxy.conf` - Reverse proxy with rate limiting

**Ports**:
- 80 (HTTP)
- 443 (HTTPS - for production)

## Frontend Layer

### React Application
**Technology**: React + TypeScript + Vite  
**Port**: 80 (internal, accessed through WAF)  
**Location**: `app/frontend/`

**Features**:
- Single Page Application (SPA)
- Real-time chat interface
- Notification system
- User authentication UI
- Game interface
- Responsive design with Tailwind CSS

**State Management**:
- Zustand for global state
- Socket.IO client for real-time communication

## API Layer

### API Gateway
**Technology**: Fastify + Socket.IO  
**Port**: 8080 (internal, accessed through WAF at /api)  
**Location**: `app/backend/api_gateway/`

**Responsibilities**:
- Central entry point for all backend services
- Authentication middleware (JWT)
- Socket.IO namespace routing
- Request forwarding
- CORS handling

**Socket.IO Namespaces**:
- `/chat` - Chat service namespace
- `/notification` - Notification service namespace

## Microservices Layer

### Chat Service
**Technology**: Fastify + Socket.IO + SQLite  
**Port**: 3003  
**Location**: `app/backend/services/chat/`

**Features**:
- Real-time messaging
- Message validation (friend/blocked status)
- Message persistence
- Kafka integration for notifications

**Database**: SQLite with relationships table

### Notification Service
**Technology**: Fastify + Socket.IO  
**Port**: 3006 
**Location**: `app/backend/services/notification/`

**Features**:
- Real-time notification delivery
- Multiple notification types (messages, friend requests, games)
- Kafka consumer for events
- User socket tracking

### User Authentication Service
**Technology**: Node.js  
**Port**: TBD  
**Location**: `app/backend/services/userAuth/`

**Features**:
- User registration/login
- JWT token generation
- Password hashing
- Session management

### Game Service
**Port**: 3005
**Location**: `app/backend/services/game/`
**Features**:


### Leaderboard Service
**Location**: `app/backend/services/leaderboard/`
**Status**: To be implemented

## Message Queue Layer

### Kafka
**Technology**: Apache Kafka  
**Port**: 9092  
**Location**: `infra/kafka/`

**Purpose**:
- Asynchronous event streaming
- Service decoupling
- Message persistence
- Scalable message processing

**Topics**:
- `notifications` - Notification events

**Producers**:
- Chat Service (publishes message notifications)

**Consumers**:
- Notification Service (consumes notification events)

### Zookeeper
**Technology**: Apache Zookeeper  
**Port**: 2181  
**Location**: `infra/zookeeper/`

**Purpose**:
- Kafka cluster coordination
- Configuration management
- Leader election

### Kafka UI
**Technology**: kafka-ui  
**Port**: 8080 (accessed through WAF at /kafka-ui)  
**Location**: `infra/kafka-ui/`

**Purpose**:
- Kafka cluster monitoring
- Topic management
- Message browsing

## Monitoring Layer

### Prometheus
**Technology**: Prometheus  
**Port**: 9090  
**Location**: `infra/monitoring/prometheus/`

**Features**:
- Metrics collection
- Time-series database
- Alert rules
- Service discovery

### Grafana
**Technology**: Grafana  
**Port**: 3000  
**Location**: `infra/monitoring/grafana/`

**Features**:
- Metrics visualization
- Custom dashboards
- Alerting
- Multiple data sources

### ELK Stack

#### Elasticsearch
**Port**: 9200  
**Location**: `infra/monitoring/elasticsearch/`
- Log storage and indexing

#### Logstash
**Port**: 5044  
**Location**: `infra/monitoring/logstash/`
- Log processing and transformation

#### Kibana
**Port**: 5601  
**Location**: `infra/monitoring/kibana/`
- Log visualization and analysis

#### Filebeat
**Location**: `infra/monitoring/filebeat/`
- Log shipping from containers

### Node Exporter
**Port**: 9100  
**Location**: `infra/monitoring/node-exporter/`
- System metrics collection

### Alertmanager
**Port**: 9093  
**Location**: `infra/monitoring/alertmanager/`
- Alert routing and management

## Data Flow

### Message Flow
```
User A → WAF → Frontend → WAF → API Gateway → Chat Service
                                                    ↓
                                          (Validate relationship)
                                                    ↓
                                            (Save to SQLite)
                                                    ↓
                                         (Publish to Kafka)
                                                    ↓
                                            Notification Service
                                                    ↓
                                      (Emit to User B via Socket.IO)
                                                    ↓
                            API Gateway → WAF → Frontend → User B
```

### Authentication Flow
```
User → WAF → Frontend → WAF → API Gateway → User Auth Service
                                                    ↓
                                              (Verify credentials)
                                                    ↓
                                            (Generate JWT token)
                                                    ↓
                            API Gateway → WAF → Frontend → User
                                                    ↓
                                        (Store token in localStorage)
                                                    ↓
                                    (Include in subsequent requests)
```

### Security Flow (WAF)
```
Request → WAF/ModSecurity
            ↓
       (Apply OWASP CRS)
            ↓
       (Check rate limit)
            ↓
       (Custom rules)
            ↓
    ┌───────┴───────┐
    ↓               ↓
  Allow          Block
    ↓               ↓
 Backend        403 Response
 Services        + Log audit
```

## Network

### Docker Network: ft_Transc
All services communicate through a single Docker bridge network.

**Benefits**:
- Service discovery by container name
- Isolated network
- Internal DNS resolution

## Storage

### Volumes
- `prometheus-data` - Prometheus metrics
- `alertmanager-data` - Alert configurations
- `grafana-data` - Grafana dashboards
- `elasticsearch-data` - Log data

### Logs
- `logs/waf/` - WAF access and error logs
- `logs/modsec/` - ModSecurity audit logs
- `logs/` - Application logs

### Databases
- SQLite files for service-specific data
- Stored in service directories

## Security Features

### WAF/ModSecurity (NEW)
- ✅ First line of defense
- ✅ OWASP CRS protection
- ✅ Rate limiting
- ✅ DDoS mitigation
- ✅ Attack logging

### Application Level
- ✅ JWT authentication
- ✅ Password hashing
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention (at application level)

### Network Level
- ✅ Docker network isolation
- ✅ Internal service communication
- ✅ Exposed only necessary ports
- ✅ WAF as single entry point

### Planned (HashiCorp Vault - Next Module)
- ⏳ Secrets management
- ⏳ Dynamic credentials
- ⏳ Encryption as a service
- ⏳ Certificate management

## Deployment

### Development
```bash
# Start core services
docker-compose up -d zookeeper kafka waf

# Start backend services
npm run dev  # In each service directory

# Start frontend
npm run dev  # In frontend directory
```

### Production
```bash
# Start all services
docker-compose up -d

# Access through WAF
https://your-domain.com
```

## Scalability

### Current Architecture
- Single instance per service
- SQLite for persistence
- Suitable for moderate traffic

### Future Scalability Options
1. **Horizontal Scaling**
   - Multiple instances per service
   - Load balancing
   - Shared state management

2. **Database**
   - Migrate from SQLite to PostgreSQL
   - Database replication
   - Connection pooling

3. **Caching**
   - Redis for session storage
   - API response caching
   - WebSocket connection caching

4. **CDN**
   - Static asset distribution
   - DDoS protection
   - Geographic distribution

## High Availability

### Current Setup
- Basic health checks
- Automatic container restart
- Log rotation

### Future HA Options
- Service replication
- Database clustering
- Multi-region deployment
- Backup and disaster recovery

## Performance Considerations

### WAF
- ~5-15ms latency per request
- Minimal CPU overhead
- Configurable buffer sizes
- Rate limiting prevents overload

### WebSocket
- Long-lived connections
- Efficient binary protocol
- Namespace-based routing
- Connection pooling

### Kafka
- High throughput messaging
- Message persistence
- Scalable consumer groups
- Offset management

## Monitoring & Observability

### Metrics (Prometheus)
- Request rates
- Response times
- Error rates
- System resources

### Logs (ELK)
- Application logs
- Access logs
- Audit logs (ModSecurity)
- Structured logging

### Visualization (Grafana)
- Real-time dashboards
- Custom metrics
- Alert visualization
- Historical data

### Security Monitoring
- Attack attempts (ModSecurity audit log)
- Rate limit violations
- Blocked requests
- Suspicious patterns

## Configuration Management

### Environment Variables
- Service-specific `.env` files
- Docker Compose environment section
- Secrets in HashiCorp Vault (planned)

### Configuration Files
- Service configs in respective directories
- NGINX/ModSecurity in `security/waf/`
- Monitoring configs in `infra/monitoring/`
- Centralized in docker-compose.yml

## Documentation

- `docs/architecture.md` - This file
- `docs/waf-implementation-guide.md` - WAF detailed guide
- `docs/waf-quick-reference.md` - WAF quick commands
- `docs/WAF-IMPLEMENTATION-SUMMARY.md` - WAF summary
- `docs/services.md` - Service documentation
- `docs/monitoring-stack.md` - Monitoring documentation
- `security/waf/README.md` - WAF technical details

## Technology Stack Summary

| Layer | Technology |
|-------|------------|
| WAF | NGINX + ModSecurity + OWASP CRS |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| API Gateway | Fastify + Socket.IO |
| Backend Services | Node.js + Fastify |
| Real-time | Socket.IO |
| Message Queue | Apache Kafka + Zookeeper |
| Databases | SQLite (to be migrated to PostgreSQL) |
| Monitoring | Prometheus + Grafana + ELK Stack |
| Containerization | Docker + Docker Compose |
| Secrets Management | HashiCorp Vault (planned) |

## Port Mapping

| Service | Internal Port | External Port | Access |
|---------|--------------|---------------|--------|
| WAF | 80, 443 | 80, 443 | Public |
| Frontend | 80 | - | Via WAF |
| API Gateway | 8080 | - | Via WAF /api |
| Chat Service | 3003 | - | Internal |
| Notification Service | 3005 | - | Internal |
| Kafka | 9092 | 9092 | Internal + Local |
| Kafka UI | 8080 | - | Via WAF /kafka-ui |
| Zookeeper | 2181 | 2181 | Internal |
| Prometheus | 9090 | 9090 | Internal |
| Grafana | 3000 | 3000 | Internal |
| Elasticsearch | 9200 | 9200 | Internal |
| Kibana | 5601 | 5601 | Internal |

## Security Compliance

### OWASP Top 10 Coverage
1. ✅ Injection - ModSecurity + Input validation
2. ✅ Broken Authentication - JWT + Rate limiting
3. ✅ Sensitive Data Exposure - HTTPS + Vault (planned)
4. ✅ XML External Entities - ModSecurity
5. ✅ Broken Access Control - Authorization middleware
6. ✅ Security Misconfiguration - Hardened configs
7. ✅ XSS - ModSecurity + React auto-escaping
8. ✅ Insecure Deserialization - Input validation
9. ✅ Using Components with Known Vulnerabilities - Regular updates
10. ✅ Insufficient Logging & Monitoring - ELK + Prometheus

## Future Enhancements

### Phase 1: HashiCorp Vault (Next)
- Secrets management
- Dynamic database credentials
- PKI/Certificate management
- Encryption as a service

### Phase 2: Advanced Security
- Two-factor authentication
- API key management
- Advanced threat detection
- Security information and event management (SIEM)

### Phase 3: Performance & Scalability
- Redis caching layer
- PostgreSQL migration
- Service mesh (Istio/Linkerd)
- Horizontal pod autoscaling

### Phase 4: DevOps & Automation
- CI/CD pipelines
- Automated testing
- Infrastructure as Code (Terraform)
- GitOps workflow

---

**Last Updated**: December 2025  
**Status**: Production Ready (with WAF/ModSecurity implemented)  
**Next Module**: HashiCorp Vault for Secrets Management
