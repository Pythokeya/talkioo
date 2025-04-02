# Talkio Full-Stack Deployment Guide

This guide provides simple instructions for deploying Talkio as a complete application with both frontend and backend together. All options are free.

## Option 1: Replit (Simplest)

1. **Deploy directly from Replit:**
   - Click the "Deploy" button in the top right of the Replit interface
   - Follow the guided steps
   - Your app will be available at `your-project-name.replit.app`

2. **Benefits:**
   - Built-in PostgreSQL database
   - One-click deployment
   - HTTPS included
   - No configuration needed

## Option 2: Railway.app (Free Tier)

1. **Sign up for Railway:**
   - Create an account at [Railway.app](https://railway.app/)
   - Railway offers a free tier with $5 in credits monthly

2. **Deploy from GitHub:**
   - Push your code to a GitHub repository
   - In Railway dashboard, click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Add a PostgreSQL database:**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically link the database to your project

4. **Set environment variables:**
   - On your project dashboard, click "Variables"
   - Add `SESSION_SECRET=your_secure_random_value`
   - Add `NODE_ENV=production`

5. **Deploy:**
   - Railway will build and deploy your application automatically
   - Click on your deployment to see the generated URL

## Option 3: Render.com (Free Tier)

1. **Sign up for Render:**
   - Create an account at [Render.com](https://render.com/)

2. **Create a PostgreSQL database:**
   - Go to Dashboard → "New" → "PostgreSQL"
   - Choose the free tier
   - Note the connection details provided after creation

3. **Deploy Web Service:**
   - Dashboard → "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: talkio
     - Runtime: Node.js
     - Build Command: `./build-prod.sh`
     - Start Command: `NODE_ENV=production node dist/index.js`
   - Add environment variables:
     - `DATABASE_URL` (from your PostgreSQL setup)
     - `SESSION_SECRET` (any secure random string)
     - `NODE_ENV=production`

4. **Deploy:**
   - Click "Create Web Service"
   - Your app will be available at a `.onrender.com` URL

## Option 4: Glitch.com (Free Tier)

1. **Sign up for Glitch:**
   - Create an account at [Glitch.com](https://glitch.com/)

2. **Create a new project:**
   - Click "New Project" → "Import from GitHub"
   - Enter your GitHub repository URL

3. **Set up database:**
   - Create a free PostgreSQL database using [Neon](https://neon.tech) or [ElephantSQL](https://www.elephantsql.com/)
   - Get your connection string

4. **Configure environment variables:**
   - In your Glitch project, click on ".env" in the file browser
   - Add:
     ```
     DATABASE_URL=your_postgres_connection_string
     SESSION_SECRET=your_secure_random_string
     NODE_ENV=production
     ```

5. **Build and run:**
   - Click on "Tools" → "Terminal"
   - Run: `chmod +x build-prod.sh && ./build-prod.sh`
   - Then run: `refresh`
   - Your app will be available at a `.glitch.me` URL

## Important Notes for All Free Deployments

1. **Database limitations:**
   - Free tier databases typically have storage limits (usually 500MB-1GB)
   - Consider implementing data cleanup to stay within limits

2. **Sleep/Idle policies:**
   - Free services may put your app to sleep after inactivity (except Replit with Hacker Plan)
   - First request after idle may be slow as the app wakes up

3. **Custom domain:**
   - Most free tiers allow connecting a custom domain you already own
   - Follow the platform-specific instructions for adding your domain

4. **Production readiness:**
   - For a smoother experience, run this once after deployment:
     ```bash
     npm run db:push
     ```
   - This ensures your database schema is properly migrated