const fs = require('fs');
let content = fs.readFileSync('src/views/Search.vue', 'utf8');

// Replace the <style scoped> block
const styleStart = content.indexOf('<style scoped>');
if (styleStart !== -1) {
  content = content.substring(0, styleStart);
}

const newStyle = `
<style scoped>
.search-page {
  max-width: 1000px;
  margin: 40px auto;
  padding: 0 24px;
}

.search-header h2 {
  font-size: 28px;
  color: #3D3D3D;
  margin-bottom: 32px;
  font-weight: 400;
  letter-spacing: 0.5px;
  text-align: center;
}

/* 简约输入框组合 */
.search-box {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  background: #FFF;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 2px 20px rgba(247, 181, 200, 0.08);
}

.search-box input {
  flex: 1;
  padding: 12px 16px;
  border: none;
  font-size: 15px;
  background: transparent;
  box-shadow: none;
}

.search-box input:focus {
  box-shadow: none;
}

.city-selector-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  border-left: 1px solid #F1E5E7;
}

.city-btn {
  padding: 8px 16px;
  color: #7A6F72;
  background: transparent;
  border: none;
  font-size: 15px;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 400;
}

.city-btn:hover {
  background: #FDF3F5;
  color: #D68C9E;
}

.clear-city-btn {
  padding: 4px 8px;
  background: transparent;
  color: #CFC2C4;
  font-size: 12px;
  border-radius: 4px;
}

.clear-city-btn:hover {
  background: #FCE8EC;
  color: #E2889D;
}

.search-main-btn {
  padding: 0 32px;
  background: #E2889D;
  color: #FFF;
  border-radius: 8px;
  font-weight: 500;
  font-size: 15px;
}

.search-main-btn:hover {
  background: #D6748A;
}

.cancel-btn {
  padding: 0 24px;
  background: #FDF3F5;
  color: #D68C9E;
}

/* 位置输入框 */
.location-box {
  max-width: 600px;
  margin: 0 auto 32px;
}

.location-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FFF;
  padding: 6px 6px 6px 16px;
  border-radius: 30px;
  border: 1px solid #F1E5E7;
  transition: border-color 0.2s;
}

.location-input-wrapper:focus-within {
  border-color: #E2889D;
}

.location-icon {
  font-size: 16px;
  color: #D68C9E;
}

.location-input {
  flex: 1;
  border: none;
  font-size: 14px;
  padding: 8px 0;
  box-shadow: none;
}

.clear-location-btn {
  background: transparent;
  color: #CFC2C4;
}

.geocode-btn {
  padding: 8px 20px;
  background: #FDF3F5;
  color: #D68C9E;
  border-radius: 20px;
}

.geocode-btn:hover {
  background: #FCE8EC;
}

.location-status {
  margin-top: 12px;
  padding: 8px 16px;
  background: transparent;
  color: #A99F9F;
  font-size: 13px;
  text-align: center;
}

/* 城市选择弹窗 */
.city-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 251, 251, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.city-modal-content {
  background: #FFF;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(226, 136, 157, 0.1);
  border: 1px solid #F9F1F3;
}

.city-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #F9F1F3;
}

.city-modal-header h3 {
  font-size: 18px;
  font-weight: 500;
  color: #3D3D3D;
}

.close-btn {
  background: transparent;
  color: #A99F9F;
  font-size: 16px;
  padding: 4px;
}

.close-btn:hover {
  color: #3D3D3D;
  background: #F9F1F3;
}

.city-search-box {
  padding: 16px 24px;
  border-bottom: 1px solid #F9F1F3;
}

.city-search-input {
  background: #FDF3F5;
  border: none;
  border-radius: 8px;
}

.city-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  border-bottom: 1px solid #F9F1F3;
}

.city-tab {
  background: transparent;
  color: #A99F9F;
  padding: 8px 16px;
  border-radius: 6px;
}

.city-tab.active {
  background: #FDF3F5;
  color: #D68C9E;
  font-weight: 500;
}

.hot-cities {
  padding: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.city-option {
  background: #FFF;
  border: 1px solid #F1E5E7;
  color: #5D5355;
  border-radius: 6px;
}

.city-option:hover {
  border-color: #E2889D;
  color: #E2889D;
  background: #FDF3F5;
}

.province-selector {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  height: 360px;
}

.province-list, .city-list, .district-list {
  padding: 12px;
  border-right: 1px solid #F9F1F3;
  overflow-y: auto;
}
.district-list { border-right: none; }

.province-item, .city-item, .district-item {
  width: 100%;
  text-align: left;
  background: transparent;
  color: #5D5355;
  padding: 10px 16px;
  margin-bottom: 4px;
}

.province-item:hover, .city-item:hover, .district-item:hover {
  background: #FDF3F5;
}

.province-item.active, .city-item.active, .district-item.active {
  background: #E2889D;
  color: #FFF;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  margin: 24px 0 16px;
  border-bottom: 1px solid #F9F1F3;
}

.results-count {
  font-size: 14px;
  color: #A99F9F;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.sort-select {
  padding: 8px 12px;
  border: 1px solid #F1E5E7;
  border-radius: 6px;
  color: #5D5355;
  background: #FFF;
  outline: none;
}

.export-btn {
  background: #FFF;
  border: 1px solid #F1E5E7;
  color: #5D5355;
}

.export-btn:hover {
  background: #FDF3F5;
  color: #E2889D;
  border-color: #FCE8EC;
}

/* 结果列表 */
.filter-box {
  margin-bottom: 24px;
}
.filter-input {
  background: #FFF;
  border: 1px solid #F1E5E7;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.district-group {
  margin-bottom: 16px;
}

.district-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
  padding-left: 4px;
}

.district-name {
  font-size: 18px;
  font-weight: 500;
  color: #3D3D3D;
}

.district-count {
  font-size: 13px;
  color: #A99F9F;
}

.district-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.poi-item {
  background: #FFF;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #F9F1F3;
  transition: all 0.2s;
}

.poi-item:hover {
  border-color: #FCE8EC;
  box-shadow: 0 4px 12px rgba(226, 136, 157, 0.05);
}

.poi-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.poi-name {
  font-size: 16px;
  font-weight: 500;
  color: #3D3D3D;
  line-height: 1.4;
}

.favorite-btn {
  background: transparent;
  color: #E6D8DB;
  font-size: 18px;
  padding: 0 4px;
}
.favorite-btn.favorited { color: #E2889D; }

.poi-info {
  font-size: 13px;
  color: #7A6F72;
  margin-bottom: 6px;
}
.distance-info { color: #C28B99; }

.poi-phones {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #F9F1F3;
}

.phone-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.phone-number {
  font-size: 14px;
  color: #D68C9E;
  font-family: 'Inter', monospace;
}

.copy-btn-small {
  padding: 4px 10px;
  font-size: 12px;
  background: #FDF3F5;
  color: #D68C9E;
}

.copy-btn-small:hover { background: #FCE8EC; }
.copy-btn-small.copied { background: #E2889D; color: #FFF; }

.load-more-section {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 40px 0;
}

.load-more-btn, .load-all-btn {
  background: #FFF;
  border: 1px solid #E2889D;
  color: #E2889D;
  padding: 12px 32px;
}

.load-more-btn:hover, .load-all-btn:hover {
  background: #FDF3F5;
}

.no-more {
  text-align: center;
  color: #A99F9F;
  font-size: 13px;
  margin: 40px 0;
}
</style>
`;

fs.writeFileSync('src/views/Search.vue', content + newStyle);
