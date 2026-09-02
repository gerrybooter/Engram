<template>
  <div class="console-view">
    <div class="console-grid">
      <section class="card">
        <header class="card-head">
          <h2>连接设置</h2>
          <span class="tag">Python API</span>
        </header>
        <label class="field">
          <span>后端地址</span>
          <input v-model="settings.endpoint" placeholder="/api/python" @change="persist" />
        </label>
        <label class="field">
          <span>用户 ID</span>
          <input v-model="settings.userId" placeholder="u1001" @change="persist" />
        </label>
        <label class="field">
          <span>会话 ID</span>
          <input v-model="settings.conversationId" placeholder="首轮对话后自动生成" @change="persist" />
        </label>
        <div class="row-actions">
          <button type="button" @click="refreshAll">刷新状态</button>
          <a class="btn-link" :href="docs" target="_blank" rel="noreferrer">API 文档</a>
        </div>
      </section>

      <section class="card">
        <header class="card-head">
          <h2>服务状态</h2>
          <span :class="['dot', online ? 'dot-online' : 'dot-offline']"></span>
        </header>
        <dl class="stat-list">
          <div><dt>健康检查</dt><dd :class="online ? 'ok' : 'muted'">{{ healthLabel }}</dd></div>
          <div><dt>知识片段</dt><dd>{{ knowledgeCount }}</dd></div>
          <div><dt>当前会话</dt><dd class="mono">{{ settings.conversationId || '未开始' }}</dd></div>
        </dl>
        <details v-if="monitorText" class="raw">
          <summary>监控摘要原文</summary>
          <pre>{{ monitorText }}</pre>
        </details>
      </section>

      <section class="card card-wide">
        <header class="card-head">
          <h2>最近一轮链路</h2>
          <span class="tag">Trace</span>
        </header>

        <p v-if="!reply" class="hint">
          在「在线客服」里发一条消息，这里会展示这轮的意图识别、Agent 路由与 RAG 命中详情。
        </p>

        <div v-else class="trace">
          <div class="trace-step">
            <h3>意图识别</h3>
            <p class="trace-main">
              {{ intentLabel(reply.intent) }}
              <code>{{ reply.intent }}</code>
              <span class="tag soft">置信度 {{ toPercent(reply.intentConfidence) }}</span>
            </p>
            <div v-if="sourceScores.length" class="scores">
              <div v-for="score in sourceScores" :key="score.key" class="score">
                <span>{{ intentSourceLabel(score.key) }}</span>
                <div class="bar"><i :style="{ width: `${Math.min(score.value * 100, 100)}%` }"></i></div>
                <b>{{ toPercent(score.value) }}</b>
              </div>
            </div>
            <p v-if="reply.embeddingProvider" class="trace-sub">
              向量来源：{{ embeddingProviderLabel(reply.embeddingProvider) }}
              <span v-if="isEmbeddingDegraded(reply.embeddingProvider)" class="tag warn-tag">已降级</span>
            </p>
          </div>

          <div class="trace-step">
            <h3>Agent 路由</h3>
            <p class="trace-main">
              {{ agentLabel(reply.primaryAgent) }}
              <code>{{ reply.primaryAgent }}</code>
              <span class="tag soft">置信度 {{ toPercent(reply.routingConfidence) }}</span>
            </p>
            <p v-if="reply.supportingAgents.length" class="trace-sub">
              协作 Agent：{{ reply.supportingAgents.map(agentLabel).join('、') }}
            </p>
            <p v-if="reply.routingReason" class="trace-sub">路由依据：{{ reply.routingReason }}</p>
          </div>

          <div class="trace-step">
            <h3>知识检索</h3>
            <p class="trace-main">{{ reply.knowledgeUsed ? '命中知识库，已注入上下文' : '本轮未触发 RAG' }}</p>
            <p class="trace-sub">端到端耗时 {{ formatLatency(reply.latencyMs) || '-' }}</p>
            <p v-if="reply.escalated" class="trace-sub warn">已标记转人工</p>
          </div>

          <div v-if="entities.length" class="trace-step">
            <h3>抽取实体</h3>
            <p v-for="entity in entities" :key="entity.key" class="trace-sub">
              {{ entity.label }}：<code v-for="v in entity.values" :key="v">{{ v }}</code>
            </p>
          </div>
        </div>

        <details v-if="reply" class="raw">
          <summary>完整响应 JSON</summary>
          <pre>{{ JSON.stringify(reply.raw, null, 2) }}</pre>
        </details>
      </section>

      <section class="card">
        <header class="card-head">
          <h2>知识库检索</h2>
          <span class="tag soft">RAG</span>
        </header>
        <div class="inline-form">
          <input v-model="searchQuery" placeholder="退款多久能到账" @keydown.enter.prevent="search" />
          <button type="button" :disabled="busy || !searchQuery.trim()" @click="search">检索</button>
        </div>
        <p v-if="searchError" class="hint warn">{{ searchError }}</p>
        <p v-else-if="searched && !searchResults.length" class="hint">没有检索到匹配的片段。</p>
        <div class="results">
          <article v-for="(item, index) in searchResults" :key="item.id || index" class="result">
            <strong>{{ item.title || '未命名片段' }}</strong>
            <span class="score-tag">相似度 {{ item.score ?? '-' }}</span>
            <p>{{ item.content }}</p>
          </article>
        </div>
      </section>

      <section class="card">
        <header class="card-head">
          <h2>导入知识</h2>
          <span class="tag soft">Docs</span>
        </header>
        <label class="field">
          <span>标题</span>
          <input v-model="docTitle" placeholder="退款补充政策" />
        </label>
        <label class="field">
          <span>内容</span>
          <textarea v-model="docContent" rows="4" placeholder="输入知识库内容"></textarea>
        </label>
        <div class="row-actions">
          <button type="button" :disabled="busy || !docTitle.trim() || !docContent.trim()" @click="submitDoc">
            添加文档
          </button>
          <label class="btn-file">
            上传文件
            <input type="file" accept=".txt,.md,.json" @change="upload" />
          </label>
        </div>
        <p v-if="importMessage" :class="['hint', importFailed ? 'warn' : 'ok']">{{ importMessage }}</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  addKnowledge,
  docsUrl,
  requestKnowledgeStats,
  requestMonitor,
  requestSearch,
  saveSettings,
  uploadKnowledge
} from '../lib/backends'
import {
  agentLabel,
  embeddingProviderLabel,
  formatLatency,
  intentLabel,
  intentSourceLabel,
  isEmbeddingDegraded,
  nonEmptyEntities,
  toPercent
} from '../lib/labels'

