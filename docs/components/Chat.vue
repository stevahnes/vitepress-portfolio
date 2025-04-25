<template>
  <div class="max-w-2xl mx-auto p-4 space-y-4">
    <div v-for="(msg, index) in messages" :key="index" class="bg-gray-100 p-3 rounded-md">
      <p>{{ msg.role === 'user' ? 'You' : 'AI' }}: <span>{{ msg.content }}</span></p>
    </div>

    <form @submit.prevent="handleSubmit" class="flex gap-2">
      <input
        v-model="input"
        placeholder="Ask something..."
        class="flex-1 px-4 py-2 border rounded-md"
      />
      <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md">
        Send
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const input = ref<string>('')
const messages = ref<Message[]>([])

const handleSubmit = async () => {
  const trimmed = input.value.trim()
  if (!trimmed) return

  const userMessage: Message = { role: 'user', content: trimmed }
  messages.value.push(userMessage)

  const aiMessage: Message = { role: 'assistant', content: '' }
  messages.value.push(aiMessage)

  try {
    const response = await fetch('https://api.langbase.com/v1/pipes/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: input.value,
    }),
  })

    if (!response.body) {
      aiMessage.content = '[Error: No response body]'
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      aiMessage.content += decoder.decode(value, { stream: true })
    }

    input.value = ''
  } catch (error) {
    aiMessage.content = `[Error: ${(error as Error).message}]`
  }
}
</script>