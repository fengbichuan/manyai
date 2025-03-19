<template>
  <div id="app" class="app-container">
     <!-- 优化后的侧边栏切换按钮 -->
     <button 
       class="sidebar-toggle"
       :class="{ collapsed: sidebarCollapsed }"
       @click="toggleSidebar"
     >
       <span class="toggle-text">{{ sidebarCollapsed ? '→' : '←' }}</span>
     </button>
 
     <!-- 左侧导航栏 -->
     <nav 
       id="sidebar" 
       :class="{ collapsed: sidebarCollapsed }"
       aria-label="主导航"
     >
       <div class="sidebar-header">
         <h1>Many AI</h1>
       </div>
       <ul class="nav-menu">
         <li class="nav-item">
           <a href="#" class="nav-link">
             <span class="icon">➕</span>
             <span class="text">开启新对话</span>
           </a>
         </li>
         <li class="nav-item">
           <a href="#" class="nav-link">
             <span class="icon">📚</span>
             <span class="text">历史记录</span>
           </a>
         </li>
         <li class="nav-item">
           <a href="#" class="nav-link">
             <span class="icon">⭐</span>
             <span class="text">收藏夹</span>
           </a>
         </li>
       </ul>
     </nav>
 
     <!-- 右侧主内容区域 -->
     <main 
       class="main-content"
       :style="{ marginLeft: sidebarCollapsed ? '80px' : '280px' }"
     >
       <div class="content-wrapper">
         <div id="lottie-container" ></div>
         
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
   </div>
 
   <div 
     class="assist-touch"
     :style="{left: posX + 'px', top: posY + 'px'}"
     @mousedown.prevent="startDrag"
     @click.stop="toggleMenu"
     ref="touchButton"
   >
     <div class="touch-circle"></div>
     
     <transition name="menu-fade">
       <div 
         v-if="showMenu"
         class="action-menu"
         :style="menuPosition"
       >
         <div 
           v-for="(item, index) in menuItems"
           :key="index"
           class="menu-item"
           @click.stop="handleMenuAction(item.action)"
         >
           <span class="icon">{{ item.icon }}</span>
           <span class="label">{{ item.label }}</span>
         </div>
       </div>
     </transition>
   </div>
 
 </template>
 
 <script>
 import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
 import InputBar from './components/InputBar.vue';
 import { useAIWebSocket } from './websocket.js';
 //import ChainGraph from './components/ChainGraph.vue';
 import AnswersPanel from './components/AnswersPanel.vue';
 import axios from 'axios';
 import lottie from 'lottie-web';
 
 export default {
   name: 'App',
   components: {
     InputBar,
     //ChainGraph,
     AnswersPanel
   },
   setup() {
     // 旧的逻辑部分
     const sidebarCollapsed = ref(false);
     const toggleSidebar = () => {
       sidebarCollapsed.value = !sidebarCollapsed.value;
     };
 
     const question = ref('');
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
 
     // 新增的拖拽和菜单部分
     const posX = ref(30);
     const posY = ref(30);
     const isDragging = ref(false);
     const offsetX = ref(0);
     const offsetY = ref(0);
     const showMenu = ref(false);
     const menuItems = ref([
       { icon: '🏠', label: 'GPT', action: 'home' },
       { icon: '📋', label: 'DeepSeek', action: 'copy' },
       { icon: '📁', label: 'Kimi', action: 'file' },
       { icon: '⚙️', label: '豆包', action: 'settings' }
     ]);
 
     const menuPosition = computed(() => {
       return {
         left: posX.value > window.innerWidth / 2 ? '-180px' : '40px',
         top: posY.value > window.innerHeight / 2 ? '-160px' : '40px'
       };
     });
 
     // 定义一个 ref 用来获取按钮 DOM 元素（需在模板中绑定 ref="touchButtonRef"）
     const touchButtonRef = ref(null);
 
     const startDrag = (e) => {
       isDragging.value = true;
       showMenu.value = false;
       // 计算精确偏移量，需确保 touchButtonRef 已绑定
       if (touchButtonRef.value) {
         const rect = touchButtonRef.value.getBoundingClientRect();
         offsetX.value = e.clientX - rect.left;
         offsetY.value = e.clientY - rect.top;
       }
     };
 
     const handleDrag = (e) => {
       if (isDragging.value) {
         posX.value = Math.max(0, Math.min(window.innerWidth - 40, e.clientX - offsetX.value));
         posY.value = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - offsetY.value));
       }
     };
 
     const stopDrag = () => {
       isDragging.value = false;
     };
 
     const toggleMenu = () => {
       if (!isDragging.value) {
         showMenu.value = !showMenu.value;
       }
     };
 
     const handleOutsideClick = (e) => {
       if (touchButtonRef.value && !touchButtonRef.value.contains(e.target)) {
         showMenu.value = false;
       }
     };
 
     const handleMenuAction = (action) => {
       console.log('执行操作:', action);
       switch (action) {
         case 'home':
           window.scrollTo(0, 0);
           break;
         case 'copy':
           navigator.clipboard.writeText('示例文本');
           break;
         // 其他操作……
       }
       showMenu.value = false;
     };
 
     // 注册全局事件监听器
     onMounted(() => {
       document.addEventListener('mousemove', handleDrag);
       document.addEventListener('mouseup', stopDrag);
       document.addEventListener('click', handleOutsideClick);
     });
 
     onBeforeUnmount(() => {
       document.removeEventListener('mousemove', handleDrag);
       document.removeEventListener('mouseup', stopDrag);
       document.removeEventListener('click', handleOutsideClick);
     });
 
     return {
       // 旧的返回项
       sidebarCollapsed,
       toggleSidebar,
       question,
       handleQuestion,
       displayMode,
       aiList,
       chainData,
       currentStep,
       responses,
       wsResponses,
       sendQuestion,
       // 新增的返回项
       posX,
       posY,
       isDragging,
       offsetX,
       offsetY,
       showMenu,
       menuItems,
       menuPosition,
       startDrag,
       handleDrag,
       stopDrag,
       toggleMenu,
       handleOutsideClick,
       handleMenuAction,
       touchButtonRef
     };
   }
 };
 </script>
 
 
 <style>
 .app-container {
   display: flex;
   position: relative;
 }
 
 /* 切换按钮样式 */
 .sidebar-toggle {
   position: fixed;
   top: 10px;
   left: 10px;
   z-index: 110;
   padding: 8px 12px;
   background-color: #e6eef4; /* 青灰色 */
   border: none;
   border-radius: 4px;
   cursor: pointer;
 }
 
 /* 左侧导航栏 */
 #sidebar {
   width: 200px;
   background-color: #e6eef4; /* 青灰色 */
   color: #333;
   padding: 15px;
   position: fixed;
   height: 100%;
   top: 0;
   left: 0;
   overflow: hidden;
   transition: width 0.2s;
 }
 
 #sidebar.collapsed {
   width: 0;
   padding: 20px 0; /* 缩回去时减少左右padding */
 }
 
 /* 导航项样式 */
 #sidebar ul {
   list-style: none;
   padding: 0;
   margin: 0;
 }
 
 #sidebar li {
   margin: 20px 0;
 }
 
 #sidebar a {
   color: #333;
   text-decoration: none;
   font-size: 18px;
 }
 
 /* 主内容区域 */
 .main-content {
   transition: margin-left 0.3s;
   padding: 20px;
   width: calc(100% - 220px);
 }
 
 /* 其他已有样式 */
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
 
 /* 颜色变量 */
 :root {
   --primary-color: #2c3e50;
   --secondary-color: #42b983;
   --sidebar-bg: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
   --hover-bg: rgba(66, 185, 131, 0.1);
   --shadow-color: rgba(0, 0, 0, 0.05);
   --nav-icon-size: 1.4rem;
 }
 
 .app-container {
   display: flex;
   min-height: 100vh;
   background: #f8fafb;
   font-family: 'Segoe UI', system-ui, sans-serif;
 }
 
 /* 侧边栏切换按钮 */
 .sidebar-toggle {
   position: fixed;
   top: 24px;
   left: 24px;
   z-index: 110;
   width: 36px;
   height: 36px;
   background: var(--secondary-color);
   border: none;
   border-radius: 50%;
   cursor: pointer;
   transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
   box-shadow: 0 2px 12px var(--shadow-color);
   display: flex;
   align-items: center;
   justify-content: center;
 
   &:hover {
     transform: scale(1.08);
     background: #3aa876;
   }
 
   .toggle-text {
     color: white;
     font-weight: 600;
     font-size: 1.1rem;
     transform: translateX(-1px);
   }
 
   &.collapsed {
     left: 88px;
   }
 }
 /* 侧边栏 */
 #sidebar {
   width: 240px;
   height: 100vh;
   position: fixed;
   background: var(--sidebar-bg);
   box-shadow: 4px 0 16px var(--shadow-color);
   transition: transform 0.3s ease-in-out;
   overflow: hidden;
   display: flex;
   flex-direction: column;
   border-right: 1px solid #e0e6eb;
 
   &.collapsed {
     transform: translateX(-100%);
   }
 
   .sidebar-header {
     padding: 24px;
     border-bottom: 1px solid #e3e8ee;
     
     h1 {
       margin: 0;
       color: var(--primary-color);
       font-size: 1.6rem;
       font-weight: 700;
       letter-spacing: -0.5px;
     }
   }
 
   .nav-menu {
     padding: 16px 0;
     flex-grow: 1;
   }
 
   .nav-item {
     margin: 6px 12px;
     border-radius: 8px;
     transition: all 0.2s ease;
 
     &:hover {
       background: var(--hover-bg);
       transform: translateX(4px);
     }
   }
 
   .nav-link {
     display: flex;
     align-items: center;
     padding: 14px 20px;
     color: var(--primary-color);
     text-decoration: none;
     transition: all 0.2s;
 
     .icon {
       margin-right: 14px;
       font-size: var(--nav-icon-size);
       width: 24px;
       text-align: center;
     }
 
     .text {
       font-size: 1.05rem;
       font-weight: 500;
       opacity: 0.9;
     }
   }
 }
 
 /* 主内容区 */
 .main-content {
   flex-grow: 1;
   transition: margin 0.3s ease-in-out;
   padding: 32px;
 
   .content-wrapper {
     max-width: 1200px;
     margin: 0 auto;
   }
 
   .lottie-animation {
     width: 300px;
     height: 300px;
     margin: 40px auto;
     background: white;
     border-radius: 16px;
     box-shadow: 0 4px 12px var(--shadow-color);
   }
 
   .ask-section {
     margin: 40px 0;
   }
 
   .response-section {
     margin: 32px 0;
     background: white;
     border-radius: 12px;
     padding: 24px;
     box-shadow: 0 2px 8px var(--shadow-color);
   }
 
   .visualization-section {
     margin-top: 40px;
     background: white;
     border-radius: 12px;
     padding: 24px;
     box-shadow: 0 2px 8px var(--shadow-color);
   }
 }
 
 /* 响应式设计 */
 @media (max-width: 768px) {
   .main-content {
     padding: 24px;
     margin-left: 0 !important;
   }
 
   #sidebar:not(.collapsed) {
     width: 100%;
     z-index: 100;
   }
 
   .sidebar-toggle {
     top: 10px;
     left: 10px;
   }
 }
 
 .assist-touch {
   position: fixed;
   z-index: 9999;
   cursor: move;
   transition: transform 0.2s;
 }
 
 .assist-touch:active {
   transform: scale(0.9);
 }
 
 .touch-circle {
   width: 40px;
   height: 40px;
   background: rgba(255, 255, 255, 0.9);
   border-radius: 50%;
   box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
   display: flex;
   align-items: center;
   justify-content: center;
   position: relative;
 }
 
 .touch-circle::after {
   content: '';
   width: 12px;
   height: 12px;
   background: #42b983;
   border-radius: 50%;
 }
 
 .action-menu {
   position: absolute;
   background: rgba(255, 255, 255, 0.95);
   border-radius: 12px;
   padding: 8px 0;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
   backdrop-filter: blur(10px);
 }
 
 .menu-item {
   display: flex;
   align-items: center;
   padding: 12px 20px;
   min-width: 160px;
   cursor: pointer;
   transition: all 0.2s;
 }
 
 .menu-item:hover {
   background: rgba(66, 185, 131, 0.1);
   transform: translateX(5px);
 }
 
 .menu-item .icon {
   font-size: 1.2rem;
   margin-right: 12px;
 }
 
 .menu-item .label {
   font-size: 0.9rem;
   color: #2c3e50;
 }
 
 .menu-fade-enter-active,
 .menu-fade-leave-active {
   transition: opacity 0.2s, transform 0.2s;
 }
 
 .menu-fade-enter,
 .menu-fade-leave-to {
   opacity: 0;
   transform: scale(0.9);
 }
 
 @media (max-width: 768px) {
   .assist-touch {
     display: none; /* 移动端隐藏 */
   }
 }
 
 </style>