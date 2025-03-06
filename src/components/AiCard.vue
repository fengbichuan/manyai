<template>
    <div class="ai-card">
      <!-- 卡片顶部：AI Logo和名称 -->
      <div class="header">
        <img v-if="logo" :src="logo" :alt="name" class="logo" />
        <span class="name">{{ name }}</span>
        <!-- 在右侧显示响应耗时和置信度 -->
        <span class="time" v-if="responseTime">耗时: {{ responseTime }}ms</span>
        <span class="confidence" v-if="confidence">置信度: {{ (confidence * 100).toFixed(1) }}%</span>
      </div>
      <!-- 回答内容，流式追加文本 -->
      <div class="content">
        {{ content }}
        <span v-if="!done" class="cursor">|</span>  <!-- 未完成时显示光标动画 -->
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  // 接收父组件传入的 AI 数据对象
  const props = defineProps({
    name: String,
    logo: String,
    content: String,
    done: Boolean,
    responseTime: Number,
    confidence: Number
  })
  // 可以根据需要计算一些派生状态，例如截断显示等，这里简单直接展示
  </script>
  
  <style scoped>
  .ai-card {
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #f9f9f9;
    padding: 12px;
    margin: 8px 4px;
    max-width: 600px;
  }
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  .logo {
    width: 24px;
    height: 24px;
    margin-right: 8px;
  }
  .name {
    font-weight: bold;
    font-size: 16px;
  }
  .time, .confidence {
    font-size: 0.9em;
    color: #555;
    margin-left: auto;
    margin-right: 0;
    /* 使用 margin-left: auto 将耗时和置信度推到最右 */
  }
  .confidence {
    margin-left: 16px;
  }
  .content {
    white-space: pre-wrap;  /* 保留换行并自动折行 */
    font-size: 15px;
    line-height: 1.5;
  }
  .cursor {
    display: inline-block;
    width: 2px;
    background-color: #666;
    /* 光标动画效果 */
    animation: blink 1s step-start 0s infinite;
  }
  @keyframes blink {
    50% { opacity: 0; }
  }
  </style>
  