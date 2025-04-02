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

echo "Frontend build complete! Ready for Netlify deployment."
echo "Files are located in the dist/client directory."