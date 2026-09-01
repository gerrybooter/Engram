<template>
  <div class="app">
    <nav class="tabs">
      <div class="tabs-inner">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          type="button"
          :class="['tab', view === tab.id ? 'tab-active' : '']"
          @click="view = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </nav>

    <ChatView
      v-show="view === 'chat'"
      :settings="settings"
      :online="online"
      @reply="lastReply = $event"
    />

    <ConsoleView
      v-if="consoleOpened"
      v-show="view === 'console'"
      :settings="settings"
      :online="online"
      :health-label="healthLabel"
      :reply="lastReply"
      @check-health="checkHealth"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import ChatView from './views/ChatView.vue'
import ConsoleView from './views/ConsoleView.vue'
import { createInitialSettings, requestHealth, saveSettings } from './lib/backends'

const TABS = [
  { id: 'chat', label: '在线客服' },
  { id: 'console', label: '控制台' }
]

const settings = reactive(createInitialSettings())
const view = ref('chat')
const online = ref(false)
const healthLabel = ref('未检查')
const lastReply = ref(null)

// 控制台首次打开才挂载，避免普通用户从没点开时也去打 /monitor、/knowledge/stats。
const consoleOpened = ref(false)
watch(view, (value) => {
  if (value === 'console') consoleOpened.value = true
})

watch(() => settings.conversationId, () => saveSettings(settings))

onMounted(checkHealth)

async function checkHealth() {
  try {
    const data = await requestHealth(settings)
    online.value = data?.status === 'ok'
    healthLabel.value = online.value ? '正常' : data?.status || '异常'
  } catch (error) {
    online.value = false
    healthLabel.value = error.message
  }
}
</script>
