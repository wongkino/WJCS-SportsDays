#!/bin/bash

echo "🐳 啟動運動會計分程式 (純 Docker)"
echo ""

# 檢查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 請先安裝 Docker"
    exit 1
fi

# 建立資料目錄
mkdir -p data

# 停止並清理現有容器
echo "🛑 清理現有容器..."
docker stop sport-backend sport-frontend 2>/dev/null || true
docker rm sport-backend sport-frontend 2>/dev/null || true

# 建立網路
docker network create sportday-network 2>/dev/null || true

# 啟動後端
echo "🚀 啟動後端..."
docker run -d \
    --name sport-backend \
    --network sportday-network \
    -p 3001:3001 \
    -v "$(pwd)/server:/app" \
    -v "$(pwd)/data:/app/data" \
    -e NODE_ENV=production \
    node:18-alpine \
    sh -c "
        apk add --no-cache python3 make g++ sqlite-dev musl-dev &&
        cd /app &&
        npm install express cors sqlite3 body-parser multer csv-parser &&
        node index.js
    "

# 等待後端啟動
echo "⏳ 等待後端啟動..."
sleep 5

# 啟動前端
echo "🚀 啟動前端..."
docker run -d \
    --name sport-frontend \
    --network sportday-network \
    -p 3000:3000 \
    -v "$(pwd)/client:/app" \
    -e CHOKIDAR_USEPOLLING=true \
    node:18-alpine \
    sh -c "
        cd /app &&
        npm install &&
        npm start
    "

echo ""
echo "✅ 啟動完成！"
echo ""
echo "🌐 訪問地址："
echo "   前端: http://localhost:3000"
echo "   後端: http://localhost:3001"
echo ""
echo "📋 管理指令："
echo "   docker ps                    # 查看容器"
echo "   docker logs sport-frontend   # 查看前端日誌"
echo "   docker logs sport-backend    # 查看後端日誌"
echo "   docker stop sport-backend sport-frontend  # 停止服務"
