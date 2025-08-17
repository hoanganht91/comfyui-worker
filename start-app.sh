#!/bin/bash
set -e

# Check if NVM is installed
if ! command -v nvm &> /dev/null; then
  echo "NVM is not installed. Installing NVM..."
  export NVM_DIR="$HOME/.nvm"
  
  # Install NVM if directory doesn't exist
  if [ ! -d "$NVM_DIR" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi
  
  # Source NVM for current session
  source "$NVM_DIR/nvm.sh"
  
  # Add NVM to shell profiles for persistent access
  echo "Adding NVM to shell profiles..."
  
  # Add to .bashrc if it exists
  if [ -f "$HOME/.bashrc" ]; then
    if ! grep -q "NVM_DIR" "$HOME/.bashrc"; then
      echo '' >> "$HOME/.bashrc"
      echo '# NVM Configuration' >> "$HOME/.bashrc"
      echo 'export NVM_DIR="$HOME/.nvm"' >> "$HOME/.bashrc"
      echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> "$HOME/.bashrc"
      echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> "$HOME/.bashrc"
    fi
  fi
  
  # Add to .profile as fallback
  if [ -f "$HOME/.profile" ]; then
    if ! grep -q "NVM_DIR" "$HOME/.profile"; then
      echo '' >> "$HOME/.profile"
      echo '# NVM Configuration' >> "$HOME/.profile"
      echo 'export NVM_DIR="$HOME/.nvm"' >> "$HOME/.profile"
      echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> "$HOME/.profile"
      echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> "$HOME/.profile"
    fi
  fi
  
  # Install and setup Node.js
  nvm install 18
  nvm use 18
  nvm alias default 18
  npm install -g pm2
  
  echo "✅ NVM installed and configured for future shell sessions"
else
  # NVM is already available, just ensure we're using the right version
  source "$NVM_DIR/nvm.sh" 2>/dev/null || true
  nvm use 18 2>/dev/null || nvm install 18
fi

CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd $CURRENT_DIR
pm2 start ./dist/index.js --name comfyui-worker
pm2 save