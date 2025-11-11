# ft_transcendence Frontend

React + Vite application with Docker support

## 📁 Project Structure

```
frontend/
├── Dockerfile              # Production build with nginx
├── Dockerfile.dev          # Development with hot reload
├── nginx.conf             # Nginx configuration
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── index.html             # Entry HTML
└── src/
    ├── main.jsx           # React entry point
    ├── App.jsx            # Main App component
    ├── App.css            # App styles
    └── index.css          # Global styles
```

## 🚀 Quick Start

### Development Mode (with hot reload)

```bash
# Build development image
docker build -f Dockerfile.dev -t ft-transcendence-frontend:dev .

# Run development container
docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules ft-transcendence-frontend:dev
```

Or with docker-compose:
```yaml
frontend-dev:
  build:
    context: ./app/frontend
    dockerfile: Dockerfile.dev
  ports:
    - "5173:5173"
  volumes:
    - ./app/frontend:/app
    - /app/node_modules
  environment:
    - VITE_API_URL=http://localhost:8000
```

### Production Mode (with nginx)

```bash
# Build production image
docker build -t ft-transcendence-frontend:latest .

# Run production container
docker run -p 80:80 ft-transcendence-frontend:latest
```

Or with docker-compose:
```yaml
frontend:
  build:
    context: ./app/frontend
    dockerfile: Dockerfile
  ports:
    - "80:80"
  restart: unless-stopped
```

## 🛠️ Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Access

- **Development:** http://localhost:5173
- **Production:** http://localhost:80

## 📦 Features

- ✅ React 18
- ✅ Vite for fast builds
- ✅ Hot Module Replacement (HMR)
- ✅ Multi-stage Docker build
- ✅ Nginx for production
- ✅ Security headers
- ✅ Gzip compression
- ✅ React Router support
- ✅ API proxy configuration (optional)
- ✅ Health check endpoint

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

Access in code:
```javascript
const API_URL = import.meta.env.VITE_API_URL
```

### API Proxy

Uncomment in `nginx.conf`:
```nginx
location /api {
    proxy_pass http://backend:8000;
    ...
}
```

## 🏗️ Build Optimization

The production build includes:
- Code splitting
- Tree shaking
- Minification
- Asset optimization
- Vendor chunking

## 📊 Health Check

The nginx configuration includes a health check endpoint:

```bash
curl http://localhost/health
# Response: healthy
```

Docker health check runs every 30 seconds.

## 🔒 Security

Included security headers:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

## 🎨 Styling

You can add any CSS framework:

```bash
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# Material-UI
npm install @mui/material @emotion/react @emotion/styled

# Bootstrap
npm install bootstrap
```

## 📝 Notes

- The production image uses multi-stage build to keep size small
- Development image includes hot reload
- Nginx serves static files efficiently
- React Router is configured with fallback to index.html
