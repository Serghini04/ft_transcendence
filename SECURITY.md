# Security Configuration Guide

## 🔒 Environment Variables Setup

This project uses environment variables to manage sensitive configuration. **Never commit `.env` files to git.**

### Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Generate strong secrets:**
   ```bash
   # Generate JWT Secret
   openssl rand -base64 32
   
   # Generate JWT Refresh Secret
   openssl rand -base64 32
   
   # Generate Cookie Secret
   openssl rand -base64 32
   ```

3. **Update `.env` with your secrets:**
   - Replace all `changeme` values
   - Use the generated secrets from step 2
   - Update email credentials if using notifications
   - Update CORS_ORIGIN with your frontend URLs

4. **Store secrets in Vault:**
   ```bash
   docker compose up -d vault
   
   docker exec vault vault kv put secret/app \
     JWT_SECRET='your-generated-jwt-secret' \
     JWT_REFRESH='your-generated-refresh-secret' \
     COOKIE_SECRET='your-generated-cookie-secret' \
     ELASTIC_PASSWORD='your-elastic-password' \
     KIBANA_PASSWORD='your-kibana-password' \
     EMAIL_USER='your-email@example.com' \
     EMAIL_PASSWORD='your-email-password'
   ```

## 🔐 Security Best Practices

### 1. Environment Files
- ✅ **DO**: Keep `.env` file secure and private
- ✅ **DO**: Use `.env.example` as a template
- ❌ **DON'T**: Commit `.env` to git (already in `.gitignore`)
- ❌ **DON'T**: Share `.env` file publicly

### 2. Secret Management
- Use **minimum 32 characters** for all secrets
- Use **different secrets** for each environment (dev, staging, prod)
- Rotate secrets regularly
- Use Vault for production secrets

### 3. Password Requirements
- JWT_SECRET: Minimum 32 characters, alphanumeric + symbols
- JWT_REFRESH: Minimum 32 characters, different from JWT_SECRET
- COOKIE_SECRET: Minimum 32 characters
- Grafana password: Strong password (8+ chars, mixed case, numbers, symbols)
- Elastic/Kibana: Strong passwords

### 4. Docker Compose Security
All secrets are now referenced from `.env`:
```yaml
environment:
  - JWT_SECRET=${JWT_SECRET}
  - JWT_REFRESH=${JWT_REFRESH}
```

## 📋 Environment Variables Reference

### Required Secrets
| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | JWT access token signing key | `openssl rand -base64 32` |
| `JWT_REFRESH` | JWT refresh token signing key | `openssl rand -base64 32` |
| `COOKIE_SECRET` | Cookie encryption key | `openssl rand -base64 32` |
| `VAULT_TOKEN` | Vault root token | `dev-root-token` (dev only) |

### Optional Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `GF_SECURITY_ADMIN_USER` | Grafana admin username | `admin` |
| `GF_SECURITY_ADMIN_PASSWORD` | Grafana admin password | `changeme` |
| `ELASTIC_PASSWORD` | Elasticsearch password | `changeme` |
| `KIBANA_PASSWORD` | Kibana password | `changeme` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:5173` |
| `NODE_ENV` | Node environment | `production` |

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Generate strong random secrets for all variables
- [ ] Update all `changeme` values in `.env`
- [ ] Store secrets in Vault
- [ ] Update CORS_ORIGIN with production URLs
- [ ] Set NODE_ENV=production
- [ ] Verify `.env` is in `.gitignore`
- [ ] Test all services with new secrets
- [ ] Backup your `.env` file securely
- [ ] Document secret rotation schedule

## 🆘 Troubleshooting

### "JWT_SECRET is not defined"
1. Check `.env` file exists
2. Verify `JWT_SECRET=` has a value
3. Restart docker containers: `docker compose down && docker compose up -d`

### "Cannot connect to Vault"
1. Check Vault is running: `docker ps | grep vault`
2. Verify VAULT_ADDR in `.env`
3. Check Vault health: `docker exec vault vault status`

### Secrets not loading
1. Ensure `.env` is in project root
2. Restart services: `docker compose restart`
3. Check docker logs: `docker compose logs [service-name]`

## 📚 Additional Resources

- [Vault Documentation](https://www.vaultproject.io/docs)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [Security Best Practices](https://cheatsheetseries.owasp.org/)
