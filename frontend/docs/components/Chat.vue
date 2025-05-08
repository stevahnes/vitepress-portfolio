<script lang="ts" setup>
import { ref, reactive, nextTick, onMounted, watch } from 'vue';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  service_tier: string;
  system_fingerprint: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'user' | 'assistant';
      content?: string;
      refusal?: any;
    };
    logprobs: any;
    finish_reason: string | null;
  }>;
  usage: any;
}

const userInput = ref<string>('');
const messages = ref<Message[]>([
  { role: 'assistant', content: 'Hi! What would you like to learn about Steve today?' },
]);
const loading = ref<boolean>(false);

const inputRef = ref<HTMLInputElement | null>(null);
const chatContainerRef = ref<HTMLDivElement | null>(null);

// Properly define setLoading function that was missing
const setLoading = (value: boolean) => {
  loading.value = value;
};

const scrollToBottom = async () => {
  await nextTick(); // Wait for the DOM to update
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
  }
};

const sendMessage = async () => {
  if (!userInput.value.trim()) return;

  const userMessage: Message = { role: 'user', content: userInput.value };
  messages.value.push(userMessage);

  // Don't add an empty assistant message immediately - will add it when we get content
  let currentAssistantContent = '';
  let assistantMessageAdded = false;

  setLoading(true);

  try {
    const threadId = localStorage.getItem('threadId') ?? null;

    const response = await fetch('https://advocado-agent.vercel.app/chat', {
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
            role: 'user',
            content: userInput.value,
          },
        ],
      }),
    });

    if (!response.body) throw new Error('No response body');

    if (response.headers.get('lb-thread-id')) {
      localStorage.setItem('threadId', response.headers.get('lb-thread-id') as string);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed: ChatChunk = JSON.parse(line);
          const delta = parsed.choices[0]?.delta;
          if (delta?.content) {
            // Add assistant message only when we receive the first content
            if (!assistantMessageAdded) {
              const assistantMessage: Message = { role: 'assistant', content: '' };
              messages.value.push(assistantMessage);
              assistantMessageAdded = true;
            }

            currentAssistantContent += delta.content;
            // Update the last message in the array
            messages.value[messages.value.length - 1].content = currentAssistantContent;
            // Force a reactive update by creating a new array reference
            messages.value = [...messages.value];
            await scrollToBottom(); // Scroll on each content update
          }
        } catch (parseError) {
          console.error('Error parsing line:', line, parseError);
        }
      }
    }
  } catch (error) {
    console.error('Error during streaming:', error);

    // Only add error message if we haven't added any assistant message yet
    if (!assistantMessageAdded) {
      messages.value.push({ role: 'assistant', content: '[Error receiving response]' });
    } else if (currentAssistantContent.trim() === '') {
      // If we've added a message but it's empty, add error content
      messages.value[messages.value.length - 1].content = '[Error receiving response]';
    }

  } finally {
    setLoading(false);
    userInput.value = '';
    if (inputRef.value) {
      inputRef.value.focus();
    }
    await scrollToBottom(); // Ensure final scroll after all processing
  }
};

onMounted(() => {
  scrollToBottom(); // Scroll to bottom on initial load
  if (inputRef.value) {
    inputRef.value.focus();
  }
});

watch(
  messages,
  () => {
    scrollToBottom();
  },
  { deep: true } // Add deep watching to detect content changes
);
</script>

<template>
  <div class="flex h-[80vh] md:h-[40vh] w-full flex-col rounded-lg border border-gray-700 p-4">
    <div ref="chatContainerRef" class="flex-1 overflow-auto space-y-4 flex flex-col">
      <!-- Message container with fixed styling -->
      <div v-for="(msg, index) in messages" :key="index" class="flex" :class="[
        msg.role === 'user' ? 'justify-end' : 'justify-start'
      ]">
        <!-- Only show message bubble if there's content -->
        <div v-if="msg.content.trim().length > 0" :class="[
          'rounded-lg px-4 py-3 max-w-[80%]',
          msg.role === 'user'
            ? 'bg-blue-500 text-white dark:bg-blue-400 dark:text-gray-900'
            : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
        ]">
          {{ msg.content }}
        </div>
      </div>
      <!-- Typing indicator outside the message loop -->
      <div v-if="loading" class="flex justify-start">
        <div
          class="bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-3 max-w-[80%] animate-pulse">
          Typing...
        </div>
      </div>
    </div>

    <form @submit.prevent="sendMessage" class="mt-4 flex">
      <input ref="inputRef" v-model="userInput" type="text" placeholder="What would you like to ask about Steve?"
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