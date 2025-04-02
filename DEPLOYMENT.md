# Talkio Deployment Guide

This guide provides detailed instructions for deploying the Talkio chat application to various environments.

## Prerequisites

Before deploying, ensure you have:

1. A PostgreSQL database
2. Node.js 18+ installed on your server
3. Required environment variables (see below)

## Environment Variables

Create a `.env` file with these variables:

```
# Required
DATABASE_URL=postgres://username:password@host:port/database
SESSION_SECRET=your_secure_random_string

# Optional
NODE_ENV=production
PORT=5000
ENABLE_HELMET=true
```

## Deployment Options

### 1. Replit Deployment (Recommended)

1. Click the "Deploy" button in the Replit interface
2. Follow the guided deployment steps
3. Your app will be deployed to a `.replit.app` domain with HTTPS

### 2. Docker Deployment

Using Docker Compose:
```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f
```

Manual Docker deployment:
```bash
# Build the Docker image
docker build -t talkio .

# Run the container
docker run -p 5000:5000 --env-file .env talkio
```

### 3. Traditional VPS/Server Deployment

Run the build script:
```bash
./build.sh
```

This creates a `talkio-production.zip` file. On your server:

1. Upload and extract the zip file
2. Set up environment variables
3. Install production dependencies:
   ```bash
   npm ci --omit=dev
   ```
4. Start the application:
   ```bash
   npm start
   ```

Consider using a process manager like PM2:
```bash
npm install -g pm2
pm2 start dist/index.js --name talkio
pm2 save
```

### 4. Platform as a Service (PaaS)

For Heroku, Railway, or similar:

1. Connect your repository
2. Configure environment variables
3. Deploy with the included Procfile

## Database Migration

After deployment, initialize or update the database schema:

```bash
npm run db:push
```

## SSL/TLS Configuration

In production, always use HTTPS. Options:

1. Use a service with built-in SSL (Replit, Vercel, Heroku)
2. Configure a reverse proxy (Nginx, Apache) with Let's Encrypt
3. For Docker, consider using Traefik with automatic SSL

## Monitoring

Set up basic monitoring:

1. Standard logs are output to console/stdout
2. Consider adding a monitoring solution like New Relic or Datadog
3. Set up alerts for server errors and performance issues

## Backup Strategy

1. Regularly backup your PostgreSQL database
2. Schedule automated backups using pg_dump or similar tools
3. Store backups in a secure, off-site location

## Scaling Considerations

For higher traffic:

1. Use a load balancer with multiple app instances
2. Consider separating the WebSocket server
3. Implement database connection pooling
4. Add Redis for session storage and caching