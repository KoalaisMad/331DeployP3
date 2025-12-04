#!/bin/bash

# Build script for Render deployment

# Install backend dependencies
cd backend
npm install

# Go back to root and build frontend
cd ../frontend
npm install
npm run build

echo "Build completed successfully!"
