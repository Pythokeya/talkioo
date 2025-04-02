# Talkio - Family-Friendly Chat Application

A secure, family-friendly person-to-person chat application designed for safe and creative communication between friends and family.

## Features

- Real-time messaging with WebSocket
- Friend requests and management
- Message editing and deletion (30-minute window)
- Message deletion (10-minute window)
- Animated emoji reactions with explosion effects
- Voice message recording and playback
- Customizable chat themes
- Family-friendly content moderation
- Mobile-responsive design
- Production-ready security with Helmet
- Health check endpoint

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Express.js, WebSocket (ws)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based auth

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgres://username:password@host:port/database
SESSION_SECRET=your_secure_session_secret
NODE_ENV=production
PORT=5000 (optional)
ENABLE_HELMET=true (optional)
```

## Installation and Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/talkio.git
   cd talkio
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the application:
   ```
   npm run build
   ```

4. Start the production server:
   ```
   npm start
   ```

## Development

Run the development server:

```
npm run dev
```

## Database Migrations

Push schema changes to the database:

```
npm run db:push
```

## Docker Deployment

1. Build and start with Docker Compose:
   ```
   docker-compose up -d
   ```

2. Or build and run the Docker image manually:
   ```
   docker build -t talkio .
   docker run -p 5000:5000 --env-file .env talkio
   ```

## Replit Deployment

1. Click the "Deploy" button in the Replit interface
2. Follow the deployment instructions provided by Replit
3. Your application will be available at a `.replit.app` domain

## Monitoring

The application provides a health check endpoint at `/health` which returns status information:

```json
{
  "status": "ok",
  "timestamp": "2023-08-01T12:34:56.789Z",
  "uptime": 3600
}
```

This endpoint can be used for monitoring and integration with infrastructure health check systems.

## License

MIT