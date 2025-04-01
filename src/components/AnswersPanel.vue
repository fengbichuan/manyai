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
        :reasoning-steps="getChainData(ai.name)"
        :done="responses[ai.name]?.done || false"
        :response-time="responses[ai.name]?.time / 1000*1000|| 0"
      />
    </div>
  </div>
</template>

<script setup>
import AiCard from './AiCard.vue';
import { computed } from 'vue';

const props = defineProps({
  aiList: Array,
  responses: Object,
  mode: {
    type: String,
    default: 'parallel'
  }
});

const chainSteps = computed(() => {
  return props.aiList.reduce((acc, ai) => {
    acc[ai.name] = processReasoning(props.responses[ai.name]?.reasoning || '')
    return acc
  }, {})
})

const processReasoning = (reasoning) => {
  return (reasoning || '')
    .split(/(?<=[。！？.?])\n+/)
    .filter(segment => segment.trim().length > 0)
    .map((text, index) => ({
      step: index + 1,
      info: text
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
      timestamp: Date.now() + index * 1000
    }))
}

const getChainData = (aiName) => {
  return chainSteps.value[aiName]?.map(step => step.info) || []
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
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .answers-panel {
    grid-template-columns: 1fr;
  }
}
</style>