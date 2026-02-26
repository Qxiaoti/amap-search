<template>
  <div class="search-page">
    <div class="search-header">
      <h2>商户搜索</h2>
      <div class="search-box">
        <input 
          v-model="keyword" 
          type="text" 
          placeholder="输入商户或行业，多个词用逗号分隔（如：餐饮,火锅,烧烤）"
          @keypress.enter="searchPOI()"
          list="history-list"
          class="keyword-input"
        />
        <datalist id="history-list">
          <option v-for="item in searchHistory" :key="item" :value="item" />
        </datalist>
        <div class="city-selector-wrapper">
          <button @click="showCitySelector = true" class="city-btn gradient-btn">
            {{ selectedCityText || '选择城市' }}
          </button>
          <button 
            v-if="city" 
            @click="clearCity" 
            class="clear-city-btn"
            title="清除城市"
          >
            ✕
          </button>
        </div>
        <button @click="searchPOI()" :disabled="loading || loadingAll" class="search-main-btn gradient-btn">
          {{ loading ? '搜索中...' : '搜索' }}
        </button>
          <button
            v-if="results.length > 0 && hasMore"
            @click="loadAll"
            :disabled="loadingMore || loadingAll"
            class="gradient-btn"
          >
            {{ loadingAll ? `正在深度加载中 (已获取 ${results.length} 个)...` : '加载全部' }}
          </button>
        <button v-if="loading || loadingAll" @click="cancelSearch" class="cancel-btn">
          取消
        </button>
      </div>
      
      <!-- 位置输入 -->
      <div class="location-box">
        <div class="location-input-wrapper">
          <span class="location-icon">📍</span>
          <input 
            v-model="userLocation" 
            type="text" 
            placeholder="输入你的位置（如：五一广场、岳麓山）获取距离信息"
            class="location-input"
            @keypress.enter="geocodeLocation"
          />
          <button 
            v-if="userLocation" 
            @click="clearLocation" 
            class="clear-location-btn"
          >
            ✕
          </button>
          <button 
            @click="geocodeLocation" 
            :disabled="!userLocation || geocoding"
            class="geocode-btn gradient-btn"
          >
            {{ geocoding ? '定位中...' : '确定位置' }}
          </button>
        </div>
        <div v-if="userCoordinates" class="location-status">
          ✓ 已定位：{{ userLocationName }} ({{ userCoordinates }})
        </div>
      </div>
    </div>

    <!-- 城市选择器弹窗 -->
    <div v-if="showCitySelector" class="city-modal" @click="showCitySelector = false">
      <div class="city-modal-content" @click.stop>
        <div class="city-modal-header">
          <h3>选择城市</h3>
          <button class="close-btn" @click="showCitySelector = false">✕</button>
        </div>

        <!-- 搜索框 -->
        <div class="city-search-box">
          <input 
            v-model="citySearchKeyword"
            type="text"
            placeholder="搜索城市名称..."
            class="city-search-input"
          />
          <span class="search-icon">🔍</span>
        </div>

        <!-- 搜索结果 -->
        <div v-if="citySearchKeyword && searchResults.length > 0" class="search-results">
          <div 
            v-for="(result, index) in searchResults" 
            :key="index"
            class="search-result-item"
            @click="selectSearchResult(result)"
          >
            <div class="result-city">{{ result.label }}</div>
            <div class="result-province">{{ result.sublabel }}</div>
          </div>
          <!-- 允许直接使用输入的词作为区域 -->
          <div class="search-result-item custom-area-item" @click="selectCustomCity(citySearchKeyword)">
            <div class="result-city">使用 "{{ citySearchKeyword }}" 作为区域</div>
            <div class="result-province">自定义搜索区域 (如：县城、商圈)</div>
          </div>
        </div>

          <div v-else-if="citySearchKeyword && searchResults.length === 0" class="no-results">
            <div style="margin-bottom: 16px;">未在快捷列表中找到匹配的城市</div>
            <button class="confirm-btn gradient-btn" style="width: auto; padding: 10px 24px;" @click="selectCustomCity(citySearchKeyword)">
              直接搜索 "{{ citySearchKeyword }}" 区域
            </button>
          </div>

          <!-- 原有的标签和内容 -->
          <div v-else class="tabs-container">
            <div class="city-tabs">
            <button 
              :class="['city-tab', { active: activeTab === 'hot' }]"
              @click="activeTab = 'hot'"
            >
              热门城市
            </button>
            <button 
              :class="['city-tab', { active: activeTab === 'province' }]"
              @click="activeTab = 'province'"
            >
              按省份
            </button>
          </div>

          <!-- 热门城市 -->
          <div v-if="activeTab === 'hot'" class="hot-cities">
            <button 
              v-for="city in hotCities" 
              :key="city"
              class="city-option"
              @click="selectCity(city)"
            >
              {{ city }}
            </button>
          </div>

          <!-- 省份选择 -->
          <div v-if="activeTab === 'province'" class="province-tab-content">
            <div class="province-selector">
              <div class="province-list">
                <button
                  v-for="item in cityData"
                  :key="item.province"
                  :class="['province-item', { active: selectedProvince === item.province }]"
                  @click="selectedProvince = item.province"
                >
                  {{ item.province }}
                </button>
              </div>

              <div class="city-list" v-if="selectedProvince">
                <button
                  v-for="city in currentCities"
                  :key="city.name"
                  :class="['city-item', { active: selectedCity === city.name }]"
                  @click="selectedCity = city.name"
                >
                  {{ city.name }}
                </button>
              </div>

              <div class="district-list" v-if="selectedCity && currentDistricts.length > 0">
                <button
                  v-for="district in currentDistricts"
                  :key="district.name || district"
                  :class="['district-item', { active: selectedDistrict === (district.name || district) }]"
                  @click="selectDistrict(district)"
                >
                  {{ district.name || district }}
                </button>
              </div>

              <div class="town-list" v-if="selectedDistrict && currentTowns.length > 0">
                <button
                  v-for="town in currentTowns"
                  :key="town"
                  class="town-item"
                  @click="selectTown(town)"
                >
                  {{ town }}
                </button>
              </div>
            </div>

            <div class="city-actions" v-if="selectedCity">
              <button class="confirm-btn gradient-btn" @click="confirmCitySelection">
                确定选择 {{ selectedCity }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading" class="loading">🔍 搜索中...</div>

    <div v-if="results.length > 0" class="toolbar">
      <div class="toolbar-left">
        <span class="results-count">
          {{ hasMore ? `共发现 ${totalCount} 个商户，已抓取 ${results.length} 个` : `已加载全部可获取的 ${results.length} 个结果 (预估总计 ${totalCount} 个)` }}
        </span>
      </div>
      <div class="toolbar-right">
        <select v-model="sortBy" class="sort-select">
          <option value="">默认排序</option>
          <option value="distance">按距离</option>
          <option value="name">按名称</option>
        </select>
        <button class="export-btn" @click="exportToExcel">导出Excel</button>
        <button class="export-btn" @click="exportPhonesToExcel">导出电话表</button>
      </div>
    </div>

    <div v-if="results.length > 0" class="filter-box">
      <input 
        v-model="filterType" 
        type="text" 
        placeholder="筛选类型（如：餐饮、酒店）"
        class="filter-input"
      />
    </div>

    <!-- 按区县分组显示结果 -->
    <div v-if="filteredResults.length > 0" class="results">
      <div v-for="(group, district) in resultsByDistrict" :key="district" class="district-group">
        <div class="district-header">
          <h3 class="district-name">{{ district }}</h3>
          <span class="district-count">{{ group.length }} 个商户</span>
        </div>
        
        <div class="district-results">
          <div 
            v-for="poi in group" 
            :key="poi.id" 
            class="poi-item"
          >
            <div class="poi-header">
              <div class="poi-name">{{ poi.name }}</div>
              <button 
                class="favorite-btn"
                :class="{ favorited: isFavorite(poi.id) }"
                @click="toggleFavorite(poi)"
              >
                {{ isFavorite(poi.id) ? '★' : '☆' }}
              </button>
            </div>
            <div class="poi-info">📍 {{ poi.address || '暂无地址' }}</div>
            <div class="poi-info">🏷️ {{ poi.type || '暂无分类' }}</div>
            <div v-if="poi.distance !== undefined && poi.distance !== null && poi.distance !== ''" class="poi-info distance-info">📏 距离：{{ formatDistance(poi.distance) }}</div>
            
            <!-- 多个电话号码 -->
            <div v-if="getPhoneList(poi.tel).length > 0" class="poi-phones">
              <div class="phone-label">📞 电话：</div>
              <div class="phone-list">
                <div 
                  v-for="(phone, index) in getPhoneList(poi.tel)" 
                  :key="index"
                  class="phone-item"
                >
                  <span class="phone-number">{{ phone }}</span>
                  <button 
                    class="copy-btn-small" 
                    :class="{ copied: phone === poi.copiedPhone }"
                    @click="copySinglePhone(poi, phone)"
                  >
                    {{ phone === poi.copiedPhone ? '✓' : '复制' }}
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="poi-info no-phone">暂无电话信息</div>
          </div>
        </div>
      </div>
    </div>

      <div v-if="results.length > 0 && hasMore" class="load-more-section">
        <button 
          @click="loadMore" 
          :disabled="loadingMore || loadingAll"
          class="load-more-btn gradient-btn"
        >
          {{ loadingMore ? '加载中...' : `加载更多数据` }}
        </button>
      </div>

      <div v-if="results.length > 0 && !hasMore" class="no-more">
        已加载全部可获取的结果（共 {{ results.length }} 个，平台预估总计 {{ totalCount }} 个）
      </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { cityData, hotCities } from '../data/cities'
import * as XLSX from 'xlsx'

const route = useRoute()
const keyword = ref('')
const city = ref('湖南')
const loading = ref(false)
const loadingMore = ref(false)
const loadingAll = ref(false)
const error = ref('')
const results = ref([])
const searchHistory = ref([])
const favorites = ref([])
const sortBy = ref('')
const filterType = ref('')
const currentPage = ref(1)
const totalCount = ref(0)
const isAllLoaded = ref(false)
const pageSize = ref(20) // 改为20条，提升速度
const searchController = ref(null) // 用于取消请求

// 用户位置相关
const userLocation = ref('')
const userCoordinates = ref('')
const userLocationName = ref('')
const geocoding = ref(false)

// 城市选择器
const showCitySelector = ref(false)
const activeTab = ref('hot')
const selectedProvince = ref('')
const selectedCity = ref('')
const selectedDistrict = ref('')
const selectedTown = ref('')
const citySearchKeyword = ref('')

const selectedCityText = computed(() => {
  if (selectedTown.value) {
    return `${selectedCity.value} ${selectedDistrict.value} ${selectedTown.value}`
  }
  if (selectedDistrict.value) {
    return `${selectedCity.value} ${selectedDistrict.value}`
  }
  return city.value || ''
})

// 搜索结果扁平化 - 支持省、市、区县三级搜索
const searchResults = computed(() => {
  if (!citySearchKeyword.value) return []
  
  const kw = citySearchKeyword.value.toLowerCase().trim()
  if (!kw) return []
  
  const results = []
  cityData.forEach(province => {
    const provinceMatch = province.province.toLowerCase().includes(kw)
    province.cities.forEach(cityItem => {
      const cityMatch = cityItem.name.toLowerCase().includes(kw)
      if (provinceMatch || cityMatch) {
        // 省或市名匹配 => 加入整个市
        results.push({
          province: province.province,
          city: cityItem.name,
          district: '',
            districts: cityItem.districts.map(d => d.name || d),
          label: cityItem.name,
          sublabel: province.province
        })
      } else {
          // 检查区县匹配
          cityItem.districts.forEach(dObj => {
            const district = dObj.name || dObj;
            if (district.toLowerCase().includes(kw)) {
              results.push({
                province: province.province,
                city: cityItem.name,
                district: district,
                town: '',
                districts: cityItem.districts.map(d => d.name || d),
                label: district,
                sublabel: `${province.province} · ${cityItem.name}`
              })
            }
            if (dObj.towns) {
              dObj.towns.forEach(town => {
                if (town.toLowerCase().includes(kw)) {
                  results.push({
                    province: province.province,
                    city: cityItem.name,
                    district: district,
                    town: town,
                    districts: cityItem.districts.map(d => d.name || d),
                    label: town,
                    sublabel: `${cityItem.name} · ${district}`
                  })
                }
              })
            }
          })
      }
    })
  })
  return results.slice(0, 30) // 最多显示30条
})

const currentCities = computed(() => {
  const province = cityData.find(p => p.province === selectedProvince.value)
  return province ? province.cities : []
})

const currentDistricts = computed(() => {
  const cityObj = currentCities.value.find(c => c.name === selectedCity.value)
  return cityObj ? cityObj.districts : []
})

const currentTowns = computed(() => {
  const distObj = currentDistricts.value.find(d => (d.name || d) === selectedDistrict.value)
  return distObj ? (distObj.towns || []) : []
})

const selectCity = (cityName) => {
  city.value = cityName
  selectedCity.value = cityName
  selectedDistrict.value = ''
  selectedTown.value = ''
  citySearchKeyword.value = ''
  // Don't close immediately if we have districts
  const cityObj = currentCities.value.find(c => c.name === cityName)
  if (!cityObj || !cityObj.districts || cityObj.districts.length === 0) {
    showCitySelector.value = false
  }
}

const selectDistrict = (district) => {
  selectedDistrict.value = district.name || district
  selectedTown.value = ''
  city.value = `${selectedCity.value} ${selectedDistrict.value}`
  
  // Don't close if we have towns
  const distObj = currentDistricts.value.find(d => (d.name || d) === selectedDistrict.value)
  if (!distObj || !distObj.towns || distObj.towns.length === 0) {
    citySearchKeyword.value = ''
    showCitySelector.value = false
  }
}

const selectTown = (town) => {
  selectedTown.value = town
  city.value = `${selectedCity.value} ${selectedDistrict.value} ${town}`
  citySearchKeyword.value = ''
  showCitySelector.value = false
}

const confirmCitySelection = () => {
  city.value = selectedCity.value
  citySearchKeyword.value = ''
  showCitySelector.value = false
}

const selectCustomCity = (customCity) => {
  city.value = customCity
  selectedCity.value = customCity
  selectedDistrict.value = ''
  selectedTown.value = ''
  citySearchKeyword.value = ''
  showCitySelector.value = false
}

const selectSearchResult = (result) => {
  selectedProvince.value = result.province
  selectedCity.value = result.city
  if (result.town) {
    selectedDistrict.value = result.district
    selectTown(result.town)
  } else if (result.district) {
    // 区县直接选中
    selectDistrict(result.district)
  } else if (result.districts.length === 0) {
    selectCity(result.city)
  } else {
    // 市级：进入省份面板显示区县
    activeTab.value = 'province'
    citySearchKeyword.value = ''
  }
}

const clearCity = () => {
  // 如果正在搜索，先停止
  if (loading.value) {
    loading.value = false
  }
  
  city.value = ''
  selectedCity.value = ''
  selectedDistrict.value = ''
    selectedTown.value = ''
    selectedProvince.value = ''
  
  console.log('已清空城市选择')
}

// 地理编码：将地址转换为坐标
const geocodeLocation = async () => {
  if (!userLocation.value.trim()) {
    return
  }
  
  const apiKey = localStorage.getItem('amap_api_key')
  if (!apiKey) {
    alert('请先在设置页面配置API Key')
    return
  }
  
  geocoding.value = true
  
  try {
      // 如果选择了城市，在该城市内搜索，否则默认湖南
      const cityParam = city.value ? city.value.split(/\s+/)[0] : '湖南'
      let url = `https://restapi.amap.com/v3/geocode/geo?key=${apiKey}&address=${encodeURIComponent(userLocation.value)}&output=json`
      
      if (cityParam) {
        url += `&city=${encodeURIComponent(cityParam)}`
      }
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      const geocode = data.geocodes[0]
      userCoordinates.value = geocode.location
      userLocationName.value = geocode.formatted_address || userLocation.value
      
      // 保存到localStorage
      localStorage.setItem('user_location', JSON.stringify({
        name: userLocationName.value,
        coordinates: userCoordinates.value
      }))
      
      console.log('位置定位成功:', userCoordinates.value)
      
      // 如果已有搜索结果，重新搜索以计算距离
      if (results.value.length > 0) {
        searchPOI()
      }
    } else {
      alert('无法定位该地址，请输入更详细的位置信息')
    }
  } catch (err) {
    console.error('地理编码失败:', err)
    alert('定位失败，请重试')
  } finally {
    geocoding.value = false
  }
}

