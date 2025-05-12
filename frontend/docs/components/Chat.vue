<script lang="ts" setup>
import { ref, nextTick, onMounted, watch, computed } from 'vue';
import { marked } from 'marked';
import { useData } from 'vitepress';

// Interfaces
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

// State management
// TODO: WIP - Thread functionality is currently disabled as the get thread route is returning 404
// The following features are temporarily disabled:
// - End Chat button and functionality
// - Thread resolution
const userInput = ref('');
const messages = ref<Message[]>([]);  // Start with empty messages
const loading = ref(false);
const isInitialLoading = ref(false);
const isDragging = ref(false);
const startY = ref(0);
const startHeight = ref(0);
const chatHeight = ref(400);
const clientSideTheme = ref(false);
const isClient = ref(false);  // Add client-side detection

// DOM refs
const inputRef = ref<HTMLInputElement | null>(null);
const chatContainerRef = ref<HTMLDivElement | null>(null);
const chatWindowRef = ref<HTMLDivElement | null>(null);

// Theme handling
const { isDark } = useData();
const cssVars = computed(() => ({
  '--scrollbar-thumb': clientSideTheme.value && isDark.value ? '#4a5568' : '#cbd5e0',
  '--scrollbar-thumb-hover': clientSideTheme.value && isDark.value ? '#2d3748' : '#a0aec0',
  '--scrollbar-track': clientSideTheme.value && isDark.value ? '#1a202c' : '#edf2f7',
  '--code-bg-color': clientSideTheme.value && isDark.value ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
  '--link-color': clientSideTheme.value && isDark.value ? '#90cdf4' : '#3182ce',
  '--blockquote-border-color': clientSideTheme.value && isDark.value ? '#4a5568' : '#cbd5e0',
}));

// Utility functions
const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const parseMarkdown = (content) => marked.parse(content);

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
  }
};

// Resize functionality - now supporting both mouse and touch events
const startResize = (e) => {
  e.preventDefault();
  isDragging.value = true;

  // Handle both mouse and touch events
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
  startY.value = clientY;
  startHeight.value = chatHeight.value;

  // Add appropriate event listeners based on event type
  if (e.type.includes('touch')) {
    document.addEventListener('touchmove', handleTouchResize, { passive: false });
    document.addEventListener('touchend', stopResize);
  } else {
    document.addEventListener('mousemove', handleMouseResize);
    document.addEventListener('mouseup', stopResize);
  }
};

const handleMouseResize = (e) => {
  if (!isDragging.value) return;
  const deltaY = e.clientY - startY.value;
  chatHeight.value = Math.max(200, startHeight.value + deltaY);
};

const handleTouchResize = (e) => {
  if (!isDragging.value) return;
  e.preventDefault(); // Prevent scrolling while resizing
  const deltaY = e.touches[0].clientY - startY.value;
  chatHeight.value = Math.max(200, startHeight.value + deltaY);
};

const stopResize = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleMouseResize);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('touchmove', handleTouchResize);
  document.removeEventListener('touchend', stopResize);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('chatHeight', chatHeight.value.toString());
  }
};

// Message handling
const sendMessage = async () => {
  if (!userInput.value.trim()) return;

  // Add user message
  const userMessage: Message = {
    role: 'user',
    content: userInput.value,
    timestamp: Date.now()
  };
  messages.value.push(userMessage);

  let currentAssistantContent = '';
  let assistantMessageAdded = false;
  loading.value = true;

  try {
    const threadId = isClient.value ? localStorage.getItem('threadId') : null;

    const response = await fetch('https://advocado-agent.vercel.app/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stream: true,
        rawResponse: true,
        threadId,
        messages: [{ role: 'user', content: userInput.value }]
      })
    });

    if (!response.body) throw new Error('No response body');

    const threadIdHeader = response.headers.get('lb-thread-id');
    if (threadIdHeader && isClient.value) {
      localStorage.setItem('threadId', threadIdHeader);
    }

    // Process streaming response
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
          const parsed = JSON.parse(line);
          const delta = parsed.choices[0]?.delta;

          if (delta?.content) {
            if (!assistantMessageAdded) {
              messages.value.push({
                role: 'assistant',
                content: '',
                timestamp: Date.now()
              });
              assistantMessageAdded = true;
            }

            currentAssistantContent += delta.content;
            messages.value[messages.value.length - 1].content = currentAssistantContent;
            messages.value = [...messages.value];
            await scrollToBottom();
          }
        } catch (error) {
          console.error('Error parsing line:', line, error);
        }
      }
    }
  } catch (error) {
    console.error('Error during streaming:', error);

    if (!assistantMessageAdded) {
      messages.value.push({
        role: 'assistant',
        content: '[Error receiving response]',
        timestamp: Date.now()
      });
    } else if (currentAssistantContent.trim() === '') {
      messages.value[messages.value.length - 1].content = '[Error receiving response]';
    }
  } finally {
    loading.value = false;
    userInput.value = '';
    if (inputRef.value) inputRef.value.focus();
    await scrollToBottom();
  }
};

