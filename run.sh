#!/bin/bash

# Exit on any error
set -e

echo "Installing NVM (Node Version Manager)..."
export NVM_DIR="$HOME/.nvm"

if [ ! -d "$NVM_DIR" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  # Load nvm immediately
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
  echo "NVM already installed."
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

echo "Installing Node.js LTS..."
nvm install --lts

echo "Node version:"
node -v
echo "NPM version:"
npm -v

echo "Installing project dependencies..."
npm install

echo "Building the project..."
npm run build

echo "Starting development server..."
npm run dev
