#!/bin/bash

echo "📊 運動會計分程式 (分離式前端) Stack 狀態"
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
echo "   觀賽者前端: http://localhost:3100"
echo "   計分員前端: http://localhost:3200"
echo "   後端 API: http://localhost:3300"
echo ""
echo "📋 其他指令："
echo "   ./stack-separated-logs.sh          # 查看日誌"
echo "   ./stack-separated-restart.sh       # 重啟服務"
echo "   ./stack-separated-stop.sh          # 停止服務"
