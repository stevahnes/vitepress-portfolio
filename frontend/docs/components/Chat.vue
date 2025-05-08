<script lang="ts" setup>
import { ref, reactive, nextTick, onMounted, watch, computed } from 'vue';
import { marked } from 'marked'; // Import marked for Markdown parsing
import { useData } from 'vitepress'; // Import useData to access the theme

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
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
  { role: 'assistant', content: 'Hi! What would you like to learn about Steve today?', timestamp: Date.now() },
]);
const loading = ref<boolean>(false);
const isDragging = ref<boolean>(false);
const startY = ref<number>(0);
const startHeight = ref<number>(0);
const chatHeight = ref<number>(400); // Default height in pixels

const inputRef = ref<HTMLInputElement | null>(null);
const chatContainerRef = ref<HTMLDivElement | null>(null);
const chatWindowRef = ref<HTMLDivElement | null>(null);

// Get VitePress theme data
const { isDark } = useData();

// CSS variables for theme-dependent styling
const cssVars = computed(() => {
  return {
    '--scrollbar-thumb': isDark.value ? '#4a5568' : '#cbd5e0',
    '--scrollbar-thumb-hover': isDark.value ? '#2d3748' : '#a0aec0',
    '--scrollbar-track': isDark.value ? '#1a202c' : '#edf2f7',
    '--code-bg-color': isDark.value ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
    '--link-color': isDark.value ? '#90cdf4' : '#3182ce',
    '--blockquote-border-color': isDark.value ? '#4a5568' : '#cbd5e0',
  };
});

// Function to format timestamp
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Properly define setLoading function that was missing
const setLoading = (value: boolean) => {
  loading.value = value;
};

// Function to parse markdown
const parseMarkdown = (content: string): string => {
  return marked.parse(content);
};

const scrollToBottom = async () => {
  await nextTick(); // Wait for the DOM to update
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
  }
};

// Resize handlers
const startResize = (e: MouseEvent) => {
  e.preventDefault();
  isDragging.value = true;
  startY.value = e.clientY;
  startHeight.value = chatHeight.value;
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
};

const handleResize = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const deltaY = e.clientY - startY.value;
  const newHeight = Math.max(200, startHeight.value + deltaY); // Minimum height of 200px
  chatHeight.value = newHeight;
};

const stopResize = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);

  // Save the chat height to localStorage for persistence
  localStorage.setItem('chatHeight', chatHeight.value.toString());
};

const sendMessage = async () => {
  if (!userInput.value.trim()) return;

  const userMessage: Message = {
    role: 'user',
    content: userInput.value,
    timestamp: Date.now()
  };
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
              const assistantMessage: Message = {
                role: 'assistant',
                content: '',
                timestamp: Date.now()
              };
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
      messages.value.push({
        role: 'assistant',
        content: '[Error receiving response]',
        timestamp: Date.now()
      });
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
  // Set initial height based on default or previously stored value
  if (chatWindowRef.value) {
    chatHeight.value = localStorage.getItem('chatHeight')
      ? parseInt(localStorage.getItem('chatHeight') || '400')
      : 400;
  }

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
  { deep: true } // Fix 5: Add deep watching to detect content changes
);
</script>

