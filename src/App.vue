<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <router-link to="/" class="logo">🗺️ 商户查询</router-link>
        <div class="nav-links" :class="{ open: menuOpen }">
          <router-link to="/" class="nav-link" @click="menuOpen = false">首页</router-link>
          <router-link to="/search" class="nav-link" @click="menuOpen = false">搜索</router-link>
          <router-link to="/multi-search" class="nav-link" @click="menuOpen = false">对比搜索</router-link>
          <router-link to="/favorites" class="nav-link" @click="menuOpen = false">收藏</router-link>
          <router-link to="/history" class="nav-link" @click="menuOpen = false">历史</router-link>
          <router-link to="/analytics" class="nav-link" @click="menuOpen = false">分析</router-link>
          <router-link to="/compare" class="nav-link" @click="menuOpen = false">对比</router-link>
          <router-link to="/settings" class="nav-link" @click="menuOpen = false">设置</router-link>
        </div>
        <button class="hamburger" @click="menuOpen = !menuOpen" :class="{ active: menuOpen }">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const menuOpen = ref(false)
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  text-decoration: none;
  transition: color 0.2s;
}

.logo:hover {
  color: #f9a8d4;
}

.nav-links {
  display: flex;
  gap: 28px;
}

.nav-link {
  color: #6e6e73;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  transition: color 0.2s;
  position: relative;
}

.nav-link:hover {
  color: #333;
}

.nav-link.router-link-active {
  color: #f9a8d4;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 0;
  right: 0;
  height: 2px;
  background: #f9a8d4;
}

.main-content {
  flex: 1;
  padding: 20px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

/* 汉堡按钮 */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  box-shadow: none;
}
.hamburger span {
  display: block;
  width: 24px;
  height: 2px;
  background: #333;
  border-radius: 2px;
  transition: all 0.3s;
}
.hamburger.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger.active span:nth-child(2) { opacity: 0; }
.hamburger.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

@media (max-width: 768px) {
  .nav-container {
    height: 52px;
    padding: 0 16px;
  }
  .logo {
    font-size: 17px;
  }
  .hamburger {
    display: flex;
  }
  .nav-links {
    display: none;
    position: absolute;
    top: 52px;
    left: 0;
    right: 0;
    background: #fff;
    flex-direction: column;
    padding: 12px 16px 20px;
    gap: 4px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    z-index: 99;
  }
  .nav-links.open {
    display: flex;
  }
  .nav-link {
    font-size: 15px;
    padding: 12px 16px;
    border-radius: 8px;
  }
  .nav-link:hover {
    background: #fdf2f8;
  }
  .nav-link.router-link-active::after {
    display: none;
  }
  .main-content {
    padding: 12px;
  }
}
</style>
