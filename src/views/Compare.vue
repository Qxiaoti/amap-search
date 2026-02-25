<template>
  <div class="compare-page">
    <div class="page-header">
      <h2>商户对比</h2>
      <p class="subtitle">选择商户进行对比分析</p>
    </div>

    <div class="selector-section">
      <div class="selector-box">
        <label>选择商户 A</label>
        <select v-model="selectedA" class="poi-select">
          <option value="">请选择商户</option>
          <option 
            v-for="fav in favorites" 
            :key="fav.id" 
            :value="fav.id"
          >
            {{ fav.name }}
          </option>
        </select>
      </div>
      <div class="vs-icon">VS</div>
      <div class="selector-box">
        <label>选择商户 B</label>
        <select v-model="selectedB" class="poi-select">
          <option value="">请选择商户</option>
          <option 
            v-for="fav in favorites" 
            :key="fav.id" 
            :value="fav.id"
          >
            {{ fav.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="poiA && poiB" class="compare-result">
      <div class="compare-grid">
        <div class="compare-card">
          <h3>{{ poiA.name }}</h3>
          <div class="compare-item">
            <div class="compare-label">地址</div>
            <div class="compare-value">{{ poiA.address || '暂无' }}</div>
          </div>
          <div class="compare-item">
            <div class="compare-label">类型</div>
            <div class="compare-value">{{ poiA.type || '暂无' }}</div>
          </div>
          <div class="compare-item">
            <div class="compare-label">电话</div>
            <div class="compare-value phone">{{ poiA.tel || '暂无' }}</div>
          </div>
        </div>

        <div class="compare-card">
          <h3>{{ poiB.name }}</h3>
          <div class="compare-item">
            <div class="compare-label">地址</div>
            <div class="compare-value">{{ poiB.address || '暂无' }}</div>
          </div>
          <div class="compare-item">
            <div class="compare-label">类型</div>
            <div class="compare-value">{{ poiB.type || '暂无' }}</div>
          </div>
          <div class="compare-item">
            <div class="compare-label">电话</div>
            <div class="compare-value phone">{{ poiB.tel || '暂无' }}</div>
          </div>
        </div>
      </div>

      <div class="comparison-summary">
        <h3>对比总结</h3>
        <div class="summary-item">
          <span class="summary-icon">📍</span>
          <span>两个商户{{ sameType ? '属于同一类型' : '类型不同' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">📞</span>
          <span>{{ bothHavePhone ? '都有联系电话' : '部分商户缺少电话' }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="favorites.length === 0" class="empty-state">
      <div class="empty-icon">⭐</div>
      <h3>暂无收藏商户</h3>
      <p>请先收藏商户后再进行对比</p>
      <button @click="$router.push('/search')" class="go-search-btn">去搜索</button>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>请选择要对比的商户</h3>
      <p>从上方下拉框中选择两个商户进行对比</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const favorites = ref([])
const selectedA = ref('')
const selectedB = ref('')

onMounted(() => {
  try {
    const saved = localStorage.getItem('favorites')
    if (saved) {
      favorites.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('加载收藏失败:', e)
    favorites.value = []
  }
})

const poiA = computed(() => {
  return favorites.value.find(f => f.id === selectedA.value)
})

const poiB = computed(() => {
  return favorites.value.find(f => f.id === selectedB.value)
})

const sameType = computed(() => {
  if (!poiA.value || !poiB.value) return false
  const typeA = poiA.value.type?.split(';')[0]
  const typeB = poiB.value.type?.split(';')[0]
  return typeA === typeB
})

const bothHavePhone = computed(() => {
  return poiA.value?.tel && poiB.value?.tel
})
</script>

<style scoped>
.compare-page {
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

.selector-section {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: end;
  margin-bottom: 40px;
}

.selector-box label {
  display: block;
  margin-bottom: 12px;
  color: #333333;
  font-size: 16px;
  font-weight: 500;
}

.poi-select {
  width: 100%;
  padding: 14px 18px;
  border: none;
  background: white;
  border-radius: 8px;
  font-size: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  cursor: pointer;
}

.poi-select:focus {
  outline: none;
  box-shadow: 0 4px 20px rgba(255,100,130,0.15);
}

.vs-icon {
  font-size: 24px;
  font-weight: 700;
  color: #F9A8D4;
  padding: 14px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.compare-result {
  margin-top: 40px;
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.compare-card {
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.compare-card h3 {
  font-size: 22px;
  color: #333333;
  margin-bottom: 24px;
  font-weight: 600;
  padding-bottom: 16px;
  border-bottom: 2px solid #F9F9F9;
}

.compare-item {
  margin-bottom: 20px;
}

.compare-item:last-child {
  margin-bottom: 0;
}

.compare-label {
  font-size: 14px;
  color: #888888;
  margin-bottom: 8px;
}

.compare-value {
  font-size: 16px;
  color: #333333;
  line-height: 1.6;
}

.compare-value.phone {
  color: #F9A8D4;
  font-weight: 600;
}

.comparison-summary {
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.comparison-summary h3 {
  font-size: 20px;
  color: #333333;
  margin-bottom: 20px;
  font-weight: 600;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #F9F9F9;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 16px;
  color: #333333;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-icon {
  font-size: 24px;
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
</style>
