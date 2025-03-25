<template>
  <div :class="['answers-panel', mode]">
    <div 
      v-for="ai in aiList" 
      :key="ai.name" 
      class="ai-container"
      :class="{ 'collapsed': responses[ai.name]?.done }"
    >
      <ChainGraph 
        class="chain-graph"
        :chain-data="getChainData(ai.name)"
        :current-step="getCurrentStep(ai.name)"
      />
      <AiCard 
        :name="ai.name"
        :logo="ai.logo"
        :content="responses[ai.name]?.content || ''"
        :done="responses[ai.name]?.done"
        :response-time="responses[ai.name]?.time / 1000 || 0"
      />
    </div>
  </div>
</template>

<script setup>
import AiCard from './AiCard.vue';
import ChainGraph from './ChainGraph.vue';
import { computed } from 'vue';

const props = defineProps({
  aiList: Array,
  responses: Object,
  mode: {
    type: String,
    default: 'parallel'
  }
});

// 每个AI独立的思维链状态
const chainSteps = computed(() => {
  return props.aiList.reduce((acc, ai) => {
    acc[ai.name] = processReasoning(props.responses[ai.name]?.reasoning || '')
    return acc
  }, {})
})

// 处理思维链数据
const processReasoning = (reasoning) => {
  // 增强中文标点处理和多级分割
  return (reasoning || '')
    // 使用正向预查保留分隔符到前一个段落
    .split(/(?<=[。！？.?])\n+/)
    .filter(segment => {
      // 过滤空段落和纯空格段落
      return segment.trim().length > 0
    })
    .map((text, index) => ({
      step: index + 1,
      info: text
        .replace(/\n/g, ' ')    // 段落内换行转空格
        .replace(/\s+/g, ' ')   // 合并连续空格
        .trim(),
      timestamp: Date.now() + index * 1000
    }))
}

const getChainData = (aiName) => {
  return chainSteps.value[aiName] || []
}

const getCurrentStep = (aiName) => {
  const steps = chainSteps.value[aiName] || []
  return steps.length > 0 ? steps.length - 1 : -1
}
</script>

<style scoped>
.answers-panel {
  display: grid;
  gap: 24px;
  padding: 16px;
}

.answers-panel.parallel {
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}

.ai-container {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 20px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 折叠状态下的样式 */
.ai-container.collapsed .chain-graph {
  max-height: 0;
  opacity: 0;
  padding: 0;
  margin: 0;
  transition: all 0.3s ease;
}

.chain-graph {
  height: 200px;
  transition: all 0.3s ease;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .ai-container {
    grid-template-rows: auto 1fr;
  }
  
  .chain-graph {
    border-bottom: 1px solid #eee;
    padding-bottom: 16px;
    margin-bottom: 12px;
  }
  
  .ai-container.collapsed .chain-graph {
    border-bottom: none;
  }
}
</style>