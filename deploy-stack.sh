#!/bin/bash

echo "🐳 部署運動會計分程式 (Docker Stack)"
echo ""

# 檢查 Docker Swarm
if ! docker info | grep -q "Swarm: active"; then
    echo "❌ Docker Swarm 未啟用，正在初始化..."
    docker swarm init
    echo "✅ Docker Swarm 已初始化"
fi

# 檢查 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 請先安裝 Docker Compose"
    exit 1
fi

# 建立資料目錄
mkdir -p data

# 停止現有容器
echo "🛑 停止現有容器..."
docker stop sport-backend sport-frontend 2>/dev/null || true
docker rm sport-backend sport-frontend 2>/dev/null || true

# 部署 Stack
echo "🚀 部署 Docker Stack..."
if command -v docker-compose &> /dev/null; then
    docker-compose down 2>/dev/null || true
    docker-compose up -d
else
    docker compose down 2>/dev/null || true
    docker compose up -d
fi

echo ""
echo "✅ Stack 部署完成！"
echo ""
echo "🌐 訪問地址："
echo "   前端: http://localhost:3000"
echo "   後端: http://localhost:3001"
echo ""
echo "📋 管理指令："
echo "   docker-compose ps                    # 查看服務狀態"
echo "   docker-compose logs -f               # 查看所有日誌"
echo "   docker-compose logs -f frontend      # 查看前端日誌"
echo "   docker-compose logs -f backend       # 查看後端日誌"
echo "   docker-compose down                  # 停止服務"
echo "   docker-compose up -d                 # 啟動服務"
echo "   docker-compose restart               # 重啟服務"
echo ""
echo "🔧 健康檢查："
echo "   docker-compose ps                    # 檢查服務健康狀態"
