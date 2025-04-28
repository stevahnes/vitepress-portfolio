<script lang="ts" setup>
import { ref, nextTick } from 'vue'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatChunk {
  id: string
  object: string
  created: number
  model: string
  service_tier: string
  system_fingerprint: string
  choices: Array<{
    index: number
    delta: {
      role?: 'user' | 'assistant'
      content?: string
      refusal?: any
    }
    logprobs: any
    finish_reason: string | null
  }>
  usage: any
}

const userInput = ref<string>('')
const messages = ref<Message[]>([])
const loading = ref<boolean>(false)

const inputRef = ref<HTMLInputElement | null>(null)
const chatContainerRef = ref<HTMLDivElement | null>(null)

const scrollToBottom = () => {
  nextTick(() => {
    chatContainerRef.value?.scrollTo({
      top: chatContainerRef.value.scrollHeight,
      behavior: 'smooth',
    })
  })
}

const sendMessage = async () => {
  if (!userInput.value.trim()) return

  messages.value.push({ role: 'user', content: userInput.value })
  const assistantMessage: Message = { role: 'assistant', content: '' }
  messages.value.push(assistantMessage)

  loading.value = true

  try {
    const threadId = localStorage.getItem("threadId") ?? null;

    const response = await fetch('http://advocado-agent.vercel.app/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stream: true,
        rawResponse: true,
        threadId: threadId,
        messages: [
          {
            role: "user",
            content: userInput.value,
          },
        ],
      }),
    })

    if (!response.body) throw new Error('No response body')

    if (response.headers.get("lb-thread-id")) {
      localStorage.setItem("threadId", response.headers.get("lb-thread-id") as string)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')

      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        const parsed: ChatChunk = JSON.parse(line)

        const delta = parsed.choices[0]?.delta
        if (delta?.content) {
          assistantMessage.content += delta.content
          scrollToBottom()
        }
      }
    }
  } catch (error) {
    console.error('Error during streaming:', error)
    assistantMessage.content += '\n[Error receiving response]'
    scrollToBottom()
  } finally {
    loading.value = false
    userInput.value = ''
    inputRef.value?.focus()
  }
}
</script>

<template>
  <div class="flex h-[85vh] md:h-[40vh] w-full flex-col rounded-lg border-solid border-1 border-gray-700 p-4">
    <div ref="chatContainerRef" class="flex-1 overflow-auto space-y-4">
      <div v-for="(msg, index) in messages" :key="index" :class="[
        'rounded-lg px-4 py-3 max-w-[80%]',
        msg.role === 'user'
          ? 'self-end bg-blue-500 text-white dark:bg-blue-400 dark:text-gray-900'
          : 'self-start bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
      ]">
        {{ msg.content }}
      </div>
    </div>

    <form @submit.prevent="sendMessage" class="mt-4 flex">
      <input ref="inputRef" v-model="userInput" type="text" placeholder="Type your question here ..."
        class="flex-1 rounded-l-md border border-gray-300 dark:border-gray-600 p-2 dark:bg-gray-800 dark:text-gray-100"
        :disabled="loading" />
      <button type="submit"
        class="bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-gray-900 rounded-r-md px-4"
        :disabled="loading">
        {{ loading ? '⏳' : 'Send' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
