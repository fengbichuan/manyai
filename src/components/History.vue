<template>
    <div class="history-container">
      <h3 v-if="history.length">对话历史</h3>
      <div 
        v-for="(record, index) in history"
        :key="index"
        class="history-item"
      >
        <div class="history-header">
          <span class="question">{{ record.question }}</span>
          <time class="timestamp">{{ formatTime(record.timestamp) }}</time>
        </div>
        
        <div class="ai-answers">
          <div 
            v-for="ai in aiList"
            :key="ai.name"
            class="answer-card"
          >
            <div class="ai-header">
              <img 
                :src="ai.logo" 
                :alt="ai.name + ' logo'"
                class="ai-logo"
              />
              <span class="ai-name">{{ ai.name }}</span>
            </div>
            <div class="answer-content">
              {{ record.answers[ai.name]?.content || '无回答' }}
            </div>
            <div class="answer-meta">
              <span class="response-time">
                ⏱ {{ record.answers[ai.name]?.responseTime }}s
              </span>
              <span class="confidence">
                🎯 {{ record.answers[ai.name]?.confidence }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      history: {
        type: Array,
        required: true
      },
      aiList: {
        type: Array,
        required: true
      }
    },
    methods: {
      formatTime(isoString) {
        return new Date(isoString).toLocaleString()
      }
    }
  }
  </script>
  
  <style scoped>
  .history-container {
    margin-top: 2rem;
    padding: 1rem;
    background: #f8fafb;
  }
  
  .history-item {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1rem 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #eee;
  }
  
  .question {
    font-weight: 600;
    color: #2c3e50;
    flex: 1;
  }
  
  .timestamp {
    font-size: 0.8em;
    color: #666;
  }
  
  .ai-answers {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  .answer-card {
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #eee;
  }
  
  .ai-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .ai-logo {
    width: 24px;
    height: 24px;
    margin-right: 0.5rem;
  }
  
  .ai-name {
    font-weight: 500;
    color: #2c3e50;
  }
  
  .answer-content {
    line-height: 1.6;
    color: #333;
    min-height: 80px;
    margin-bottom: 0.5rem;
  }
  
  .answer-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.8em;
    color: #666;
  }
  
  .response-time, .confidence {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  </style>
  