# Engram

> Engram 是神经科学中指记忆在神经系统里留下的物理痕迹。这个项目的核心，就是让 Agent 拥有分层的、可检索的记忆。

Engram 是一个企业级智能客服 Agent 平台。它不是"用户问一句、模型答一句"的单轮机器人，而是把一次业务请求拆成一条可治理的工程链路：意图识别 → 记忆读取 → RAG 检索 → 多 Agent 路由 → 工具调用 → 记忆写入 → 在线监控 → 自动评测。

## 核心链路

```text
用户请求
  -> FastAPI /chat
  -> MemoryManager    读取 Redis 工作记忆 + ChromaDB 情景记忆 + 用户画像
  -> IntentRecognizer 三路融合意图识别
  -> AgentOrchestrator 路由到 General / Technical / Billing Agent
  -> ToolManager      工具调用（查询改写、重排、缓存、超时、熔断、降级）
  -> LLM 生成回复
  -> 写回 Redis，异步更新 ChromaDB 用户画像
  -> PerformanceMonitor 在线观测 + 路由降权
```

## 技术要点

**三级记忆架构** — 工作记忆放 Redis（会话内高频读写、TTL 控制），情景记忆和用户画像放 ChromaDB（跨会话语义检索）。记忆超阈值时触发压缩，避免 prompt 无限膨胀。

**多 Agent 结构化路由** — 主 Agent 负责意图判定与分派，General / Technical / Billing 三个专业 Agent 各自持有领域 prompt 与工具集；路由结果受在线监控反馈影响，表现差的路径会被降权。

**RAG 知识库** — ChromaDB 向量检索，按意图决定是否触发，支持查询改写与结果重排。

**动态 Skills** — 运行时从 `skills/` 目录加载规则并注入 prompt，无需改代码即可调整各业务线的应答策略。

**稳定性** — 工具层实现缓存、超时、熔断和 fallback，单个下游故障不会打穿整条链路。

**可观测与可评测** — Prometheus 指标暴露 + 端到端评测闭环，支持多轮对话评测与回归测试。

## 仓库结构

```text
Engram/
├── backend/                        # Python 后端
│   ├── api/main.py                 # FastAPI 入口：/chat /search /knowledge /monitor /eval
│   ├── core/intent_recognizer.py   # 三路融合意图识别
│   ├── core/skill_loader.py        # 动态 Skills 加载
│   ├── agents/                     # 多 Agent 路由编排
│   ├── memory/                     # Redis + ChromaDB 记忆管理
│   ├── mcp/tool_manager.py         # 工具调用、熔断、缓存、降级
│   ├── mcp/knowledge_base.py       # ChromaDB RAG 知识库
│   ├── monitor/                    # 在线性能监控
│   ├── evaluation/                 # 端到端评测
│   ├── skills/                     # 业务线规则（可热加载）
│   ├── docker-compose.yml          # Redis / ChromaDB / Prometheus / Nginx / App
│   └── README.md                   # 完整部署与使用指南
└── frontend/                       # Vue 3 + Vite 调试控制台
    ├── src/                        # 对话调试、健康检查、监控摘要、知识库管理
    └── README.md
```

## 快速开始

### 后端

```bash
cd backend
cp .env.example .env        # 填入 ANTHROPIC_API_KEY
docker compose up -d --build
```

启动后：

| 服务 | 地址 |
|------|------|
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| Nginx | http://localhost |
| Prometheus | http://localhost:9090 |

支持 Anthropic 兼容的第三方接口，在 `.env` 中配置 `ANTHROPIC_BASE_URL` 即可。

### 前端

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

开发模式下 Vite 会把 `/api/python` 代理到 `http://localhost:8000`。

## 详细文档

- [后端完整使用指南](backend/README.md) — 部署、API 调用、知识库、ChromaDB 数据查看、监控评测、排障
- [前端说明](frontend/README.md)
- [架构图](backend/wiki/架构图.md)
- [产品定位](backend/wiki/Engram企业智能运营协同中枢.md)
