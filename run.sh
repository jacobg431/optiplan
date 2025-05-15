#!/bin/bash

# Exit on any error
set -e

echo "Checking for Node.js..."

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed. Please install Node.js (LTS version) before running this script."
  exit 1
fi

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

echo "Installing project dependencies..."
npm install

echo "Building the project..."
npm run build

echo "Starting development server..."
npm run dev
