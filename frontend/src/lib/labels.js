// 后端返回的是内部枚举（billing / knowledge_used / escalated ...）。
// 终端用户界面不该出现这些词，这里统一翻译成人话。
// 控制台视图仍会显示原始值，方便排查。

const AGENT_LABELS = {
  general: '在线客服',
  technical: '技术支持',
  billing: '账单专员',
  escalation: '人工坐席'
}

const INTENT_LABELS = {
  query: '信息查询',
  complaint: '投诉',
  request: '业务办理',
  greeting: '打招呼',
  escalation: '要求转人工',
  technical: '技术问题',
  billing: '账单问题',
  account: '账户管理',
  feedback: '反馈',
  order_status: '订单状态',
  logistics: '物流配送',
  refund: '退款退货',
  invoice: '发票',
  payment_issue: '支付异常',
  account_security: '账户安全',
  technical_login: '登录故障',
  technical_crash: '程序报错',
  human_handoff: '转人工',
  other: '其他'
}

const ENTITY_LABELS = {
  order_id: '订单号',
  product: '商品',
  date: '日期',
  amount: '金额',
  error_code: '错误码'
}

// 键名来自后端 IntentRecognizer 的 source_scores，实测为 pattern / embedding / llm。
const INTENT_SOURCE_LABELS = {
  pattern: '规则匹配',
  rule: '规则匹配',
  embedding: '向量相似',
  llm: '大模型判定'
}

export function agentLabel(value) {
  return AGENT_LABELS[value] || value || '在线客服'
}

export function intentLabel(value) {
  return INTENT_LABELS[value] || value || '其他'
}

export function entityLabel(key) {
  return ENTITY_LABELS[key] || key
}

export function intentSourceLabel(key) {
  return INTENT_SOURCE_LABELS[key] || key
}

/** 把毫秒渲染成用户看得懂的耗时，例如 820ms / 1.4s。 */
export function formatLatency(ms) {
  const value = Number(ms)
  if (!Number.isFinite(value) || value <= 0) return ''
  return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`
}

/**
 * 客服气泡下方那行小字。只保留用户真正关心的信息：
 * 谁在回答、有没有查资料、花了多久。
 */
export function replyFootnote(reply) {
  if (!reply) return []
  const parts = [agentLabel(reply.primaryAgent || reply.agentType)]
  if (reply.knowledgeUsed) parts.push('已查阅知识库')
  const latency = formatLatency(reply.latencyMs)
  if (latency) parts.push(latency)
  return parts
}

/** 只保留真正提取到内容的实体，避免展示一堆空数组。 */
export function nonEmptyEntities(entities) {
  return Object.entries(entities || {})
    .filter(([, values]) => Array.isArray(values) && values.length > 0)
    .map(([key, values]) => ({ key, label: entityLabel(key), values }))
}

/** 把 0.87 这类置信度转成 87%。 */
export function toPercent(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '-'
  return `${Math.round(num * 100)}%`
}
