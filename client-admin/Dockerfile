FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV CI=false
ENV DISABLE_ESLINT_PLUGIN=true
ENV PUBLIC_URL=/
RUN npm run build

FROM nginx:alpine
COPY nginx.spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 3000
