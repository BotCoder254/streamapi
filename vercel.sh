#!/bin/bash

# Make the script executable
chmod +x vercel.sh

# Display Node.js and npm versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "Installing dependencies..."
npm ci --production

# Create necessary directories if they don't exist
mkdir -p public/js
mkdir -p public/css
mkdir -p public/images

# Copy static assets if needed
if [ -d "src/public" ]; then
  cp -r src/public/* public/
fi

# Display deployment information
echo "Deploying StreamAPI to Vercel..."
echo "Environment: $NODE_ENV"

# Exit successfully
exit 0 