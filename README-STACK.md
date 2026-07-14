# 運動會計分程式 - Docker Stack 部署指南

## 📋 概述

本專案已成功轉換為 Docker Stack 部署方式，使用 Docker Compose 來管理服務。

## 🚀 快速開始

### 1. 部署 Stack
```bash
./deploy-stack.sh
```

### 2. 查看狀態
```bash
./stack-status.sh
```

### 3. 訪問應用程式
- **前端**: http://localhost:3000
- **後端**: http://localhost:3001

## 📋 管理指令

### 基本操作
```bash
# 啟動服務
./stack-start.sh

# 停止服務
./stack-stop.sh

# 重啟服務
./stack-restart.sh

# 更新服務
./stack-update.sh

# 查看狀態
./stack-status.sh
```

### 日誌查看
```bash
# 查看所有日誌
./stack-logs.sh

# 即時跟蹤日誌
./stack-logs.sh -f

# 查看特定服務日誌
./stack-logs.sh -s frontend
./stack-logs.sh -s backend

# 即時跟蹤特定服務日誌
./stack-logs.sh -f -s frontend
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
- **backend**: Node.js 後端服務 (端口 3001)
- **frontend**: React 前端服務 (端口 3000)
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
- **3000**: 前端服務
- **3001**: 後端 API 服務

### 內部網路
- 服務間通過 `sportday-network` 網路通訊
- 前端通過 `http://sport-backend:3001` 訪問後端

## 📊 監控和除錯

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
docker compose logs frontend

# 即時跟蹤日誌
docker compose logs -f
```

### 進入容器除錯
```bash
# 進入後端容器
docker compose exec backend sh

# 進入前端容器
docker compose exec frontend sh
```

## 🔄 更新和維護

### 更新應用程式
```bash
# 使用更新腳本
./stack-update.sh

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
./stack-logs.sh

# 檢查 Docker 狀態
docker info

# 檢查端口占用
netstat -tlnp | grep :3000
netstat -tlnp | grep :3001
```

#### 2. 前端無法連接後端
```bash
# 檢查網路連接
docker compose exec frontend ping sport-backend

# 檢查後端健康狀態
curl http://localhost:3001/
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
./deploy-stack.sh
```

## 📁 檔案結構

```
sport/
├── docker-compose.yml          # Docker Compose 配置
├── deploy-stack.sh            # 部署腳本
├── stack-start.sh             # 啟動腳本
├── stack-stop.sh              # 停止腳本
├── stack-restart.sh           # 重啟腳本
├── stack-update.sh            # 更新腳本
├── stack-status.sh            # 狀態查看腳本
├── stack-logs.sh              # 日誌查看腳本
├── README-STACK.md            # Stack 部署指南
├── client/                    # 前端程式碼
├── server/                    # 後端程式碼
└── data/                      # 資料目錄
```

## 🎯 優勢

### 相比純 Docker 容器的優勢
1. **統一管理**: 使用單一配置文件管理所有服務
2. **依賴管理**: 自動處理服務間依賴關係
3. **健康檢查**: 內建健康檢查機制
4. **網路隔離**: 自動建立內部網路
5. **資料持久化**: 統一的資料卷管理
6. **易於擴展**: 支援多實例部署
7. **版本控制**: 配置檔案可版本控制

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

**運動會計分程式 Docker Stack** - 更簡單、更可靠的部署方式！
