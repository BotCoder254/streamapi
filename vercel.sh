#!/bin/bash

# This script runs during the build phase on Vercel

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run any build steps if needed
echo "Building application..."
npm run build --if-present

# Display deployment information
echo "Deploying StreamAPI to Vercel..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Exit successfully
exit 0 