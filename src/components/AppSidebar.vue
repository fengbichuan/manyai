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
                <li class="nav-item" :class="{ active: activeView === 'chat' }" @click="changeView('chat')">
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
        }
    },
    activeView: {
      type: String,
      default: 'chat'
    },
    emits: ['toggle'],
    methods: {
    changeView(view) {
      this.$emit('view-change', view)
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