// 清除用户位置
const clearLocation = () => {
  userLocation.value = ''
  userCoordinates.value = ''
  userLocationName.value = ''
  localStorage.removeItem('user_location')
  
  // 如果已有搜索结果，重新搜索
  if (results.value.length > 0) {
    searchPOI()
  }
}

const cancelSearch = () => {
  if (searchController.value) {
    searchController.value.abort()
  }
  loading.value = false
  loadingMore.value = false
  loadingAll.value = false
  console.log('已取消搜索')
}

onMounted(() => {
  try {
    const savedHistory = localStorage.getItem('search_history')
    if (savedHistory) {
      try {
        searchHistory.value = JSON.parse(savedHistory)
      } catch (e) {
        console.error('解析搜索历史失败:', e)
        searchHistory.value = []
      }
    }

    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      try {
        favorites.value = JSON.parse(savedFavorites)
      } catch (e) {
        console.error('解析收藏失败:', e)
        favorites.value = []
      }
    }
    
    // 加载保存的用户位置
    const savedLocation = localStorage.getItem('user_location')
    if (savedLocation) {
      try {
        const loc = JSON.parse(savedLocation)
        userLocation.value = loc.name || ''
        userCoordinates.value = loc.coordinates || ''
        userLocationName.value = loc.name || ''
      } catch (e) {
        console.error('解析用户位置失败:', e)
        localStorage.removeItem('user_location')
      }
    }

    if (route.query.q) {
      keyword.value = route.query.q
      searchPOI()
    }
  } catch (e) {
    console.error('初始化失败:', e)
    alert('数据加载失败，请检查浏览器设置是否允许使用localStorage')
  }
})

