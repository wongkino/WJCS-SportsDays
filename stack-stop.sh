#!/bin/bash

echo "🛑 停止運動會計分程式 Stack"
echo ""

# 檢查 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 請先安裝 Docker Compose"
    exit 1
fi

# 停止服務
echo "🛑 停止服務..."
if command -v docker-compose &> /dev/null; then
    docker-compose down
else
    docker compose down
fi

echo ""
echo "✅ Stack 已停止！"
