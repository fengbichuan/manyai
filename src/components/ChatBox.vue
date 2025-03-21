<template>
    <div class="chat-container">
      <transition name="welcome-fade">
        <div v-if="!hasFirstQuestion" class="welcome-section">
          <p class="welcome-text">我是 ManyAi，很高兴见到你！</p>
          <div class="function-list">
            <p>我可以帮你：</p>
            <p>✍️ 写代码、读文件</p>
            <p>📖 写作各种创意内容</p>
            <p>请把你的任务交给我吧~</p>
          </div>
        </div>
      </transition>
  
      <div class="input-group">
        <input 
          type="text" 
          v-model="question" 
          @keyup.enter="submitQuestion" 
          :placeholder="placeholder" 
          class="message-input"
        />
        <button @click="submitQuestion" class="send-button">发送</button>
      </div>
  
      <transition name="search-fade">
        <div v-if="!hasFirstQuestion" class="bottom-links">
          <a href="#" class="search-link">
            <span>深度思考 (R1)</span>
            <span>→</span>
            联网搜索
          </a>
        </div>
      </transition>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue'
  
  const props = defineProps({
    hasFirstQuestion: Boolean
  })
  
  // 组件的响应式数据
  const question = ref('')
  const placeholder = ref('请输入您的问题…')
  const localHasQuestion = ref(false)
  
  // 定义事件 emit
  const emit = defineEmits(['submit'])
  
  // 提交问题函数
  const submitQuestion = () => {
    if (question.value.trim() !== '') {
      emit('submit', question.value.trim())
      question.value = ''
      localHasQuestion.value = true
    }
  }
  
  // 监听父组件状态变化
  watch(() => props.hasFirstQuestion, (newVal) => {
    if (!newVal) {
      localHasQuestion.value = false
      placeholder.value = placeholderOptions[0]
    }
  })
  
  // 定时切换占位符
  const placeholderOptions = [
    '请输入您的问题…',
    '例如：股票明天会涨吗？',
    '例如：用一句话描述Vue3'
  ]
  let phIndex = 0
  onMounted(() => {
    setInterval(() => {
      if (!localHasQuestion.value) {
        phIndex = (phIndex + 1) % placeholderOptions.length
        placeholder.value = placeholderOptions[phIndex]
      }
    }, 5000)
  })
  </script>
  
  <style scoped>
  .chat-container {
    width: 400px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 24px;
    transition: all 0.3s ease;
  }
  
  .welcome-section {
    margin-bottom: 24px;
  }
  
  .welcome-text {
    font-size: 18px;
    line-height: 1.6;
    color: #333;
    margin-bottom: 16px;
  }
  
  .function-list {
    color: #666;
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 24px;
  }
  
  .input-group {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    position: relative;
    z-index: 2;
  }
  
  .message-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.3s ease;
  }
  
  .message-input:focus {
    border-color: #0875e1;
    outline: none;
  }
  
  .send-button {
    background-color: #0875e1;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: 
      background-color 0.2s,
      transform 0.2s;
  }
  
  .send-button:hover {
    background-color: #0662b7;
    transform: translateY(-1px);
  }
  
  .send-button:active {
    transform: translateY(0);
  }
  
  .bottom-links {
    display: flex;
    justify-content: flex-end;
  }
  
  .search-link {
    color: #0875e1;
    text-decoration: none;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: opacity 0.3s ease;
  }
  
  .search-link:hover {
    text-decoration: underline;
    opacity: 0.8;
  }
  
  /* 过渡动画 */
  .welcome-fade-enter-active,
  .welcome-fade-leave-active {
    transition: all 0.3s ease;
    max-height: 200px;
    overflow: hidden;
  }
  
  .welcome-fade-enter-from,
  .welcome-fade-leave-to {
    opacity: 0;
    transform: translateY(-20px);
    max-height: 0;
  }
  
  .search-fade-enter-active,
  .search-fade-leave-active {
    transition: all 0.3s ease 0.1s;
  }
  
  .search-fade-enter-from,
  .search-fade-leave-to {
    opacity: 0;
    transform: translateY(20px);
  }
  </style>
  