// Add endChat function
/*
const endChat = async () => {
  if (isEndingChat.value) return;

  const threadId = typeof localStorage !== 'undefined' ? localStorage.getItem('threadId') : null;
  if (!threadId) return;

  isEndingChat.value = true;
  try {
    const response = await fetch('https://advocado-agent.vercel.app/thread/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: threadId as string })
    });

    if (!response.ok) throw new Error('Failed to end chat');

    // Clear the thread ID from localStorage
    localStorage.removeItem('threadId');

    // Add a system message indicating chat has ended
    const endMessage: Message = {
      role: 'assistant',
      content: 'Chat session has ended. Feel free to start a new conversation!',
      timestamp: Date.now()
    };
    messages.value.push(endMessage);
  } catch (error) {
    console.error('Error ending chat:', error);
    const errorMessage: Message = {
      role: 'assistant',
      content: 'Failed to end chat session. Please try again.',
      timestamp: Date.now()
    };
    messages.value.push(errorMessage);
  } finally {
    isEndingChat.value = false;
  }
};
*/

// Lifecycle hooks
onMounted(async () => {
  isClient.value = true;  // Mark as client-side
  clientSideTheme.value = true;

  // Initialize with welcome message if no messages exist
  if (messages.value.length === 0) {
    messages.value = [
      { role: 'assistant', content: 'Hi! What would you like to learn about Steve today?', timestamp: Date.now() }
    ];
  }

  if (isClient.value) {  // Only access browser APIs on client
    const existingThreadId = localStorage.getItem('threadId');
    if (existingThreadId) {
      isInitialLoading.value = true;
      try {
        // Fetch thread messages
        const messagesResponse = await fetch(`https://advocado-agent.vercel.app/thread/listMessages?threadId=${existingThreadId}`);
        const messagesData = await messagesResponse.json();

        if (messagesData && Array.isArray(messagesData)) {
          // Convert the messages to our format and add timestamps
          messages.value = messagesData.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at || Date.now()
          }));
        }
      } catch (error) {
        console.error('Error fetching thread messages:', error);
        // If there's an error, start with the default message
        messages.value = [
          { role: 'assistant', content: 'Hi! What would you like to learn about Steve today?', timestamp: Date.now() }
        ];
      } finally {
        isInitialLoading.value = false;
      }
    }

    if (chatWindowRef.value) {
      const savedHeight = localStorage.getItem('chatHeight');
      if (savedHeight) chatHeight.value = parseInt(savedHeight);
    }
  }

  scrollToBottom();
  if (inputRef.value) inputRef.value.focus();
});

// Watchers
watch(messages, () => scrollToBottom(), { deep: true });
watch(isDark, () => { }, { immediate: true });
</script>

