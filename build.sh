#!/bin/bash
set -e

# Print steps for clarity
echo "🔨 Building Talkio Chat Application..."

# Check for required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  Warning: DATABASE_URL is not set. Using local database for build."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checks
echo "🔍 Running type checks..."
npm run check

# Build the application
echo "🏗️  Building frontend and backend..."
npm run build

# Create a production-ready ZIP file
echo "📁 Creating production artifact..."
mkdir -p deployment
cp -r dist deployment/
cp package.json package-lock.json deployment/
cp -r attached_assets deployment/ 2>/dev/null || true
cp .env.example deployment/

# Create a minimal package.json for production
node -e "
const pkg = require('./package.json');
const newPkg = {
  name: pkg.name,
  version: pkg.version,
  description: 'Talkio Chat Application',
  scripts: { start: 'NODE_ENV=production node index.js' },
  dependencies: pkg.dependencies
};
require('fs').writeFileSync('./deployment/package.json', JSON.stringify(newPkg, null, 2));
"

# Create a zip file for easy deployment
cd deployment
zip -r ../talkio-production.zip .
cd ..

echo "✅ Build complete!"
echo "📋 Instructions:"
echo "1. Deploy the 'talkio-production.zip' file to your server"
echo "2. Extract the zip file"
echo "3. Create a .env file based on .env.example"
echo "4. Run 'npm ci --omit=dev' to install production dependencies"
echo "5. Start the server with 'npm start'"