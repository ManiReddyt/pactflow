# ContractLock Server Deployment Guide

This guide covers different deployment options for the ContractLock server using Docker.

## 🐳 Docker Deployment

### Prerequisites

- Docker and Docker Compose installed
- Git (to clone the repository)

### Quick Start with Docker Compose

1. **Clone and navigate to server directory**

   ```bash
   git clone <repository-url>
   cd contract-lock/server
   ```

2. **Start services with Docker Compose**

   ```bash
   # The Dockerfile will automatically build the TypeScript code
   docker-compose up -d
   ```

   **Note**: The Dockerfile uses a multi-stage build that automatically compiles the TypeScript code, so you don't need to run `yarn build` manually.

3. **Verify deployment**

   ```bash
   # Check if services are running
   docker-compose ps

   # Check server health
   curl http://localhost:3000/health
   ```

### Environment Variables

Create a `.env` file for custom configuration:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
MONGODB_URI=mongodb://admin:password123@mongodb:27017/contractlock?authSource=admin

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Optional: Pinata IPFS Configuration
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key
```

### Manual Docker Build

1. **Build the Docker image**

   ```bash
   docker build -t contract-lock-server .
   ```

2. **Run with external MongoDB**
   ```bash
   docker run -d \
     --name contract-lock-server \
     -p 3000:3000 \
     -e MONGODB_URI=mongodb://your-mongodb-host:27017/contractlock \
     -e JWT_SECRET=your-jwt-secret \
     contract-lock-server
   ```

## 🚀 Production Deployment

### Using Docker Compose (Recommended)

1. **Update docker-compose.yml for production**

   ```yaml
   version: "3.8"

   services:
     mongodb:
       image: mongo:7.0
       container_name: contract-lock-mongodb
       restart: always
       environment:
         MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
         MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
         MONGO_INITDB_DATABASE: contractlock
       volumes:
         - mongodb_data:/data/db
       networks:
         - contract-lock-network

     server:
       build: .
       container_name: contract-lock-server
       restart: always
       ports:
         - "3000:3000"
       environment:
         NODE_ENV: production
         MONGODB_URI: ${MONGODB_URI}
         JWT_SECRET: ${JWT_SECRET}
         JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
       depends_on:
         - mongodb
       networks:
         - contract-lock-network
   ```

2. **Create production .env file**

   ```env
   MONGO_ROOT_USERNAME=your_secure_username
   MONGO_ROOT_PASSWORD=your_secure_password
   MONGODB_URI=mongodb://your_secure_username:your_secure_password@mongodb:27017/contractlock?authSource=admin
   JWT_SECRET=your_very_secure_jwt_secret_key
   JWT_EXPIRES_IN=7d
   ```

3. **Deploy**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### Using External Database

If you prefer to use an external MongoDB service (like MongoDB Atlas):

1. **Update docker-compose.yml**

   ```yaml
   version: "3.8"

   services:
     server:
       build: .
       container_name: contract-lock-server
       restart: always
       ports:
         - "3000:3000"
       environment:
         NODE_ENV: production
         MONGODB_URI: ${MONGODB_URI}
         JWT_SECRET: ${JWT_SECRET}
         JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
   ```

2. **Set environment variables**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/contractlock?retryWrites=true&w=majority
   JWT_SECRET=your_very_secure_jwt_secret_key
   JWT_EXPIRES_IN=7d
   ```

## 🔧 Management Commands

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs server
docker-compose logs mongodb

# Follow logs
docker-compose logs -f server
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart server
```

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
yarn build
docker-compose up -d --build
```

## 🔍 Health Checks

### Server Health

```bash
# Basic health check
curl http://localhost:3000/health

# Detailed health check
curl http://localhost:3000/health | jq
```

### Database Health

```bash
# Connect to MongoDB
docker exec -it contract-lock-mongodb mongosh

# Check database
use contractlock
db.users.countDocuments()
```

## 🛡️ Security Considerations

1. **Change default passwords** in production
2. **Use strong JWT secrets** (at least 32 characters)
3. **Enable MongoDB authentication**
4. **Use HTTPS** in production
5. **Set up firewall rules** to restrict access
6. **Regular security updates** for base images

## 📊 Monitoring

### Resource Usage

```bash
# Container resource usage
docker stats

# Specific container
docker stats contract-lock-server
```

### Log Monitoring

```bash
# Real-time logs
docker-compose logs -f

# Log with timestamps
docker-compose logs -t
```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Check what's using port 3000
   lsof -i :3000

   # Kill process
   kill -9 <PID>
   ```

2. **MongoDB connection issues**

   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb

   # Test connection
   docker exec -it contract-lock-mongodb mongosh
   ```

3. **Application won't start**

   ```bash
   # Check application logs
   docker-compose logs server

   # Check if dist folder exists
   ls -la dist/
   ```

### Debug Mode

```bash
# Run in debug mode
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up
```

## 📝 Environment Variables Reference

| Variable                | Description               | Default       | Required |
| ----------------------- | ------------------------- | ------------- | -------- |
| `NODE_ENV`              | Environment mode          | `development` | No       |
| `PORT`                  | Server port               | `3000`        | No       |
| `MONGODB_URI`           | MongoDB connection string | -             | Yes      |
| `JWT_SECRET`            | JWT signing secret        | -             | Yes      |
| `JWT_EXPIRES_IN`        | JWT expiration time       | `7d`          | No       |
| `PINATA_API_KEY`        | Pinata IPFS API key       | -             | No       |
| `PINATA_SECRET_API_KEY` | Pinata IPFS secret key    | -             | No       |

---

For more information, see the main [README.md](README.md) file.
