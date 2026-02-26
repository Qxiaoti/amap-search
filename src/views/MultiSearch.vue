<template>
  <div class="multi-search-page">
    <div class="page-header">
      <h2>多关键词对比搜索</h2>
      <p class="subtitle">每个关键词单独搜索并按列展示，一键去重合并为总表</p>
    </div>

    <!-- 搜索控制区 -->
    <div class="search-panel">
      <div class="search-row">
        <input
          v-model="keyword"
          type="text"
          placeholder="输入多个关键词，用逗号分隔（如：火锅,烧烤,快餐）"
          class="keyword-input"
          @keypress.enter="startSearch"
        />
        <div class="city-selector-wrapper">
          <button @click="showCitySelector = true" class="city-btn gradient-btn">
            {{ selectedCityText || '选择城市' }}
          </button>
          <button v-if="city" @click="clearCity" class="clear-btn">✕</button>
        </div>
        <button @click="startSearch" :disabled="isSearching" class="search-btn gradient-btn">
          {{ isSearching ? '搜索中...' : '开始搜索' }}
        </button>
        <button v-if="isSearching" @click="cancelAll" class="cancel-btn">取消</button>
      </div>

      <!-- 关键词状态标签 -->
      <div v-if="columns.length > 0" class="kw-tags">
        <div
          v-for="col in columns"
          :key="col.kw"
          class="kw-tag"
          :class="{ loading: col.loading, done: col.done, error: col.hasError }"
        >
          <span class="kw-label">{{ col.kw }}</span>
          <span class="kw-count">
            {{ col.loading ? '搜索中...' : col.hasError ? '失败' : `${col.pois.length} 个` }}
          </span>
        </div>
      </div>
    </div>

    <!-- 操作栏（有结果后显示） -->
    <div v-if="hasAnyResults" class="action-bar">
      <div class="action-left">
        <span class="total-info">
          各列共 {{ totalRaw }} 个（含重复），去重后 {{ mergedResults.length }} 个
        </span>
      </div>
      <div class="action-right">
        <button
          @click="showMerged = !showMerged"
          class="toggle-btn"
          :class="{ active: showMerged }"
        >
          {{ showMerged ? '查看分列视图' : '查看总表' }}
        </button>
        <button @click="deduplicateAndShow" class="dedup-btn gradient-btn">
          一键去重 &amp; 生成总表
        </button>
        <button v-if="showMerged" @click="exportMerged" class="export-btn">导出总表 Excel</button>
        <button v-if="showMerged" @click="exportMergedPhones" class="export-btn">导出总表电话</button>
      </div>
    </div>

    <!-- 分列视图 -->
    <div v-if="hasAnyResults && !showMerged" class="columns-view">
      <div
        v-for="col in columns"
        :key="col.kw"
        class="col-panel"
      >
        <div class="col-header">
          <div class="col-title">{{ col.kw }}</div>
          <div class="col-meta">
            <span v-if="col.loading" class="col-status loading">搜索中...</span>
            <span v-else-if="col.hasError" class="col-status error">{{ col.errorMsg }}</span>
            <span v-else class="col-status done">{{ col.pois.length }} 个商户</span>
          </div>
          <button
            v-if="!col.loading && col.hasMore"
            @click="loadMoreForCol(col)"
            :disabled="col.loadingMore"
            class="col-more-btn"
          >
            {{ col.loadingMore ? '加载中...' : '加载更多' }}
          </button>
          <button
            v-if="!col.loading && col.hasMore"
            @click="loadAllForCol(col)"
            :disabled="col.loadingAll"
            class="col-all-btn gradient-btn"
          >
            {{ col.loadingAll ? `加载中(${col.pois.length})...` : '加载全部' }}
          </button>
        </div>

        <div v-if="col.loading" class="col-loading">搜索中...</div>
        <div v-else-if="col.pois.length === 0 && col.done" class="col-empty">无结果</div>
        <div v-else class="col-list">
          <div
            v-for="poi in col.pois"
            :key="poi.id"
            class="poi-card"
            :class="{ duplicate: isDuplicate(poi.id) }"
          >
            <div class="poi-name">{{ poi.name }}</div>
            <div class="poi-addr">{{ poi.address || '暂无地址' }}</div>
            <div class="poi-type">{{ poi.type || '' }}</div>
            <div v-if="poi.tel" class="poi-tel">{{ poi.tel }}</div>
            <div v-if="isDuplicate(poi.id)" class="dup-badge">重复</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 总表视图 -->
    <div v-if="hasAnyResults && showMerged" class="merged-view">
      <div class="merged-header">
        <h3>去重总表（{{ mergedResults.length }} 个商户）</h3>
        <input
          v-model="mergeFilter"
          type="text"
          placeholder="筛选名称/地址/类型..."
          class="merge-filter"
        />
      </div>
        <table class="merged-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>商户名称</th>
              <th>来源关键词</th>
              <th>地区</th>
              <th>地址</th>
              <th>类型</th>
              <th>电话</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(poi, idx) in filteredMerged" :key="poi.id">
              <td>{{ idx + 1 }}</td>
              <td class="td-name">{{ poi.name }}</td>
              <td><span class="kw-source-tag">{{ poi._sourceKw }}</span></td>
              <td>{{ getDistrict(poi) }}</td>
              <td class="td-addr">{{ poi.address || '-' }}</td>
              <td>{{ poi.type || '-' }}</td>
              <td class="td-tel">{{ poi.tel || '-' }}</td>
            </tr>
          </tbody>
        </table>
        <!-- 手机端卡片列表 -->
        <div class="merged-cards">
          <div v-for="(poi, idx) in filteredMerged" :key="'mc-' + poi.id" class="merged-card">
            <div class="mc-top">
              <span class="mc-idx">{{ idx + 1 }}</span>
              <span class="mc-name">{{ poi.name }}</span>
              <span class="kw-source-tag">{{ poi._sourceKw }}</span>
            </div>
            <div class="mc-row" v-if="poi.tel">📞 <span class="mc-tel">{{ poi.tel }}</span></div>
            <div class="mc-row" v-if="poi.address">📍 {{ poi.address }}</div>
            <div class="mc-row" v-if="getDistrict(poi)">🏙 {{ getDistrict(poi) }} · {{ poi.type || '' }}</div>
          </div>
        </div>
      <div v-if="filteredMerged.length === 0" class="empty-hint">没有匹配的商户</div>
    </div>

    <!-- 城市选择器弹窗（复用与 Search.vue 相同逻辑） -->
    <div v-if="showCitySelector" class="city-modal" @click="showCitySelector = false">
      <div class="city-modal-content" @click.stop>
        <div class="city-modal-header">
          <h3>选择城市</h3>
          <button class="close-btn" @click="showCitySelector = false">✕</button>
        </div>
        <div class="city-search-box">
          <input
            v-model="citySearchKeyword"
            type="text"
            placeholder="搜索城市名称..."
            class="city-search-input"
          />
        </div>

        <div v-if="citySearchKeyword && citySearchResults.length > 0" class="search-results">
          <div
            v-for="(result, index) in citySearchResults"
            :key="index"
            class="search-result-item"
            @click="selectSearchResult(result)"
          >
            <div class="result-city">{{ result.label }}</div>
            <div class="result-province">{{ result.sublabel }}</div>
          </div>
          <div class="search-result-item custom-area-item" @click="selectCustomCity(citySearchKeyword)">
            <div class="result-city">使用 "{{ citySearchKeyword }}" 作为区域</div>
            <div class="result-province">自定义搜索区域</div>
          </div>
        </div>

        <div v-else-if="citySearchKeyword && citySearchResults.length === 0" class="no-results">
          <div style="margin-bottom: 16px;">未在快捷列表中找到匹配城市</div>
          <button class="confirm-btn gradient-btn" style="width:auto;padding:10px 24px;" @click="selectCustomCity(citySearchKeyword)">
            直接搜索 "{{ citySearchKeyword }}" 区域
          </button>
        </div>

        <div v-else class="tabs-container">
          <div class="city-tabs">
            <button :class="['city-tab', { active: activeTab === 'hot' }]" @click="activeTab = 'hot'">热门城市</button>
            <button :class="['city-tab', { active: activeTab === 'province' }]" @click="activeTab = 'province'">按省份</button>
          </div>
          <div v-if="activeTab === 'hot'" class="hot-cities">
            <button v-for="c in hotCities" :key="c" class="city-option" @click="selectCity(c)">{{ c }}</button>
          </div>
          <div v-if="activeTab === 'province'" class="province-tab-content">
            <div class="province-selector">
              <div class="province-list">
                <button
                  v-for="item in cityData"
                  :key="item.province"
                  :class="['province-item', { active: selectedProvince === item.province }]"
                  @click="selectedProvince = item.province"
                >{{ item.province }}</button>
              </div>
              <div class="city-list" v-if="selectedProvince">
                <button
                  v-for="c in currentCities"
                  :key="c.name"
                  :class="['city-item', { active: selectedCity === c.name }]"
                  @click="selectedCity = c.name"
                >{{ c.name }}</button>
              </div>
              <div class="district-list" v-if="selectedCity && currentDistricts.length > 0">
                <button
                  v-for="d in currentDistricts"
                  :key="d.name || d"
                  :class="['district-item', { active: selectedDistrict === (d.name || d) }]"
                  @click="selectDistrict(d)"
                >{{ d.name || d }}</button>
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
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { cityData, hotCities } from '../data/cities'
import * as XLSX from 'xlsx'

