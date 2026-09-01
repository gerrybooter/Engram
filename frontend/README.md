# Engram Frontend

Engram 的 Vue 调试控制台，用于观察多 Agent 编排、记忆链路和 RAG 命中情况。

## 功能

- 对话调试：展示每轮的意图识别、Agent 路由、RAG 命中与转人工标记。
- 健康检查与监控摘要。
- 知识库检索、文档导入、文件上传。
- 支持 Docker + Nginx 部署。

## 后端地址

| 用途 | 默认地址 |
|------|----------|
| Engram API | `http://localhost:8000` |

开发模式下，Vite 会把 `/api/python` 代理到 `http://localhost:8000`。

Docker 模式下，Nginx 通过 `host.docker.internal` 访问宿主机上的后端服务。

## 本地运行

安装依赖：

```bash
npm install
```

启动：

```bash
npm run dev
```

访问：

```text
http://localhost:5173
```

如果后端端口不是默认值，可以启动时覆盖：

```bash
VITE_PYTHON_API_URL=http://localhost:8000 npm run dev
```

## Docker 部署

构建并启动容器（前端会在容器内编译，宿主机不需要先 `npm run build`）：

```bash
docker compose up -d --build
```

访问：

```text
http://localhost:5174
```

停止：

```bash
docker compose down
```
