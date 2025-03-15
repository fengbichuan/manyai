<template>
  <div :class="['answers-panel', mode]">
    <AiCard 
      v-for="ai in aiList"
      :key="ai.name"
      :name="ai.name"
      :logo="ai.logo"
      :content="responses[ai.name]?.content || ''"
      :done="responses[ai.name]?.done"
      :response-time="responses[ai.name]?.responseTime"
      :confidence="responses[ai.name]?.confidence"
    />
  </div>
</template>

<script setup>
import AiCard from './AiCard.vue';

defineProps({
  aiList: {
    type: Array,
    required: true
  },
  responses: {
    type: Object,
    required: true
  },
  mode: {
    type: String,
    default: 'parallel',
    validator: (value) => ['parallel', 'compare'].includes(value)
  }
});
</script>

<style scoped>
.answers-panel {
  padding: 16px;
}

.answers-panel.parallel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.answers-panel.compare {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
