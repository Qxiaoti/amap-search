<template>
  <div class="home">
    <div class="hero">
      <h1 class="hero-title">高德地图商户查询</h1>
      <p class="hero-subtitle">快速查找商户信息，一键导出联系方式</p>
      
      <div class="quick-search">
        <input 
          v-model="keyword" 
          type="text" 
          placeholder="输入商户名称开始搜索..."
          @keypress.enter="goToSearch"
          class="hero-input"
        />
        <button @click="goToSearch" class="hero-btn gradient-btn">开始搜索</button>
      </div>
    </div>

    <div class="features">
      <div class="feature-card" @click="$router.push('/search')">
        <div class="feature-icon">🔍</div>
        <h3>智能搜索</h3>
        <p>支持关键词、城市筛选，快速找到目标商户</p>
      </div>
      <div class="feature-card" @click="$router.push('/favorites')">
        <div class="feature-icon">⭐</div>
        <h3>收藏管理</h3>
        <p>收藏常用商户，随时查看联系信息</p>
      </div>
      <div class="feature-card" @click="$router.push('/analytics')">
        <div class="feature-icon">📊</div>
        <h3>数据分析</h3>
        <p>查看使用统计，分析搜索趋势</p>
      </div>
      <div class="feature-card" @click="$router.push('/compare')">
        <div class="feature-icon">🔄</div>
        <h3>商户对比</h3>
        <p>对比多个商户信息，做出更好选择</p>
      </div>
    </div>

    <div class="stats">
      <div class="stat-item">
        <div class="stat-number">{{ searchCount }}</div>
        <div class="stat-label">搜索次数</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ favoriteCount }}</div>
        <div class="stat-label">收藏商户</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ historyCount }}</div>
        <div class="stat-label">历史记录</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ exportCount }}</div>
        <div class="stat-label">导出次数</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const keyword = ref('')
const searchCount = ref(0)
const favoriteCount = ref(0)
const historyCount = ref(0)
const exportCount = ref(0)

onMounted(() => {
  try {
    const historyStr = localStorage.getItem('search_history') || '[]'
    const favoritesStr = localStorage.getItem('favorites') || '[]'
    
    let history = []
    let favorites = []
    
    try {
      history = JSON.parse(historyStr)
    } catch (e) {
      console.error('解析历史失败:', e)
    }
    
    try {
      favorites = JSON.parse(favoritesStr)
    } catch (e) {
      console.error('解析收藏失败:', e)
    }
    
    const count = parseInt(localStorage.getItem('search_count') || '0')
    const exports = parseInt(localStorage.getItem('export_count') || '0')
    
    searchCount.value = count
    favoriteCount.value = favorites.length
    historyCount.value = history.length
    exportCount.value = exports
  } catch (e) {
    console.error('加载首页数据失败:', e)
  }
})

const goToSearch = () => {
  if (keyword.value.trim()) {
    router.push({ name: 'Search', query: { q: keyword.value } })
  } else {
    router.push({ name: 'Search' })
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

.hero {
  text-align: center;
  padding: 20px 20px 20px;
}

.hero-title {
  font-size: 42px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 8px;
  letter-spacing: -1.5px;
}

.hero-subtitle {
  font-size: 18px;
  color: #888888;
  margin-bottom: 24px;
  font-weight: 400;
}

.quick-search {
  display: flex;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
}

.hero-input {
  flex: 1;
  padding: 18px 24px;
  border: none;
  font-size: 18px;
  background: white;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.hero-input:focus {
  outline: none;
  box-shadow: 0 6px 30px rgba(255,100,130,0.2);
}

.hero-btn {
  padding: 18px 40px;
  color: white;
  border: none;
  font-size: 18px;
  cursor: pointer;
  border-radius: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.hero-btn:not(.gradient-btn) {
  background: linear-gradient(135deg, #F9A8D4 0%, #F48FB1 100%);
  box-shadow: 0 6px 24px rgba(255,100,130,0.3);
}

.hero-btn:hover:not(.gradient-btn) {
  transform: translateY(-3px);
  box-shadow: 0 10px 35px rgba(255,100,130,0.4);
}

.features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px 20px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: white;
  padding: 24px 16px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: all 0.3s;
  cursor: pointer;
  border: 2px solid transparent;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  border-color: #F9A8D4;
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.feature-card h3 {
  font-size: 16px;
  color: #333333;
  margin-bottom: 6px;
  font-weight: 600;
}

.feature-card p {
  font-size: 12px;
  color: #888888;
  line-height: 1.4;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.stat-item {
  text-align: center;
  padding: 24px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: all 0.3s;
}

.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.stat-number {
  font-size: 44px;
  font-weight: 700;
  color: #F9A8D4;
  margin-bottom: 8px;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #888888;
  font-weight: 500;
}
</style>


.feature-card {
  cursor: pointer;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding: 60px 20px;
  max-width: 1000px;
  margin: 0 auto;
}
