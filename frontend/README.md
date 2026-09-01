# Engram Frontend

Engram 的 Vue 前端，包含两个视图：

- **在线客服** —— 面向终端用户的对话界面。欢迎语、常见问题快捷入口、转人工提示，不暴露任何内部字段。
- **控制台** —— 面向开发与演示。连接设置、健康检查、监控摘要、知识库检索与导入，以及最近一轮对话的完整链路（意图识别三路打分、Agent 路由依据、RAG 命中、抽取实体、原始 JSON）。

默认进入「在线客服」，控制台在首次点开时才挂载，普通用户不会触发监控类请求。

## 访问地址

前端只有一个入口：

```text
http://localhost:5173
```

开发模式和 Docker 模式都监听这个端口，**二选一，不能同时启动**。同时启动会因端口冲突直接报错，这是有意为之——避免出现两个网址、不知道自己在看哪一个。

| 模式 | 启动方式 | 跑的内容 |
|------|----------|----------|
| 开发 | `npm run dev` | 源码 + 热更新 |
| Docker | `docker compose up -d --build` | `npm run build` 产物，Nginx 托管 |

## 后端地址

| 用途 | 默认地址 |
|------|----------|
| Engram API | `http://localhost:8000` |

开发模式下，Vite 把 `/api/python` 代理到 `http://localhost:8000`。

Docker 模式下，Nginx 通过 `host.docker.internal` 访问宿主机上的后端服务。

界面「控制台 → 连接设置」里可以直接改后端地址，改动存在 localStorage。

## 本地运行

```bash
npm install
npm run dev
```

如果后端端口不是默认值：

```bash
VITE_PYTHON_API_URL=http://localhost:8000 npm run dev
```

> `npm run dev` 启用了 `strictPort`。端口被占时会直接报 `Port 5173 is already in use`，
> 而不是静默漂移到 5174。报这个错通常说明 Docker 那份已经在跑了，先 `docker compose down`。

## Docker 部署

前端在容器内编译，宿主机不需要先 `npm run build`：

```bash
docker compose up -d --build
```

停止：

```bash
docker compose down
```

## 目录结构

```text
src/
├── App.vue              # 外壳：视图切换 + 健康检查
├── views/
│   ├── ChatView.vue     # 在线客服（终端用户）
│   └── ConsoleView.vue  # 控制台（开发/演示）
├── lib/
│   ├── backends.js      # API 调用与响应归一化
│   └── labels.js        # 内部枚举 → 中文文案
└── styles.css           # 设计 token + 全部样式
```
