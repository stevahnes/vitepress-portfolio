<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const visible = ref(false);
const terminalOpen = ref(false);
const phase = ref<"glitching" | "calm">("glitching");

let showTimer: ReturnType<typeof setTimeout> | null = null;
let phaseTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function clearAll() {
  if (showTimer) clearTimeout(showTimer);
  if (phaseTimer) clearTimeout(phaseTimer);
  if (hideTimer) clearTimeout(hideTimer);
}

function scheduleNext() {
  const delay = 15_000 + Math.random() * 30_000;
  showTimer = setTimeout(trigger, delay);
}

function trigger() {
  if (terminalOpen.value) {
    scheduleNext();
    return;
  }
  visible.value = true;
  phase.value = "glitching";

  phaseTimer = setTimeout(() => {
    phase.value = "calm";

    hideTimer = setTimeout(() => {
      visible.value = false;
      scheduleNext();
    }, 2000);
  }, 400);
}

/**
 * Simulate typing "/terminal" + Enter into the global keydown handler.
 * This is exactly how a user would open the Console — no router.go needed.
 */
function handleClick() {
  clearAll();
  visible.value = false;

  const sequence = "/terminal";
  for (const key of sequence) {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  }
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
}

function onTerminalOpen() {
  terminalOpen.value = true;
  visible.value = false;
  clearAll();
}

function onTerminalClose() {
  terminalOpen.value = false;
  scheduleNext();
}

onMounted(() => {
  window.addEventListener("terminalOpen", onTerminalOpen);
  window.addEventListener("terminalClose", onTerminalClose);
  showTimer = setTimeout(trigger, 8_000 + Math.random() * 8_000);
});

onUnmounted(() => {
  clearAll();
  window.removeEventListener("terminalOpen", onTerminalOpen);
  window.removeEventListener("terminalClose", onTerminalClose);
});
</script>

<template>
  <ClientOnly>
    <Transition name="hint">
      <button
        v-if="visible"
        class="glitch-hint"
        :class="phase"
        aria-label="Open terminal easter egg"
        @click="handleClick"
      >
        <!-- Red channel — chromatic aberration left -->
        <span class="layer layer-r" aria-hidden="true">&gt; _</span>
        <!-- Blue channel — chromatic aberration right -->
        <span class="layer layer-b" aria-hidden="true">&gt; _</span>
        <!-- Base layer — reserves button dimensions -->
        <span class="layer layer-base">&gt; _</span>
      </button>
    </Transition>
  </ClientOnly>
</template>

<style scoped>
/*
 * Mirrors the shader picker button (top-right, inside the nav bar area).
 * Sits at the same vertical band on the left edge.
 * z-index: 25 keeps it under VitePress nav (30) so nav occludes it naturally.
 * Hidden on mobile — keyboard easter egg doesn't apply on touch devices.
 */
.glitch-hint {
  position: fixed;
  top: calc(64px + 0.75rem);
  left: max(1rem, calc(50vw - 720px + 1.5rem));
  z-index: 15;

  /* Reset */
  appearance: none;
  border: none;
  background: transparent;
  padding: 4px 6px;
  margin: 0;
  cursor: pointer;

  /* Typography — matches Console.vue exactly */
  font-family: "IBM Plex Mono", "Cascadia Code", "Fira Code", monospace;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.04em;

  display: inline-flex;
  align-items: center;
}

.glitch-hint:focus-visible {
  outline: 1px dashed rgba(0, 194, 168, 0.45);
  outline-offset: 3px;
  border-radius: 3px;
}

/* ── Layer stacking ──────────────────────────── */

.layer {
  position: absolute;
  top: 4px;
  left: 6px;
  white-space: pre;
  line-height: 1;
  pointer-events: none;
}

/* Base layer: in-flow to reserve button dimensions */
.layer-base {
  position: relative;
  top: auto;
  left: auto;
  color: #00c2a8;
  text-shadow: 0 0 10px rgba(0, 194, 168, 0.65);
}

/* Red channel */
.layer-r {
  color: #ff5f57;
  opacity: 0;
  mix-blend-mode: screen;
}

/* Blue channel — matches --vp-c-blue-3 */
.layer-b {
  color: #7ab5e5;
  opacity: 0;
  mix-blend-mode: screen;
}

/* ── Glitching phase (400ms burst) ──────────── */

.glitching .layer-r {
  animation: glitch-r 0.4s steps(1) forwards;
}

.glitching .layer-b {
  animation: glitch-b 0.4s steps(1) forwards;
}

.glitching .layer-base {
  animation: glitch-base 0.4s steps(1) forwards;
}

@keyframes glitch-r {
  0% {
    opacity: 0.9;
    transform: translate(-3px, 1px) scaleX(1.02);
  }

  15% {
    opacity: 0;
    transform: translate(0, 0);
  }

  30% {
    opacity: 0.8;
    transform: translate(-5px, -1px) scaleX(0.98);
  }

  45% {
    opacity: 0;
    transform: translate(0, 0);
  }

  60% {
    opacity: 0.7;
    transform: translate(-2px, 2px);
  }

  75% {
    opacity: 0;
    transform: translate(0, 0);
  }

  90% {
    opacity: 0.5;
    transform: translate(-4px, 0);
  }

  100% {
    opacity: 0;
    transform: translate(0, 0);
  }
}

@keyframes glitch-b {
  0% {
    opacity: 0.9;
    transform: translate(3px, -1px) scaleX(0.98);
  }

  15% {
    opacity: 0;
    transform: translate(0, 0);
  }

  30% {
    opacity: 0.8;
    transform: translate(5px, 1px) scaleX(1.02);
  }

  45% {
    opacity: 0;
    transform: translate(0, 0);
  }

  60% {
    opacity: 0.7;
    transform: translate(2px, -2px);
  }

  75% {
    opacity: 0;
    transform: translate(0, 0);
  }

  90% {
    opacity: 0.5;
    transform: translate(4px, 0);
  }

  100% {
    opacity: 0;
    transform: translate(0, 0);
  }
}

@keyframes glitch-base {
  0% {
    transform: translate(1px, 0);
    opacity: 1;
  }

  10% {
    transform: translate(-1px, 0);
    opacity: 0.6;
  }

  20% {
    transform: translate(0, 0);
    opacity: 1;
  }

  35% {
    transform: translate(2px, 0);
    opacity: 0.8;
  }

  50% {
    transform: translate(-2px, 0);
    opacity: 1;
  }

  65% {
    transform: translate(1px, 0);
    opacity: 0.7;
  }

  80% {
    transform: translate(0, 0);
    opacity: 1;
  }

  100% {
    transform: translate(0, 0);
    opacity: 1;
  }
}

/* ── Calm phase (2s blink) ───────────────────── */

.calm .layer-r,
.calm .layer-b {
  opacity: 0;
  animation: none;
}

.calm .layer-base {
  animation: calm-blink 0.9s step-end infinite;
  text-shadow: 0 0 14px rgba(0, 194, 168, 0.95);
}

@keyframes calm-blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

/* ── Entrance / exit ─────────────────────────── */

.hint-enter-active {
  transition: opacity 0.08s ease;
}

.hint-leave-active {
  transition: opacity 0.4s ease;
}

.hint-enter-from,
.hint-leave-to {
  opacity: 0;
}
</style>
