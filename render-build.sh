#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
npm install

# Build the client and server
npm run build

# Synchronize database schema (optional but recommended here)
# Note: Ensure DATABASE_URL is set in Render environment
npm run db:push
