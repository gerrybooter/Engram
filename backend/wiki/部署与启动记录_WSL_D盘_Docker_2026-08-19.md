# Engram 安装、启动与运行环境记录

> 记录日期：2026 年 8 月 19 日  
> 更新日期：2026 年 9 月 1 日 —— 项目更名为 Engram，并重构为单一仓库（`backend/` + `frontend/`），下文路径已同步更新。  
> 目的：让之后协助本项目的 AI 或开发者知道：本项目使用的是 **WSL Ubuntu 内的 Docker Engine**，不是 Windows Docker Desktop。因此，在 Windows PowerShell 里找不到 `docker` 命令是正常现象。

---

## 1. 当前项目的运行方式

Engram 的实际运行链路如下：

```text
Windows 10
  └─ WSL 2
      └─ Ubuntu 24.04.1 LTS（迁移到了 D 盘）
          └─ Docker Engine + Docker Compose
              ├─ engram-app       Python FastAPI / Agent 主程序
              ├─ engram-redis     Redis 工作记忆
              ├─ engram-chromadb  ChromaDB 知识库
              ├─ engram-nginx     Nginx 反向代理
              └─ engram-prometheus Prometheus 监控
```

仓库根目录在 Windows 的：

```text
D:\Workspace\Engram
```

`docker compose` 需要在**后端目录**执行，因为编排文件在那里：

```text
D:\Workspace\Engram\backend
```

在 Ubuntu/WSL 中对应的路径是：

```bash
/mnt/d/Workspace/Engram/backend
```

> 若项目尚未移动到该位置，请把上面的 `D:\Workspace\Engram` 换成实际所在目录。

Docker 的镜像、容器和 Linux 环境位于迁移后的 WSL Ubuntu 中，主要存放在 D 盘，而不是 Docker Desktop 的 C 盘目录。

---

## 2. 为什么 Windows PowerShell 没有 `docker` 命令？

如果在 Windows PowerShell 中直接执行：

```powershell
docker --version
```

看到：

```text
'docker' is not recognized as the name of a cmdlet...
```

这是正常的，不代表项目没有 Docker，也不代表 Docker 没安装。

原因是：

- 没有安装 Docker Desktop；
- 没有把 Docker CLI 安装到 Windows；
- Docker Engine 安装在 WSL Ubuntu 内；
- 因此 Docker 命令只能在 Ubuntu 终端中使用。

正确关系是：

```text
Windows PowerShell 只负责进入 WSL
PowerShell 输入 wsl
进入 Ubuntu 后，才能执行 docker / docker compose
```

所以排查时要区分两个环境：

| 终端环境 | `docker` 命令是否可用 | 用途 |
|---|---:|---|
| Windows PowerShell（`PS C:\...>`） | 不一定可用，本机没有安装 Docker CLI | 输入 `wsl` 进入 Ubuntu |
| Ubuntu（`moonsseeker@...$` 或 `root@...#`） | 可用 | 启动 Docker、启动 Engram |

---

## 3. Docker 安装过程总结

### 3.1 安装 WSL Ubuntu

电脑是较旧的 Windows 10，无法直接使用当前版本 Docker Desktop，因此选择了 WSL 方案：

- 安装 Ubuntu 24.04.1 LTS；
- 使用 WSL 2；
- 不安装 Docker Desktop 图形界面；
- 在 Ubuntu 中直接安装 Docker Engine 和 Docker Compose 插件。

### 3.2 在 Ubuntu 中安装 Docker Engine

在 Ubuntu 中配置 Docker 官方 apt 源，并安装：

```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

已验证的组件包括：

```text
docker-ce
 docker-ce-cli
containerd.io
docker-buildx-plugin
docker-compose-plugin
```

验证命令：

```bash
sudo docker info
```

如果能看到 `Client` 和 `Server` 两部分，说明 Docker 后台服务已经启动。

验证 Compose：

```bash
sudo docker compose version
```

验证 Docker 是否能运行容器：

```bash
sudo docker run hello-world
```

看到下面的内容就表示 Docker 工作正常：

```text
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

### 3.3 为什么 Docker 后来迁移到 D 盘？

最开始 Ubuntu 默认放在 C 盘。Docker 镜像、容器和数据都在 Ubuntu 内部，所以虽然项目代码在 D 盘，C 盘仍然被 Docker 占用了很多空间。

