<!-- AnswersPanel.vue -->
<template>
  <div :class="['answers-panel', mode]">
    <div 
      v-for="ai in aiList" 
      :key="ai.name" 
      class="ai-container"
    >
      <AiCard 
        :name="ai.name"
        :logo="ai.logo"
        :content="responses[ai.name]?.content || ''"
        :done="responses[ai.name]?.done"
        :response-time="responses[ai.name]?.time / 1000 || 0"
      />
      <ChainGraph 
        class="chain-graph"
        :chain-data="getChainData(ai.name)"
        :current-step="getCurrentStep(ai.name)"
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
  return (reasoning || '').split('\n')
    .filter(line => line.trim())
    .map((text, index) => ({
      step: index + 1,
      info: text,
      timestamp: Date.now() + index
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
  grid-template-columns: 1fr 300px;
  gap: 20px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chain-graph {
  height: 200px;
  border-left: 1px solid #eee;
  padding-left: 20px;
}

@media (max-width: 768px) {
  .ai-container {
    grid-template-columns: 1fr;
  }
  .chain-graph {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid #eee;
    padding-top: 16px;
  }
}
</style>