<template>
  <div class="analytics-page">
    <div class="page-header">
      <h2>数据分析</h2>
      <p class="subtitle">查看你的使用统计</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🔍</div>
        <div class="stat-value">{{ totalSearches }}</div>
        <div class="stat-label">总搜索次数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-value">{{ favorites.length }}</div>
        <div class="stat-label">收藏商户</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📞</div>
        <div class="stat-value">{{ totalPhonesCopied }}</div>
        <div class="stat-label">复制电话次数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-value">{{ totalExports }}</div>
        <div class="stat-label">导出次数</div>
      </div>
    </div>

    <div class="chart-section">
      <h3 class="section-title">热门搜索关键词</h3>
      <div class="keyword-chart">
        <div 
          v-for="(item, index) in topKeywords" 
          :key="index"
          class="keyword-bar"
        >
          <div class="keyword-name">{{ item.keyword }}</div>
          <div class="keyword-bar-container">
            <div 
              class="keyword-bar-fill"
              :style="{ width: (item.count / maxCount * 100) + '%' }"
            ></div>
          </div>
          <div class="keyword-count">{{ item.count }}次</div>
        </div>
      </div>
    </div>

    <div class="chart-section">
      <h3 class="section-title">最近7天搜索趋势</h3>
      <div class="trend-chart">
        <div 
          v-for="(day, index) in last7Days" 
          :key="index"
          class="trend-bar"
        >
          <div 
            class="trend-bar-fill"
            :style="{ height: (day.count / maxDayCount * 100) + '%' }"
          ></div>
          <div class="trend-label">{{ day.label }}</div>
        </div>
      </div>
    </div>

    <div class="chart-section">
      <h3 class="section-title">商户类型分布</h3>
      <div class="type-distribution">
        <div 
          v-for="(type, index) in topTypes" 
          :key="index"
          class="type-item"
        >
          <div class="type-circle" :style="{ background: getColor(index) }"></div>
          <div class="type-info">
            <div class="type-name">{{ type.name }}</div>
            <div class="type-count">{{ type.count }} 个</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const totalSearches = ref(0)
const totalPhonesCopied = ref(0)
const totalExports = ref(0)
const favorites = ref([])
const searchHistory = ref([])
const searchLog = ref([])

onMounted(() => {
  loadAnalytics()
})

const loadAnalytics = () => {
  try {
    totalSearches.value = parseInt(localStorage.getItem('search_count') || '0')
    totalPhonesCopied.value = parseInt(localStorage.getItem('phone_copy_count') || '0')
    totalExports.value = parseInt(localStorage.getItem('export_count') || '0')
    
    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      try {
        favorites.value = JSON.parse(savedFavorites)
      } catch (e) {
        console.error('解析收藏数据失败:', e)
        favorites.value = []
      }
    }
    
    const savedHistory = localStorage.getItem('search_history')
    if (savedHistory) {
      try {
        searchHistory.value = JSON.parse(savedHistory)
      } catch (e) {
        console.error('解析历史数据失败:', e)
        searchHistory.value = []
      }
    }
    
    const savedLog = localStorage.getItem('search_log')
    if (savedLog) {
      try {
        searchLog.value = JSON.parse(savedLog)
      } catch (e) {
        console.error('解析搜索日志失败:', e)
        searchLog.value = []
      }
    }
  } catch (e) {
    console.error('加载分析数据失败:', e)
  }
}

const topKeywords = computed(() => {
  const keywordMap = {}
  searchHistory.value.forEach(keyword => {
    keywordMap[keyword] = (keywordMap[keyword] || 0) + 1
  })
  
  return Object.entries(keywordMap)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

const maxCount = computed(() => {
  return Math.max(...topKeywords.value.map(item => item.count), 1)
})

const last7Days = computed(() => {
  const days = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const count = searchLog.value.filter(log => log.date === dateStr).length
    
    days.push({
      label: i === 0 ? '今天' : `${i}天前`,
      count: count
    })
  }
  
  return days
})

const maxDayCount = computed(() => {
  return Math.max(...last7Days.value.map(day => day.count), 1)
})

const topTypes = computed(() => {
  const typeMap = {}
  favorites.value.forEach(fav => {
    if (fav.type) {
      const mainType = fav.type.split(';')[0]
      typeMap[mainType] = (typeMap[mainType] || 0) + 1
    }
  })
  
  return Object.entries(typeMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
})

const getColor = (index) => {
  const colors = [
    '#F9A8D4', '#ff8a65', '#ffa726', '#ffca28',
    '#66bb6a', '#42a5f5', '#7e57c2', '#ec407a'
  ]
  return colors[index % colors.length]
}
</script>

<style scoped>
.analytics-page {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}

.stat-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.stat-value {
  font-size: 40px;
  font-weight: 700;
  color: #F9A8D4;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 16px;
  color: #888888;
}

.chart-section {
  background: white;
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.section-title {
  font-size: 20px;
  color: #333333;
  margin-bottom: 24px;
  font-weight: 600;
}

.keyword-chart {
  display: grid;
  gap: 16px;
}

.keyword-bar {
  display: grid;
  grid-template-columns: 120px 1fr 60px;
  align-items: center;
  gap: 16px;
}

.keyword-name {
  font-size: 15px;
  color: #333333;
  font-weight: 500;
}

.keyword-bar-container {
  height: 32px;
  background: #F9F9F9;
  border-radius: 8px;
  overflow: hidden;
}

.keyword-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #F9A8D4, #ff8a65);
  border-radius: 8px;
  transition: width 0.5s ease;
}

.keyword-count {
  font-size: 14px;
  color: #888888;
  text-align: right;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 200px;
  gap: 8px;
  padding: 20px 0;
}

.trend-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.trend-bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #F9A8D4, #ff8a65);
  border-radius: 8px 8px 0 0;
  transition: height 0.5s ease;
  min-height: 4px;
}

.trend-label {
  margin-top: 12px;
  font-size: 13px;
  color: #888888;
}

.type-distribution {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #F9F9F9;
  border-radius: 8px;
}

.type-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.type-info {
  flex: 1;
}

.type-name {
  font-size: 15px;
  color: #333333;
  font-weight: 500;
  margin-bottom: 4px;
}

.type-count {
  font-size: 13px;
  color: #888888;
}

@media (max-width: 768px) {
  .page-header {
    margin-bottom: 20px;
  }
  .page-header h2 {
    font-size: 24px;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .stat-card {
    padding: 16px;
  }
  .stat-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }
  .stat-value {
    font-size: 24px;
  }
  .stat-label {
    font-size: 13px;
  }
  .chart-section {
    padding: 16px;
  }
  .keyword-bar {
    grid-template-columns: 80px 1fr 40px;
    gap: 8px;
  }
  .keyword-name {
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .type-distribution {
    grid-template-columns: 1fr;
  }
}
</style>