后来采用了更安全的迁移顺序：

```text
导出旧 Ubuntu 到 D 盘
  → 导入一个新的 Ubuntu-D 到 D 盘
  → 启动新 Ubuntu 的 Docker
  → 启动并验证 Engram
  → 确认可用后，再删除旧 Ubuntu
```

新环境的默认用户曾经变成过 `root`。如果终端提示符是：

```text
root@DESKTOP-...#
```

说明当前是 root 用户，不需要输入 sudo 密码。

更适合日常使用的普通用户是：

```text
moonsseeker
```

---

## 4. 每次如何启动 Engram

### 方法 A：从 Windows PowerShell 进入 Ubuntu

在 Windows PowerShell 中执行：

```powershell
wsl
```

如果没有进入正确的发行版，可以明确指定：

```powershell
wsl -d Ubuntu-D -u moonsseeker
```

进入 Ubuntu 后，提示符应该类似：

```text
moonsseeker@DESKTOP-BHB11R1:~$
```

### 方法 B：启动 Docker 服务

在 Ubuntu 中执行：

```bash
sudo service docker start
```

如果当前用户是 root，也可以不需要密码；这与 PowerShell 是否使用管理员权限不是一回事。

### 方法 C：进入后端目录

编排文件在 `backend/` 下，必须进到这一层：

```bash
cd '/mnt/d/Workspace/Engram/backend'
```

### 方法 D：启动全部服务

日常启动：

```bash
sudo docker compose up -d
```

如果刚修改了 `.env`，希望让 Engram 重新读取 API 配置：

```bash
sudo docker compose up -d --force-recreate engram
```

如果修改了 Dockerfile、requirements.txt 或项目构建内容，才使用：

```bash
sudo docker compose up -d --build
```

不要每次都加 `--build`，否则会重复构建并占用更多时间和磁盘空间。

### 方法 E：检查服务状态

```bash
sudo docker compose ps
```

正常情况下主要服务应显示：

```text
engram-app        Up ... (healthy)
engram-chromadb   Up ... (healthy)
engram-redis      Up ... (healthy)
engram-prometheus Up ... (healthy)
engram-nginx      Up ... (healthy)
```

Nginx 健康检查目前使用：

```text
http://127.0.0.1/health
```

这是为了避免容器内 `localhost` 的 IPv4/IPv6 解析差异导致误报 `unhealthy`。

---

## 5. 如何打开并使用项目

Engram 不是点击一个桌面图标就能看到完整企业页面的应用。它是一个后端 Agent 服务，需要先启动 Docker 服务，再用浏览器访问 API 页面。

### 5.1 Swagger 调试页面

在 Windows 浏览器打开：

```text
http://localhost:8000/docs
```

这会打开 FastAPI 自动生成的 Swagger UI，用来查看和测试接口。

也可以通过 Nginx 访问：

```text
http://localhost/docs
```

### 5.2 先测试健康接口

在 Swagger 中找到：

```text
GET /health
```

点击：

```text
Try it out → Execute
```

返回 HTTP `200`，说明 API 服务正常。

### 5.3 测试核心聊天接口

找到：

```text
POST /chat
```

输入：

```json
{
  "message": "我的外卖怎么还没到？",
  "user_id": "demo_user",
  "conv_id": "demo_001"
}
```

返回结果中可以重点观察：

```text
response
intent
intent_group
agent_type
primary_agent
supporting_agents
routing_reason
knowledge_used
escalated
latency_ms
```

这些字段可以用来学习项目的完整 Agent 链路：意图识别、Agent 路由、知识库使用、回复生成、升级标记和耗时监控。

### 5.4 停止项目

```bash
sudo docker compose down
```

这个命令只停止服务，不会删除镜像、代码或知识库数据。

不要随意执行：

```bash
sudo docker system prune -a --volumes
```

这可能删除镜像、容器、卷和知识库数据。

---

## 6. API Key 配置注意事项

API 配置写在后端目录：

```text
D:\Workspace\Engram\backend\.env
```

项目读取的主要变量是：

```env
ANTHROPIC_API_KEY=你的密钥
ANTHROPIC_MODEL=你的模型名
ANTHROPIC_BASE_URL=可选的兼容接口地址
```

不要把 `.env` 的完整内容发给其他 AI，也不要把 API Key 放到截图、Git 提交或公开仓库中。

