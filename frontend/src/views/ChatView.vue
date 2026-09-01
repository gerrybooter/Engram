<template>
  <div class="chat-view">
    <header class="chat-header">
      <div class="chat-identity">
        <div class="avatar avatar-brand">EN</div>
        <div>
          <h1>Engram 在线客服</h1>
          <p class="chat-status">
            <span :class="['dot', online ? 'dot-online' : 'dot-offline']"></span>
            {{ online ? '客服在线，随时为你服务' : '服务连接中断' }}
          </p>
        </div>
      </div>
      <button v-if="messages.length" class="btn-ghost" type="button" @click="resetConversation">
        重新开始
      </button>
    </header>

    <div ref="scroller" class="chat-scroll">
      <div v-if="!messages.length" class="welcome">
        <div class="avatar avatar-brand avatar-lg">EN</div>
        <h2>你好，有什么可以帮你？</h2>
        <p>描述你遇到的问题，我会帮你查询订单、处理退款或解决使用故障。</p>
        <div class="suggestions">
          <button
            v-for="item in SUGGESTIONS"
            :key="item"
            class="suggestion"
            type="button"
            @click="send(item)"
          >
            {{ item }}
          </button>
        </div>
      </div>

      <div v-for="item in messages" :key="item.id" :class="['row', `row-${item.role}`]">
        <div v-if="item.role === 'assistant'" class="avatar avatar-brand avatar-sm">EN</div>

        <div class="bubble-group">
          <div :class="['bubble', `bubble-${item.role}`, item.error ? 'bubble-error' : '']">
            <p>{{ item.content }}</p>

            <details v-if="item.errorDetail" class="error-detail">
              <summary>查看技术详情</summary>
              <pre>{{ item.errorDetail }}</pre>
            </details>
          </div>

          <p v-if="item.footnote?.length" class="footnote">
            <span v-for="(part, index) in item.footnote" :key="part">
              <template v-if="index > 0"> · </template>{{ part }}
            </span>
          </p>

          <div v-if="item.escalated" class="handoff">
            已为你转接人工客服，稍后会有专员跟进这个问题。
          </div>
        </div>
      </div>

      <div v-if="busy" class="row row-assistant">
        <div class="avatar avatar-brand avatar-sm">EN</div>
        <div class="bubble bubble-assistant typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <form class="composer" @submit.prevent="send()">
      <textarea
        ref="input"
        v-model="draft"
        rows="1"
        placeholder="输入你的问题，按 Enter 发送"
        @keydown.enter.exact.prevent="send()"
        @input="autoGrow"
      ></textarea>
      <button class="btn-send" type="submit" :disabled="busy || !draft.trim()">发送</button>
    </form>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { ApiError, requestChat } from '../lib/backends'
import { replyFootnote } from '../lib/labels'

const props = defineProps({
  settings: { type: Object, required: true },
  online: { type: Boolean, default: false }
})
const emit = defineEmits(['reply'])

const SUGGESTIONS = [
  '我要申请退款，订单号 #A10241',
  '下单三天了还没发货',
  '登录时一直提示验证码错误',
  '怎么开发票？'
]

const messages = ref([])
const draft = ref('')
const busy = ref(false)
const scroller = ref(null)
const input = ref(null)

watch(messages, scrollToBottom, { deep: true })
watch(busy, scrollToBottom)

async function send(preset) {
  const content = (preset ?? draft.value).trim()
  if (!content || busy.value) return

  messages.value.push({ id: crypto.randomUUID(), role: 'user', content })
  draft.value = ''
  resetInputHeight()
  busy.value = true

  try {
    const reply = await requestChat(props.settings, content)

    // 首轮由后端生成 conv_id，记下来后续对话才能延续同一份记忆。
    if (reply.conversationId && !props.settings.conversationId) {
      props.settings.conversationId = reply.conversationId
    }

    messages.value.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: reply.response,
      footnote: replyFootnote(reply),
      escalated: reply.escalated
    })
    emit('reply', reply)
  } catch (error) {
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: error.message,
      error: true,
      errorDetail: error instanceof ApiError ? error.technicalText : String(error)
    })
  } finally {
    busy.value = false
  }
}

function resetConversation() {
  messages.value = []
  props.settings.conversationId = ''
}

function autoGrow() {
  const el = input.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

function resetInputHeight() {
  if (input.value) input.value.style.height = 'auto'
}

async function scrollToBottom() {
  await nextTick()
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' })
}
</script>