<template>
  <div ref="chatWindowRef" :style="{ height: `${chatHeight}px`, ...cssVars }" :class="[
    'flex w-full flex-col rounded-lg !p-4 !shadow-lg relative',
    isDark
      ? '!border !border-gray-700 !bg-gray-900'
      : '!border !border-gray-200 !bg-gray-50'
  ]">
    <!-- Header with title -->
    <div :class="[
      '!mb-4 !pb-3 flex items-center',
      isDark ? '!border-b !border-gray-700' : '!border-b !border-gray-200'
    ]">
      <div class="!h-3 !w-3 !rounded-full !bg-green-500 !mr-2"></div>
      <h3 :class="isDark ? '!text-gray-100 !font-medium' : '!text-gray-800 !font-medium'">Chat with Advocado 🥑</h3>
    </div>

    <div ref="chatContainerRef" class="flex-1 !overflow-auto !space-y-4 flex flex-col !px-1">
      <!-- Message container with improved styling to match website -->
      <div v-for="(msg, index) in messages" :key="index" class="flex w-full !mb-3" :class="[
        msg.role === 'user' ? '!justify-end' : '!justify-start'
      ]">
        <!-- Only show message bubble if there's content -->
        <div v-if="msg.content.trim().length > 0" :class="[
          '!rounded-lg !px-4 !py-3 !max-w-[85%] !shadow-md',
          msg.role === 'user'
            ? '!bg-indigo-600 !text-white'
            : isDark
              ? '!bg-gray-800 !text-gray-100 !border !border-gray-700'
              : '!bg-white !text-gray-800 !border !border-gray-200',
        ]">
          <div class="!flex !justify-between !items-center !mb-1">
            <span :class="[
              '!text-xs',
              msg.role === 'user'
                ? '!text-gray-200'
                : isDark ? '!text-gray-400' : '!text-gray-500'
            ]">{{ msg.role === 'user' ? 'You' : 'Advocado' }}</span>
            <span v-if="msg.timestamp" :class="[
              '!text-xs !ml-4',
              msg.role === 'user'
                ? '!text-gray-200'
                : isDark ? '!text-gray-400' : '!text-gray-500'
            ]">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <!-- Use v-html with markdown parsing for rendering formatted text -->
          <div class="!whitespace-pre-wrap markdown-content" v-html="parseMarkdown(msg.content)"></div>
        </div>
      </div>

      <!-- Typing indicator with improved styling and fixed spacing -->
      <div v-if="loading" class="flex !justify-start !w-full">
        <div :class="[
          '!rounded-lg !px-4 !py-3 !max-w-[85%] !shadow-md',
          isDark
            ? '!bg-gray-800 !text-gray-300 !border !border-gray-700'
            : '!bg-white !text-gray-600 !border !border-gray-200'
        ]">
          <div class="!flex !justify-between !items-center !mb-1">
            <span :class="isDark ? '!text-xs !text-gray-400' : '!text-xs !text-gray-500'">Advocado</span>
            <span :class="isDark ? '!text-xs !text-gray-400 !ml-4' : '!text-xs !text-gray-500 !ml-4'">{{
              formatTime(Date.now()) }}</span>
          </div>
          <div class="!flex !items-center">
            <span :class="[
              '!inline-block !h-2 !w-2 !rounded-full !mr-1 !animate-pulse',
              isDark ? '!bg-gray-400' : '!bg-gray-300'
            ]"></span>
            <span :class="[
              '!inline-block !h-2 !w-2 !rounded-full !mx-1 !animate-pulse',
              isDark ? '!bg-gray-400' : '!bg-gray-300'
            ]" style="animation-delay: 0.2s"></span>
            <span :class="[
              '!inline-block !h-2 !w-2 !rounded-full !ml-1 !animate-pulse',
              isDark ? '!bg-gray-400' : '!bg-gray-300'
            ]" style="animation-delay: 0.4s"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Resize handle -->
    <div
      class="!h-2 !w-full !cursor-ns-resize !flex !justify-center !items-center hover:!bg-gray-300 dark:hover:!bg-gray-700 !transition-colors !rounded-b-lg"
      @mousedown="startResize">
      <div :class="['!w-12 !h-1 !rounded-full', isDark ? '!bg-gray-600' : '!bg-gray-300']"></div>
    </div>

    <form @submit.prevent="sendMessage" :class="[
      '!mt-4 flex !rounded-lg !overflow-hidden !shadow-md',
      isDark
        ? '!bg-gray-800 !border !border-gray-700'
        : '!bg-gray-100 !border !border-gray-200'
    ]">
      <input ref="inputRef" v-model="userInput" type="text" placeholder="Ask something about Steve..." :class="[
        'flex-1 !border-0 !p-3 !outline-none !focus:ring-0 !focus:ring-offset-0',
        isDark
          ? '!bg-gray-800 !text-gray-100 !placeholder-gray-500'
          : '!bg-gray-100 !text-gray-800 !placeholder-gray-400'
      ]" :disabled="loading" />
      <button type="submit"
        class="!bg-indigo-600 !hover:bg-indigo-700 !text-white !px-4 !transition-colors !duration-200 !ease-in-out !flex !items-center !justify-center !min-w-[60px]"
        :disabled="loading">
        <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="!h-5 !w-5" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <div v-else class="!h-5 !w-5 !border-2 !border-t-transparent !border-white !rounded-full !animate-spin"></div>
      </button>
    </form>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

/* Force important on all style rules to override VitePress */
.flex {
  display: flex !important;
}

.flex-col {
  flex-direction: column !important;
}

.flex-1 {
  flex: 1 1 0% !important;
}

/* Add custom transitions for better UX */
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease !important;
}

.message-enter-from,
.message-leave-to {
  opacity: 0 !important;
  transform: translateY(20px) !important;
}

/* Add styles for the resize handle */
.resize-handle {
  cursor: ns-resize !important;
  height: 8px !important;
  width: 100% !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  transition: background-color 0.2s !important;
}

.resize-handle:hover {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.resize-handle-bar {
  width: 40px !important;
  height: 4px !important;
  border-radius: 2px !important;
  background-color: #e2e8f0 !important;
}

/* User select none to prevent text selection during resize */
.user-select-none {
  user-select: none !important;
}

/* Add styling for markdown content */
:deep(.markdown-content) {
  line-height: 1.5 !important;
}

:deep(.markdown-content p) {
  margin-bottom: 0.5rem !important;
}

:deep(.markdown-content p:last-child) {
  margin-bottom: 0 !important;
}

:deep(.markdown-content strong) {
  font-weight: bold !important;
}

:deep(.markdown-content em) {
  font-style: italic !important;
}

:deep(.markdown-content ul) {
  list-style-type: disc !important;
  margin-left: 1.5rem !important;
  margin-bottom: 0.5rem !important;
}

:deep(.markdown-content ol) {
  list-style-type: decimal !important;
  margin-left: 1.5rem !important;
  margin-bottom: 0.5rem !important;
}

:deep(.markdown-content code) {
  font-family: monospace !important;
  background-color: var(--code-bg-color) !important;
  padding: 0.1rem 0.3rem !important;
  border-radius: 0.25rem !important;
}

:deep(.markdown-content pre code) {
  display: block !important;
  padding: 0.75rem !important;
  margin-bottom: 0.5rem !important;
  overflow-x: auto !important;
}

:deep(.markdown-content a) {
  color: var(--link-color) !important;
  text-decoration: underline !important;
}

:deep(.markdown-content blockquote) {
  border-left: 3px solid var(--blockquote-border-color) !important;
  padding-left: 1rem !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  font-style: italic !important;
}
</style>