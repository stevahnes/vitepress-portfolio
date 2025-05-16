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
        :id="item.anchor"
        class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500"
        >{{ item.time }}</time
      >
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ item.title }}
      </h3>
      <p class="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">
        {{ item.description }}
      </p>
      <div v-show="item.path">
        <a
          target="_blank"
          :href="item.path"
          class="inline-flex no-underline! hover:underline items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-gray-100 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700"
          >{{ item.cta }}
          <svg
            class="w-3 h-3 ms-2 rtl:rotate-180"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 10"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M1 5h12m0 0L9 1m4 4L9 9"
            /></svg
        ></a>
      </div>
    </li>
  </ol>
</template>

<script setup lang="ts">
interface TimelineItem {
  time: string;
  title: string;
  description: string;
  path?: string;
  cta?: string;
  anchor?: string;
}

const props = withDefaults(
  defineProps<{
    items: TimelineItem[];
  }>(),
  {},
);
</script>
