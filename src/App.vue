<template>
  <div id="app">
    <div id="lottie-container" style="width: 300px; height: 300px;"></div>
    <!-- 顶部提问栏 -->
    <InputBar class="input-container" @submit="handleQuestion" />

    <!-- AI回答展示面板 -->
    <AnswersPanel 
      :mode="displayMode"
      :ai-list="aiList"
      :responses="responses"
    />

    <!-- 思维链可视化区域 -->
    <ChainGraph :chainData="chainData" :currentStep="currentStep" />
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue';  // 导入 onMounted
import InputBar from './components/InputBar.vue';
import { useAIWebSocket } from './websocket.js';
import ChainGraph from './components/ChainGraph.vue';
import AnswersPanel from './components/AnswersPanel.vue';
import axios from 'axios'; // 引入axios库
import lottie from 'lottie-web';  // 引入lottie-web

export default {
  name: 'App',
  components: {
    InputBar,
    ChainGraph,
    AnswersPanel
  },

  setup() {
    const question = ref(''); // 响应式数据
    const displayMode = ref('parallel');
    const chainData = ref([]); // 将由后台提供的GPT思维链步骤数据填充
    const currentStep = ref(-1); // 当前推理到的步骤索引

    const responses = ref({}); // 添加一个响应式对象，用于保存每个AI的回答内容
    const requestStartTime = ref(null); // 用于记录请求的开始时间
    // 定义使用的多个AI名称及其Logo（这里示例使用3个，可扩展到GPT、DeepSeek等）
    const aiList = [
      { name: 'GPT', logo: require('@/assets/chatgpt.png') },
      { name: 'DeepSeek', logo: require('@/assets/deepseek.png') },
      { name: 'Kimi', logo: require('@/assets/kimi.png') }
    ];

    // 提取名称数组用于初始化 WebSocket
    const aiNames = aiList.map(ai => ai.name);

    // 建立 WebSocket 连接并获得响应数据和发送函数
    const { responses: wsResponses, sendQuestion } = useAIWebSocket('ws://localhost:8082/chat', aiNames);

    // 处理提交的问题：调用 WebSocket 发送，同时重置思维链数据
    const handleQuestion = (question) => {
      if (question.trim() === '') return;

      // 发送问题到后端的 REST API
      axios.post('http://localhost:8082/api/ask', { question })
      .then((response) => {
        /*
        数据格式：
        {
          "answer1": "回答1",
          "answer2": "回答2"
        }
          把answer1、2、3和gpt、deepseek、kimi对应起来
        */

        const keyMap = {
          "answer1": "GPT",
          "answer2": "DeepSeek",
          "answer3": "Kimi"
        };
        const elapsedTimeInSeconds = (performance.now() - requestStartTime.value) / 1000;

        for (const key in keyMap) {
          responses.value[keyMap[key]] = {
            content: response.data[key],
            done: false,
            responseTime: elapsedTimeInSeconds.toFixed(1),  // 保留一位小数
            confidence: '未知'  // 初始化为未知
          }
        }

        
        
      })
      .catch((error) => {
        console.error('Error:', error);
      });



      // 发送问题到 WebSocket
      sendQuestion(question);
      
      // 重置思维链
      chainData.value = [];
      currentStep.value = -1;
    };

    // 监听某个AI的回答进度来模拟更新思维链（这里以 GPT 为例）
    watch(() => wsResponses.GPT?.content, (newContent, oldContent) => {
      if (newContent && newContent.length > oldContent?.length) {
        // 简单模拟：每当GPT内容新增一句话，就添加一个思维链节点
        if (newContent.endsWith('。\n') || newContent.endsWith('.\n')) {
          // 避免重复推送
          if (!chainData.value.some(step => step.info === newContent)) {
            chainData.value.push({ step: chainData.value.length + 1, info: newContent });
            currentStep.value = chainData.value.length - 1; // 高亮最新步骤
          }
        }
      }
    });

    // 当GPT回答完成时，取消高亮（例如高亮指数设为无效值）
    watch(() => wsResponses.GPT?.done, (done) => {
      if (done) {
        currentStep.value = -1;
      }
    });

    // 在组件挂载后加载动画
    onMounted(() => {
      lottie.loadAnimation({
        container: document.getElementById('lottie-container'),  // 容器
        renderer: 'svg',  // 渲染方式
        loop: true,  // 是否循环播放
        autoplay: true,  // 是否自动播放
        path: 'http://localhost:8080/logo.json',  // JSON 动画的路径

      });
    });

    return {
      question,
      handleQuestion,
      displayMode,
      aiList,
      chainData,
      currentStep,
      responses
    };
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 10px;  /* 将这里的值调小 */
  padding-top: 10px; /* 将这里的值调小 */
}


.input-container {
  left: 50%;
  transform: translateX(-50%);
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
  width: 300px;   /* 可以根据需求调整宽度 */
  height: 300px;  /* 可以根据需求调整高度 */
  margin: 0 auto; /* 使其水平居中 */
}

</style>
