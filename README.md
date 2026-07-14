# WJCS-SportsDays

## 概述

WJCS-SportsDays 是專為運動會設計的計分程式，支援工場組和展能組的比賽，包含個人項目（來回跑、立定跳遠、火箭投擲）和團體項目（硬地滾球）。

## 🎯 系統特色

### 分離式端口設計
- **觀眾網站**：Port 15101 - 只顯示排名和結果
- **後台管理**：Port 15102 - 完整管理功能
- **後端 API**：Port 3001 - 提供資料服務

### 功能特色
- 📊 即時分數記錄和排名
- 👥 參賽者管理（手動新增 + CSV 匯入）
- 🏆 初賽前三名顯示
- 🥇 決賽入圍者和冠軍顯示
- 📱 響應式設計，支援手機和電腦
- 🔄 自動資料更新

## 🚀 快速部署

### 使用 Portainer Swarm + NFS

#### 1. 準備部署檔案
```bash
./prepare-separate-deploy.sh
```

#### 2. 上傳到 NFS
```bash
scp -r separate-deploy/* user@10.0.0.2:/volume2/swarm/wjcs/sportday/
```

#### 3. 部署 Portainer Stack
- 使用 `portainer-swarm-wjcs-separate-ports.yml`
- Stack 名稱：`sportday-separate`

#### 4. 配置外部 Nginx
- 使用 `nginx-simple-separate.conf`
- 修改域名和 IP 地址

## 🌐 訪問地址

### 直接訪問
- **觀眾網站**：http://your-swarm-node-ip:15101
- **後台管理**：http://your-swarm-node-ip:15102
- **後端 API**：http://your-swarm-node-ip:3001

### 通過外部 Nginx
- **觀眾網站**：http://your-domain.com
- **後台管理**：http://admin.your-domain.com

## 📊 系統功能

### 觀眾網站 (Port 15101)
- ✅ 查看初賽前三名
- ✅ 查看決賽入圍者
- ✅ 查看最終冠軍
- ❌ 無管理功能

### 後台管理 (Port 15102)
- ✅ 參賽者管理（手動新增 + CSV 匯入）
- ✅ 分數輸入（初賽/決賽）
- ✅ 結果查看和排名
- ✅ 資料匯出和備份

## 🏃‍♂️ 比賽項目

### 個人項目
- **來回跑**：以秒為單位，時間越短越好
- **立定跳遠**：以公分為單位，距離越遠越好
- **火箭投擲**：以公尺為單位，距離越遠越好

### 團體項目
- **硬地滾球**：以分為單位，分數越高越好

## 👥 參賽者分類

### 組別
- **工場組**：男組、女組
- **展能組**：男組、女組

### 資料格式
- 姓名、性別、組別、單位（選填）

## 📁 專案結構

```
sportday/
├── server/                   # Express 後端
│   ├── index.js             # 主程式
│   └── package.json         # 依賴配置
├── client/                   # React 前端
│   ├── src/
│   │   ├── App.js           # 管理後台主程式
│   │   ├── PublicApp.js     # 觀眾專用主程式
│   │   └── components/      # 組件目錄
│   ├── public/
│   │   ├── index.html       # 管理後台 HTML
│   │   └── public.html      # 觀眾專用 HTML
│   └── package.json         # 前端依賴配置
├── portainer-swarm-wjcs-separate-ports.yml  # Swarm 配置
├── nginx-simple-separate.conf              # 簡化 Nginx 配置
├── nginx-external-separate.conf            # 完整 Nginx 配置
├── prepare-separate-deploy.sh              # 部署準備腳本
├── build-public.sh                         # 前端建置腳本
├── SEPARATE-PORTS-GUIDE.md                 # 部署指南
├── CSV-IMPORT-GUIDE.md                     # CSV 匯入指南
├── SCORING-GUIDE.md                        # 計分員指南
├── USER-MANUAL.md                          # 使用手冊
├── QUICK-GUIDE.md                          # 快速指南
├── WORKFLOW.md                             # 工作流程
├── TRAINING-MATERIAL.md                    # 培訓材料
├── 參賽者匯入範本.csv                      # CSV 範本
└── README.md                               # 說明文件
```

## 🔧 技術架構

### 後端技術
- **Node.js** + **Express**
- **SQLite** 資料庫
- **RESTful API**
- **CORS** 支援
- **檔案上傳** (CSV 匯入)

### 前端技術
- **React** + **Ant Design**
- **響應式設計**
- **即時資料更新**
- **分離式介面**（觀眾/管理）

### 部署技術
- **Docker Swarm**
- **NFS 檔案共享**
- **Nginx 反向代理**
- **外部負載均衡**

## 📖 使用指南

### 工作人員操作
- **完整操作手冊**：查看 `USER-MANUAL.md`
- **快速操作指南**：查看 `QUICK-GUIDE.md`
- **工作流程說明**：查看 `WORKFLOW.md`
- **培訓材料**：查看 `TRAINING-MATERIAL.md`

### 計分員操作
- **計分員操作指南**：查看 `SCORING-GUIDE.md`
- **快速計分指南**：查看 `SCORING-QUICK-GUIDE.md`
- **計分員培訓材料**：查看 `SCORING-TRAINING.md`

### CSV 匯入
- **CSV 匯入指南**：查看 `CSV-IMPORT-GUIDE.md`
- **範本檔案**：`參賽者匯入範本.csv`

### 部署指南
- **分離式端口部署**：查看 `SEPARATE-PORTS-GUIDE.md`

## 🧪 測試

### 測試服務
```bash
# 測試觀眾網站
curl http://your-swarm-node-ip:15101/

# 測試後台管理
curl http://your-swarm-node-ip:15102/

# 測試後端 API
curl http://your-swarm-node-ip:3001/
```

### 測試外部 Nginx
```bash
# 測試觀眾網站
curl http://your-domain.com/

# 測試後台管理
curl http://admin.your-domain.com/
```

## 🔒 安全建議

### 訪問控制
- 觀眾網站：公開訪問
- 後台管理：建議設定訪問控制

### 防火牆設定
- 只開放必要端口
- 限制管理端口的外部訪問

### SSL/TLS
- 使用 HTTPS 加密傳輸
- 設定適當的 SSL 憑證

## 📈 效能優化

### 負載均衡
- 配置多節點負載均衡
- 設定健康檢查

### 快取設定
- 靜態檔案快取
- API 回應快取

### 監控
- 設定服務監控
- 配置日誌收集

## 🚨 故障排除

### 常見問題
- 服務無法啟動
- 端口衝突
- Nginx 配置錯誤

### 除錯指令
```bash
# 檢查服務狀態
docker service ls

# 查看服務日誌
docker service logs sportday_backend
docker service logs sportday_public-frontend
docker service logs sportday_admin-frontend

# 檢查端口
netstat -tlnp | grep :15101
netstat -tlnp | grep :15102
netstat -tlnp | grep :3001
```

## 📞 技術支援

### 聯絡方式
- 系統管理員：[聯絡資訊]
- 技術支援：[聯絡資訊]

### 版本資訊
- **版本**：1.0.0
- **更新日期**：2024年
- **授權**：MIT License

---

**運動會計分程式** - 讓比賽更精彩，讓結果更透明！