<!-- AiCard.vue -->
<template>
  <div class="ai-card">
    <div class="header">
      <img v-if="logo" :src="logo" :alt="name" class="logo" />
      <div class="meta">
        <span class="name">{{ name }}</span>
        <span class="time" v-if="responseTime">· {{ responseTime.toFixed(1) }}s</span>
      </div>
    </div>

    <div class="content">
      <template v-for="(line, index) in contentLines" :key="index">
        <span class="content-line">{{ line }}</span>
      </template>
      <span v-if="!done" class="cursor">|</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: String,
  logo: String,
  content: String,
  done: Boolean,
  responseTime: Number
});

const contentLines = computed(() => {
  return props.content.split('\n').filter(l => l.trim());
});
</script>

<style scoped>
.ai-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.logo {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  margin-right: 10px;
}

.meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.name {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.time {
  font-size: 13px;
  color: #666;
}

.content-container {
  display: grid;
  gap: 12px;
}

.content-line {
  display: block;
  margin-bottom: 4px;
}

.reasoning-preview {
  border-top: 1px solid #eee;
  padding-top: 12px;
  margin-top: 12px;
}

.reasoning-header {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.reasoning-content {
  font-size: 13px;
  color: #888;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}
</style>