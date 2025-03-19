<template>
  <div class="assist-touch" :style="{ left: posX + 'px', top: posY + 'px' }" @mousedown.prevent="startDrag"
    @click.stop="toggleMenu" ref="touchButton">
    <div class="touch-circle"></div>

    <transition name="firework">
      <div v-if="showMenu" class="firework-menu" :style="menuPosition">
        <div v-for="(item, index) in menuItems" :key="index" class="menu-spark" :style="getSparkStyle(index)"
          @click.stop="handleMenuAction(item.action)">
          <div class="spark-content">
            <span class="icon">{{ item.icon }}</span>
            <span class="label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

export default {
  name: 'AssistTouch',
  setup() {
    const posX = ref(30);
    const posY = ref(30);
    const isDragging = ref(false);
    const offsetX = ref(0);
    const offsetY = ref(0);
    const showMenu = ref(false);
    const touchButton = ref(null);

    const menuItems = ref([
      { icon: '🏠', label: 'GPT', action: 'home' },
      { icon: '📋', label: 'DeepSeek', action: 'copy' },
      { icon: '📁', label: 'Kimi', action: 'file' },
      { icon: '⚙️', label: '豆包', action: 'settings' }
    ]);

    const menuPosition = computed(() => ({
      left: posX.value > window.innerWidth / 2 ? '-180px' : '40px',
      top: posY.value > window.innerHeight / 2 ? '-160px' : '40px'
    }));

    const startDrag = (e) => {
      isDragging.value = true;
      showMenu.value = false;
      if (touchButton.value) {
        const rect = touchButton.value.getBoundingClientRect();
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

    const handleMenuAction = (action) => {
      console.log('执行操作:', action);
      showMenu.value = false;
    };

    const handleOutsideClick = (e) => {
      if (touchButton.value && !touchButton.value.contains(e.target)) {
        showMenu.value = false;
      }
    };

    const getSparkStyle = (index) => {
      const count = menuItems.value.length;
      const angle = (index * 360) / count;
      return {
        transform: `
      translate(-15%, -100%) 
      rotate(${angle}deg) 
      translate(100px) 
      rotate(-${angle}deg)
    `,
        transformOrigin: 'center center'
      };
    };
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
      posX,
      posY,
      isDragging,
      showMenu,
      menuItems,
      menuPosition,
      touchButton,
      startDrag,
      toggleMenu,
      handleMenuAction,
      getSparkStyle
    };
  }
};
</script>

<style scoped>
.firework-enter-active .menu-spark {
  opacity: 1;
  transform: translate(-50%, -50%) rotate(var(--angle)) translate(var(--distance)) rotate(calc(-1 * var(--angle)));
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}


/* 添加中心定位修正 */
.spark-content {
  /* 添加定位修正 */
  position: relative;
  left: -50%;
  top: -50%;
  transform: translate(50%, 50%);
}

.firework-menu {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
}

.menu-spark {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}


.spark-content {
  min-width: 100px;
  min-height: 40px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  transform: scale(0.5);
  transition: all 0.3s;
}

.menu-spark:hover .spark-content {
  transform: scale(1.1);
  background: rgba(66, 185, 131, 0.9);
}

.icon {
  margin-right: 8px;
  font-size: 1.2em;
}


/* 修改动画效果 */
.firework-enter-active .menu-spark {
  opacity: 1;
  transform: translate(0, 0) scale(1);
}

.firework-leave-active .menu-spark {
  transition: all 0.3s;
  opacity: 0;
  transform: translate(0, 0) scale(0);
}

.firework-enter-from .menu-spark {
  opacity: 0;
  transform: translate(0, 0) scale(0);
}

.firework-leave-to .menu-spark {
  opacity: 0;
  transform: translate(0, 0) scale(0);
}


.menu-spark:nth-child(1) {
  transition-delay: 0.1s;
}

.menu-spark:nth-child(2) {
  transition-delay: 0.2s;
}

.menu-spark:nth-child(3) {
  transition-delay: 0.3s;
}

.menu-spark:nth-child(4) {
  transition-delay: 0.4s;
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
    display: none;
  }
}
</style>