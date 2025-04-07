<template>
  <div id="app" class="app-container">
    <AppSideBar :collapsed="sidebarCollapsed" :active-view="activeView" @toggle="toggleSidebar"
      @view-change="handleViewChange" @new-conversation-created="handleNewConversation" />

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
            <!-- Optional: Display convId for debugging -->
            <!-- <p>Debug: Current ConvID = {{ convId || 'None' }}</p> -->
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
// Keep imports as they are
import { ref, watch, onMounted, computed, reactive } from 'vue';
import { useAIWebSocket } from './websocket.js'; 
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
    const displayMode = ref('parallel');
    const responses = ref({});
    const requestStartTime = ref(null);
    const convId = ref(null); // <-- Add state for Conversation ID

    const aiList = [
      { name: 'GPT', logo: require('@/assets/chatgpt.png') },
      { name: 'DeepSeek', logo: require('@/assets/deepseek.png') },
      { name: 'Kimi', logo: require('@/assets/kimi.png') },
      { name: 'coze', logo: require('@/assets/coze.png') },
    ];

    // --- WebSocket Setup ---
    // const wsAiNames = aiList.filter(ai => ai.name !== 'coze').map(ai => ai.name);
    const wsAiNames = aiList.map(ai => ai.name);
    const { responses: wsResponses, sendQuestion } = useAIWebSocket('ws://localhost:8082/chat', wsAiNames);
    //打印responses的内容
    console.log(wsResponses);

    // --- Computed Property for Display ---
    const processedResponses = computed(() => {
      const processed = {};
      aiList.forEach(ai => {
        const responseData = responses.value[ai.name];
        processed[ai.name] = {
          name: ai.name,
          content: responseData?.content || '',
          reasoning: responseData?.reasoning || '',
          done: responseData?.done || false,
          responseTime: responseData?.responseTime?.toString() || '0.0',
          confidence: responseData?.confidence || null,
          error: responseData?.error || null,
          lastUpdated: responseData?.lastUpdated || 0,
        };
      });
      return processed;
    });

    // --- Watch WebSocket Responses ---
    watch(wsResponses, (newWsData) => {
      for (const [aiName, data] of Object.entries(newWsData)) {
        if (responses.value[aiName]) {
          // Only update fields that exist in the incoming data
          Object.keys(data).forEach(key => {
            if (key in responses.value[aiName]) {
              responses.value[aiName][key] = data[key];
            }
          });
        } else {
          console.warn(`Received WS data for unexpected or uninitialized AI: ${aiName}`);
          // Initialize defensively if necessary, but handleQuestion should normally do this
          responses.value[aiName] = reactive({
            name: aiName,
            content: data.content || '',
            reasoning: data.reasoning || '',
            done: data.done || false,
            responseTime: data.responseTime || 0,
            confidence: data.confidence || null,
            error: data.error || null,
            lastUpdated: data.lastUpdated || Date.now(), // Add timestamp
          });
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
        fullResponses: { ...responses.value },
        convId: convId.value // 新增：保存当前会话ID
      };
      console.log('Attempting to save history item:', newItem);
      history.value.unshift(newItem);
      if (history.value.length > 100) history.value.pop();
      localStorage.setItem('chatHistory', JSON.stringify(history.value));
    };

    // --- Question Handling (Main Logic) ---
    const handleQuestion = async (questionText) => {
      if (questionText.trim() === '') return;

      console.log(`Handling question: "${questionText}"`);
      showAnswers.value = true;
      hasFirstQuestion.value = true;
      // activeView should already be 'chat' if ChatBox is visible, but double-check isn't harmful
      if (activeView.value !== 'chat') activeView.value = 'chat';
      requestStartTime.value = performance.now();

      // 1. Initialize/Reset state for ALL AIs
      responses.value = aiList.reduce((acc, ai) => {
        acc[ai.name] = reactive({
          name: ai.name, content: '', reasoning: '', done: false,
          responseTime: 0, confidence: null, error: null, lastUpdated: 0,
        });
        return acc;
      }, {});
      console.log("Initial responses state:", JSON.stringify(responses.value));

      // 2. Trigger WebSocket AIs
      if (wsAiNames.length > 0) {
        console.log("Sending question to WebSocket AIs:", wsAiNames);
        sendQuestion(questionText, convId.value);
      }

      // 3. Trigger Coze API call (using dynamic convId)
      const cozeAiInfo = aiList.find(ai => ai.name === 'coze');
      if (cozeAiInfo) {
        // --- Use the dynamic convId ---
        const currentConversationId = convId.value;
        if (!currentConversationId) {
          console.error("Cannot call Coze: No active conversation ID. Please start a new conversation.");
          // Update Coze state to show an error immediately
          responses.value.coze.error = "请先点击'开启新对话'来获取会话ID";
          responses.value.coze.done = true;
          responses.value.coze.lastUpdated = Date.now();
          // Skip the rest of the Coze logic
        } 
      }

      // 4. Interval Timer to check completion
      let checkCount = 0; // Prevent infinite loops
      const maxChecks = 120; // e.g., 1 minute if interval is 500ms

      const checkCompletionInterval = setInterval(() => {
        checkCount++;
        const allDone = aiList.every(ai => responses.value[ai.name]?.done);

        if (allDone || checkCount > maxChecks) {
          if (checkCount > maxChecks) {
            console.warn("Completion check timed out. Saving history with current state.");
            // Mark any non-done WS responses as errored or timed out
            wsAiNames.forEach(aiName => {
              if (responses.value[aiName] && !responses.value[aiName].done) {
                responses.value[aiName].error = "响应超时";
                responses.value[aiName].done = true; // Mark as done to stop waiting
                responses.value[aiName].lastUpdated = Date.now();
              }
            });
          } else {
            console.log("All AIs finished. Saving history.");
          }
          addHistoryItem(questionText, responses.value); // Save the final state
          clearInterval(checkCompletionInterval); // Stop checking
        } else {
          // Update elapsed time for non-done WS responses
          const elapsed = Number((performance.now() - requestStartTime.value) / 1000);
          wsAiNames.forEach(aiName => {
            if (responses.value[aiName] && !responses.value[aiName].done && responses.value[aiName].responseTime < elapsed) {
              // Only update if WS hasn't provided a final time yet
              responses.value[aiName].responseTime = elapsed.toFixed(1);
            }
          });
        }
      }, 500);
    };

    // --- View Switching ---
    const handleViewChange = (view) => {
      console.log('Switching view to:', view);
      activeView.value = view;
      // When switching to a non-chat view, or explicitly starting a *new* chat
      // via the sidebar (which triggers this AND handleNewConversation),
      // reset the chat state.
      if (view !== 'chat') {
        showAnswers.value = false;
        hasFirstQuestion.value = false;
        responses.value = {}; // Clear responses
        // convId.value = null; // Decide if switching view should clear the ID
        // If 'Start New' always gets a fresh ID, maybe not needed here.
        // But if user switches to History then back to Chat, should they resume?
        // Current logic: 'Start New' gets a new ID, switching away doesn't clear it.
      } else {
        // If switching TO chat (e.g., from history click), we load history or start fresh.
        // 'Start New Conversation' click handles its own reset/ID fetch.
        // Loading history handles its state in `loadHistory`.
        // If simply switching back to chat *without* clicking 'Start New',
        // do we want to clear state? The current `handleNewConversationClick`
        // in Sidebar already calls `changeView('chat')`, so this might be redundant
        // or cause double resets. Let's keep chat state reset minimal here.
        // The main reset for a *new* conversation happens via the 'Start New' flow.
      }
    };

    // --- Handler for the new conversation event ---
    const handleNewConversation = (newConversationId) => {
      console.log('Parent received new conversation ID:', newConversationId);
      convId.value = newConversationId; // Update the conversation ID state
      // It's good practice to also reset the chat display when starting fresh
      showAnswers.value = false;
      hasFirstQuestion.value = false;
      responses.value = {}; // Clear previous responses for the new chat
      // activeView should already be 'chat' because handleNewConversationClick calls changeView('chat') first
      // Ensure activeView is 'chat' if somehow it wasn't
      if (activeView.value !== 'chat') {
        activeView.value = 'chat';
      }
    };

    // --- Load History ---
    const loadHistory = (historyItem) => {
      console.log("加载历史记录，恢复会话ID:", historyItem.convId);
      activeView.value = 'chat';
      responses.value = historyItem.fullResponses || {};
      convId.value = historyItem.convId || null; // 新增：恢复历史会话ID
      showAnswers.value = true;
      hasFirstQuestion.value = true;
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
          localStorage.removeItem('chatHistory');
        }
      }
      // Optional: Automatically start a new conversation on initial load?
      // If so, you'd need to trigger the same logic as handleNewConversationClick
      // perhaps by calling a shared function or emitting from the child on mount.
      // Example (would require AppSidebar changes to handle this):
      // childSidebarRef.value?.startNewConversationOnInit();
      // Or just call the API directly here if preferred:
      // async function initConversation() { ... fetch ... handleNewConversation(id); }
      // initConversation();
    });

    return {
      sidebarCollapsed,
      activeView,
      history,
      toggleSidebar: () => sidebarCollapsed.value = !sidebarCollapsed.value,
      handleQuestion,
      displayMode,
      aiList,
      responses,
      showAnswers,
      hasFirstQuestion,
      handleViewChange,
      loadHistory,
      processedResponses,
      convId, // <-- Return convId
      handleNewConversation // <-- Return the handler
    };
  }
};
</script>

<style>
/* Styles remain the same */
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