const filteredResults = computed(() => {
  let list = results.value

  if (filterType.value) {
    list = list.filter(poi => 
      poi.type && poi.type.includes(filterType.value)
    )
  }

  if (sortBy.value === 'distance') {
    list = [...list].sort((a, b) => {
      // 更安全的距离解析
      const valA = parseFloat(a.distance)
      const valB = parseFloat(b.distance)
      const distA = !isNaN(valA) ? valA : 999999
      const distB = !isNaN(valB) ? valB : 999999
      return distA - distB
    })
  } else if (sortBy.value === 'name') {
    list = [...list].sort((a, b) => {
      const nameA = a.name || ''
      const nameB = b.name || ''
      return nameA.localeCompare(nameB, 'zh-CN')
    })
  }

  return list
})

// 按区县分组结果
const resultsByDistrict = computed(() => {
  const groups = {}

  filteredResults.value.forEach(poi => {
    const district = getDistrict(poi)

    if (!groups[district]) {
      groups[district] = []
    }
    groups[district].push(poi)
  })

  return groups
})

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

const normalizePois = (pois) => {
  return pois.map(poi => {
    let distance = null
    if (userCoordinates.value && poi.location) {
      const [userLon, userLat] = userCoordinates.value.split(',').map(Number)
      const [poiLon, poiLat] = poi.location.split(',').map(Number)
      if (!isNaN(userLon) && !isNaN(userLat) && !isNaN(poiLon) && !isNaN(poiLat)) {
        distance = calculateDistance(userLat, userLon, poiLat, poiLon)
      }
    }

    const apiDistance = (poi.distance && !Array.isArray(poi.distance) && String(poi.distance).trim() !== '')
      ? poi.distance
      : null

    return {
      ...poi,
      distance: distance !== null ? distance.toString() : apiDistance,
      copied: false,
      copiedPhone: ''
    }
  })
}

