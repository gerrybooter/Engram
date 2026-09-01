const DEFAULT_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || '/api/python'
const STORAGE_KEY = 'engram.frontend.settings'

export function createInitialSettings() {
  const saved = readSettings()
  return {
    userId: saved.userId || 'u1001',
    conversationId: saved.conversationId || '',
    endpoint: saved.endpoint || DEFAULT_BASE_URL
  }
}

export function saveSettings(settings) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      userId: settings.userId,
      conversationId: settings.conversationId,
      endpoint: settings.endpoint
    })
  )
}

export function baseUrl(settings) {
  return normalizeBaseUrl(settings.endpoint || DEFAULT_BASE_URL)
}

export function docsUrl(settings) {
  return `${baseUrl(settings)}/docs`
}

export async function requestHealth(settings) {
  return requestJson(settings, '/health')
}

export async function requestMonitor(settings) {
  return requestJson(settings, '/monitor')
}

export async function requestKnowledgeStats(settings) {
  return requestJson(settings, '/knowledge/stats')
}

export async function requestSearch(settings, query, topK = 5) {
  // 后端 /search 用的是 snake_case 查询参数（api/main.py: search(query, top_k)），
  // 早先前端传的是 topK，会被静默忽略、永远退回默认 5 条。
  const params = new URLSearchParams({ query, top_k: String(topK) })
  return requestJson(settings, `/search?${params}`, { method: 'POST' })
}

export async function requestChat(settings, message) {
  const raw = await requestJson(settings, '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      user_id: settings.userId || 'anonymous',
      conv_id: settings.conversationId || undefined
    })
  })
  return normalizeChatResponse(raw)
}

export async function addKnowledge(settings, documents) {
  return requestJson(settings, '/knowledge/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documents })
  })
}

export async function uploadKnowledge(settings, file) {
  const form = new FormData()
  form.append('file', file)
  return requestJson(settings, '/knowledge/upload', { method: 'POST', body: form })
}

/**
 * 后端 ChatResponse 的字段远多于界面早先用到的 4 个。
 * 这里全部接住：客服视图只挑其中几个渲染，控制台展示完整链路。
 */
function normalizeChatResponse(raw) {
  return {
    conversationId: raw.conv_id || raw.conversation_id || raw.conversationId || '',
    response: raw.response || '',
    intent: raw.intent || 'other',
    intentGroup: raw.intent_group || 'other',
    intentConfidence: Number(raw.intent_confidence ?? 0),
    intentSourceScores: raw.intent_source_scores || {},
    entities: raw.entities || {},
    agentType: raw.agent_type || '',
    agentTypes: raw.agent_types || [],
    primaryAgent: raw.primary_agent || raw.agent_type || '',
    supportingAgents: raw.supporting_agents || [],
    routingReason: raw.routing_reason || '',
    routingConfidence: Number(raw.routing_confidence ?? 0),
    escalated: Boolean(raw.escalated),
    latencyMs: Number(raw.latency_ms ?? raw.latencyMs ?? 0),
    knowledgeUsed: Boolean(raw.knowledge_used ?? raw.knowledgeUsed),
    raw
  }
}

async function requestJson(settings, path, options = {}) {
  const url = `${baseUrl(settings)}${path}`

  let response
  try {
    response = await fetch(url, options)
  } catch (cause) {
    // fetch 只有在网络层失败时才 reject，这时 message 通常是 "Failed to fetch"，
    // 对用户毫无信息量，换成能指导下一步的说法。
    throw new ApiError('无法连接到服务，请确认后端已启动', { url, detail: String(cause) })
  }

  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    throw new ApiError(friendlyStatusMessage(response.status), {
      url,
      status: response.status,
      detail: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    })
  }
  return data
}

/** 带技术详情的错误：界面展示 message，详情折叠在「查看详情」里。 */
export class ApiError extends Error {
  constructor(message, { url, status, detail } = {}) {
    super(message)
    this.name = 'ApiError'
    this.url = url
    this.status = status
    this.detail = detail
  }

  get technicalText() {
    return [this.status ? `HTTP ${this.status}` : null, this.url, this.detail]
      .filter(Boolean)
      .join('\n')
  }
}

function friendlyStatusMessage(status) {
  if (status === 503) return '服务正在启动中，请稍候重试'
  if (status === 413) return '文件太大了，请控制在 10MB 以内'
  if (status === 404) return '接口不存在，请检查后端地址是否填对'
  if (status >= 500) return '服务处理出错了，请稍后再试'
  if (status >= 400) return '请求没有被接受，请检查输入内容'
  return '请求失败'
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '')
}

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}
