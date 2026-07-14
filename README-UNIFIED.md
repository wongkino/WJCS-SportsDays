# 🏆 運動會計分程式 - 統一版

## 🚀 **快速開始**

### **簡化版啟動** (推薦)
```bash
./start-simple.sh
```
- 包含：後端 API + 前端管理介面
- 端口：3000 (前端), 3001 (後端)

### **完整版啟動**
```bash
./start-unified.sh
```
- 包含：後端 + 管理介面 + 觀眾網站 + 後台管理
- 端口：3000, 15101, 15102, 3001

## 🌐 **訪問地址**

- **管理介面**: http://localhost:3000
- **後端 API**: http://localhost:3001
- **觀眾網站**: http://localhost:15101 (完整版)
- **後台管理**: http://localhost:15102 (完整版)

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

## 🔧 **管理指令**

```bash
# 查看服務狀態
docker-compose -f docker-compose.simple-unified.yml ps

# 查看日誌
docker-compose -f docker-compose.simple-unified.yml logs -f

# 停止服務
docker-compose -f docker-compose.simple-unified.yml down

# 重啟服務
docker-compose -f docker-compose.simple-unified.yml restart
```

## 📦 **部署到遠端**

```bash
./deploy-unified.sh
```

## 🎯 **推薦使用**

- **開發測試**: 使用簡化版 (`./start-simple.sh`)
- **正式使用**: 使用完整版 (`./start-unified.sh`)
- **遠端部署**: 使用部署腳本 (`./deploy-unified.sh`)

---

**運動會計分程式統一版** - 簡單、高效、易用！ 🎉
