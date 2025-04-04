<!-- components/AppSideBar.vue -->
<template>
    <div>
        <button class="sidebar-toggle" :class="{ collapsed: collapsed }" @click="$emit('toggle')">
            <span class="toggle-text">{{ collapsed ? '→' : '←' }}</span>
        </button>

        <nav id="sidebar" :class="{ collapsed: collapsed }" aria-label="主导航">
            <div class="sidebar-header">
                <h1>Many AI</h1>
            </div>
            <ul class="nav-menu">
                  <li class="nav-item" :class="{ active: activeView === 'chat' }" @click="handleNewConversationClick">
                    <a href="#" class="nav-link">
                        <span class="icon">➕</span>
                        <span class="text">开启新对话</span>
                    </a>
                </li>
                <li class="nav-item" :class="{ active: activeView === 'history' }" @click="changeView('history')">
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
    </div>
</template>

<script>
export default {
  name: 'AppSideBar',
  props: {
    collapsed: {
      type: Boolean,
      required: true
    },
    activeView: {
      type: String,
      required: true
    }
  },
  // 声明会触发的事件，增加了 'new-conversation-created'
  emits: ['toggle', 'view-change', 'new-conversation-created'],
  methods: {
    // 通用的视图切换方法，只负责触发 view-change 事件
    changeView(view) {
      this.$emit('view-change', view)
    },
    // 处理“开启新对话”点击的专属方法
    async handleNewConversationClick() {
      // 1. 切换视图（如果需要的话，父组件会处理）
      this.changeView('chat');

      // 2. 发起 API 请求创建新对话
      try {
        const response = await fetch('http://localhost:8082/api/coze/create', {
          method: 'POST',
          headers: {
            // 如果API需要，可以添加 Content-Type 等头信息
            'Content-Type': 'application/json',
            // 'Accept': 'application/json' // 根据API要求添加
          },
          // 如果API需要 body，可以在这里添加
          // body: JSON.stringify({ /* some data if needed */ })
        });

        if (!response.ok) {
          // 处理 HTTP 错误状态 (例如 404, 500)
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 3. 检查返回的数据并提取 conversationId
        if (data && data.conversationId) {
          console.log('New conversation created, ID:', data.conversationId);
          // 4. 触发新事件，将 conversationId 传递给父组件
          this.$emit('new-conversation-created', data.conversationId);
        } else {
          console.error('Failed to get conversationId from response:', data);
          // 这里可以添加错误处理逻辑，例如通知用户
        }

      } catch (error) {
        // 处理网络错误或 JSON 解析错误
        console.error('Error creating new conversation:', error);
        // 这里可以添加错误处理逻辑，例如通知用户创建失败
      }
    }
  }
}
</script>

<style scoped>
/* 新增激活状态样式 */
.nav-item.active {
  background: var(--hover-bg);
  border-left: 4px solid var(--secondary-color);
}

.nav-item.active .nav-link {
  font-weight: 600;
  color: var(--secondary-color);
}

.nav-item.active .icon {
  opacity: 1;
}
/* 切换按钮样式 */
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
}

.sidebar-toggle:hover {
    transform: scale(1.08);
    background: #3aa876;
}

.toggle-text {
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
    transform: translateX(-1px);
}

.sidebar-toggle.collapsed {
    left: 88px;
}

/* 侧边栏样式 */
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
}

#sidebar.collapsed {
    transform: translateX(-100%);
}

.sidebar-header {
    padding: 24px;
    border-bottom: 1px solid #e3e8ee;
}

.sidebar-header h1 {
    margin: 0;
    color: var(--primary-color);
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.5px;
}

.nav-menu {
    padding: 16px 0;
    flex-grow: 1;
}

.nav-item {
    margin: 6px 12px;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.nav-item:hover {
    background: var(--hover-bg);
    transform: translateX(4px);
}

.nav-link {
    display: flex;
    align-items: center;
    padding: 14px 20px;
    color: var(--primary-color);
    text-decoration: none;
    transition: all 0.2s;
}

.nav-link .icon {
    margin-right: 14px;
    font-size: var(--nav-icon-size);
    width: 24px;
    text-align: center;
}

.nav-link .text {
    font-size: 1.05rem;
    font-weight: 500;
    opacity: 0.9;
}

@media (max-width: 768px) {
    #sidebar:not(.collapsed) {
        width: 100%;
        z-index: 100;
    }

    .sidebar-toggle {
        top: 10px;
        left: 10px;
    }
}


</style>