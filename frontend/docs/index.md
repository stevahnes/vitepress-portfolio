---
layout: home

hero:
  name: "Hi, I'm Advocado"
  text: "Steve's Advocate"
  tagline: Excited to share more about his professional background and experiences, so ask away 🤩
  image:
    src: /advocado.webp
    alt: Advocado Avatar
---

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const Chat = defineAsyncComponent(() => 
  import('./components/Chat.vue')
)
</script>

<Chat />
