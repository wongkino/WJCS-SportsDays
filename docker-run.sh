#!/bin/bash

echo "🐳 使用 Docker 直接運行運動會計分程式"
echo ""

# 檢查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 請先安裝 Docker"
    exit 1
fi

# 建立資料目錄
echo "📂 建立資料目錄..."
mkdir -p data

# 停止現有容器
echo "🛑 停止現有容器..."
docker stop sport-backend sport-frontend 2>/dev/null || true
docker rm sport-backend sport-frontend 2>/dev/null || true

# 建立網路
echo "🌐 建立 Docker 網路..."
docker network create sportday-network 2>/dev/null || true

# 啟動後端容器
echo "🚀 啟動後端容器..."
docker run -d \
    --name sport-backend \
    --network sportday-network \
    -p 3001:3001 \
    -v "$(pwd)/server:/app" \
    -v "$(pwd)/data:/app/data" \
    -e NODE_ENV=production \
    -e PORT=3001 \
    --restart unless-stopped \
    node:18-alpine \
    sh -c "
        apk add --no-cache python3 make g++ sqlite-dev musl-dev wget &&
        cd /app &&
        npm install express cors sqlite3 body-parser multer csv-parser &&
        node index.js
    "

if [ $? -ne 0 ]; then
    echo "❌ 後端容器啟動失敗"
    exit 1
fi

echo "✅ 後端容器啟動成功"

# 等待後端啟動
echo "⏳ 等待後端啟動..."
sleep 10

# 啟動前端容器
echo "🚀 啟動前端容器..."
docker run -d \
    --name sport-frontend \
    --network sportday-network \
    -p 3000:3000 \
    -v "$(pwd)/client:/app" \
    -e CHOKIDAR_USEPOLLING=true \
    -e REACT_APP_API_URL=http://sport-backend:3001 \
    --restart unless-stopped \
    node:18-alpine \
    sh -c "
        cd /app &&
        npm install &&
        npm start
    "

if [ $? -ne 0 ]; then
    echo "❌ 前端容器啟動失敗"
    exit 1
fi

echo "✅ 前端容器啟動成功"

echo ""
echo "🎉 運動會計分程式啟動成功！"
echo ""
echo "🌐 訪問地址："
echo "   🔧 管理介面: http://localhost:3000"
echo "   📡 後端 API: http://localhost:3001"
echo ""
echo "📋 管理指令："
echo "   查看容器: docker ps"
echo "   查看日誌: docker logs sport-frontend -f"
echo "   停止服務: docker stop sport-backend sport-frontend"
echo "   重啟服務: docker restart sport-backend sport-frontend"
echo "   清理容器: docker rm sport-backend sport-frontend"
