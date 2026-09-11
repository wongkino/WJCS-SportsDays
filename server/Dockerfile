FROM node:18-alpine

RUN apk add --no-cache python3 make g++ sqlite-dev musl-dev wget

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/data

EXPOSE 3300

ENV NODE_ENV=production
ENV PORT=3300
ENV DB_PATH=/app/data/sportday.db

CMD ["node", "index.js"]
