#!/bin/bash
set -e

echo "🚀 Setting up ComfyUI Worker project..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Fix permissions for all shell scripts
echo "🔧 Setting execute permissions for shell scripts..."
find . -name "*.sh" -type f -exec chmod +x {} \;

echo "✅ All shell scripts now have execute permissions:"
ls -la *.sh | awk '{print "  " $1 " " $9}'

echo ""
echo "📋 Available commands:"
echo "  ./start-app.sh    - Start the ComfyUI worker application"
echo "  ./start-server.sh - Start the server"
echo ""
echo "🎉 Setup complete! You can now run the scripts."
