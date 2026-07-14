#!/bin/bash

echo "📊 運動會計分程式 Stack 狀態"
echo ""

# 檢查 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 請先安裝 Docker Compose"
    exit 1
fi

# 顯示服務狀態
echo "🔍 服務狀態："
if command -v docker-compose &> /dev/null; then
    docker-compose ps
else
    docker compose ps
fi

echo ""
echo "🌐 訪問地址："
echo "   前端: http://localhost:3000"
echo "   後端: http://localhost:3001"
echo ""
echo "📋 其他指令："
echo "   ./stack-logs.sh          # 查看日誌"
echo "   ./stack-restart.sh       # 重啟服務"
echo "   ./stack-stop.sh          # 停止服務"
