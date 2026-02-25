<template>
  <div class="history-page">
    <div class="page-header">
      <h2>搜索历史</h2>
      <p class="subtitle">{{ history.length }} 条历史记录</p>
    </div>

    <div v-if="history.length === 0" class="empty-state">
      <div class="empty-icon">🕐</div>
      <h3>暂无搜索历史</h3>
      <p>开始搜索后，历史记录会显示在这里</p>
      <button @click="$router.push('/search')" class="go-search-btn">去搜索</button>
    </div>

    <div v-else class="history-list">
      <div 
        v-for="(item, index) in history" 
        :key="index" 
        class="history-item"
        @click="searchAgain(item)"
      >
        <div class="history-content">
          <div class="history-icon">🔍</div>
          <div class="history-text">{{ item }}</div>
        </div>
        <button 
          class="delete-btn"
          @click.stop="removeHistory(index)"
        >
          ✕
        </button>
      </div>
    </div>

    <div v-if="history.length > 0" class="actions">
      <button @click="clearAll" class="clear-btn">清空历史</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const history = ref([])

onMounted(() => {
  loadHistory()
})

const loadHistory = () => {
  try {
    const saved = localStorage.getItem('search_history')
    if (saved) {
      history.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('加载历史失败:', e)
    history.value = []
  }
}

const searchAgain = (keyword) => {
  router.push({ name: 'Search', query: { q: keyword } })
}

const removeHistory = (index) => {
  try {
    history.value.splice(index, 1)
    localStorage.setItem('search_history', JSON.stringify(history.value))
  } catch (e) {
    console.error('删除历史失败:', e)
    alert('删除失败，请重试')
  }
}

const clearAll = () => {
  if (confirm('确定要清空所有历史记录吗？')) {
    try {
      history.value = []
      localStorage.removeItem('search_history')
    } catch (e) {
      console.error('清空历史失败:', e)
      alert('清空失败，请重试')
    }
  }
}
</script>

<style scoped>
.history-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  margin-bottom: 32px;
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

.empty-state {
  text-align: center;
  padding: 100px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
  opacity: 0.3;
}

.empty-state h3 {
  font-size: 24px;
  color: #333333;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 17px;
  color: #888888;
  margin-bottom: 32px;
}

.go-search-btn {
  padding: 14px 32px;
  background: #F9A8D4;
  color: white;
  border: none;
  font-size: 17px;
  cursor: pointer;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(255,100,130,0.25);
}

.go-search-btn:hover {
  background: #F48FB1;
  transform: translateY(-2px);
}

.history-list {
  display: grid;
  gap: 12px;
  margin-bottom: 32px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.3s;
}

.history-item:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,0.08);
  transform: translateX(8px);
}

.history-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.history-icon {
  font-size: 24px;
  opacity: 0.5;
}

.history-text {
  font-size: 17px;
  color: #333333;
  font-weight: 500;
}

.delete-btn {
  padding: 6px 10px;
  background: transparent;
  color: #888888;
  border: none;
  font-size: 18px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  box-shadow: none;
}

.delete-btn:hover {
  background: #F9F9F9;
  color: #E91E63;
  transform: none;
}

.actions {
  text-align: center;
}

.clear-btn {
  padding: 14px 32px;
  background: #F9F9F9;
  color: #E91E63;
  border: none;
  font-size: 16px;
  cursor: pointer;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: none;
}

.clear-btn:hover {
  background: #E91E63;
  color: white;
  transform: translateY(-2px);
}
</style>
