FROM node:24.21.0 AS public-build
WORKDIR /app
COPY web/public/package.json web/public/package-lock.json ./
RUN npm ci
COPY web/public/ ./
ENV CI=false
ENV DISABLE_ESLINT_PLUGIN=true
ENV PUBLIC_URL=/
RUN npm run build

FROM node:24.21.0 AS admin-build
WORKDIR /app
COPY web/admin/package.json web/admin/package-lock.json ./
RUN npm ci
COPY web/admin/ ./
ENV CI=false
ENV DISABLE_ESLINT_PLUGIN=true
ENV PUBLIC_URL=/admin
RUN npm run build

FROM node:24.21.0 AS backend-deps
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

FROM node:24.21.0
WORKDIR /app

COPY --from=backend-deps /app/node_modules ./node_modules
COPY server/ ./
RUN mkdir -p /app/uploads /app/web/public /app/web/admin

COPY --from=public-build /app/build /app/web/public
COPY --from=admin-build /app/build /app/web/admin
COPY web/scorer/ /app/web/public/

EXPOSE 3200

ENV NODE_ENV=production
ENV PORT=3200
ENV PUBLIC_WEB_DIR=/app/web/public
ENV ADMIN_WEB_DIR=/app/web/admin

CMD ["node", "index.js"]
