<div align="center">

# 🎮 ft_transcendence

### Enterprise-Grade Real-Time Gaming & Social Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Kafka](https://img.shields.io/badge/Apache%20Kafka-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white)](https://kafka.apache.org/)

*A production-ready, microservices-based real-time platform featuring live chat, multiplayer gaming, and comprehensive observability stack*

[Features](#-key-features) • [Architecture](#-architecture) • [Tech Stack](#-technology-stack) • [Getting Started](#-getting-started) • [Documentation](#-documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Security Features](#-security-features)
- [Infrastructure & DevOps](#-infrastructure--devops)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Monitoring & Observability](#-monitoring--observability)
- [Contributing](#-contributing)

---

## 🌟 Overview

**ft_transcendence** is a modern, full-stack web application that demonstrates enterprise-level architecture and development practices. Built with a microservices architecture, it showcases real-time communication, event-driven design, comprehensive security measures, and production-grade infrastructure.

### 🎯 What Makes This Special?

- 🏗️ **Microservices Architecture** - Independently deployable services with clear boundaries
- ⚡ **Real-Time Everything** - WebSocket-powered instant messaging and live notifications
- 🔐 **Security-First Design** - WAF, Vault secrets management, JWT authentication
- 📊 **Full Observability** - Complete monitoring with Prometheus, Grafana, and ELK stack
- 🚀 **Event-Driven** - Apache Kafka for reliable, scalable async communication
- 🎮 **Multi-Game Support** - Extensible gaming framework with TicTacToe and Pong

---

## ✨ Key Features

### 💬 Real-Time Chat System
- **Instant Messaging** - WebSocket-based real-time chat with message history
- **User Relationships** - Friend management with block/unblock capabilities
- **Privacy Controls** - User-level notification preferences (mute/unmute)
- **Read Receipts** - Track message delivery and read status
- **Online Presence** - Live user status tracking across the platform
- **Search & Discovery** - Find and connect with users instantly

### 🎮 Multiplayer Gaming Platform
- **TicTacToe** - Real-time multiplayer with game state synchronization
- **Pong** - Classic game with live opponent matching
- **Challenge System** - Send and receive game invitations
- **Leaderboard** - Global rankings and player statistics
- **Game History** - Track wins, losses, and performance metrics

### 🔔 Smart Notification System
- **Multi-Channel Notifications** - Toast notifications, in-app alerts, and persistent storage
- **Event-Driven** - Kafka-powered notification delivery with guaranteed delivery
- **User Preferences** - Granular control over notification types and delivery
- **Offline Support** - Notifications queued for offline users
- **Type-Specific Handling** - Different notification styles for messages, challenges, and system events

### 👤 User Management
- **OAuth Integration** - Secure authentication with JWT tokens
- **Profile Customization** - Avatars, backgrounds, bios, and privacy settings
- **Session Management** - Refresh token rotation and automatic token renewal
- **Account Security** - Password hashing, rate limiting, and audit logs

---

## 🏗️ Architecture

### Microservices Architecture

Each service is independently:
- **Deployable** - Container-based with Docker
- **Scalable** - Horizontal scaling capability
- **Testable** - Isolated business logic
- **Maintainable** - Clear service boundaries

#### Service Breakdown

| Service | Responsibility | Port | Database |
|---------|---------------|------|----------|
| **API Gateway** | Request routing, load balancing | 3000 | - |
| **User Auth** | Authentication, user management | 3001 | users.sqlite |
| **Chat Service** | Messaging, relationships | 3002 | chat.sqlite |
| **Game Service** | Game logic, matchmaking | 3003 | game.sqlite |
| **Notification** | Event handling, notifications | 3006 | notification.sqlite |
| **Leaderboard** | Rankings, statistics | 3004 | leaderboard.sqlite |

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI with hooks and context
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Socket.io Client** - Real-time communication
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Beautiful icon library

### Backend
- **Node.js 20** - JavaScript runtime
- **Fastify** - High-performance web framework
- **TypeScript** - Type safety across services
- **Socket.io** - WebSocket server implementation
- **Better-SQLite3** - Synchronous SQLite database
- **JWT** - Stateless authentication

### Message Queue & Events
- **Apache Kafka** - Distributed event streaming
- **Zookeeper** - Kafka coordination
- **KafkaJS** - Node.js Kafka client

### Security
- **NGINX + ModSecurity** - Web Application Firewall
- **OWASP CRS** - Core rule set for attack prevention
- **HashiCorp Vault** - Secrets management
- **bcrypt** - Password hashing
- **JWT Tokens** - Secure authentication

### Infrastructure & DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Prometheus** - Metrics collection and alerting
- **Grafana** - Metrics visualization and dashboards
- **ELK Stack** - Centralized logging
  - Elasticsearch - Log storage and search
  - Logstash - Log processing pipeline
  - Kibana - Log visualization
- **Filebeat** - Log shipping
- **Node Exporter** - System metrics

---

## 🛡️ Security Features

### Web Application Firewall (WAF)
- ✅ **OWASP ModSecurity CRS** - Industry-standard protection
- ✅ **SQL Injection Prevention** - Automatic detection and blocking
- ✅ **XSS Protection** - Cross-Site Scripting prevention
- ✅ **Path Traversal Protection** - Directory access prevention
- ✅ **Command Injection Protection** - OS command blocking
- ✅ **DDoS Mitigation** - Rate limiting and connection throttling
- ✅ **Security Headers** - HSTS, CSP, X-Frame-Options
- ✅ **Request Validation** - Body size limits, method filtering

### Secrets Management (HashiCorp Vault)
- ✅ **Centralized Secret Storage** - Single source of truth
- ✅ **AppRole Authentication** - Service-to-service auth
- ✅ **Dynamic Secrets** - Time-limited credentials
- ✅ **Encryption as a Service** - Transit engine
- ✅ **Audit Logging** - Complete access trail
- ✅ **Policy-Based Access** - Fine-grained permissions
- ✅ **Automatic Token Renewal** - Zero-downtime rotation
- ✅ **TLS Encryption** - All communication encrypted

### Authentication & Authorization
- ✅ **JWT-based Authentication** - Stateless, scalable
- ✅ **Refresh Token Rotation** - Enhanced security
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Rate Limiting** - Brute-force protection
- ✅ **Session Management** - Automatic expiration
- ✅ **CORS Configuration** - Cross-origin security

---

## 📊 Infrastructure & DevOps

### Monitoring & Observability

#### Prometheus + Grafana
- **System Metrics** - CPU, memory, disk, network
- **Application Metrics** - Request rates, response times, errors
- **Business Metrics** - Active users, messages sent, games played
- **Custom Dashboards** - Real-time visualization
- **Alerting** - Automated incident detection

#### ELK Stack (Elasticsearch, Logstash, Kibana)
- **Centralized Logging** - All service logs in one place
- **Log Aggregation** - Structured log collection
- **Full-Text Search** - Query across all logs
- **Log Analytics** - Pattern detection and insights
- **Custom Visualizations** - Kibana dashboards
- **Real-Time Monitoring** - Live log streaming

### Event-Driven Architecture

#### Apache Kafka
- **Event Streaming** - Reliable message delivery
- **Topics**:
  - `UserCreated` - New user registration events
  - `userUpdated` - User profile changes
  - `notifications` - All notification events
- **Producers**: User Auth, Chat, Game services
- **Consumers**: Chat, Notification services
- **Guaranteed Delivery** - At-least-once semantics
- **Scalability** - Horizontal partition scaling

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required
- Docker 24.0+
- Docker Compose 2.20+
- Git

# Optional (for development)
- Node.js 20+
- npm/yarn/pnpm
```

### Quick Start (Production Mode)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/ft_transcendence.git
cd ft_transcendence

# 2. Build and start all services
docker-compose up --build

# 3. Access the application
# Frontend: http://localhost:5173
# Kafka UI: http://localhost:8080/kafka-ui
# Grafana: http://localhost:3030 (admin/admin)
# Kibana: http://localhost:5601
# Prometheus: http://localhost:9090
```

### Development Setup

```bash
# 1. Install dependencies for all services
cd app/frontend && npm install
cd ../backend/api_gateway && npm install
cd ../services/chat && npm install
cd ../services/game && npm install
cd ../services/notification && npm install
cd ../services/userAuth && npm install

# 2. Start infrastructure services
docker-compose up kafka zookeeper vault elasticsearch

# 3. Run services locally
cd app/frontend && npm run dev
cd app/backend/services/chat && npm run dev
# ... repeat for other services
```

### Environment Variables

Create `.env` files for each service:

```env
# app/frontend/.env
VITE_API_URL=http://localhost:8080
VITE_SOCKET_URL=http://localhost:8080

# app/backend/services/*/.env
KAFKA_BROKER=localhost:9092
VAULT_ADDR=http://localhost:8200
JWT_SECRET=your-secret-key
```

---

## 📁 Project Structure

```
ft_transcendence/
├── app/
│   ├── frontend/                    # React + Vite frontend
│   │   ├── src/
│   │   │   ├── chat/               # Chat feature module
│   │   │   ├── Game/               # Pong game module
│   │   │   ├── TicTac/             # TicTacToe module
│   │   │   ├── notification/       # Notification system
│   │   │   ├── userAuth/           # Authentication UI
│   │   │   └── components/         # Shared components
│   │   └── public/
│   │
│   └── backend/
│       ├── api_gateway/            # Main API Gateway
│       │   └── src/
│       │
│       └── services/
│           ├── chat/               # Chat microservice
│           │   ├── src/
│           │   │   ├── controllers/
│           │   │   ├── repositories/
│           │   │   ├── kafka/
│           │   │   ├── plugins/
│           │   │   └── models/
│           │   └── db/
│           │
│           ├── game/               # Game microservice
│           ├── notification/       # Notification microservice
│           ├── userAuth/           # Authentication microservice
│           ├── leaderboard/        # Leaderboard microservice
│           └── shared/             # Shared utilities
│
├── infra/                          # Infrastructure configs
│   ├── nginx/                      # NGINX + ModSecurity
│   ├── kafka/                      # Kafka configuration
│   ├── vault/                      # Vault policies & scripts
│   ├── monitoring/                 # Prometheus & Grafana
│   └── log-management/             # ELK Stack
│       ├── elasticsearch/
│       ├── logstash/
│       ├── kibana/
│       └── filebeat/
│
├── docs/                           # Documentation
│   ├── architecture.md
│   ├── database-schema.md
│   ├── vault-integration.md
│   ├── monitoring-stack.md
│   └── security-checklist.md
│
├── scripts/                        # Utility scripts
│   ├── setup-vault.sh
│   ├── test-waf.sh
│   ├── grafana-dashboards.sh
│   └── rebuild-services.sh
│
└── docker-compose.yml              # Main orchestration
```

---

## 🔌 API Documentation

### Authentication Endpoints

```http
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/refresh           # Refresh access token
GET    /api/auth/profile           # Get user profile
PATCH  /api/auth/profile           # Update profile
```

### Chat Endpoints

```http
GET    /api/chat/contacts          # Get user's contacts
GET    /api/chat/conversation/:id  # Get conversation history
GET    /api/chat/search?q=         # Search users
POST   /api/chat/block/:id         # Block user
POST   /api/chat/unblock/:id       # Unblock user
PATCH  /api/chat/messages/:id/seen # Mark messages as read
```

### Game Endpoints

```http
GET    /api/game/active            # Get active games
POST   /api/game/challenge         # Send game challenge
GET    /api/game/history           # Get game history
GET    /api/leaderboard            # Get rankings
```

### Notification Endpoints

```http
GET    /api/notifications          # Get user notifications
PATCH  /api/notifications/:id/read # Mark as read
POST   /api/notifications/read-all # Mark all as read
```

### WebSocket Events

#### Chat Namespace (`/chat`)
```javascript
// Client → Server
socket.emit('message:send', { to, message, timestamp })

// Server → Client
socket.on('message:received', (data) => { })
socket.on('message:sent', (data) => { })
socket.on('message:error', (data) => { })
socket.on('user:online', (userId) => { })
socket.on('user:offline', (userId) => { })
```

#### Notification Namespace (`/notification`)
```javascript
// Server → Client
socket.on('notification:new', (notification) => { })
socket.on('notification:read', (notificationId) => { })
```

#### Game Namespace (`/game`)
```javascript
// Client → Server
socket.emit('game:join', { gameId })
socket.emit('game:move', { gameId, move })

// Server → Client
socket.on('game:state', (state) => { })
socket.on('game:end', (result) => { })
```

---

## 📊 Monitoring & Observability

### Access Monitoring Tools

| Tool | URL | Default Credentials | Purpose |
|------|-----|---------------------|---------|
| **Grafana** | http://localhost:3030 | admin / admin | Metrics visualization |
| **Prometheus** | http://localhost:9090 | - | Metrics collection |
| **Kibana** | http://localhost:5601 | - | Log analytics |
| **Kafka UI** | http://localhost:8080/kafka-ui | - | Kafka monitoring |

### Available Dashboards

#### Grafana Dashboards
1. **System Overview** - CPU, memory, disk, network across all services
2. **Microservices Health** - Service-specific metrics and health checks
3. **Kafka Metrics** - Message rates, consumer lag, topic statistics
4. **Application Performance** - Response times, error rates, throughput
5. **User Activity** - Active users, messages sent, games played

#### Kibana Visualizations
1. **Error Logs** - Service errors and exceptions
2. **WAF Logs** - Security events and blocked requests
3. **Access Patterns** - API usage and user behavior
4. **Performance Logs** - Slow queries and bottlenecks

### Setting Up Dashboards

```bash
# Import Grafana dashboards
./scripts/grafana-dashboards.sh

# View Kibana canvas
# Import: docs/kibana-canvas-microservices.json
```

---

## 🧪 Testing

### WAF Testing

```bash
# Test SQL injection protection
./scripts/test-waf.sh

# Test XSS protection
./scripts/test-frontend-modsec.sh

# Comprehensive WAF tests
./scripts/waf-comprehensive-test.sh
```

### Service Testing

```bash
# Test all services
./scripts/test-services.sh

# Test rate limiting
./scripts/test-rate-limit.sh

# Demo rate limit functionality
./scripts/demo-rate-limit.sh
```

### Manual Testing

```bash
# Test Kafka messages
./scripts/messages.sh

# Verify monitoring stack
./scripts/verify-monitoring.sh
```

---

## 🔧 Configuration

### Vault Configuration

Vault stores sensitive configuration:
- JWT secrets
- Database credentials
- API keys
- Service-to-service tokens

```bash
# Initialize Vault
./scripts/setup-vault.sh

# Access Vault UI
http://localhost:8200
```

See [`docs/vault-integration.md`](docs/vault-integration.md) for details.

### WAF Configuration

ModSecurity rules can be customized:

```nginx
# security/waf/custom-rules.conf
SecRule REQUEST_URI "@contains /admin" \
    "id:1000,\
    phase:1,\
    deny,\
    status:403,\
    msg:'Admin access blocked'"
```

### Kafka Topics

Configure in [`infra/kafka/config.yml`](infra/kafka/config.yml):

```yaml
topics:
  - name: UserCreated
    partitions: 3
    replication: 1
  - name: notifications
    partitions: 5
    replication: 1
```

---

## 🎨 Frontend Features

### User Interface Highlights

- **Responsive Design** - Mobile, tablet, and desktop support
- **Dark Theme** - Modern, eye-friendly dark mode
- **Real-Time Updates** - Instant UI updates via WebSocket
- **Toast Notifications** - Non-intrusive notification system
- **Smooth Animations** - Tailwind CSS transitions
- **Accessible** - WCAG 2.1 compliant components

### State Management

Using **Zustand** for lightweight, fast state management:

```typescript
// Chat store
const useChatStore = create((set) => ({
  messages: [],
  contacts: [],
  selectedContact: null,
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  }))
}))
```

---

## 🐳 Docker Services

### Service Health Checks

All services include health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Container Orchestration

```bash
# Start specific services
docker-compose up kafka zookeeper vault

# Scale services
docker-compose up --scale chat-service=3

# View logs
docker-compose logs -f chat-service

# Restart service
docker-compose restart notification-service

# Rebuild and restart
docker-compose up --build chat-service
```

---

## 🚦 Development Workflow

### Recommended Development Flow

1. **Feature Branch** - Create from `main`
2. **Local Development** - Run services locally
3. **Testing** - Test with Docker Compose
4. **Code Review** - PR with detailed description
5. **Integration** - Merge to main
6. **Deployment** - Docker build and deploy

### Debugging

```bash
# View service logs
docker-compose logs -f [service-name]

# Enter container
docker-compose exec chat-service sh

# Check Kafka messages
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic notifications --from-beginning

# Monitor Prometheus targets
curl http://localhost:9090/api/v1/targets
```

---

## 📚 Documentation

Comprehensive documentation available in the [`docs/`](docs/) directory:

- **[Architecture](docs/architecture.md)** - System design and service overview
- **[Database Schema](docs/database-schema.md)** - Data models and relationships
- **[Vault Integration](docs/vault-integration.md)** - Secrets management setup
- **[Kafka Infrastructure](docs/kafka-infrastructure.md)** - Event streaming architecture
- **[Monitoring Stack](docs/monitoring-stack.md)** - Observability setup
- **[Security Checklist](docs/security-checklist.md)** - Security best practices
- **[ELK Implementation](docs/ELK-IMPLEMENTATION-SUMMARY.md)** - Logging setup

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Code Style

- **TypeScript** - Strict mode enabled
- **ESLint** - Follow configured rules
- **Prettier** - Auto-format on save
- **Conventional Commits** - Use semantic commit messages

---

## 📝 License

This project is part of the 42 School curriculum.

---

## 🙏 Acknowledgments

- **42 School** - Project foundation and requirements
- **OWASP** - Security best practices and ModSecurity CRS
- **HashiCorp** - Vault documentation and examples
- **Apache Software Foundation** - Kafka and related tools
- **Elastic** - ELK Stack documentation
- **Prometheus & Grafana** - Monitoring solutions

---

## 📧 Contact & Support

For questions, issues, or suggestions:

- **GitHub Issues** - [Report bugs or request features](https://github.com/yourusername/ft_transcendence/issues)
- **Documentation** - Check the [`docs/`](docs/) directory
- **Email** - your.email@example.com

---

<div align="center">

### ⭐ If you found this project interesting, please consider giving it a star!

**Built with ❤️ using modern web technologies**

[⬆ Back to Top](#-ft_transcendence)

</div>
