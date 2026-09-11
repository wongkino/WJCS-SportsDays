# WJCS-SportsDays

懷智運動會計分系統：公開排名、管理後台、計分頁與 API 收在同一個 Docker image，資料庫使用 MariaDB。

## 訪問

| 頁面 | 路徑 |
|---|---|
| 公開排名 | `/` |
| 管理後台 | `/admin/` |
| 計分員登入 | `/scorer.html` |
| 計分工作台 | `/scorer-dashboard.html` |
| API | `/api/` |

本機預設：`http://localhost:3200`

## 專案結構

```
.
├── Dockerfile                 # node:24.21.0
├── docker-compose.yml
├── server/                    # Express + MariaDB
│   ├── index.js
│   ├── db.js
│   └── template.csv
├── web/
│   ├── public/                # 公開頁 /
│   ├── admin/                 # 管理後台 /admin/
│   └── scorer/
└── db/                        # MariaDB 資料（不進 image）
```

## 部署

```bash
docker compose up -d
```

Image：`ghcr.io/wongkino/wjcs-sportsdays:latest`

- 網站：`3200:3200`
- MariaDB：只在 stack 內給 app 使用，不對外開放 port

推送到 `main` 後，GitHub Actions 會建置並推送 image；每次成功 build 會自動把版本號 patch +1（例如 `1.0.0` → `1.0.1`），並打上對應的 GHCR tag。

## 本機開發

```bash
npm run dev:server    # API，http://localhost:3200
npm run dev:public    # 公開頁
npm run dev:admin     # 管理後台
```

## 比賽項目

- 個人：來回跑、立定跳遠、火箭投擲
- 團體：硬地滾球
- 組別：工場及社區組、展能組
