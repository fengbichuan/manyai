<template>
  <div class="ai-card">
    <!-- 卡片顶部：AI Logo和名称 -->
    <div class="header">
      <img v-if="logo" :src="logo" :alt="name" class="logo" />
      <span class="name">{{ name }}</span>
      <span class="time" v-if="responseTime">耗时: {{ responseTime }}s</span>
    </div>

    <!-- 回答内容，流式追加文本 -->
    <div class="content">
      {{ content }}
      <span v-if="!done" class="cursor">|</span>  <!-- 未完成时显示光标动画 -->
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  done: {
    type: Boolean,
    required: true
  },
  responseTime: {
    type: Number,
    default: 0
  },
  confidence: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.ai-card {
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f9f9f9;
  padding: 12px;
  margin: 8px 4px;
  max-width: 600px;
}
.header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.logo {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}
.name {
  font-weight: bold;
  font-size: 16px;
}
.time, .confidence {
  font-size: 0.9em;
  color: #555;
  margin-left: auto;
  margin-right: 0;
  /* 使用 margin-left: auto 将耗时和置信度推到最右 */
}
.content {
  white-space: pre-wrap;  /* 保留换行并自动折行 */
  font-size: 15px;
  line-height: 1.5;
}
.cursor {
  display: inline-block;
  width: 2px;
  background-color: #666;
  /* 光标动画效果 */
  animation: blink 1s step-start 0s infinite;
}
@keyframes blink {
  50% { opacity: 0; }
}
</style>
