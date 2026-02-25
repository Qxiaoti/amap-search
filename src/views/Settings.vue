<template>
  <div class="settings-page">
    <div class="page-header">
      <h2>设置</h2>
      <p class="subtitle">配置应用参数</p>
    </div>

    <div class="settings-section">
      <h3 class="section-title">API 配置</h3>
      <div class="setting-item">
        <label>高德地图 API Key</label>
        <input 
          v-model="apiKey" 
          type="text" 
          placeholder="请输入你的API Key"
          @blur="saveApiKey"
        />
        <small>
          没有API Key？访问 
          <a href="https://console.amap.com/dev/key/app" target="_blank">高德开放平台</a> 
          免费申请
        </small>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">数据管理</h3>
      <div class="setting-item">
        <div class="setting-row">
          <div>
            <div class="setting-label">搜索历史</div>
            <div class="setting-desc">{{ historyCount }} 条记录</div>
          </div>
          <button @click="clearHistory" class="danger-btn">清空</button>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-row">
          <div>
            <div class="setting-label">收藏商户</div>
            <div class="setting-desc">{{ favoriteCount }} 个商户</div>
          </div>
          <button @click="clearFavorites" class="danger-btn">清空</button>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-row">
          <div>
            <div class="setting-label">搜索统计</div>
            <div class="setting-desc">累计搜索 {{ searchCount }} 次</div>
          </div>
          <button @click="resetCount" class="danger-btn">重置</button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">关于</h3>
      <div class="about-info">
        <div class="about-item">
          <span class="about-label">版本</span>
          <span class="about-value">1.0.0</span>
        </div>
        <div class="about-item">
          <span class="about-label">技术栈</span>
          <span class="about-value">Vue 3 + Vite</span>
        </div>
        <div class="about-item">
          <span class="about-label">数据来源</span>
          <span class="about-value">高德地图开放平台</span>
        </div>
      </div>
    </div>

    <div class="save-notice" v-if="saved">✓ 已保存</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const apiKey = ref('')
const historyCount = ref(0)
const favoriteCount = ref(0)
const searchCount = ref(0)
const saved = ref(false)

onMounted(() => {
  loadSettings()
})

const loadSettings = () => {
  try {
    const savedKey = localStorage.getItem('amap_api_key')
    if (savedKey) apiKey.value = savedKey

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

    historyCount.value = history.length
    favoriteCount.value = favorites.length
    searchCount.value = count
  } catch (e) {
    console.error('加载设置失败:', e)
  }
}

const saveApiKey = () => {
  if (apiKey.value.trim()) {
    localStorage.setItem('amap_api_key', apiKey.value)
    showSaved()
  }
}

const clearHistory = () => {
  if (confirm('确定要清空搜索历史吗？')) {
    localStorage.removeItem('search_history')
    historyCount.value = 0
    showSaved()
  }
}

const clearFavorites = () => {
  if (confirm('确定要清空所有收藏吗？')) {
    localStorage.removeItem('favorites')
    favoriteCount.value = 0
    showSaved()
  }
}

const resetCount = () => {
  if (confirm('确定要重置搜索统计吗？')) {
    localStorage.setItem('search_count', '0')
    searchCount.value = 0
    showSaved()
  }
}

const showSaved = () => {
  saved.value = true
  setTimeout(() => {
    saved.value = false
  }, 2000)
}
</script>

<style scoped>
.settings-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  margin-bottom: 40px;
}

.page-header h2 {
  font-size: 32px;
  color: #333333;
  margin-bottom: 8px;
  font-weight: 600;
}

.subtitle {
  font-size: 18px;
  color: #888888;
}

.settings-section {
  background: white;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.section-title {
  font-size: 20px;
  color: #333333;
  margin-bottom: 24px;
  font-weight: 600;
}

.setting-item {
  margin-bottom: 24px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  margin-bottom: 12px;
  color: #333333;
  font-size: 16px;
  font-weight: 500;
}

.setting-item input {
  width: 100%;
  padding: 14px 18px;
  border: none;
  background: #F9F9F9;
  border-radius: 10px;
  font-size: 16px;
  margin-bottom: 8px;
}

.setting-item input:focus {
  outline: none;
  background: #EEEEEE;
}

.setting-item small {
  color: #888888;
  font-size: 14px;
}

.setting-item a {
  color: #F9A8D4;
  text-decoration: none;
}

.setting-item a:hover {
  text-decoration: underline;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #F9F9F9;
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 16px;
  color: #333333;
  font-weight: 500;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 14px;
  color: #888888;
}

.danger-btn {
  padding: 8px 20px;
  background: #F9F9F9;
  color: #E91E63;
  border: none;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  box-shadow: none;
}

.danger-btn:hover {
  background: #E91E63;
  color: white;
  transform: translateY(-1px);
}

.about-info {
  padding: 20px 0;
}

.about-item {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #F9F9F9;
}

.about-item:last-child {
  border-bottom: none;
}

.about-label {
  font-size: 16px;
  color: #888888;
}

.about-value {
  font-size: 16px;
  color: #333333;
  font-weight: 500;
}

.save-notice {
  position: fixed;
  bottom: 40px;
  right: 40px;
  padding: 16px 24px;
  background: #34c759;
  color: white;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(52, 199, 89, 0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
