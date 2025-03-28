<template>
  <div class="ai-card">
    <div class="header">
      <img v-if="logo" :src="logo" :alt="name" class="logo" />
      <div class="meta">
        <span class="name">{{ name }}</span>
        <span class="time" v-if="responseTime">· {{ responseTime.toFixed(1) }}s</span>
      </div>
    </div>

    <!-- 推理步骤区域 -->
    <div v-if="reasoningSteps.length > 0" class="reasoning">
      <div 
        class="reasoning-header"
        @click="toggleReasoning"
      >
        <span>推理步骤（{{ reasoningSteps.length }}步）</span>
        <span class="arrow" :class="{ expanded: isReasoningExpanded }">▼</span>
      </div>
      <div 
        class="reasoning-steps"
        :class="{ 'visible': isReasoningExpanded }"
      >
        <div 
          v-for="(step, index) in reasoningSteps"
          :key="index"
          class="step"
        >
          <span class="step-index">Step {{ index + 1 }}:</span>
          {{ step }}
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content">
      <template v-for="(line, index) in contentLines" :key="index">
        <span class="content-line">{{ line }}</span>
      </template>
      <span v-if="!done" class="cursor">|</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted} from 'vue';

const props = defineProps({
  name: String,
  logo: String,
  content: String,
  done: Boolean,
  responseTime: Number,
  reasoningSteps: { type: Array, default: () => [] }
});

const isReasoningExpanded = ref(true);

watch(() => props.done, (newVal) => {
  console.log('[AiCard] done 状态变化:', newVal);
  if (newVal) {
    setTimeout(() => {
      console.log('[AiCard] 触发自动折叠');
      isReasoningExpanded.value = false;
    }, 800);
  } else {
    isReasoningExpanded.value = true;
  }
}, { immediate: true });

// 新增 mounted 钩子
onMounted(() => {
  console.log('[AiCard] 初始 props:', {
    done: props.done,
    name: props.name
  });
});

const toggleReasoning = () => {
  isReasoningExpanded.value = !isReasoningExpanded.value;
};

const contentLines = computed(() => {
  return props.content.split('\n').filter(l => l.trim());
});
</script>

<style scoped>
/* 新增折叠动效样式 */
.reasoning-steps {
  overflow: hidden;
  transition: 
    max-height 0.5s ease-in-out,
    opacity 0.3s ease-in-out;
  max-height: 0;
  opacity: 1;
}

.reasoning-steps:not(.visible) {
  opacity: 0;
  transition: 
    max-height 0.5s ease-in-out,
    opacity 0.3s ease-in-out 0.2s; /* 延迟透明度变化 */
}

.reasoning-steps.visible {
  max-height: 100vh; /* 使用更灵活的最大高度 */
}
.ai-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
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

.content {
  line-height: 1.6;
  order: 2;
}

.reasoning {
  order: 1;
  width: 100%;
  margin-bottom: 12px;
}

.reasoning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #eee;
}

.reasoning-header:hover {
  background: #f1f3f5;
}

.arrow {
  font-size: 10px;
  transition: transform 0.2s;
}

.arrow.expanded {
  transform: rotate(180deg);
}

.reasoning-steps {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  margin-top: 4px;
}

.reasoning-steps.visible {
  max-height: 1000px;
  padding: 4px 0;
}

.step {
  padding: 8px 12px;
  margin: 4px 0;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.5;
  animation: fadeIn 0.3s ease;
}

.step-index {
  font-weight: 500;
  color: #2c3e50;
  margin-right: 6px;
}

.content-line {
  display: block;
  margin-bottom: 4px;
}

.cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>