const searchPOI = async (isLoadMore = false) => {
  console.log('开始搜索...', { keyword: keyword.value, city: city.value, isLoadMore })
  
  const apiKey = localStorage.getItem('amap_api_key')
  
  if (!apiKey) {
    error.value = '请先在设置页面配置API Key'
    console.error('缺少API Key')
    return
  }

  if (!keyword.value.trim()) {
    error.value = '请输入搜索关键词'
    console.error('缺少关键词')
    return
  }

  // 取消之前的请求
  if (searchController.value) {
    searchController.value.abort()
  }
  searchController.value = new AbortController()

  error.value = ''
  
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    results.value = []
    currentPage.value = 1
  }

  const startTime = Date.now()

    try {
      const page = isLoadMore ? currentPage.value + 1 : 1
      
        // 处理城市参数
        // city.value 格式可能是：
        //   "长沙市"（只选市）
        //   "长沙市 岳麓区"（选了区）
        //   "平江县"（自定义县城）
          let cityParam = ''
          let townParam = ''
          
            if (city.value.trim()) {
              if (selectedTown.value) {
                cityParam = selectedDistrict.value || selectedCity.value
                townParam = selectedTown.value
              } else if (selectedDistrict.value) {
                cityParam = selectedDistrict.value
              } else if (selectedCity.value) {
                cityParam = selectedCity.value
              } else {
                const parts = city.value.trim().split(/\s+/)
                if (parts.length >= 3) {
                  cityParam = parts[1]
                  townParam = parts.slice(2).join(' ')
                } else if (parts.length === 2) {
                  cityParam = parts[1]
                } else {
                  cityParam = parts[0]
                }
              }
            } else {
              // 默认限制在湖南地区
              cityParam = '湖南'
            }
          
          // 处理多关键词
          const kwList = keyword.value.split(/[,，]+/).map(k => k.trim()).filter(Boolean)
          
          let allNewPois = []
          let currentTotalCount = 0
          let anyHasData = false
          let apiError = null
          
          // 创建带超时的fetch请求
          const fetchWithTimeout = (url, options, timeout = 10000) => {
            return Promise.race([
              fetch(url, options),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('请求超时')), timeout)
              )
            ])
          }

          for (let i = 0; i < kwList.length; i++) {
            const kw = kwList[i]
            let actualKeyword = kw;
            if (townParam) {
              actualKeyword = `${townParam} ${actualKeyword}`;
            }
            
            let url = `https://restapi.amap.com/v3/place/text?key=${apiKey}&keywords=${encodeURIComponent(actualKeyword)}&output=json&offset=${pageSize.value}&page=${page}&extensions=base`
            
            if (cityParam) {
              url += `&city=${encodeURIComponent(cityParam)}&citylimit=true`
            }
            
            console.log(`请求URL [${kw}]:`, url)
            
            // 避免并发超限
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 200))
            }
            
            try {
              const response = await fetchWithTimeout(url, {
                signal: searchController.value.signal
              }, 10000)
              
              const data = await response.json()
              
              if (data.status === '1' && data.pois && data.pois.length > 0) {
                allNewPois.push(...data.pois)
                anyHasData = true
              }
              if (!isLoadMore && data.status === '1') {
                currentTotalCount = Math.max(currentTotalCount, parseInt(data.count) || 0)
              }
              if (data.status === '0') {
                apiError = data.info
              }
            } catch (err) {
              if (err.name === 'AbortError') throw err;
              console.error(`请求关键词 [${kw}] 失败:`, err)
            }
          }
          
          const endTime = Date.now()
          console.log(`多关键词API总响应时间: ${endTime - startTime}ms`)

          if (!anyHasData) {
            if (apiError && !isLoadMore) {
               error.value = `查询失败：${apiError}`
            } else if (!isLoadMore) {
              error.value = '未找到相关商户'
            } else {
              // 如果加载更多时没数据，说明达到了高德分页上限(一般最多900条)
              isAllLoaded.value = true
            }
            console.warn('没有找到结果')
            return
          }

          // 去重处理
          const existingIds = new Set(results.value.map(p => p.id))
          const uniqueNewPois = []
          for (const poi of allNewPois) {
              if (!existingIds.has(poi.id)) {
                  existingIds.add(poi.id)
                  uniqueNewPois.push(poi)
              }
          }

          const newPois = normalizePois(uniqueNewPois)

          if (isLoadMore) {
            results.value = [...results.value, ...newPois]
            currentPage.value = page
            // Adjust total count if needed (though currentTotalCount is what we rely on for ceiling)
          } else {
            results.value = newPois
            currentPage.value = 1
          totalCount.value = currentTotalCount
          isAllLoaded.value = false
          addToHistory(keyword.value)
            incrementSearchCount()
          }
    
    console.log('搜索完成，结果数量:', results.value.length, `总耗时: ${Date.now() - startTime}ms`)
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('搜索已取消')
      return
    }
    error.value = `请求失败：${err.message}`
    console.error('搜索出错:', err)
  } finally {
    loading.value = false
    loadingMore.value = false
    searchController.value = null
  }
}

