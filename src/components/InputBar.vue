<template> 
  <div class="input-bar">
    <!-- 提问输入框 -->
    <input 
      type="text" 
      v-model="question" 
      @keyup.enter="submitQuestion" 
      :placeholder="placeholder" 
    />
    <!-- 提交按钮 -->
    <button @click="submitQuestion">提问</button>
    <!-- 智能提示按钮列表 -->
    <div class="suggestions">
      <button v-for="(suggest, index) in suggestions" :key="index" @click="useSuggestion(suggest)">
        {{ suggest }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 组件的响应式数据
const question = ref('')                     // 用户当前输入的问题
const placeholder = ref('请输入您的问题…')    // 动态提示语占位符
const suggestions = ref([                   // 智能提示按钮示例
  '天气如何？',
  '告诉我一个笑话',
  '今天的新闻头条是什么？'
])

// 定义事件 emit
const emit = defineEmits(['submit'])

// 提交问题函数
const submitQuestion = () => {
  if (question.value.trim() !== '') {
    emit('submit', question.value.trim())  // 发出提交事件
    question.value = ''  // 清空输入框
  }
}

// 使用智能提示填充并提交
const useSuggestion = (text) => {
  question.value = text
  submitQuestion()  // 提交问题
}

// 定时切换占位符示例（每隔几秒更换提示语）
const placeholderOptions = [
  '请输入您的问题…',
  '例如：股票明天会涨吗？',
  '例如：用一句话描述Vue3'
]
let phIndex = 0
onMounted(() => {
  setInterval(() => {
    phIndex = (phIndex + 1) % placeholderOptions.length
    placeholder.value = placeholderOptions[phIndex]
  }, 5000)
})
</script>

<style scoped>
.input-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
}
.input-bar input {
  flex: 1;
  padding: 8px;
  font-size: 16px;
}
.input-bar button {
  padding: 8px 16px;
}
.suggestions {
  margin-left: 16px;
}
.suggestions button {
  margin-right: 8px;
  font-size: 14px;
  padding: 4px 8px;
}
</style>
