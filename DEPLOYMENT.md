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

### 1. Netlify Deployment

Netlify is great for hosting the frontend of your application, but since Talkio includes a backend with WebSocket connections, you'll need to set up separate backend hosting and configure Netlify to work with it.

#### Step 1: Prepare Your Application

1. The application already includes a `netlify.toml` file in the root directory:
   ```toml
   [build]
     command = "chmod +x ./frontend-deploy.sh && ./frontend-deploy.sh"
     publish = "dist/client"
     
   [[redirects]]
     from = "/api/*"
     to = "https://your-backend-url.com/api/:splat"
     status = 200
     force = true
     
   [[redirects]]
     from = "/ws"
     to = "wss://your-backend-url.com/ws"
     status = 101
     force = true
     
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. The application includes a dedicated `frontend-deploy.sh` script to build the frontend separately:
   ```bash
   #!/bin/bash

   # Script to build and prepare the frontend for Netlify deployment
   
   # Create client output directory if it doesn't exist
   mkdir -p dist/client
   
   # Build the frontend only
   echo "Building frontend for Netlify deployment..."
   npx vite build --outDir dist/client
   
   # Copy index.html to support client-side routing
   echo "Copying index.html for client-side routing..."
   cp dist/client/index.html dist/client/200.html
   cp dist/client/index.html dist/client/404.html
   ```

3. Make sure the `frontend-deploy.sh` script is executable:
   ```bash
   chmod +x frontend-deploy.sh
   ```

#### Step 2: Deploy the Backend

Choose one of these options for backend hosting:

1. **Render/Railway/Fly.io**: Deploy your Express backend to handle API requests and WebSocket connections
2. **Heroku**: Use the included Procfile for deployment
3. **Digital Ocean App Platform**: Upload your code and configure environment variables

Make sure to:
- Configure environment variables in your backend host
- Note your backend URL (e.g., `https://talkio-backend.onrender.com`)

#### Step 3: Deploy to Netlify

1. Sign up or log in to [Netlify](https://app.netlify.com/)

2. Deploy via Netlify CLI:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Initialize Netlify configuration
   netlify init
   
   # Deploy your site
   netlify deploy --prod
   ```

   Or via Netlify UI:
   - Click "New site from Git"
   - Select your Git provider (GitHub, GitLab, BitBucket)
   - Select your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist/client`
   - Click "Deploy site"

#### Step 4: Configure Environment Variables in Netlify

1. Go to your site dashboard in Netlify
2. Navigate to Site settings > Build & deploy > Environment
3. Add the following environment variables:
   - `VITE_API_URL`: Your backend URL (e.g., `https://talkio-backend.onrender.com`)
   - Any other frontend-specific environment variables

#### Step 5: Update Your Frontend Code

The application already includes the required configuration to handle Netlify deployment. The frontend code uses the following utilities from `client/src/lib/netlify-config.ts`:

```typescript
// Configuration for Netlify deployment
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Configure WebSocket connection
export const getWebSocketUrl = (): string => {
  // Determine WebSocket protocol based on current protocol
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // If API URL is provided via environment variable, use it for WebSocket connection
  if (import.meta.env.VITE_API_URL) {
    const baseUrl = import.meta.env.VITE_API_URL
      .replace('https://', wsProtocol + '//')
      .replace('http://', wsProtocol + '//');
    return `${baseUrl}/ws`;
  }
  
  // Fallback to current host (for local development)
  return `${wsProtocol}//${window.location.host}/ws`;
};

// Helper function to join API URL with endpoint
export const apiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Join base URL with endpoint
  return API_BASE_URL 
    ? `${API_BASE_URL.replace(/\/+$/, '')}/${cleanEndpoint}`
    : `/${cleanEndpoint}`;
};

// Function to determine if we're in a Netlify environment
export const isNetlifyEnvironment = (): boolean => {
  return !!import.meta.env.VITE_API_URL;
};
```

The WebSocket client and API requests have been updated to use these helpers automatically:

1. The WebSocket connection in `client/src/lib/websocket.ts` uses:
   ```typescript
   const wsUrl = getWebSocketUrl();
   this.socket = new WebSocket(wsUrl);
   ```

2. API requests in `client/src/lib/queryClient.ts` use:
   ```typescript
   // In apiRequest function
   const apiEndpoint = isNetlifyEnvironment() ? apiUrl(url) : url;
   
   // In getQueryFn
   const endpoint = queryKey[0] as string;
   const apiEndpoint = isNetlifyEnvironment() ? apiUrl(endpoint) : endpoint;
   ```

#### Step 6: Redeploy Frontend After Updates

```bash
netlify deploy --prod
```

#### Step 7: Test Your Deployment

1. Visit your Netlify URL
2. Test all features including real-time chat
3. Check WebSocket connections in browser developer tools

### 2. Replit Deployment (Recommended)

1. Click the "Deploy" button in the Replit interface
2. Follow the guided deployment steps
3. Your app will be deployed to a `.replit.app` domain with HTTPS

### 3. Docker Deployment

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

### 4. Traditional VPS/Server Deployment

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

### 5. Platform as a Service (PaaS)

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

1. Use a service with built-in SSL (Netlify, Replit, Vercel, Heroku)
2. Configure a reverse proxy (Nginx, Apache) with Let's Encrypt
3. For Docker, consider using Traefik with automatic SSL

## Monitoring

Set up basic monitoring:

1. Standard logs are output to console/stdout
2. Consider adding a monitoring solution like New Relic or Datadog
3. Set up alerts for server errors and performance issues
4. Use the application's `/health` endpoint for uptime monitoring

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