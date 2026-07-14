# 🏆 運動會計分程式 - 純 Docker 版

## 🚀 **快速開始**

### **啟動服務**
```bash
./start-docker.sh
```
- 使用純 Docker 命令
- 不需要 Docker Compose
- 包含：後端 API + 前端管理介面

## 🌐 **訪問地址**

- **管理介面**: http://localhost:3000
- **後端 API**: http://localhost:3001

## 📋 **功能特色**

- ✅ **參賽者管理** - 新增、編輯、CSV 匯入
- ✅ **分數輸入** - 初賽/決賽分數記錄
- ✅ **排名計算** - 自動排名和分組
- ✅ **結果顯示** - 前三名、決賽、冠軍
- ✅ **響應式設計** - 支援手機、平板、電腦
- ✅ **即時更新** - 自動資料更新

## 🏆 **比賽項目**

- **來回跑** - 時間計分
- **立定跳遠** - 距離計分
- **火箭投擲** - 距離計分
- **硬地滾球** - 分數計分

## 👥 **參賽者分類**

- **工場組** - 男組、女組
- **展能組** - 男組、女組

## 🐳 **Docker 管理指令**

```bash
# 查看容器狀態
docker ps

# 查看前端日誌
docker logs sport-frontend -f

# 查看後端日誌
docker logs sport-backend -f

# 停止服務
docker stop sport-backend sport-frontend

# 重啟服務
docker restart sport-backend sport-frontend

# 清理容器
docker rm sport-backend sport-frontend

# 清理網路
docker network rm sportday-network
```

## 📦 **部署到遠端**

```bash
./deploy-docker.sh
```

## 🎯 **優勢**

- 🐳 **純 Docker** - 不需要 Docker Compose
- 🚀 **快速啟動** - 直接使用 Docker 命令
- 🔧 **簡單管理** - 標準 Docker 指令
- 💾 **資源節省** - 更少的依賴
- 📱 **跨平台** - 支援所有 Docker 環境

## 🔧 **故障排除**

```bash
# 檢查容器狀態
docker ps -a

# 查看容器日誌
docker logs sport-backend
docker logs sport-frontend

# 重新啟動
docker restart sport-backend sport-frontend

# 完全重新部署
docker stop sport-backend sport-frontend
docker rm sport-backend sport-frontend
./start-docker.sh
```

---

**運動會計分程式純 Docker 版** - 簡單、高效、易用！ 🎉
