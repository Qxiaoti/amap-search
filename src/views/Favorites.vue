<template>
  <div class="favorites-page">
    <div class="page-header">
      <h2>我的收藏</h2>
      <p class="subtitle">{{ favorites.length }} 个收藏的商户</p>
    </div>

    <div v-if="favorites.length === 0" class="empty-state">
      <div class="empty-icon">⭐</div>
      <h3>还没有收藏</h3>
      <p>在搜索结果中点击星标即可收藏商户</p>
      <button @click="$router.push('/search')" class="go-search-btn gradient-btn">去搜索</button>
    </div>

    <div v-else class="favorites-list">
      <div 
        v-for="fav in favorites" 
        :key="fav.id" 
        class="favorite-item"
      >
        <div class="favorite-header">
          <div class="favorite-name">{{ fav.name }}</div>
          <button 
            class="remove-btn"
            @click="removeFavorite(fav.id)"
          >
            删除
          </button>
        </div>
        <div class="favorite-info">📍 {{ fav.address || '暂无地址' }}</div>
        <div class="favorite-info">🏷️ {{ fav.type || '暂无分类' }}</div>
        
        <!-- 多个电话号码 -->
        <div v-if="getPhoneList(fav.tel).length > 0" class="favorite-phones">
          <div class="phone-label">📞 电话：</div>
          <div class="phone-list">
            <div 
              v-for="(phone, index) in getPhoneList(fav.tel)" 
              :key="index"
              class="phone-item"
            >
              <span class="phone-number">{{ phone }}</span>
              <button 
                class="copy-btn-small" 
                :class="{ copied: phone === fav.copiedPhone }"
                @click="copySinglePhone(fav, phone)"
              >
                {{ phone === fav.copiedPhone ? '✓' : '复制' }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="favorite-info no-phone">暂无电话信息</div>
      </div>
    </div>

    <div v-if="favorites.length > 0" class="actions">
      <button @click="exportFavorites" class="action-btn">导出Excel</button>
      <button @click="clearAll" class="action-btn danger">清空收藏</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as XLSX from 'xlsx'

const favorites = ref([])

onMounted(() => {
  loadFavorites()
})

const loadFavorites = () => {
  try {
    const saved = localStorage.getItem('favorites')
    if (saved) {
      const parsed = JSON.parse(saved)
      favorites.value = parsed.map(fav => ({
        ...fav,
        copied: false,
        copiedPhone: ''
      }))
    }
  } catch (e) {
    console.error('加载收藏失败:', e)
    favorites.value = []
  }
}

const removeFavorite = (id) => {
  try {
    favorites.value = favorites.value.filter(fav => fav.id !== id)
    localStorage.setItem('favorites', JSON.stringify(favorites.value))
  } catch (e) {
    console.error('删除收藏失败:', e)
    alert('删除失败，请重试')
  }
}

// 解析电话号码列表
const getPhoneList = (tel) => {
  if (!tel) return []
  try {
    return tel.split(/[;,，；\s]+/).filter(phone => phone && phone.trim())
  } catch (err) {
    console.error('解析电话号码失败:', err, tel)
    return []
  }
}

// 复制单个电话号码
const copySinglePhone = async (fav, phone) => {
  if (!phone) {
    console.error('电话号码为空')
    return
  }
  
  try {
    await navigator.clipboard.writeText(phone)
    fav.copiedPhone = phone
    setTimeout(() => {
      fav.copiedPhone = ''
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}

const copyPhone = async (fav) => {
  try {
    await navigator.clipboard.writeText(fav.tel)
    fav.copied = true
    setTimeout(() => {
      fav.copied = false
    }, 2000)
  } catch (err) {
    alert('复制失败，请手动复制')
  }
}

const exportFavorites = () => {
  try {
    if (!favorites.value || favorites.value.length === 0) {
      alert('没有可导出的收藏')
      return
    }

    // 准备电话数据
    const phoneData = []
    
    favorites.value.forEach(fav => {
      if (fav.tel) {
        const phones = getPhoneList(fav.tel)
        if (phones.length > 0) {
          phones.forEach((phone, index) => {
            phoneData.push({
              '序号': phoneData.length + 1,
              '商户名称': fav.name || '',
              '电话号码': phone,
              '电话类型': phones.length > 1 ? `电话${index + 1}` : '主要电话',
              '地址': fav.address || '',
              '类型': fav.type || ''
            })
          })
        }
      }
    })

    if (phoneData.length === 0) {
      alert('收藏中没有电话号码')
      return
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(phoneData)

    // 设置列宽
    ws['!cols'] = [
      { wch: 8 },  // 序号
      { wch: 30 }, // 商户名称
      { wch: 18 }, // 电话号码
      { wch: 12 }, // 电话类型
      { wch: 50 }, // 地址
      { wch: 20 }  // 类型
    ]

    // 添加工作表
    XLSX.utils.book_append_sheet(wb, ws, '收藏电话')

    // 导出文件
    const fileName = `收藏电话表_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
    XLSX.writeFile(wb, fileName)

    console.log(`收藏电话表导出成功，共${phoneData.length}条记录`)
  } catch (err) {
    console.error('导出失败:', err)
    alert(`导出失败：${err.message}`)
  }
}

const clearAll = () => {
  if (confirm('确定要清空所有收藏吗？')) {
    try {
      favorites.value = []
      localStorage.removeItem('favorites')
    } catch (e) {
      console.error('清空收藏失败:', e)
      alert('清空失败，请重试')
    }
  }
}
</script>

<style scoped>
.favorites-page {
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
  color: white;
  border: none;
  font-size: 17px;
  cursor: pointer;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
}

.go-search-btn:not(.gradient-btn) {
  background: #F9A8D4;
  box-shadow: 0 2px 8px rgba(255,100,130,0.25);
}

.go-search-btn:hover:not(.gradient-btn) {
  background: #F48FB1;
  transform: translateY(-2px);
}

.favorites-list {
  display: grid;
  gap: 16px;
  margin-bottom: 32px;
}

.favorite-item {
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  transition: all 0.3s;
}

.favorite-item:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-4px);
}

.favorite-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.favorite-name {
  font-size: 20px;
  font-weight: 600;
  color: #333333;
}

.remove-btn {
  padding: 6px 14px;
  background: #F9F9F9;
  color: #E91E63;
  border: none;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  box-shadow: none;
}

.remove-btn:hover {
  background: #E91E63;
  color: white;
}

.favorite-info {
  color: #6e6e73;
  font-size: 15px;
  margin: 8px 0;
}

.favorite-info.no-phone {
  color: #888888;
}

.favorite-phones {
  margin-top: 12px;
  padding: 12px;
  background: #F9F9F9;
  border-radius: 10px;
}

.phone-label {
  font-size: 14px;
  color: #888888;
  margin-bottom: 8px;
}

.phone-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.phone-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: white;
  border-radius: 8px;
  transition: all 0.2s;
}

.phone-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.phone-number {
  color: #F9A8D4;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.copy-btn-small {
  padding: 6px 14px;
  background: #F9F9F9;
  color: #333333;
  border: none;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  box-shadow: none;
  font-weight: 500;
}

.copy-btn-small:hover {
  background: #EEEEEE;
  transform: translateY(-1px);
}

.copy-btn-small.copied {
  background: #34c759;
  color: white;
}

.favorite-phone {
  color: #F9A8D4;
  font-size: 17px;
  font-weight: 600;
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.copy-btn {
  padding: 6px 14px;
  background: #F9F9F9;
  color: #333333;
  font-size: 13px;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  box-shadow: none;
}

.copy-btn:hover {
  background: #EEEEEE;
}

.copy-btn.copied {
  background: #F9A8D4;
  color: white;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  padding: 14px 32px;
  background: #F9F9F9;
  color: #333333;
  border: none;
  font-size: 16px;
  cursor: pointer;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: none;
}

.action-btn:hover {
  background: #EEEEEE;
  transform: translateY(-2px);
}

.action-btn.danger {
  color: #E91E63;
}

.action-btn.danger:hover {
  background: #E91E63;
  color: white;
}
</style>
