# 使用 Node.js 官方映像檔
FROM node:18-alpine

# 安裝必要的系統依賴
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev \
    musl-dev

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製應用程式碼
COPY . .

# 建立資料庫目錄
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3001

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=3001

# 啟動應用程式
CMD ["npm", "start"]