const props = defineProps({
  settings: { type: Object, required: true },
  online: { type: Boolean, default: false },
  healthLabel: { type: String, default: '未检查' },
  reply: { type: Object, default: null }
})
const emit = defineEmits(['check-health'])

const knowledgeCount = ref('-')
const monitorText = ref('')
const busy = ref(false)
const searchQuery = ref('退款多久能到账')
const searchResults = ref([])
const searched = ref(false)
const searchError = ref('')
const docTitle = ref('')
const docContent = ref('')
const importMessage = ref('')
const importFailed = ref(false)

const docs = computed(() => docsUrl(props.settings))
const entities = computed(() => nonEmptyEntities(props.reply?.entities))
const sourceScores = computed(() =>
  Object.entries(props.reply?.intentSourceScores || {}).map(([key, value]) => ({
    key,
    value: Number(value) || 0
  }))
)

onMounted(loadStats)

function persist() {
  saveSettings(props.settings)
}

async function refreshAll() {
  emit('check-health')
  await loadStats()
}

async function loadStats() {
  const [stats, monitor] = await Promise.allSettled([
    requestKnowledgeStats(props.settings),
    requestMonitor(props.settings)
  ])
  if (stats.status === 'fulfilled') {
    knowledgeCount.value = stats.value?.total_chunks ?? stats.value?.totalChunks ?? '-'
  }
  monitorText.value =
    monitor.status === 'fulfilled'
      ? JSON.stringify(monitor.value, null, 2)
      : monitor.reason?.message || ''
}

async function search() {
  if (!searchQuery.value.trim()) return
  busy.value = true
  searchError.value = ''
  try {
    const data = await requestSearch(props.settings, searchQuery.value, 5)
    searchResults.value = data?.results || []
  } catch (error) {
    searchResults.value = []
    searchError.value = error.message
  } finally {
    searched.value = true
    busy.value = false
  }
}

async function submitDoc() {
  await runImport(() =>
    addKnowledge(props.settings, [{ title: docTitle.value.trim(), content: docContent.value.trim() }])
  )
  if (!importFailed.value) {
    docTitle.value = ''
    docContent.value = ''
  }
}

async function upload(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  await runImport(() => uploadKnowledge(props.settings, file))
}

async function runImport(action) {
  busy.value = true
  importMessage.value = ''
  try {
    const data = await action()
    importMessage.value = data?.message || '导入成功'
    importFailed.value = false
    await loadStats()
  } catch (error) {
    importMessage.value = error.message
    importFailed.value = true
  } finally {
    busy.value = false
  }
}
</script>
