#!/bin/bash

# 部署純 Docker 版本到遠端主機
REMOTE_HOST="192.168.1.51"
REMOTE_USER="wjcsit"
REMOTE_PATH="/home/wjcsit/sport"

echo "🐳 部署純 Docker 版運動會計分程式"
echo "目標: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"
echo ""

# 建立打包目錄
echo "📦 準備純 Docker 版文件..."
mkdir -p docker-deploy

# 複製文件，只保留純 Docker 版本需要的
rsync -av \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='tmp' \
    --exclude='data' \
    --exclude='build' \
    --exclude='public-build' \
    --exclude='docker-deploy' \
    --exclude='docker-compose.*' \
    --exclude='start-simple.sh' \
    --exclude='start-unified.sh' \
    --exclude='deploy-unified.sh' \
    ./ docker-deploy/

echo "✅ 文件準備完成"
echo ""

# 建立 tar 包
echo "📦 建立純 Docker 版 tar 包..."
cd docker-deploy
tar -czf ../sport-docker.tar.gz .
cd ..
echo "✅ 純 Docker 版 tar 包建立完成: sport-docker.tar.gz"
echo ""

echo "📋 部署純 Docker 版步驟："
echo ""
echo "1. 📂 建立遠端目錄："
echo "   ssh $REMOTE_USER@$REMOTE_HOST"
echo "   mkdir -p $REMOTE_PATH"
echo "   exit"
echo ""
echo "2. 📤 上傳 tar 包："
echo "   scp sport-docker.tar.gz $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
echo ""
echo "3. 📦 解壓並設定權限："
echo "   ssh $REMOTE_USER@$REMOTE_HOST"
echo "   cd $REMOTE_PATH"
echo "   tar -xzf sport-docker.tar.gz"
echo "   rm sport-docker.tar.gz"
echo "   chmod +x *.sh"
echo "   mkdir -p data"
echo ""
echo "4. 🚀 啟動純 Docker 服務："
echo "   ./start-docker.sh"
echo ""
echo "5. 🌐 訪問應用程式："
echo "   前端: http://$REMOTE_HOST:3000"
echo "   後端: http://$REMOTE_HOST:3001"
echo ""
echo "📋 或者執行以下一鍵指令："
echo ""
echo "# 建立目錄"
echo "ssh $REMOTE_USER@$REMOTE_HOST 'mkdir -p $REMOTE_PATH'"
echo ""
echo "# 上傳文件"
echo "scp sport-docker.tar.gz $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
echo ""
echo "# 解壓並啟動"
echo "ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_PATH && tar -xzf sport-docker.tar.gz && rm sport-docker.tar.gz && chmod +x *.sh && mkdir -p data && ./start-docker.sh'"
echo ""
echo "🎉 純 Docker 版部署完成後，您就可以通過純 Docker 命令管理服務了！"
