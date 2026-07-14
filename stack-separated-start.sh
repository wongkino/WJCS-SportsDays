#!/bin/bash

echo "🚀 啟動運動會計分程式 (分離式前端)"
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
echo "✅ 分離式前端 Stack 已啟動！"
echo ""
echo "🌐 訪問地址："
echo "   觀賽者前端: http://localhost:3100"
echo "   計分員前端: http://localhost:3200"
echo "   後端 API: http://localhost:3300"
echo ""
echo "📋 查看狀態："
echo "   ./stack-separated-status.sh"
