#!/bin/bash
set -e  # Exit on error

echo "Starting Render build process..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install --production=false

# Go back to root and build frontend
echo "Building frontend..."
cd ../frontend
npm install --production=false
npm run build

echo "Build completed successfully!"
