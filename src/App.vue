<template>

  <div id="app" class="app-container">
    <AppSideBar :collapsed="sidebarCollapsed" :active-view="activeView" @toggle="toggleSidebar"
      @view-change="handleViewChange" />

    <!-- 主内容区域 -->
    <main class="main-content" :style="{ marginLeft: sidebarCollapsed ? '80px' : '280px' }">
      <div class="content-wrapper">
        <!-- 历史记录视图 -->
        <transition name="fade">
          <History v-if="activeView === 'history'" :history-list="history" @load-history="loadHistory"
            class="history-panel" />
        </transition>

        <!-- 聊天回答视图 -->
        <transition name="answers-fade">
          <section v-if="showAnswers && activeView === 'chat'" class="response-section" key="response-section">
            <AnswersPanel :mode="displayMode" :ai-list="aiList" :responses="processedResponses" />
          </section>

        </transition>
      </div>

    </main>

    <!-- 聊天输入框（仅在聊天视图显示） -->
    <div v-if="activeView === 'chat'" class="chatbox-container">
      <ChatBox @submit="handleQuestion" :has-first-question="hasFirstQuestion" />
    </div>

    <AssistTouch />
  </div>
</template>

<script>
import { ref, watch, onMounted, computed, reactive } from 'vue';
// Import reactive if initializing response objects directly
import { useAIWebSocket, askCoze } from './websocket.js';
import AnswersPanel from './components/AnswersPanel.vue';
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
    // --- State Management ---
    const sidebarCollapsed = ref(false);
    const activeView = ref('chat');
    const history = ref([]);
    const showAnswers = ref(false);
    const hasFirstQuestion = ref(false);
    const displayMode = ref('parallel'); // Assuming you might use this
    const responses = ref({}); // Main state object for ALL AI responses
    const requestStartTime = ref(null); // Overall start time for the request group

    const aiList = [
      { name: 'GPT', logo: require('@/assets/chatgpt.png') },
      { name: 'DeepSeek', logo: require('@/assets/deepseek.png') },
      { name: 'Kimi', logo: require('@/assets/kimi.png') },
      { name: 'coze', logo: require('@/assets/coze.png') }, // Keep coze here for UI list
    ];

    // --- WebSocket Setup (Filter out 'coze') ---
    const wsAiNames = aiList.filter(ai => ai.name !== 'coze').map(ai => ai.name);
    // Pass only WebSocket-relevant AI names to the composable
    const { responses: wsResponses, sendQuestion } = useAIWebSocket('ws://localhost:8082/chat', wsAiNames);

    // --- Computed Property for Display ---
    // This computed property now primarily relies on the local `responses` ref
    const processedResponses = computed(() => {
      // Ensure all AIs from aiList have an entry, even if empty initially
      const processed = {};
      aiList.forEach(ai => {
        const responseData = responses.value[ai.name];
        processed[ai.name] = {
          name: ai.name, // Ensure name is always present
          content: responseData?.content || '',
          reasoning: responseData?.reasoning || '',
          done: responseData?.done || false,
          responseTime: responseData?.responseTime?.toString() || '0.0', // Ensure string format if needed by component
          confidence: responseData?.confidence || null, // Use null or a default
          error: responseData?.error || null,
          lastUpdated: responseData?.lastUpdated || 0,
          // Add other fields your AnswersPanel might expect
        };
      });
      // console.log('Processed Responses:', JSON.stringify(processed));
      return processed;
    });

    // --- Watch WebSocket Responses and Update Local State ---
    // This watcher now only handles updates for GPT, DeepSeek, Kimi from the WebSocket
    watch(wsResponses, (newWsData) => {
      // console.log("WebSocket Data Received:", JSON.stringify(newWsData));
      for (const [aiName, data] of Object.entries(newWsData)) {
        if (responses.value[aiName]) { // Update existing entry if handleQuestion initialized it
          // Only update if data exists to avoid overwriting Coze's final state potentially
          if (data.content !== undefined) responses.value[aiName].content = data.content;
          if (data.reasoning !== undefined) responses.value[aiName].reasoning = data.reasoning;
          if (data.responseTime !== undefined) responses.value[aiName].responseTime = data.responseTime; // WS provides this
          if (data.confidence !== undefined) responses.value[aiName].confidence = data.confidence;
          if (data.error !== undefined) responses.value[aiName].error = data.error;
          if (data.lastUpdated !== undefined) responses.value[aiName].lastUpdated = data.lastUpdated;
          // Crucially, update 'done' status
          if (data.done !== undefined) responses.value[aiName].done = data.done;
        } else {
          // This case might happen if WS connects/sends before handleQuestion initializes
          // Or if an AI wasn't in the initial list passed? Handle defensively.
          console.warn(`Received WS data for unexpected AI: ${aiName}`);
          // Optionally initialize it here if needed, but initialization in handleQuestion is preferred
          // responses.value[aiName] = reactive({ ...data, name: aiName });
        }
      }
    }, { deep: true });



    // 历史记录处理方法

    const addHistoryItem = (question, answers) => {
      const newItem = {
        id: Date.now(),
        timestamp: Date.now(),
        question,
        answers: { ...answers },
        fullResponses: { ...responses.value }
      };
      console.log('Attempting to save history item:', newItem);
      history.value.unshift(newItem);
      if (history.value.length > 100) history.value.pop();
      localStorage.setItem('chatHistory', JSON.stringify(history.value));
    };

    // // --- History Management ---
    // const addHistoryItem = (question, finalResponses) => {
    //   // Use the structure expected by loadHistory (fullResponses)
    //   const newItem = {
    //     id: Date.now(),
    //     timestamp: Date.now(),
    //     question,
    //     // 'answers' might be redundant if 'fullResponses' has everything
    //     // answers: { ...extractAnswers(finalResponses) }, // Helper function if needed
    //     fullResponses: JSON.parse(JSON.stringify(finalResponses)) // Deep copy
    //   };
    //   console.log('Saving history item:', newItem);
    //   history.value.unshift(newItem);
    //   if (history.value.length > 100) history.value.pop();
    //   localStorage.setItem('chatHistory', JSON.stringify(history.value));
    // };

    // --- Question Handling (Main Logic) ---
    const handleQuestion = async (questionText) => {
      if (questionText.trim() === '') return;

      console.log(`Handling question: "${questionText}"`);
      showAnswers.value = true;
      hasFirstQuestion.value = true;
      activeView.value = 'chat'; // Ensure chat view is active
      requestStartTime.value = performance.now(); // Record overall start

      // 1. Initialize/Reset state for ALL AIs (including Coze)
      responses.value = aiList.reduce((acc, ai) => {
        acc[ai.name] = reactive({ // Use reactive for deeper tracking if needed
          name: ai.name,
          content: '',
          reasoning: '',
          done: false,
          responseTime: 0,
          confidence: null,
          error: null,
          lastUpdated: 0,
        });
        return acc;
      }, {});
      console.log("Initial responses state:", JSON.stringify(responses.value));


      // 2. Trigger WebSocket AIs (don't await, let it run in background)
      if (wsAiNames.length > 0) {
        console.log("Sending question to WebSocket AIs:", wsAiNames);
        sendQuestion(questionText); // Assumes sendQuestion uses the wsAiNames it was initialized with
      }

      // 3. Trigger Coze API call (await this specific call)
      const cozeAiInfo = aiList.find(ai => ai.name === 'coze');
      if (cozeAiInfo) {
        console.log("Calling askCoze...");
        const cozeStartTime = performance.now();
        try {
          const convId = "cvinob75usogqsuoetgg"; // Replace with dynamic ID if needed
          const answer = await askCoze(convId, questionText); // Await the async call
          const cozeEndTime = performance.now();
          const cozeDuration = ((cozeEndTime - cozeStartTime) / 1000);

          console.log("askCoze response:", answer);

          if (answer !== null) {
            // Success - update coze state
            responses.value.coze.content = answer;
            responses.value.coze.done = true;
            responses.value.coze.responseTime = cozeDuration.toFixed(1);
            responses.value.coze.error = null;
            responses.value.coze.lastUpdated = Date.now();
            // You might want a simple confidence or leave as null
            responses.value.coze.confidence = '中等可信度'; // Example
          } else {
            // Failure (askCoze returned null, maybe API logic flaw?)
            console.error('askCoze returned null');
            responses.value.coze.done = true;
            responses.value.coze.responseTime = cozeDuration.toFixed(1);
            responses.value.coze.error = '未能从 Coze 获取有效回答';
            responses.value.coze.lastUpdated = Date.now();
          }
        } catch (error) {
          // Failure (exception during fetch/askCoze)
          const cozeEndTime = performance.now();
          const cozeDuration = ((cozeEndTime - cozeStartTime) / 1000);
          console.error('Error calling askCoze:', error);
          responses.value.coze.done = true; // Mark as done even on error
          responses.value.coze.responseTime = cozeDuration.toFixed(1); // Record time taken until error
          responses.value.coze.error = `请求 Coze 出错: ${error.message || '未知错误'}`;
          responses.value.coze.lastUpdated = Date.now();
        }
        console.log("Updated Coze state:", JSON.stringify(responses.value.coze));
      }

      // 4. Interval Timer to check completion of ALL AIs and save history
      const checkCompletionInterval = setInterval(() => {
        const allDone = aiList.every(ai => responses.value[ai.name]?.done);
        // console.log("Checking completion, allDone:", allDone);

        if (allDone) {
          console.log("All AIs finished. Saving history.");
          addHistoryItem(questionText, responses.value); // Save the final state
          clearInterval(checkCompletionInterval); // Stop checking
        } else {
          // Optional: Update elapsed time for non-done WS responses if needed
          // Note: Coze's time is set definitively above. WS time comes from wsResponses watcher.
          // This section might only be needed if WS doesn't provide final time on 'done'.
          const elapsed = Number((performance.now() - requestStartTime.value) / 1000);
          wsAiNames.forEach(aiName => {
            if (responses.value[aiName] && !responses.value[aiName].done) {
              responses.value[aiName].responseTime = elapsed.toFixed(1); // Be careful not to overwrite final time from WS
            }
          });
        }
      }, 500); // Check every 500ms

    };

    // --- View Switching ---
    const handleViewChange = (view) => {
      console.log('Switching view to:', view);
      activeView.value = view;
      if (view === 'chat') {
        // Reset chat state for a new conversation
        hasFirstQuestion.value = false;
        showAnswers.value = false;
        responses.value = {}; // Clear responses
        // Clear other relevant states if any
      }
    };

    // --- Load History ---
    const loadHistory = (historyItem) => {
      console.log("Loading history item:", historyItem.id);
      activeView.value = 'chat'; // Switch to chat view
      // Ensure the structure matches what handleQuestion sets up
      responses.value = historyItem.fullResponses || {}; // Load the saved state
      showAnswers.value = true; // Show the answers panel
      hasFirstQuestion.value = true; // Indicate that a question/answer is loaded
    };

    // --- Initial Load ---
    onMounted(() => {
      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory) {
        try {
          history.value = JSON.parse(savedHistory);
          console.log("Loaded history from localStorage:", history.value.length, "items");
        } catch (e) {
          console.error("Failed to parse chat history:", e);
          localStorage.removeItem('chatHistory'); // Clear corrupted data
        }
      }
    });

    // --- Other watchers (like GPT chain data) - Keep if needed ---
    // watch(() => wsResponses.GPT?.content, ...);
    // watch(() => wsResponses.GPT?.done, ...);

    return {
      sidebarCollapsed,
      activeView,
      history,
      toggleSidebar: () => sidebarCollapsed.value = !sidebarCollapsed.value,
      handleQuestion,
      displayMode, // Keep if used by AnswersPanel/Sidebar
      aiList, // Pass the full list to the template for UI rendering
      // chainData, // Keep if needed
      // currentStep, // Keep if needed
      responses, // The local, combined state (used by processedResponses)
      showAnswers,
      hasFirstQuestion,
      handleViewChange,
      loadHistory,
      processedResponses, // Pass the computed property to AnswersPanel
      // connectionStatus: wsConnectionStatus // If you made connectionStatus reactive in websocket.js
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
  left: 280px;
  /* 匹配侧边栏初始宽度 */
  transition: left 0.3s ease-in-out;
}

.sidebar-collapsed .chatbox-container {
  left: 80px;
  /* 匹配收起后的侧边栏宽度 */
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
  margin-bottom: 200px;
  /* 留出输入框空间 */
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
  left: 400px;
  /* 初始侧边栏宽度 */
  right: 0;
  z-index: 1000;
  background: linear-gradient(to top, rgba(255, 255, 255, 1) 80%, rgba(255, 255, 255, 0));
  padding: 24px 0;
  transition: left 0.3s ease-in-out;
}

.sidebar-collapsed .chatbox-container {
  left: 80px;
  /* 侧边栏收起时的宽度 */
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

  /* 确保滚动条样式统一 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 4px;
  }

}
</style>
