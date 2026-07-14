#!/bin/bash

echo "🔄 更新運動會計分程式 Stack"
echo ""

# 檢查 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 請先安裝 Docker Compose"
    exit 1
fi

# 停止現有服務
echo "🛑 停止現有服務..."
if command -v docker-compose &> /dev/null; then
    docker-compose down
else
    docker compose down
fi

# 清理舊容器和映像
echo "🧹 清理舊容器和映像..."
docker container prune -f
docker image prune -f

# 重新啟動服務
echo "🚀 重新啟動服務..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d --build
else
    docker compose up -d --build
fi

echo ""
echo "✅ Stack 已更新！"
echo ""
echo "🌐 訪問地址："
echo "   前端: http://localhost:3000"
echo "   後端: http://localhost:3001"
echo ""
echo "📋 查看狀態："
echo "   ./stack-status.sh"
