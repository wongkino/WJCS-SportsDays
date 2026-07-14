#!/bin/bash

echo "🔄 重啟運動會計分程式 Stack"
echo ""

# 檢查 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 請先安裝 Docker Compose"
    exit 1
fi

# 重啟服務
echo "🔄 重啟服務..."
if command -v docker-compose &> /dev/null; then
    docker-compose restart
else
    docker compose restart
fi

echo ""
echo "✅ Stack 已重啟！"
echo ""
echo "📋 查看狀態："
echo "   ./stack-status.sh"