// ─── 城市选择 ───────────────────────────────────────────────
const city = ref('湖南')
const showCitySelector = ref(false)
const activeTab = ref('hot')
const selectedProvince = ref('')
const selectedCity = ref('')
const selectedDistrict = ref('')
const selectedTown = ref('')
const citySearchKeyword = ref('')

const selectedCityText = computed(() => {
  if (selectedTown.value) return `${selectedCity.value} ${selectedDistrict.value} ${selectedTown.value}`
  if (selectedDistrict.value) return `${selectedCity.value} ${selectedDistrict.value}`
  return city.value || ''
})

const citySearchResults = computed(() => {
  if (!citySearchKeyword.value) return []
  const kw = citySearchKeyword.value.toLowerCase().trim()
  const res = []
  cityData.forEach(province => {
    const pMatch = province.province.toLowerCase().includes(kw)
    province.cities.forEach(cityItem => {
      if (pMatch || cityItem.name.toLowerCase().includes(kw)) {
        res.push({ province: province.province, city: cityItem.name, district: '', town: '', districts: cityItem.districts.map(d => d.name || d), label: cityItem.name, sublabel: province.province })
      } else {
        cityItem.districts.forEach(dObj => {
          const d = dObj.name || dObj
          if (d.toLowerCase().includes(kw)) {
            res.push({ province: province.province, city: cityItem.name, district: d, town: '', districts: [], label: d, sublabel: `${province.province} · ${cityItem.name}` })
          }
          if (dObj.towns) {
            dObj.towns.forEach(town => {
              if (town.toLowerCase().includes(kw)) {
                res.push({ province: province.province, city: cityItem.name, district: d, town: town, districts: [], label: town, sublabel: `${cityItem.name} · ${d}` })
              }
            })
          }
        })
      }
    })
  })
  return res.slice(0, 30)
})