修改 `.env` 后，已经运行的容器不会自动读取新值。需要执行：

```bash
sudo docker compose up -d --force-recreate engram
```

如果 `/chat` 返回“抱歉，处理您的请求时出现问题”，查看日志：

```bash
sudo docker compose logs --tail=120 engram
```

常见原因：

- `401`：API Key 无效或不匹配；
- `404 model not found`：模型名称不存在；
- `timeout` 或 `connection error`：网络或代理问题；
- `base_url` 错误：兼容接口地址不正确；
- 使用了不兼容 Anthropic Messages 格式的平台 Key。

---

## 7. 是否需要 venv？

当前使用 Docker 启动项目时，不需要在 Windows 或 Ubuntu 宿主机中单独激活 Python `venv`。

项目的 Python 依赖会在 Docker 镜像构建时安装：

```dockerfile
COPY requirements.txt .
RUN pip install -r requirements.txt
```

运行中的主程序容器使用：

```text
python -m uvicorn api.main:app ...
```

因此下面两种方式是不同的：

### Docker 模式（当前推荐）

```text
Docker 容器内部安装 Python 和项目依赖
宿主机只需要 WSL、Docker Engine 和 Docker Compose
```

### 本地 Python 模式（学习源码时可选）

```text
需要 Python、venv、pip install -r requirements.txt
```

本地 `.venv` 文件夹存在，并不代表 Docker 启动必须激活它。

---

## 8. 为什么当前页面看起来很干瘪？为什么没有小熊饼干图片？

这是正常现象，原因是当前打开的是：

```text
FastAPI 自动生成的 Swagger API 调试页面
```

它不是企业产品前端，也不是聊天工作台。Swagger 的目标是：

- 展示 API 接口；
- 展示请求参数和返回结构；
- 让开发者点击 `Try it out` 调试接口。

所以它通常只有接口分组、折叠面板、JSON 请求和响应，不会自动提供：

- 企业级侧边栏；
- 客服聊天窗口；
- Agent 状态卡片；
- 会话列表；
- 数据监控大屏；
- 品牌插画；
- 小熊饼干形象。

仓库中的 `frontend/` 是一个独立的 Vue 3 + Vite 调试控制台，提供对话调试、健康检查、监控摘要和知识库管理界面。它需要单独启动：

```bash
cd '/mnt/d/Workspace/Engram/frontend'
npm install
npm run dev          # http://localhost:5173
```

后端本身（`backend/`）只提供 API，不含页面；`requirements.txt` 里也没有 Streamlit、Gradio 这类可视化框架。

### 小熊饼干为什么没有显示？

`api/main.py` 中的说明是“启动时打印小熊饼干图案”。这表示它会打印到：

```bash
sudo docker compose logs engram
```

或者容器启动日志中，而不是显示在浏览器 Swagger 页面。

此外，源码中的 ASCII 图案目前存在字符编码显示异常的迹象，在某些终端里可能变成乱码。它也不是一张真正的 PNG/JPG 图片，而是终端文字图案，因此不会自动出现在网页里。

如果要让小熊饼干出现在页面上，把图片或 SVG 放到 `frontend/` 的静态资源目录，再由前端通过 `/chat` 调用后端即可。

---

## 9. 给后续 AI 的最重要结论

1. **不要因为 Windows PowerShell 找不到 `docker` 就判断 Docker 没安装。** 这个项目的 Docker 在 WSL Ubuntu 内。
2. 先执行 `wsl`，进入 Ubuntu，再执行 `docker` 命令。
3. 当前项目使用 Docker Compose，主程序服务名是 `engram`，容器名是 `engram-app`。
4. 后端代码路径是 `/mnt/d/Workspace/Engram/backend`，`docker compose` 必须在这一层执行。
5. 项目启动命令是：

   ```bash
   sudo service docker start
   cd '/mnt/d/Workspace/Engram/backend'
   sudo docker compose up -d
   ```

6. 浏览器调试地址是：

   ```text
   http://localhost:8000/docs
   ```

7. `/docs` 是 Swagger 调试页，不是企业 Agent 前端；页面简洁、没有小熊图片属于当前项目形态，不代表项目没跑起来。
8. 判断项目是否真正运行，优先看：

   ```bash
   sudo docker compose ps
   ```

   以及浏览器中的：

   ```text
   GET /health → 200
   POST /chat → 返回 Agent 回复
   ```