<template>
  <div v-if="isClient" ref="chatWindowRef" :style="{ height: `${chatHeight}px`, ...cssVars }" :class="[
    '!flex !w-full !flex-col !rounded-lg !p-4 !shadow-lg !relative',
    clientSideTheme && isDark ? '!border !border-gray-700 !bg-gray-900' : '!border !border-gray-200 !bg-gray-50'
  ]">
    <!-- Header -->
    <div
      :class="['!mb-4 !pb-3 !flex !items-center !justify-between', clientSideTheme && isDark ? '!border-b !border-gray-700' : '!border-b !border-gray-200']">
      <div class="!flex !items-center">
        <div class="!h-3 !w-3 !rounded-full !bg-green-500 !mr-2"></div>
        <h3 :class="clientSideTheme && isDark ? '!text-gray-100 !font-medium' : '!text-gray-800 !font-medium'">Chat with
          Advocado 🥑</h3>
      </div>
      <!-- End Chat button temporarily disabled
      <button @click="endChat" :disabled="isEndingChat" :class="[
        '!px-3 !py-1 !rounded-lg !text-sm !transition-colors !duration-200 !ease-in-out',
        '!bg-indigo-600 !hover:bg-indigo-700 !text-white',
        isEndingChat && '!opacity-50 !cursor-not-allowed'
      ]">
        {{ isEndingChat ? 'Ending...' : 'End Chat' }}
      </button>
      -->
    </div>

    <!-- Initial loading indicator -->
    <div v-if="isInitialLoading" class="!flex-1 !flex !items-center !justify-center">
      <div class="!flex !flex-col !items-center !space-y-4">
        <div class="!h-8 !w-8 !border-4 !border-indigo-600 !border-t-transparent !rounded-full !animate-spin"></div>
        <p :class="clientSideTheme && isDark ? '!text-gray-300' : '!text-gray-600'">Loading conversation...</p>
      </div>
    </div>

    <!-- Messages area -->
    <div v-else ref="chatContainerRef" class="!flex-1 !overflow-auto !space-y-4 !flex !flex-col !px-1">
      <div v-for="(msg, index) in messages" :key="index" class="!flex !w-full !mb-3"
        :class="[msg.role === 'user' ? '!justify-end' : '!justify-start']">
        <div v-if="msg.content.trim().length > 0" :class="[
          '!rounded-lg !px-4 !py-3 !max-w-[85%] !shadow-md',
          msg.role === 'user' ? '!bg-indigo-600 !text-white' :
            (clientSideTheme && isDark) ? '!bg-gray-800 !text-gray-100 !border !border-gray-700' : '!bg-white !text-gray-800 !border !border-gray-200'
        ]">
          <div class="!flex !justify-between !items-center !mb-1">
            <span :class="[
              '!text-xs',
              msg.role === 'user' ? '!text-gray-200' :
                (clientSideTheme && isDark) ? '!text-gray-400' : '!text-gray-500'
            ]">{{ msg.role === 'user' ? 'You' : 'Advocado' }}</span>
            <span v-if="msg.timestamp" :class="[
              '!text-xs !ml-4',
              msg.role === 'user' ? '!text-gray-200' :
                (clientSideTheme && isDark) ? '!text-gray-400' : '!text-gray-500'
            ]">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div class="!whitespace-pre-wrap markdown-content" v-html="parseMarkdown(msg.content)"></div>
        </div>
      </div>

      <!-- Typing indicator -->
      <div v-if="loading" class="!flex !justify-start !w-full">
        <div :class="[
          '!rounded-lg !px-4 !py-3 !max-w-[85%] !shadow-md',
          clientSideTheme && isDark ? '!bg-gray-800 !text-gray-300 !border !border-gray-700' : '!bg-white !text-gray-600 !border !border-gray-200'
        ]">
          <div class="!flex !justify-between !items-center !mb-1">
            <span
              :class="clientSideTheme && isDark ? '!text-xs !text-gray-400' : '!text-xs !text-gray-500'">Advocado</span>
            <span
              :class="clientSideTheme && isDark ? '!text-xs !text-gray-400 !ml-4' : '!text-xs !text-gray-500 !ml-4'">
              {{ formatTime(Date.now()) }}
            </span>
          </div>
          <div class="!flex !items-center">
            <span v-for="(_, i) in 3" :key="i" :class="[
              '!inline-block !h-2 !w-2 !rounded-full !animate-pulse',
              clientSideTheme && isDark ? '!bg-gray-400' : '!bg-gray-300'
            ]" :style="{
              marginLeft: i > 0 ? '0.25rem' : 0,
              marginRight: i < 2 ? '0.25rem' : 0,
              animationDelay: `${i * 0.2}s`
            }"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Resize handle -->
    <div
      class="!h-2 !w-full !cursor-ns-resize !flex !justify-center !items-center hover:!bg-gray-300 dark:hover:!bg-gray-700 !transition-colors !rounded-b-lg"
      @mousedown="startResize" @touchstart="startResize">
      <div :class="['!w-12 !h-1 !rounded-full', clientSideTheme && isDark ? '!bg-gray-600' : '!bg-gray-300']"></div>
    </div>

    <!-- Input form -->
    <form @submit.prevent="sendMessage" :class="[
      '!mt-4 !flex !rounded-lg !overflow-hidden !shadow-md',
      clientSideTheme && isDark ? '!bg-gray-800 !border !border-gray-700' : '!bg-gray-100 !border !border-gray-200'
    ]">
      <input ref="inputRef" v-model="userInput" type="text" placeholder="Ask something about Steve..." :class="[
        '!flex-1 !border-0 !p-3 !outline-none !focus:ring-0 !focus:ring-offset-0',
        clientSideTheme && isDark ? '!bg-gray-800 !text-gray-100 !placeholder-gray-500' : '!bg-gray-100 !text-gray-800 !placeholder-gray-400'
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
  <div v-else
    class="!flex !w-full !flex-col !rounded-lg !p-4 !shadow-lg !relative !border !border-gray-200 !bg-gray-50">
    <div class="!mb-4 !pb-3 !flex !items-center !justify-between !border-b !border-gray-200">
      <div class="!flex !items-center">
        <div class="!h-3 !w-3 !rounded-full !bg-green-500 !mr-2"></div>
        <h3 class="!text-gray-800 !font-medium">Chat with Advocado 🥑</h3>
      </div>
    </div>
    <div class="!flex-1 !flex !items-center !justify-center">
      <p class="!text-gray-600">Loading chat...</p>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar styling */
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

/* Markdown styling */
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
  margin: 0 !important;
  font-style: italic !important;
}
</style>