const currentCities = computed(() => {
  const p = cityData.find(p => p.province === selectedProvince.value)
  return p ? p.cities : []
})
const currentDistricts = computed(() => {
  const c = currentCities.value.find(c => c.name === selectedCity.value)
  return c ? c.districts : []
})
const currentTowns = computed(() => {
  const d = currentDistricts.value.find(d => (d.name || d) === selectedDistrict.value)
  return d ? (d.towns || []) : []
})

const selectCity = (name) => {
  city.value = name
  selectedCity.value = name
  selectedDistrict.value = ''
  selectedTown.value = ''
  citySearchKeyword.value = ''
  const cityObj = currentCities.value.find(c => c.name === name)
  if (!cityObj || !cityObj.districts || cityObj.districts.length === 0) {
    showCitySelector.value = false
  }
}
const selectDistrict = (d) => {
  selectedDistrict.value = d.name || d
  selectedTown.value = ''
  city.value = `${selectedCity.value} ${selectedDistrict.value}`
  
  const distObj = currentDistricts.value.find(dist => (dist.name || dist) === selectedDistrict.value)
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
const selectCustomCity = (name) => {
  city.value = name
  selectedCity.value = name
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
    selectDistrict(result.district)
  } else if (result.districts && result.districts.length === 0) {
    selectCity(result.city)
  } else {
    activeTab.value = 'province'
    citySearchKeyword.value = ''
  }
}
const clearCity = () => {
  city.value = ''
  selectedCity.value = ''
  selectedDistrict.value = ''
  selectedTown.value = ''
  selectedProvince.value = ''
}

