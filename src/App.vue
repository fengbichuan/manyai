<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <HelloWorld msg="Welcome to Your Vue.js App"/>
  <input v-model="question" @keyup.enter="submitQuestion" placeholder="请输入你的问题"/>
  <button @click="submitQuestion">提交</button>


  <div id="app">
      <!-- 顶部提问栏 -->
      <InputBar @submit="handleQuestion" />
      <!-- AI回答展示面板 -->
      <AnswersPanel :mode="displayMode" :responses="responses" @update:mode="val => displayMode = val" />
      <!-- 思维链可视化区域（这里假设显示第一个AI的思维链） -->
      <ChainGraph :chainData="chainData" :currentStep="currentStep" />
    </div>

</template>


<script>
import { ref, defineEmits } from 'vue';
import HelloWorld from './components/HelloWorld.vue';
import InputBar from './components/InputBar.vue'
export default {
  name: 'App',
  components: {
    InputBar,
    HelloWorld
  },

  setup() {
    const question = ref(''); // 响应式数据

    const emit = defineEmits(); // 定义 emit

    const submitQuestion = () => {
      if (question.value.trim() !== '') {
        emit('submit', question.value.trim()); // 发出提交事件
        question.value = ''; // 清空输入框
      }
    }

    return {
      question,
      submitQuestion
    };
  }
}
</script>















<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
