<template>
  <div id="app" class="app-container">
    <AppSideBar 
      :collapsed="sidebarCollapsed"
      :active-view="activeView"
      @toggle="toggleSidebar"
      @view-change="handleViewChange"
    />

    <!-- 主内容区域 -->
    <main class="main-content" :style="{ marginLeft: sidebarCollapsed ? '80px' : '280px' }">
      <div class="content-wrapper">
        <!-- 历史记录视图 -->
        <transition name="fade">
          <History
            v-if="activeView === 'history'"
            :history-list="history"
            @load-history="loadHistory"
            class="history-panel"
          />
        </transition>

        <!-- 聊天回答视图 -->
        <transition name="answers-fade">
          <section 
            v-if="showAnswers && activeView === 'chat'"
            class="response-section"
            key="response-section"
          >
            <AnswersPanel 
              :mode="displayMode" 
              :ai-list="aiList" 
              :responses="responses" 
            />
          </section>
        </transition>
      </div>
    </main>

    <!-- 聊天输入框（仅在聊天视图显示） -->
    <div v-if="activeView === 'chat'" class="chatbox-container">
      <ChatBox 
        @submit="handleQuestion" 
        :has-first-question="hasFirstQuestion" 
      />
    </div>

    <AssistTouch />
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue';
import { useAIWebSocket } from './websocket.js';
import AnswersPanel from './components/AnswersPanel.vue';
import axios from 'axios';
import AssistTouch from './components/AssistTouch.vue';
import AppSideBar from './components/AppSidebar.vue';
import ChatBox from './components/ChatBox.vue';
import History from './components/ChatHistory.vue';

export default {
  name: 'App',
  components: {
    AnswersPanel,
    AssistTouch,
    AppSideBar,
    ChatBox,
    History
  },
  setup() {
    // 状态管理
    const sidebarCollapsed = ref(false);
    const activeView = ref('chat'); // 新增视图状态
    const history = ref([]); // 新增历史记录

    // 初始化加载历史记录
    onMounted(() => {
      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory) {
        history.value = JSON.parse(savedHistory);
      }
    });

    // 其他现有状态保持不变...
    const showAnswers = ref(false);
    const hasFirstQuestion = ref(false);
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

    // 新增历史记录处理方法
    const addHistoryItem = (question, answers) => {
      const newItem = {
        id: Date.now(),
        timestamp: Date.now(),
        question,
        answers: { ...answers },
        fullResponses: { ...responses.value }
      };
      
      history.value.unshift(newItem);
      // 保持最多100条历史记录
      if (history.value.length > 100) history.value.pop();
      localStorage.setItem('chatHistory', JSON.stringify(history.value));
    };

    // 修改后的提问处理方法
    const handleQuestion = async (questionText) => {
      if (questionText.trim() === '') return;

      // 重置状态
      showAnswers.value = true;
      hasFirstQuestion.value = true;
      responses.value = {};
      activeView.value = 'chat'; // 确保切换到聊天视图
      requestStartTime.value = performance.now();

      try {
        const [httpResponse] = await Promise.all([
          axios.post('http://localhost:8082/api/ask', { question: questionText }),
          sendQuestion(questionText)
        ]);

        // 处理HTTP响应
        const elapsedTime = (performance.now() - requestStartTime.value) / 1000;
        const keyMap = { answer1: 'GPT', answer2: 'DeepSeek', answer3: 'Kimi' };
        const newResponses = {};

        for (const key in keyMap) {
          newResponses[keyMap[key]] = {
            content: httpResponse.data[key] || '正在思考...',
            done: false,
            responseTime: elapsedTime.toFixed(1),
            confidence: '计算中...'
          };
        }
        responses.value = newResponses;

        // 当所有回答完成时保存历史
        const checkCompletion = () => {
          if (Object.values(responses.value).every(r => r.done)) {
            addHistoryItem(questionText, responses.value);
          }
        };

        watch(responses, checkCompletion, { deep: true, immediate: true });

      } catch (error) {
        console.error('Error:', error);
        responses.value = {
          Error: {
            content: '请求失败，请稍后重试',
            done: true,
            responseTime: 0,
            confidence: '未知'
          }
        };
      }

      chainData.value = [];
      currentStep.value = -1;
    };

    // 新增视图切换处理
    const handleViewChange = (view) => {
      activeView.value = view;
      if (view === 'chat' && !hasFirstQuestion.value) {
        showAnswers.value = false;
      }
    };

    // 加载历史记录功能
    const loadHistory = (historyItem) => {
      activeView.value = 'chat';
      showAnswers.value = true;
      responses.value = historyItem.fullResponses;
      hasFirstQuestion.value = true;
    };

    // 保持原有watch监听
    watch(wsResponses, (newResponses) => {
      responses.value = { ...responses.value, ...newResponses };
    }, { deep: true });

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
      if (done) currentStep.value = -1;
    });

    return {
      sidebarCollapsed,
      activeView,
      history,
      toggleSidebar: () => sidebarCollapsed.value = !sidebarCollapsed.value,
      handleQuestion,
      displayMode,
      aiList,
      chainData,
      currentStep,
      responses,
      showAnswers,
      hasFirstQuestion,
      handleViewChange,
      loadHistory
    };
  }
};
</script>

<style>
/* 新增历史记录面板样式 */
.history-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 32px 0;
  min-height: 60vh;
}

/* 视图切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 调整聊天框位置 */
.chatbox-container {
  left: 280px; /* 匹配侧边栏初始宽度 */
  transition: left 0.3s ease-in-out;
}

.sidebar-collapsed .chatbox-container {
  left: 80px; /* 匹配收起后的侧边栏宽度 */
}

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
  margin-bottom: 200px; /* 留出输入框空间 */
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.response-section {
  margin: 32px 0;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chatbox-container {
  position: fixed;
  bottom: 0;
  left: 400px; /* 初始侧边栏宽度 */
  right: 0;
  z-index: 1000;
  background: linear-gradient(to top, rgba(255, 255, 255, 1) 80%, rgba(255, 255, 255, 0));
  padding: 24px 0;
  transition: left 0.3s ease-in-out;
}

.sidebar-collapsed .chatbox-container {
  left: 80px; /* 侧边栏收起时的宽度 */
}

/* 回答面板过渡动画 */
.answers-fade-enter-active {
  animation: answersFadeIn 0.3s;
}

@keyframes answersFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .chatbox-container {
    left: 0 !important;
    padding: 16px;
  }
  
  .main-content {
    margin-bottom: 160px;
    padding: 16px;
  }
  
  .response-section {
    margin: 16px 0;
    padding: 16px;
  }
}
</style>
