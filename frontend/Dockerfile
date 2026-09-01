# ── 构建阶段：在容器内编译前端，无需宿主机预先 npm run build ──────────────
FROM node:22-alpine AS build
WORKDIR /app

# 先只拷依赖清单，让 npm ci 这层能被 Docker 缓存复用
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── 运行阶段：只保留 nginx 和编译产物 ──────────────────────────────────
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
