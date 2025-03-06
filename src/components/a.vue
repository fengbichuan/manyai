<template> 
    <div id="app">
      <!-- 顶部提问栏 -->
      <InputBar @submit="handleQuestion" />
      <!-- AI回答展示面板 -->
      <AnswersPanel :mode="displayMode" :responses="responses" @update:mode="val => displayMode = val" />
      <!-- 思维链可视化区域（这里假设显示第一个AI的思维链） -->
      <ChainGraph :chainData="chainData" :currentStep="currentStep" />
    </div>
  </template>
  

  <template>
    <input v-model="question" @keyup.enter="submitQuestion" placeholder="请输入你的问题"/>
    <button @click="submitQuestion">提交</button>
  </template> 
  
  
  <script setup>
  import { ref } from 'vue'
  const question = ref('')
  
  const emit = defineEmits(['submit'])
  
  const submitQuestion = () => {
    if (question.value.trim() !== '') {
      emit('submit', question.value.trim())
      question.value = ''  // 清空输入框
    }
  }
  </script>
  
  
<script>
  import { ref, watch } from 'vue'
  import InputBar from './components/InputBar.vue'
  import AnswersPanel from './components/AnswersPanel.vue'
  import ChainGraph from './components/ChainGraph.vue'
  import { useAIWebSocket } from './websocket.js'
  
  export default {
    name: 'App',
    components: {
      InputBar,
      AnswersPanel,
      ChainGraph
    }
  }
  
  
  // 定义使用的多个AI名称及其Logo（这里示例使用3个，可扩展到GPT、DeepSeek等）
  const aiList = [
    { name: 'GPT', logo: 'gpt_logo.png' },
    { name: 'DeepSeek', logo: 'deepseek_logo.png' },
    { name: 'Kimi', logo: 'kimi_logo.png' }
  ]
  // 提取名称数组用于初始化 WebSocket
  const aiNames = aiList.map(ai => ai.name)
  
  // 建立 WebSocket 连接并获得响应数据和发送函数
  const { responses, sendQuestion } = useAIWebSocket('ws://localhost:3000', aiNames)
  
  // 当前展示模式：并列或对比
  const displayMode = ref('parallel')
  
  // 当前思维链数据与高亮步骤（假设与第一个AI GPT 对应）
  const chainData = ref([])      // 将由后台提供的GPT思维链步骤数据填充
  const currentStep = ref(-1)    // 当前推理到的步骤索引
  
  // 处理提交的问题：调用 WebSocket 发送，同时重置思维链数据
  const handleQuestion = (question) => {
    // 清空之前的思维链数据
    chainData.value = []
    currentStep.value = -1
    // 发送问题给后端，各AI开始生成回答
    sendQuestion(question)
  }
  
  // 监听某个AI的回答进度来模拟更新思维链（这里以 GPT 为例）
  watch(() => responses.GPT?.content, (newContent, oldContent) => {
    if (newContent && newContent.length > oldContent?.length) {
      // 简单模拟：每当GPT内容新增一句话，就添加一个思维链节点
      if (newContent.endsWith('。\n') || newContent.endsWith('.\n')) {
        chainData.value.push({ step: chainData.value.length + 1, info: 'Step ' + (chainData.value.length + 1) })
        currentStep.value = chainData.value.length - 1  // 高亮最新步骤
      }
    }
  })
  // 当GPT回答完成时，取消高亮（例如高亮指数设为无效值）
  watch(() => responses.GPT?.done, (done) => {
    if (done) {
      currentStep.value = -1
    }
  })
  </script>
  
  <style>
  #app {
    padding-top: 60px; /* 给顶部输入栏腾出空间 */
  }
  </style>
  