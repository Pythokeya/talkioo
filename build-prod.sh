#!/bin/bash

# This script handles the production build process for Talkio
# It creates a proper separation between Vite for frontend and Node for backend

echo "Building frontend..."
mkdir -p dist/client
npx vite build --outDir=dist/client

echo "Building backend..."
npx esbuild server/*.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:vite

echo "Build completed successfully!"
echo "Run with: NODE_ENV=production node dist/index.js"