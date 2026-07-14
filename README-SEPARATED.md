# 運動會計分程式 - 分離式前端部署指南

## 📋 概述

本專案已重新配置為分離式前端架構，提供兩個獨立的前端服務和一個後端 API 服務。

## 🏗️ 系統架構

### 服務配置
- **觀賽者前端** (Port 3100) - 只顯示分數和結果
- **計分員前端** (Port 3200) - 完整管理功能
- **後端 API** (Port 3300) - 提供資料服務

### 目錄結構
```
sport/
├── client-public/          # 觀賽者前端
├── client-admin/           # 計分員前端
├── server/                 # 後端 API
├── data/                   # 資料目錄
├── docker-compose.yml      # Docker 配置
└── stack-separated-*.sh    # 管理腳本
```

## 🚀 快速部署

### 1. 部署分離式前端
```bash
./deploy-separated.sh
```

### 2. 查看狀態
```bash
./stack-separated-status.sh
```

### 3. 訪問應用程式
- **觀賽者前端**: http://localhost:3100
- **計分員前端**: http://localhost:3200
- **後端 API**: http://localhost:3300

## 📋 管理指令

### 基本操作
```bash
# 啟動服務
./stack-separated-start.sh

# 停止服務
./stack-separated-stop.sh

# 重啟服務
./stack-separated-restart.sh

# 查看狀態
./stack-separated-status.sh
```

### 日誌查看
```bash
# 查看所有日誌
./stack-separated-logs.sh

# 即時跟蹤日誌
./stack-separated-logs.sh -f

# 查看特定服務日誌
./stack-separated-logs.sh -s public-frontend
./stack-separated-logs.sh -s admin-frontend
./stack-separated-logs.sh -s backend

# 即時跟蹤特定服務日誌
./stack-separated-logs.sh -f -s public-frontend
```

### 直接使用 Docker Compose
```bash
# 啟動服務
docker compose up -d

# 停止服務
docker compose down

# 查看狀態
docker compose ps

# 查看日誌
docker compose logs -f

# 重啟服務
docker compose restart

# 重新建置並啟動
docker compose up -d --build
```

## 🔧 服務配置

### 服務架構
- **backend**: Node.js 後端服務 (端口 3300)
- **public-frontend**: React 觀賽者前端 (端口 3100)
- **admin-frontend**: React 計分員前端 (端口 3200)
- **sportday-network**: 內部網路

### 健康檢查
- 後端：每 30 秒檢查一次，超時 10 秒
- 前端：每 30 秒檢查一次，超時 10 秒
- 啟動延遲：後端 40 秒，前端 60 秒

### 資料持久化
- `./data` 目錄映射到後端容器的 `/app/data`
- 資料庫和上傳檔案會保存在本地 `data` 目錄

## 🌐 網路配置

### 端口映射
- **3100**: 觀賽者前端服務
- **3200**: 計分員前端服務
- **3300**: 後端 API 服務

### 內部網路
- 服務間通過 `sportday-network` 網路通訊
- 前端通過 `http://sport-backend:3300` 訪問後端

## 📊 功能差異

### 觀賽者前端 (Port 3100)
- ✅ 查看初賽前三名
- ✅ 查看決賽入圍者
- ✅ 查看最終冠軍
- ❌ 無管理功能
- ❌ 無分數輸入功能

### 計分員前端 (Port 3200)
- ✅ 參賽者管理（手動新增 + CSV 匯入）
- ✅ 分數輸入（初賽/決賽）
- ✅ 結果查看和排名
- ✅ 資料匯出和備份
- ✅ 完整管理功能

## 📈 監控和除錯

### 檢查服務健康狀態
```bash
docker compose ps
```

### 查看詳細日誌
```bash
# 查看所有服務日誌
docker compose logs

# 查看特定服務日誌
docker compose logs backend
docker compose logs public-frontend
docker compose logs admin-frontend

# 即時跟蹤日誌
docker compose logs -f
```

### 進入容器除錯
```bash
# 進入後端容器
docker compose exec backend sh

# 進入觀賽者前端容器
docker compose exec public-frontend sh

# 進入計分員前端容器
docker compose exec admin-frontend sh
```

## 🔄 更新和維護

### 更新應用程式
```bash
# 使用更新腳本
./stack-separated-restart.sh

# 或手動更新
docker compose down
docker compose up -d --build
```

### 清理資源
```bash
# 清理未使用的容器和映像
docker container prune -f
docker image prune -f

# 清理所有未使用的資源
docker system prune -f
```

## 🚨 故障排除

### 常見問題

#### 1. 服務無法啟動
```bash
# 檢查日誌
./stack-separated-logs.sh

# 檢查 Docker 狀態
docker info

# 檢查端口占用
netstat -tlnp | grep :3100
netstat -tlnp | grep :3200
netstat -tlnp | grep :3300
```

#### 2. 前端無法連接後端
```bash
# 檢查網路連接
docker compose exec public-frontend ping sport-backend
docker compose exec admin-frontend ping sport-backend

# 檢查後端健康狀態
curl http://localhost:3300/
```

#### 3. 資料庫問題
```bash
# 檢查資料目錄權限
ls -la data/

# 檢查資料庫檔案
ls -la data/sportday.db
```

### 重置環境
```bash
# 完全重置
docker compose down -v
docker system prune -f
./deploy-separated.sh
```

## 🎯 優勢

### 分離式架構的優勢
1. **安全性**: 觀賽者無法訪問管理功能
2. **效能**: 觀賽者前端更輕量，載入更快
3. **維護性**: 可以獨立更新和管理不同前端
4. **擴展性**: 可以為不同用戶群體提供專門的介面
5. **監控**: 可以分別監控不同服務的使用情況

### 管理便利性
- 一鍵部署和更新
- 統一的日誌管理
- 簡化的服務監控
- 標準化的操作流程

## 📞 技術支援

如有問題，請檢查：
1. Docker 和 Docker Compose 版本
2. 系統資源使用情況
3. 網路連接狀態
4. 服務日誌內容

---

**運動會計分程式分離式前端** - 更安全、更高效的分離式部署方式！