// ─── 搜索核心 ───────────────────────────────────────────────
const keyword = ref('')
const columns = ref([])   // 每个关键词对应一列
const isSearching = ref(false)
const showMerged = ref(false)
const mergeFilter = ref('')
const abortControllers = ref([])

const PAGE_SIZE = 20

function getCityAndTownParams() {
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
  return { cityParam, townParam }
}

const startSearch = async () => {
  const apiKey = localStorage.getItem('amap_api_key')
  if (!apiKey) { alert('请先在设置页面配置 API Key'); return }
  const kwList = keyword.value.split(/[,，]+/).map(k => k.trim()).filter(Boolean)
  if (!kwList.length) { alert('请输入至少一个关键词'); return }

  // 终止旧请求
  abortControllers.value.forEach(c => c.abort())
  abortControllers.value = []

  showMerged.value = false
  isSearching.value = true

  // 初始化列结构
  columns.value = kwList.map(kw => reactive({
    kw,
    pois: [],
    page: 1,
    total: 0,
    loading: true,
    loadingMore: false,
    loadingAll: false,
    done: false,
    hasMore: false,
    hasError: false,
    errorMsg: ''
  }))

  const { cityParam, townParam } = getCityAndTownParams()

  // 并发搜索所有关键词第1页
  const tasks = columns.value.map(col => searchColPage(col, 1, apiKey, cityParam, townParam))
  await Promise.allSettled(tasks)
  isSearching.value = false
}

const searchColPage = async (col, page, apiKey, cityParam, townParam) => {
  const ctrl = new AbortController()
  abortControllers.value.push(ctrl)

  col.loading = (page === 1)
  col.loadingMore = (page > 1)

  try {
    let actualKeyword = col.kw
    if (townParam) {
      actualKeyword = `${townParam} ${actualKeyword}`
    }

    let url = `https://restapi.amap.com/v3/place/text?key=${apiKey}&keywords=${encodeURIComponent(actualKeyword)}&output=json&offset=${PAGE_SIZE}&page=${page}&extensions=base`
    if (cityParam) url += `&city=${encodeURIComponent(cityParam)}&citylimit=true`

    const res = await fetch(url, { signal: ctrl.signal })
    const data = await res.json()

    if (data.status === '0') {
      col.hasError = true
      col.errorMsg = data.info || '请求失败'
      col.done = true
      return
    }

    if (data.pois && data.pois.length > 0) {
      // 去重追加
      const existIds = new Set(col.pois.map(p => p.id))
      for (const poi of data.pois) {
        if (!existIds.has(poi.id)) {
          existIds.add(poi.id)
          col.pois.push({ ...poi, _sourceKw: col.kw })
        }
      }
    }

    if (page === 1) {
      col.total = parseInt(data.count) || 0
    }

    col.page = page
    col.hasMore = col.pois.length < col.total && data.pois && data.pois.length === PAGE_SIZE
    col.done = true
  } catch (err) {
    if (err.name !== 'AbortError') {
      col.hasError = true
      col.errorMsg = err.message
      col.done = true
    }
  } finally {
    col.loading = false
    col.loadingMore = false
  }
}

const loadMoreForCol = async (col) => {
  const apiKey = localStorage.getItem('amap_api_key')
  if (!apiKey) return
  col.loadingMore = true
  const { cityParam, townParam } = getCityAndTownParams()
  await searchColPage(col, col.page + 1, apiKey, cityParam, townParam)
}

