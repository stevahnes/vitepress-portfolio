<template>
  <ol class="relative border-s border-gray-200 dark:border-gray-700">
    <li
      v-for="item in props.items"
      :key="item.time"
      class="list-none mb-10 ms-4"
    >
      <div
        class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"
      ></div>
      <time
        class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500"
        >{{ item.time }}</time
      >
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ item.title }}
      </h3>
      <p class="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">
        {{ item.description }}
      </p>
    </li>
  </ol>
</template>

<script setup lang="ts">
interface TimelineItem {
  time: string;
  title: string;
  description: string;
}

const props = withDefaults(
  defineProps<{
    items: TimelineItem[];
  }>(),
  {},
);
</script>