const loadMore = () => {
  searchPOI(true)
}

  const loadAll = async () => {
    if (loadingAll.value || !hasMore.value) return
    loadingAll.value = true
  
    const apiKey = localStorage.getItem('amap_api_key')
    if (!apiKey) {
      loadingAll.value = false
      return
    }
  
    try {
        let cityParam = ''
        let townParam = ''
          if (city.value.trim()) {
            if (selectedTown.value) {
              cityParam = selectedDistrict.value || selectedCity.value
              townParam = selectedTown.value
            } else if (selectedDistrict.value) {
              cityParam = selectedDistrict.value
            } else if (selectedCity.value) {
              cityParam = selectedCity.value
            } else {
              const parts = city.value.trim().split(/\s+/)
              if (parts.length >= 3) {
                cityParam = parts[1]
                townParam = parts.slice(2).join(' ')
              } else if (parts.length === 2) {
                cityParam = parts[1]
              } else {
                cityParam = parts[0]
              }
            }
          } else {
            // 默认限制在湖南地区
            cityParam = '湖南'
          }

        const kwList = keyword.value.split(/[,，]+/).map(k => k.trim()).filter(Boolean)
        const kwActive = new Array(kwList.length).fill(true)
        // Maintain independent page counters for each keyword in case we want to
        let currentP = currentPage.value + 1

        while (kwActive.some(active => active)) {
          if (!loadingAll.value) break // 如果用户点击取消，中断加载
  
          let allNewPois = []
          
          for (let i = 0; i < kwList.length; i++) {
             if (!kwActive[i]) continue;
             
             const kw = kwList[i]
             let actualKeyword = kw;
             if (townParam) {
               actualKeyword = `${townParam} ${actualKeyword}`;
             }
             
             let url = `https://restapi.amap.com/v3/place/text?key=${apiKey}&keywords=${encodeURIComponent(actualKeyword)}&output=json&offset=${pageSize.value}&page=${currentP}&extensions=base`
             if (cityParam) {
               url += `&city=${encodeURIComponent(cityParam)}&citylimit=true`
             }
             
             // 节流：每次请求间隔 400ms，避免QPS超限
             await new Promise(resolve => setTimeout(resolve, 400))
             
             const response = await fetch(url)
             const data = await response.json()
             
             if (data.status === '0') {
               if (data.infocode === '10003') { // 并发超限 QPS limit
                 console.warn(`全部加载：[${kw}] 并发超限，稍后重试...`)
                 await new Promise(resolve => setTimeout(resolve, 1000))
                 i-- // 重试同一关键词
                 continue
               } else {
                 console.error('全部加载中断：', data.info)
                 error.value = `全部加载部分中断：${data.info}`
                 kwActive[i] = false
                 continue
               }
             }
             
             // 如果该关键词没数据，标记为停止
             if (!data.pois || data.pois.length === 0) {
               console.warn(`[${kw}] 已到达最大上限，停止加载此词`)
               kwActive[i] = false
               continue
             }
             
             allNewPois.push(...data.pois)
          }

          if (allNewPois.length === 0) {
            // 所有关键词都没数据了，或者只剩下空页的关键词
            break
          }
          
          // 去重处理
          const existingIds = new Set(results.value.map(p => p.id))
          const uniqueNewPois = []
          for (const poi of allNewPois) {
              if (!existingIds.has(poi.id)) {
                  existingIds.add(poi.id)
                  uniqueNewPois.push(poi)
              }
          }
          
          results.value = [...results.value, ...normalizePois(uniqueNewPois)]
          currentPage.value = currentP
          currentP++

          // 高德文本搜索最多返回100页（2000条），超出就停
          if (currentP > 100) {
             break
          }
        }
        
        // 当所有数据加载完毕，或者遇到上限后
        isAllLoaded.value = true
    } catch (err) {
      console.error('全部加载出错:', err)
      error.value = `全部加载失败：${err.message}`
    } finally {
      loadingAll.value = false
    }
  }

const hasMore = computed(() => {
  return !isAllLoaded.value && results.value.length < totalCount.value
})

const addToHistory = (keyword) => {
  try {
    const history = searchHistory.value.filter(item => item !== keyword)
    history.unshift(keyword)
    searchHistory.value = history.slice(0, 10)
    localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
  } catch (e) {
    console.error('保存搜索历史失败:', e)
  }
}

const incrementSearchCount = () => {
  try {
    const count = parseInt(localStorage.getItem('search_count') || '0')
    localStorage.setItem('search_count', (count + 1).toString())
    
    // 记录搜索日志
    const today = new Date().toISOString().split('T')[0]
    const logStr = localStorage.getItem('search_log') || '[]'
    let log = []
    try {
      log = JSON.parse(logStr)
    } catch (e) {
      console.error('解析搜索日志失败:', e)
    }
    log.push({ date: today, keyword: keyword.value })
    localStorage.setItem('search_log', JSON.stringify(log.slice(-100))) // 只保留最近100条
  } catch (e) {
    console.error('记录搜索统计失败:', e)
  }
}

// 解析电话号码列表
const getPhoneList = (tel) => {
  if (!tel) return []
  // 高德API偶尔返回数组
  const telStr = Array.isArray(tel) ? tel.join(';') : String(tel)
  if (!telStr.trim()) return []
  try {
    return telStr.split(/[;,，；\s]+/).filter(phone => phone && phone.trim())
  } catch (err) {
    console.error('解析电话号码失败:', err, tel)
    return []
  }
}

// 格式化距离显示
const formatDistance = (distance) => {
  if (distance === null || distance === undefined || distance === '') return ''
  
  const dist = parseFloat(distance)
  
  if (isNaN(dist)) return distance
  
  if (dist < 1000) {
    return `${Math.round(dist)}米`
  } else {
    return `${(dist / 1000).toFixed(1)}公里`
  }
}