const loadAllForCol = async (col) => {
  const apiKey = localStorage.getItem('amap_api_key')
  if (!apiKey) return
  col.loadingAll = true

  try {
    let p = col.page + 1
    const { cityParam, townParam } = getCityAndTownParams()
    while (p <= 100) {
      if (!col.loadingAll) break
      const ctrl = new AbortController()
      abortControllers.value.push(ctrl)

      let actualKeyword = col.kw
      if (townParam) {
        actualKeyword = `${townParam} ${actualKeyword}`
      }

      let url = `https://restapi.amap.com/v3/place/text?key=${apiKey}&keywords=${encodeURIComponent(actualKeyword)}&output=json&offset=${PAGE_SIZE}&page=${p}&extensions=base`
      if (cityParam) url += `&city=${encodeURIComponent(cityParam)}&citylimit=true`

      await new Promise(r => setTimeout(r, 400))

      const res = await fetch(url, { signal: ctrl.signal })
      const data = await res.json()

      if (!data.pois || data.pois.length === 0) break

      const existIds = new Set(col.pois.map(poi => poi.id))
      for (const poi of data.pois) {
        if (!existIds.has(poi.id)) {
          existIds.add(poi.id)
          col.pois.push({ ...poi, _sourceKw: col.kw })
        }
      }
      col.page = p
      col.hasMore = data.pois.length === PAGE_SIZE
      p++
    }
    col.hasMore = false
  } catch (err) {
    if (err.name !== 'AbortError') col.errorMsg = err.message
  } finally {
    col.loadingAll = false
  }
}

const cancelAll = () => {
  abortControllers.value.forEach(c => c.abort())
  abortControllers.value = []
  isSearching.value = false
  columns.value.forEach(col => {
    col.loading = false
    col.loadingMore = false
    col.loadingAll = false
    col.done = true
  })
}

// ─── 去重总表 ─────────────────────────────────────────────
const mergedResults = computed(() => {
  const seen = new Set()
  const merged = []
  for (const col of columns.value) {
    for (const poi of col.pois) {
      if (!seen.has(poi.id)) {
        seen.add(poi.id)
        merged.push(poi)
      }
    }
  }
  return merged
})

// 标记在多列中出现的重复商户
const duplicateIds = computed(() => {
  const counts = {}
  for (const col of columns.value) {
    for (const poi of col.pois) {
      counts[poi.id] = (counts[poi.id] || 0) + 1
    }
  }
  return new Set(Object.entries(counts).filter(([, v]) => v > 1).map(([k]) => k))
})

const isDuplicate = (id) => duplicateIds.value.has(id)

const filteredMerged = computed(() => {
  if (!mergeFilter.value.trim()) return mergedResults.value
  const kw = mergeFilter.value.toLowerCase()
  return mergedResults.value.filter(p =>
    (p.name || '').toLowerCase().includes(kw) ||
    (p.address || '').toLowerCase().includes(kw) ||
    (p.type || '').toLowerCase().includes(kw)
  )
})

const totalRaw = computed(() => columns.value.reduce((s, c) => s + c.pois.length, 0))
const hasAnyResults = computed(() => columns.value.some(c => c.pois.length > 0 || c.done))

const deduplicateAndShow = () => {
  showMerged.value = true
}

function getDistrict(poi) {
  if (poi.adname) return poi.adname
  if (poi.address) {
    const m = poi.address.match(/^([^省]+省)?([^市]+市)?([^区县]+[区县])/)
    if (m && m[3]) return m[3]
  }
  return '其他'
}

// ─── 导出 ─────────────────────────────────────────────────
const exportMerged = () => {
  if (!mergedResults.value.length) { alert('没有可导出的数据'); return }
  const data = filteredMerged.value.map((poi, i) => ({
    '序号': i + 1,
    '商户名称': poi.name || '',
    '来源关键词': poi._sourceKw || '',
    '地区': getDistrict(poi),
    '地址': poi.address || '',
    '类型': poi.type || '',
    '电话': poi.tel || '',
    '经度': poi.location ? poi.location.split(',')[0] : '',
    '纬度': poi.location ? poi.location.split(',')[1] : ''
  }))
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 50 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, ws, '去重总表')
  const loc = city.value ? city.value.replace(/\s+/g, '') : '全国'
  XLSX.writeFile(wb, `去重总表_${loc}_${keyword.value}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`)
}

