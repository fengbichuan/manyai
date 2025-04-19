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
        :response-time="getResponseTimeValue(ai.name)" 
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

const getResponseTimeValue = (aiName) => {
  const timeValue = props.responses[aiName]?.responseTime;
  // Check if the value exists
  if (timeValue !== undefined && timeValue !== null) {
    // Attempt to convert to number, default to 0 on failure (e.g., empty string)
    // Keep the original string if it parses cleanly to a number > 0,
    // or just pass the original string if AiCard handles strings.
    // Let's assume AiCard might prefer a number for potential formatting.
    const parsedTime = parseFloat(timeValue);
    return isNaN(parsedTime) ? 0 : parsedTime; // Return number or 0
  }
  return 0; // Default to 0 if no timeValue exists
};

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