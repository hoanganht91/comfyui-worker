#!/bin/bash
set -e

# Check if NVM is installed
if ! command -v nvm &> /dev/null; then
  echo "NVM is not installed. Please install NVM first."
  export NVM_DIR="$HOME/.nvm"
  if [ ! -d "$NVM_DIR" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi
  source "$NVM_DIR/nvm.sh"
  nvm install 18
  nvm use 18
  npm install -g pm2
fi

if [ -d "/workspace/comfyui-worker" ]; then
  cd /workspace/comfyui-worker
fi

pm2 start ./dist/index.js --name comfyui-worker
pm2 save