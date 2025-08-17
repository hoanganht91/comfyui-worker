#!/bin/bash
set -e

apt-get update
apt-get install -y nano

CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd $CURRENT_DIR

echo "🚀 Starting ComfyUI Worker"
nohup bash ./start-app.sh >/dev/null 2>&1 &

echo " Start default comfyui app"
cd /
/start.sh