const exportMergedPhones = () => {
  const rows = []
  filteredMerged.value.forEach(poi => {
    if (!poi.tel) return
    const telStr = Array.isArray(poi.tel) ? poi.tel.join(';') : String(poi.tel)
    telStr.split(/[;,，；\s]+/).filter(Boolean).forEach((phone, idx) => {
      rows.push({
        '序号': rows.length + 1,
        '商户名称': poi.name || '',
        '来源关键词': poi._sourceKw || '',
        '地区': getDistrict(poi),
        '电话号码': phone,
        '电话类型': idx === 0 ? '主要电话' : `电话${idx + 1}`,
        '地址': poi.address || '',
        '类型': poi.type || ''
      })
    })
  })
  if (!rows.length) { alert('没有电话号码可导出'); return }
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 50 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws, '电话号码')
  const loc = city.value ? city.value.replace(/\s+/g, '') : '全国'
  XLSX.writeFile(wb, `总表电话_${loc}_${keyword.value}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`)
}
</script>

<style scoped>
.multi-search-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px 60px;
}

.page-header {
  margin-bottom: 28px;
}

.page-header h2 {
  font-size: 30px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  color: #888;
  font-size: 15px;
}

/* ── 搜索面板 ── */
.search-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 20px;
}

.search-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.keyword-input {
  flex: 1;
  min-width: 260px;
  padding: 14px 20px;
  border: none;
  font-size: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  outline: none;
}

.keyword-input:focus {
  box-shadow: 0 0 0 2px #f9a8d460;
}

.city-selector-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.city-btn {
  padding: 14px 20px;
  border: none;
  font-size: 15px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 500;
}

.clear-btn {
  padding: 8px 10px;
  background: #f9f9f9;
  color: #888;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  min-width: auto;
}

