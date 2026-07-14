#!/bin/bash

echo "🚀 啟動運動會計分程式 Stack"
echo ""

# 檢查 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 請先安裝 Docker Compose"
    exit 1
fi

# 啟動服務
echo "🚀 啟動服務..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

echo ""
echo "✅ Stack 已啟動！"
echo ""
echo "🌐 訪問地址："
echo "   前端: http://localhost:3000"
echo "   後端: http://localhost:3001"
echo ""
echo "📋 查看狀態："
echo "   ./stack-status.sh"
