# Temporarily allow script execution for this session only
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# Check for Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed. Please install Node.js (LTS version) before running this script."
    exit 1
}

Write-Host "Node version: $(node -v)"
Write-Host "NPM version: $(npm -v)"

Write-Host "Installing project dependencies..."
npm install

Write-Host "Building the project..."
npm run build

Write-Host "Starting development server..."
npm run dev