.clear-btn:hover { background: #E91E63; color: white; }

.search-btn {
  padding: 14px 28px;
  border: none;
  font-size: 15px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}

.cancel-btn {
  padding: 14px 20px;
  background: #f9f9f9;
  color: #E91E63;
  border: none;
  font-size: 15px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  min-width: auto;
}

.cancel-btn:hover { background: #E91E63; color: white; }

/* 关键词状态标签 */
.kw-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.kw-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: #f9f9f9;
  font-size: 14px;
  transition: all 0.2s;
}

.kw-tag.loading { background: #fff8e1; }
.kw-tag.done { background: #e8f5e9; }
.kw-tag.error { background: #fce4ec; }

.kw-label { font-weight: 600; color: #333; }
.kw-count { color: #888; }

/* ── 操作栏 ── */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: 12px;
  padding: 18px 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.action-left .total-info {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.action-right {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.toggle-btn {
  padding: 10px 20px;
  background: #f9f9f9;
  color: #555;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  box-shadow: none;
}

.toggle-btn:hover, .toggle-btn.active {
  background: #f9a8d4;
  color: white;
}

.dedup-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.export-btn {
  padding: 10px 18px;
  background: #f9f9f9;
  color: #333;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: none;
}

.export-btn:hover { background: #eeeeee; }

/* ── 分列视图 ── */
.columns-view {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 12px;
  align-items: flex-start;
}

.col-panel {
  min-width: 280px;
  max-width: 320px;
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: hidden;
}

.col-header {
  padding: 16px 18px;
  background: linear-gradient(135deg, #f9a8d4, #fce4ec);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.col-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.col-meta { font-size: 13px; }

.col-status.loading { color: #fff8e1; }
.col-status.done { color: rgba(255,255,255,0.9); }
.col-status.error { color: #ffcdd2; }

.col-more-btn, .col-all-btn {
  margin-top: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  min-width: auto;
  align-self: flex-start;
}

.col-more-btn {
  background: rgba(255,255,255,0.3);
  color: white;
  box-shadow: none;
}
.col-more-btn:hover:not(:disabled) { background: rgba(255,255,255,0.5); }

.col-all-btn {
  color: white;
  border: none;
}

.col-loading, .col-empty {
  text-align: center;
  padding: 40px 20px;
  color: #888;
  font-size: 15px;
}

.col-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 70vh;
  overflow-y: auto;
}

.col-list::-webkit-scrollbar { width: 4px; }
.col-list::-webkit-scrollbar-thumb { background: #f9a8d4; border-radius: 2px; }

.poi-card {
  padding: 14px;
  background: #fafafa;
  border-radius: 10px;
  position: relative;
  transition: all 0.2s;
}

.poi-card:hover {
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
}

.poi-card.duplicate {
  border-left: 3px solid #f9a8d4;
}

.poi-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.poi-addr, .poi-type, .poi-tel {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
  word-break: break-all;
}

.poi-tel { color: #f9a8d4; font-weight: 600; }

.dup-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #fce4ec;
  color: #E91E63;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

/* ── 总表视图 ── */
.merged-view {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: hidden;
}

.merged-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f9f9f9;
  flex-wrap: wrap;
  gap: 12px;
}

.merged-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.merge-filter {
  padding: 10px 16px;
  border: none;
  background: #f9f9f9;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  min-width: 220px;
}

.merge-filter:focus { box-shadow: 0 0 0 2px #f9a8d460; }

.merged-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.merged-table th {
  background: #f9f9f9;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #eee;
  white-space: nowrap;
}

.merged-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f9f9f9;
  color: #333;
  vertical-align: top;
}

.merged-table tr:hover td { background: #fdf2f8; }

.td-name { font-weight: 600; white-space: nowrap; }
.td-addr { color: #666; max-width: 260px; }
.td-tel { color: #f9a8d4; font-weight: 600; white-space: nowrap; }

.kw-source-tag {
  display: inline-block;
  padding: 2px 10px;
  background: linear-gradient(135deg, #f9a8d4, #fce4ec);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.empty-hint {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 15px;
}

/* ── 城市弹窗（复用样式） ── */
.city-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
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
  padding: 20px 28px;
  border-bottom: 1px solid #f9f9f9;
}

.city-modal-header h3 { font-size: 20px; color: #333; font-weight: 600; margin: 0; }

.close-btn {
  padding: 8px 12px;
  background: #f9f9f9;
  color: #333;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  box-shadow: none;
  min-width: auto;
}

.city-search-box {
  padding: 14px 28px;
  border-bottom: 1px solid #f9f9f9;
}

.city-search-input {
  width: 100%;
  padding: 12px 20px;
  border: none;
  background: #f9f9f9;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}

.search-results {
  padding: 14px 28px;
  overflow-y: auto;
  flex: 1;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.search-result-item:hover {
  background: linear-gradient(135deg, #f9a8d4, #fce4ec);
}

.search-result-item:hover .result-city,
.search-result-item:hover .result-province { color: white; }

.custom-area-item { background: #fdf2f8; }
.result-city { font-size: 15px; color: #333; font-weight: 600; }
.result-province { font-size: 13px; color: #888; }

.no-results { text-align: center; padding: 40px 20px; color: #888; }

.tabs-container { display: flex; flex-direction: column; flex: 1; min-height: 0; }

.city-tabs {
  display: flex;
  gap: 8px;
  padding: 14px 28px;
  border-bottom: 1px solid #f9f9f9;
}

.city-tab {
  padding: 8px 20px;
  background: transparent;
  color: #888;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  box-shadow: none;
  min-width: auto;
}

.city-tab:hover { background: #f9f9f9; color: #333; }

.city-tab.active {
  background: linear-gradient(135deg, #f9a8d4, #fce4ec);
  color: white;
}

.hot-cities {
  padding: 24px 28px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  overflow-y: auto;
  flex: 1;
}

.city-option {
  padding: 12px 16px;
  background: #f9f9f9;
  color: #333;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: none;
  min-width: auto;
}

.city-option:hover {
  background: linear-gradient(135deg, #f9a8d4, #fce4ec);
  color: white;
}

.province-tab-content {
  display: flex;
  flex-direction: column;
  height: 380px;
  flex: 1;
  min-height: 0;
}

.province-selector {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.province-list, .city-list, .district-list, .town-list {
  flex: 1;
  overflow-y: auto;
  border-right: 1px solid #f9f9f9;
  padding: 14px;
}
.town-list {
  border-right: none;
}

.province-item, .city-item, .district-item, .town-item {
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  color: #333;
  border: none;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  text-align: left;
  margin-bottom: 2px;
  box-shadow: none;
  word-break: break-all;
  min-width: auto;
}

.province-item:hover, .city-item:hover, .district-item:hover, .town-item:hover {
  background: #fce4ec;
}

.province-item.active, .city-item.active, .district-item.active, .town-item.active {
  background: linear-gradient(135deg, #f9a8d4, #fce4ec);
  color: white;
}

.city-actions {
  padding: 14px 28px;
  border-top: 1px solid #f9f9f9;
}

.confirm-btn {
  width: 100%;
  padding: 12px;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
}

/* gradient-btn 全局注入（父组件App.vue有定义，这里备用） */
.gradient-btn {
  background: linear-gradient(135deg, #f9a8d4, #f48fb1) !important;
  background-size: 200% 200%;
  color: white !important;
  box-shadow: 0 4px 15px rgba(255, 100, 130, 0.3);
  transition: all 0.3s;
}

.gradient-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 100, 130, 0.4);
}

.gradient-btn:disabled {
  background: #d2d2d7 !important;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

  /* ── 响应式适配 ── */
  @media (max-width: 768px) {
    .multi-search-page {
      padding: 0 16px 40px;
    }

    .page-header {
      margin-bottom: 20px;
      text-align: center;
    }

    .page-header h2 {
      font-size: 24px;
      margin-bottom: 6px;
    }

    .subtitle {
      font-size: 14px;
    }

    .search-panel {
      padding: 16px;
      border-radius: 16px;
    }

    .search-row {
      flex-direction: column;
      gap: 12px;
    }

    .keyword-input {
      min-width: unset;
      width: 100%;
      font-size: 15px;
      padding: 14px;
      border-radius: 12px;
    }

    .city-selector-wrapper {
      width: 100%;
    }

    .city-btn {
      flex: 1;
      font-size: 15px;
      padding: 12px;
      border-radius: 10px;
    }

    .search-btn {
      width: 100%;
      padding: 14px;
      font-size: 16px;
      border-radius: 12px;
    }

    .cancel-btn {
      width: 100%;
      padding: 12px;
      font-size: 15px;
    }

    /* 操作栏 */
    .action-bar {
      flex-direction: column;
      align-items: stretch;
      padding: 16px;
      gap: 12px;
      border-radius: 16px;
    }

    .action-left .total-info {
      font-size: 14px;
      text-align: center;
      display: block;
    }

    .action-right {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .action-right button {
      width: 100%;
      font-size: 14px;
      padding: 12px;
      margin: 0;
    }

    /* 分列：竖向堆叠 */
    .columns-view {
      flex-direction: column;
      overflow-x: visible;
      gap: 20px;
    }

    .col-panel {
      min-width: unset;
      max-width: 100%;
      border-radius: 16px;
    }

    .col-list {
      max-height: 60vh;
    }

    /* 总表：卡片化 */
    .merged-view {
      border-radius: 16px;
    }

    .merged-header {
      flex-direction: column;
      align-items: stretch;
      padding: 16px;
      gap: 12px;
    }

    .merged-header h3 {
      font-size: 18px;
      text-align: center;
    }

    .merge-filter {
      width: 100%;
      padding: 12px;
    }

    .merged-table {
      display: none;
    }

    .merged-cards {
      display: block;
      padding: 12px;
    }

    /* 城市弹窗 */
    .city-modal {
      padding: 0;
      align-items: flex-end;
    }

    .city-modal-content {
      max-width: 100%;
      width: 100%;
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
