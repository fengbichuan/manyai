<template>
  <div id="app" class="app-container">
    <AppSideBar 
      :collapsed="sidebarCollapsed"
      @toggle="toggleSidebar"
    />

    <!-- 右侧主内容区域 -->
    <main 
      class="main-content"
      :style="{ marginLeft: sidebarCollapsed ? '80px' : '280px' }"
    >
      <div class="content-wrapper">
        <div id="lottie-container"></div>
        
        <!-- 提问区域 -->
        <section class="input-container">
          <InputBar @submit="handleQuestion" />
        </section>

        <!-- 回答展示 -->
        <section class="response-section">
          <AnswersPanel 
            :mode="displayMode"
            :ai-list="aiList"
            :responses="responses"
          />
        </section>

        <!-- 可视化区域 -->
        <!-- <section class="visualization-section">
          <ChainGraph 
            :chainData="chainData" 
            :currentStep="currentStep" 
          />
        </section> -->
      </div>
    </main>

    <!-- 悬浮助手按钮 -->
    <AssistTouch />
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue';
import InputBar from './components/InputBar.vue';
import { useAIWebSocket } from './websocket.js';
import AnswersPanel from './components/AnswersPanel.vue';
import axios from 'axios';
import lottie from 'lottie-web';
import AssistTouch from './components/AssistTouch.vue';
import AppSideBar from './components/AppSidebar.vue';

export default {
  name: 'App',
  components: {
    InputBar,
    AnswersPanel,
    AssistTouch,
    AppSideBar
  },
  setup() {
    const sidebarCollapsed = ref(false);
    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value;
    };

    const displayMode = ref('parallel');
    const chainData = ref([]);
    const currentStep = ref(-1);
    const responses = ref({});
    const requestStartTime = ref(null);
    const aiList = [
      { name: 'GPT', logo: require('@/assets/chatgpt.png') },
      { name: 'DeepSeek', logo: require('@/assets/deepseek.png') },
      { name: 'Kimi', logo: require('@/assets/kimi.png') }
    ];
    const aiNames = aiList.map(ai => ai.name);
    const { responses: wsResponses, sendQuestion } = useAIWebSocket('ws://localhost:8082/chat', aiNames);

    const handleQuestion = (questionText) => {
      if (questionText.trim() === '') return;
      axios.post('http://localhost:8082/api/ask', { question: questionText })
        .then((response) => {
          const keyMap = {
            answer1: 'GPT',
            answer2: 'DeepSeek',
            answer3: 'Kimi'
          };
          const elapsedTimeInSeconds = (performance.now() - requestStartTime.value) / 1000;
          for (const key in keyMap) {
            responses.value[keyMap[key]] = {
              content: response.data[key],
              done: false,
              responseTime: elapsedTimeInSeconds.toFixed(1),
              confidence: '未知'
            };
          }
        })
        .catch((error) => {
          console.error('Error:', error);
        });
      sendQuestion(questionText);
      chainData.value = [];
      currentStep.value = -1;
    };

    watch(() => wsResponses.GPT?.content, (newContent, oldContent) => {
      if (newContent && newContent.length > (oldContent?.length || 0)) {
        if (newContent.endsWith('。\n') || newContent.endsWith('.\n')) {
          if (!chainData.value.some(step => step.info === newContent)) {
            chainData.value.push({ step: chainData.value.length + 1, info: newContent });
            currentStep.value = chainData.value.length - 1;
          }
        }
      }
    });

    watch(() => wsResponses.GPT?.done, (done) => {
      if (done) {
        currentStep.value = -1;
      }
    });

    onMounted(() => {
      lottie.loadAnimation({
        container: document.getElementById('lottie-container'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'http://localhost:8080/logo.json',
      });
    });

    return {
      sidebarCollapsed,
      toggleSidebar,
      handleQuestion,
      displayMode,
      aiList,
      chainData,
      currentStep,
      responses,
      wsResponses
    };
  }
};
</script>

<style>
.app-container {
  display: flex;
  min-height: 100vh;
  background: #f8fafb;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.main-content {
  flex-grow: 1;
  transition: margin 0.3s ease-in-out;
  padding: 32px;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.input-container {
  left: 50%;
  transform: translateX(0%);
  z-index: 100;
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.input-container input {
  width: 300px;
  padding: 8px;
  margin-right: 8px;
}

.input-container button {
  padding: 8px 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

#lottie-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 300px;
  height: 300px;
  margin: 0 auto;
}

.response-section {
  margin: 32px 0;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:root {
  --primary-color: #2c3e50;
  --secondary-color: #42b983;
  --hover-bg: rgba(66, 185, 131, 0.1);
  --shadow-color: rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .main-content {
    padding: 24px;
    margin-left: 0 !important;
  }
}
</style>