// 复制单个电话号码
const copySinglePhone = async (poi, phone) => {
  if (!phone) {
    console.error('电话号码为空')
    return
  }
  
  try {
    await navigator.clipboard.writeText(phone)
    poi.copiedPhone = phone
    
    // 记录复制次数
    const count = parseInt(localStorage.getItem('phone_copy_count') || '0')
    localStorage.setItem('phone_copy_count', (count + 1).toString())
    
    setTimeout(() => {
      poi.copiedPhone = ''
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}

const isFavorite = (id) => {
  return favorites.value.some(fav => fav.id === id)
}

const toggleFavorite = (poi) => {
  try {
    const index = favorites.value.findIndex(fav => fav.id === poi.id)
    if (index > -1) {
      favorites.value.splice(index, 1)
    } else {
      favorites.value.push({
        id: poi.id,
        name: poi.name,
        tel: poi.tel,
        address: poi.address,
        type: poi.type,
        adname: poi.adname // 保存区县信息
      })
    }
    localStorage.setItem('favorites', JSON.stringify(favorites.value))
  } catch (e) {
    console.error('保存收藏失败:', e)
    alert('收藏失败，请重试')
  }
}

function getDistrict(poi) {
  if (poi.adname) return poi.adname
  if (poi.address) {
    const match = poi.address.match(/^([^省]+省)?([^市]+市)?([^区县]+[区县])/)
    if (match && match[3]) return match[3]
  }
  return '其他区域'
}


    const exportToExcel = () => {
      try {
        if (!filteredResults.value || filteredResults.value.length === 0) {
          alert('没有可导出的数据')
          return
        }

        // 准备数据
        const data = filteredResults.value.map(poi => ({
          '商户名称': poi.name || '',
          '地区': getDistrict(poi),
          '地址': poi.address || '',
          '类型': poi.type || '',
          '电话': poi.tel || '',
          '距离(米)': poi.distance || '',
          '经度': poi.location ? poi.location.split(',')[0] : '',
          '纬度': poi.location ? poi.location.split(',')[1] : ''
        }))

    // 创建工作簿
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)

    // 设置列宽
    ws['!cols'] = [
      { wch: 30 }, // 商户名称
      { wch: 50 }, // 地址
      { wch: 20 }, // 类型
      { wch: 20 }, // 电话
      { wch: 10 }, // 距离
      { wch: 12 }, // 经度
      { wch: 12 }  // 纬度
    ]

    // 添加工作表
    XLSX.utils.book_append_sheet(wb, ws, '商户信息')

    // 导出文件
    const locationName = city.value ? city.value.replace(/\s+/g, '') : '全国'
    const searchWord = keyword.value ? `_${keyword.value}` : ''
    const fileName = `商户信息_${locationName}${searchWord}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
    XLSX.writeFile(wb, fileName)

    // 记录导出次数
    const count = parseInt(localStorage.getItem('export_count') || '0')
    localStorage.setItem('export_count', (count + 1).toString())

    console.log('Excel导出成功:', fileName)
  } catch (err) {
    console.error('导出Excel失败:', err)
    alert(`导出失败：${err.message}`)
  }
}

// 导出电话号码表格
const exportPhonesToExcel = () => {
  try {
    if (!filteredResults.value || filteredResults.value.length === 0) {
      alert('没有可导出的数据')
      return
    }

    // 准备电话数据
    const phoneData = []
    
    filteredResults.value.forEach(poi => {
      if (poi.tel) {
        const phones = getPhoneList(poi.tel)
          if (phones.length > 0) {
            phones.forEach((phone, index) => {
              phoneData.push({
                '序号': phoneData.length + 1,
                '商户名称': poi.name || '',
                '地区': getDistrict(poi),
                '电话号码': phone,
                '电话类型': phones.length > 1 ? `电话${index + 1}` : '主要电话',
                '地址': poi.address || '',
                '类型': poi.type || ''
              })
            })
          }
      }
    })

    if (phoneData.length === 0) {
      alert('没有可导出的电话号码')
      return
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(phoneData)

    // 设置列宽
    ws['!cols'] = [
      { wch: 8 },  // 序号
      { wch: 30 }, // 商户名称
      { wch: 15 }, // 地区
      { wch: 18 }, // 电话号码
      { wch: 12 }, // 电话类型
      { wch: 50 }, // 地址
      { wch: 20 }  // 类型
    ]

    // 添加工作表
    XLSX.utils.book_append_sheet(wb, ws, '电话号码')

      // 导出文件
      const locationName = city.value ? city.value.replace(/\s+/g, '') : '全国'
      const searchWord = keyword.value ? `_${keyword.value}` : ''
      const fileName = `电话号码表_${locationName}${searchWord}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
      XLSX.writeFile(wb, fileName)

    // 记录导出次数
    const count = parseInt(localStorage.getItem('export_count') || '0')
    localStorage.setItem('export_count', (count + 1).toString())

    console.log(`电话表导出成功，共${phoneData.length}条记录`)
  } catch (err) {
    console.error('导出电话表失败:', err)
    alert(`导出失败：${err.message}`)
  }
}


</script>

<style scoped>
.search-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.search-header {
  margin-bottom: 32px;
}

.search-header h2 {
  font-size: 32px;
  color: #333333;
  margin-bottom: 24px;
  font-weight: 600;
}

.search-box {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.location-box {
  margin-top: 16px;
}

.location-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.location-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.location-input {
  flex: 1;
  border: none;
  font-size: 15px;
  background: transparent;
  outline: none;
  color: #333333;
}

.location-input::placeholder {
  color: #888888;
}

.clear-location-btn {
  padding: 6px 10px;
  background: #F9F9F9;
  color: #888888;
  border: none;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  box-shadow: none;
  min-width: auto;
}

.clear-location-btn:hover {
  background: #E91E63;
  color: white;
  transform: translateY(-1px);
}

.geocode-btn {
  padding: 10px 20px;
  color: white;
  border: none;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
  white-space: nowrap;
  min-width: auto;
}

.geocode-btn:not(.gradient-btn) {
  background: #F9A8D4;
  box-shadow: 0 2px 8px rgba(255,100,130,0.2);
}

.geocode-btn:hover:not(:disabled):not(.gradient-btn) {
  background: #F48FB1;
  transform: translateY(-1px);
}

.location-status {
  margin-top: 12px;
  padding: 10px 16px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-box input {
  flex: 1;
  padding: 16px 20px;
  border: none;
  font-size: 17px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.search-box input:focus {
  outline: none;
  box-shadow: 0 4px 20px rgba(255,100,130,0.15);
}

.city-input {
  max-width: 180px;
}

.city-btn {
  padding: 16px 24px;
  color: white;
  border: none;
  font-size: 17px;
  cursor: pointer;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
  white-space: nowrap;
}

.city-btn:not(.gradient-btn) {
  background: white;
  color: #333333;
  border: 2px solid #EEEEEE;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.city-btn:hover:not(.gradient-btn) {
  border-color: #F9A8D4;
  color: #F9A8D4;
  background: white;
  transform: translateY(-1px);
}

.city-selector-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
}

.clear-city-btn {
  padding: 8px 10px;
  background: #F9F9F9;
  color: #888888;
  border: none;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  box-shadow: none;
  min-width: auto;
}

.clear-city-btn:hover {
  background: #E91E63;
  color: white;
  transform: translateY(-1px);
}

.city-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.city-modal-content {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.city-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #F9F9F9;
}

.city-modal-header h3 {
  font-size: 22px;
  color: #333333;
  font-weight: 600;
}

.close-btn {
  padding: 8px 12px;
  background: #F9F9F9;
  color: #333333;
  border: none;
  font-size: 18px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  box-shadow: none;
}

.close-btn:hover {
  background: #EEEEEE;
  transform: none;
}

.city-search-box {
  position: relative;
  padding: 16px 32px;
  border-bottom: 1px solid #F9F9F9;
}

.city-search-input {
  width: 100%;
  padding: 14px 48px 14px 20px;
  border: none;
  background: #F9F9F9;
  border-radius: 8px;
  font-size: 16px;
}

.city-search-input:focus {
  outline: none;
  background: #EEEEEE;
}

.search-icon {
  position: absolute;
  right: 48px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  opacity: 0.5;
}

.search-results {
  padding: 16px 32px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #F9F9F9;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.search-result-item:hover {
  background: linear-gradient(135deg, #F9A8D4, #FCE4EC);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(255,100,130,0.3);
}

.search-result-item:hover .result-city,
.search-result-item:hover .result-province {
  color: white;
}

.custom-area-item {
  border-top: 1px solid #F9F9F9;
  margin-top: 8px;
  background: linear-gradient(135deg, #FDF2F8, #fff0f3);
}

.custom-area-item .result-province {
  color: #F9A8D4;
}

.custom-area-item:hover .result-province {
  color: white;
}

.result-city {
  font-size: 16px;
  color: #333333;
  font-weight: 600;
}

.result-province {
  font-size: 14px;
  color: #888888;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #888888;
  font-size: 16px;
}

.city-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 32px;
  border-bottom: 1px solid #F9F9F9;
}

.city-tab {
  padding: 10px 24px;
  background: transparent;
  color: #888888;
  border: none;
  font-size: 16px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  box-shadow: none;
}

.city-tab:hover {
  background: #F9F9F9;
  color: #333333;
  transform: none;
}

.city-tab.active {
  background: linear-gradient(135deg, #F9A8D4, #FCE4EC);
  color: white;
  box-shadow: 0 4px 12px rgba(255,100,130,0.3);
  animation: gradient-shift 3s ease infinite;
  background-size: 200% 200%;
}

.hot-cities {
  padding: 32px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.city-option {
  padding: 14px 20px;
  background: #F9F9F9;
  color: #333333;
  border: none;
  font-size: 15px;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.3s;
  box-shadow: none;
}

.city-option:hover {
  background: linear-gradient(135deg, #F9A8D4, #FCE4EC);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(255,100,130,0.3);
}

.tabs-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.province-tab-content {
  display: flex;
  flex-direction: column;
  height: 400px; /* Base height for the whole tab */
  flex: 1;
  min-height: 0;
}

.province-selector {
  display: flex;
  flex: 1;
  min-height: 0; /* Important for flex children scrolling */
  overflow: hidden;
}

.province-list,
.city-list,
.district-list,
.town-list {
  flex: 1;
  overflow-y: auto;
  border-right: 1px solid #F9F9F9;
  padding: 16px;
  /* Add custom scrollbar for better look */
}

.province-list::-webkit-scrollbar,
.city-list::-webkit-scrollbar,
.district-list::-webkit-scrollbar,
.town-list::-webkit-scrollbar {
  width: 6px;
}

.province-list::-webkit-scrollbar,
.city-list::-webkit-scrollbar,
.district-list::-webkit-scrollbar,
.town-list::-webkit-scrollbar {
  background: #eee;
  border-radius: 4px;
}

.district-list {
  border-right: 1px solid #F9F9F9;
}
.town-list {
  border-right: none;
}

.province-item,
.city-item,
.district-item,
.town-item {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  color: #333333;
  border: none;
  font-size: 15px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  text-align: left;
  margin-bottom: 4px;
  box-shadow: none;
  word-break: break-all;
}

.province-item:hover,
.city-item:hover,
.district-item:hover,
.town-item:hover {
  background: linear-gradient(135deg, #ffe8ed, #fff0f3);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(255,100,130,0.15);
}

.province-item.active,
.city-item.active {
  background: linear-gradient(135deg, #F9A8D4, #FCE4EC);
  color: white;
  box-shadow: 0 4px 12px rgba(255,100,130,0.3);
  animation: gradient-shift 3s ease infinite;
  background-size: 200% 200%;
}

.city-actions {
  padding: 16px 32px;
  background: white;
  border-top: 1px solid #F9F9F9;
  flex-shrink: 0;
}

.confirm-btn {
  width: 100%;
  padding: 14px;
  color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s;
}

.confirm-btn:not(.gradient-btn) {
  background: #F9A8D4;
  box-shadow: 0 2px 8px rgba(255,100,130,0.25);
}

.confirm-btn:hover:not(.gradient-btn) {
  background: #F48FB1;
  transform: translateY(-2px);
}

button {
  padding: 16px 32px;
  color: white;
  border: none;
  font-size: 17px;
  cursor: pointer;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
  white-space: nowrap;
}

button:not(.gradient-btn) {
  background: #F9A8D4;
  box-shadow: 0 2px 8px rgba(255,100,130,0.25);
}

button:hover:not(:disabled):not(.gradient-btn) {
  background: #F48FB1;
  transform: translateY(-2px);
}

button:disabled {
  background: #d2d2d7;
  cursor: not-allowed;
  transform: none;
  animation: none;
}

.search-main-btn {
  min-width: 100px;
}

.search-main-btn.gradient-btn:disabled {
  background: #d2d2d7;
  animation: none;
  box-shadow: none;
}

.geocode-btn.gradient-btn:disabled {
  background: #d2d2d7;
  animation: none;
  box-shadow: none;
}

.cancel-btn {
  padding: 16px 24px;
  background: #F9F9F9;
  color: #E91E63;
  border: none;
  font-size: 15px;
  cursor: pointer;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: none;
  min-width: auto;
}

.cancel-btn:hover {
  background: #E91E63;
  color: white;
  transform: translateY(-2px);
}

.error {
  background: #FDF2F8;
  color: #E91E63;
  padding: 20px 24px;
  margin-bottom: 24px;
  border-radius: 8px;
}

.loading {
  text-align: center;
  color: #888888;
  padding: 80px;
  font-size: 17px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.results-count {
  font-size: 18px;
  color: #333333;
  font-weight: 600;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.sort-select {
  padding: 10px 16px;
  border: none;
  background: #F9F9F9;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.export-btn {
  padding: 10px 20px;
  background: #F9F9F9;
  color: #333333;
  font-size: 14px;
  box-shadow: none;
}

.export-btn:hover {
  background: #EEEEEE;
}

.filter-box {
  margin-bottom: 24px;
}

.filter-input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: white;
  border-radius: 8px;
  font-size: 15px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.results {
  display: grid;
  gap: 32px;
}

.district-group {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.district-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #F9F9F9;
}

.district-name {
  font-size: 24px;
  color: #333333;
  font-weight: 600;
  margin: 0;
}

.district-count {
  font-size: 15px;
  color: #888888;
  background: #F9F9F9;
  padding: 6px 14px;
  border-radius: 20px;
}

.district-results {
  display: grid;
  gap: 16px;
}

.poi-item {
  padding: 24px;
  background: #fafafa;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  transition: all 0.3s;
}

.poi-item:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-4px);
  background: white;
}

.poi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.poi-name {
  font-size: 20px;
  font-weight: 600;
  color: #333333;
}

.favorite-btn {
  padding: 4px 8px;
  background: transparent;
  color: #d2d2d7;
  font-size: 24px;
  box-shadow: none;
}

.favorite-btn.favorited {
  color: #F9A8D4;
}

.poi-info {
  color: #6e6e73;
  font-size: 15px;
  margin: 8px 0;
}

.poi-info.no-phone {
  color: #888888;
}

.poi-info.distance-info {
  color: #F9A8D4;
  font-weight: 600;
}

.poi-phones {
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

.poi-phone {
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
  box-shadow: none;
}

.copy-btn:hover {
  background: #EEEEEE;
}

.copy-btn.copied {
  background: #F9A8D4;
  color: white;
}

.load-more-section {
  text-align: center;
  padding: 32px 0;
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.load-more-btn {
  padding: 14px 40px;
  color: #F9A8D4;
  border: 2px solid #F9A8D4;
  font-size: 16px;
  cursor: pointer;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: none;
}

.load-more-btn:not(.gradient-btn) {
  background: white;
}

.load-more-btn.gradient-btn {
  border: none;
  color: white;
}

.load-more-btn:hover:not(:disabled):not(.gradient-btn) {
  background: #F9A8D4;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(255,100,130,0.25);
}

.load-more-btn:disabled {
  background: #F9F9F9;
  color: #888888;
  border-color: #EEEEEE;
  cursor: not-allowed;
  transform: none;
  animation: none;
  box-shadow: none;
}



.no-more {
  text-align: center;
  padding: 32px 0;
  color: #888888;
  font-size: 15px;
}

  /* ── 响应式适配 ── */
  @media (max-width: 768px) {
    .search-page {
      padding: 0 16px;
    }

    .search-header {
      margin-bottom: 20px;
    }

    .search-header h2 {
      font-size: 24px;
      margin-bottom: 16px;
      text-align: center;
    }

    .search-box {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8f8f8;
      padding: 16px;
      border-radius: 16px;
      margin-bottom: 12px;
    }

    .keyword-input {
      width: 100%;
      font-size: 15px;
      padding: 14px 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    .city-selector-wrapper {
      width: 100%;
      display: flex;
      gap: 8px;
    }

    .city-btn {
      flex: 1;
      padding: 12px 16px;
      font-size: 15px;
      border-radius: 10px;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .clear-city-btn {
      padding: 0 14px;
    }

    .search-main-btn {
      width: 100%;
      padding: 14px;
      font-size: 16px;
      border-radius: 12px;
      margin: 0;
      font-weight: 600;
    }

    .location-box {
      margin-top: 12px;
    }

    .location-input-wrapper {
      padding: 12px;
      border-radius: 12px;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    .location-input {
      font-size: 14px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .geocode-btn {
      width: 100%;
      padding: 10px;
      margin: 0;
      font-size: 14px;
    }

    /* 工具栏 */
    .toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
      padding: 16px;
      margin-bottom: 20px;
      border-radius: 12px;
    }

    .results-count {
      font-size: 14px;
      text-align: center;
    }

    .toolbar-right {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      width: 100%;
    }

    .sort-select {
      width: 100%;
      padding: 12px;
      font-size: 14px;
      background: #f5f5f5;
    }

    .export-btn {
      width: 100%;
      padding: 12px;
      font-size: 14px;
      background: #f5f5f5;
    }

    /* 结果列表 */
    .results {
      gap: 20px;
    }

    .district-group {
      padding: 16px;
      border-radius: 16px;
    }

    .district-name {
      font-size: 20px;
    }

    .poi-item {
      padding: 16px;
      border-radius: 12px;
    }

    .poi-name {
      font-size: 18px;
    }

    .poi-info {
      font-size: 14px;
    }

    .phone-number {
      font-size: 16px;
    }

    /* 城市弹窗 */
    .city-modal {
      padding: 0;
      align-items: flex-end;
    }

    .city-modal-content {
      height: 85vh;
      border-radius: 24px 24px 0 0;
    }

    .province-selector {
      flex-direction: column;
      overflow-y: auto;
    }

    .province-list,
    .city-list,
    .district-list,
    .town-list {
      flex: none;
      width: 100%;
      max-height: 25vh;
      border-right: none;
      border-bottom: 1px solid #f8f8f8;
      padding: 12px;
    }

    .province-item,
    .city-item,
    .district-item,
    .town-item {
      padding: 10px 16px;
      font-size: 14px;
    }

    .city-actions {
      padding: 16px;
      padding-bottom: max(16px, env(safe-area-inset-bottom));
    }
  }
</style>
