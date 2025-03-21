<template>
  <div class="history-container">
    <div class="history-header">
      <h2>对话历史 ({{ historyList.length }})</h2>
    </div>
    <ul class="history-list" v-if="historyList.length">
      <li 
        v-for="item in historyList"
        :key="item.id"
        class="history-item"
        @click="$emit('load-history', item)"
      >
        <div class="content-preview">
          <div class="question">{{ truncate(item.question, 40) }}</div>
          <div class="answers-preview">
            <div 
              v-for="(answer, ai) in item.answers" 
              :key="ai"
              class="answer-item"
            >
              <span class="ai-tag">{{ ai }}</span>
              <span class="answer-text">{{ truncate(answer.content, 25) }}</span>
            </div>
          </div>
          <div class="timestamp">{{ formatTime(item.timestamp) }}</div>
        </div>
      </li>
    </ul>
    <div v-else class="empty-state">
      <span class="icon">📂</span>
      <p>暂无历史记录</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    historyList: {
      type: Array,
      required: true
    }
  },
  methods: {
    truncate(text, length) {
      return text?.length > length ? text.slice(0, length) + '...' : text || ''
    },
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/\//g, '-')
    }
  }
}
</script>

<style scoped>
.history-container {
  height: calc(100vh - 160px);
  overflow-y: auto;
  padding: 8px;
}

.history-header h2 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 1.3rem;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.history-item {
  padding: 12px;
  margin: 8px 0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.question {
  font-weight: 500;
  color: #34495e;
  margin-bottom: 8px;
}

.answers-preview {
  border-left: 2px solid #e0e6eb;
  padding-left: 8px;
  margin: 8px 0;
}

.answer-item {
  display: flex;
  align-items: baseline;
  margin: 4px 0;
  font-size: 0.9rem;
}

.ai-tag {
  background: #e8f4ff;
  color: #3498db;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-right: 6px;
  flex-shrink: 0;
}

.answer-text {
  color: #7f8c8d;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.timestamp {
  font-size: 0.75rem;
  color: #95a5a6;
  margin-top: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #bdc3c7;
}

.empty-state .icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 16px;
}
</style>
