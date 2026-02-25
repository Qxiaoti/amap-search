import fs from 'fs';

let content = fs.readFileSync('src/views/Search.vue', 'utf8');

// Add selectedTown
content = content.replace(
  /const selectedDistrict = ref\(''\)\nconst citySearchKeyword = ref\(''\)/,
  `const selectedDistrict = ref('')\nconst selectedTown = ref('')\nconst citySearchKeyword = ref('')`
);

// Add currentTowns
content = content.replace(
  /const currentDistricts = computed\(\(\) => {\n\s*const cityObj = currentCities\.value\.find\(c => c\.name === selectedCity\.value\)\n\s*return cityObj \? cityObj\.districts : \[\]\n}\)/,
  `const currentDistricts = computed(() => {
  const cityObj = currentCities.value.find(c => c.name === selectedCity.value)
  return cityObj ? cityObj.districts : []
})

const currentTowns = computed(() => {
  const distObj = currentDistricts.value.find(d => d.name === selectedDistrict.value)
  return distObj ? distObj.towns : []
})`
);

// Update selectedCityText
content = content.replace(
  /const selectedCityText = computed\(\(\) => {\n\s*if \(selectedDistrict\.value\) {\n\s*return `\$\{selectedCity\.value\} \$\{selectedDistrict\.value\}`\n\s*}\n\s*return city\.value \|\| ''\n}\)/,
  `const selectedCityText = computed(() => {
  if (selectedTown.value) {
    return \`\${selectedCity.value} \${selectedDistrict.value} \${selectedTown.value}\`
  }
  if (selectedDistrict.value) {
    return \`\${selectedCity.value} \${selectedDistrict.value}\`
  }
  return city.value || ''
})`
);

// Update clearCity
content = content.replace(
  /selectedDistrict\.value = ''\n\s*selectedProvince\.value = ''/,
  `selectedDistrict.value = ''\n    selectedTown.value = ''\n    selectedProvince.value = ''`
);

// Update selectCity, selectDistrict, and add selectTown
content = content.replace(
  /const selectCity = \(cityName\) => {[\s\S]*?showCitySelector\.value = false\n}\n\nconst selectDistrict = \(district\) => {[\s\S]*?showCitySelector\.value = false\n}/,
  `const selectCity = (cityName) => {
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
  city.value = \`\${selectedCity.value} \${selectedDistrict.value}\`
  
  // Don't close if we have towns
  const distObj = currentDistricts.value.find(d => d.name === selectedDistrict.value)
  if (!distObj || !distObj.towns || distObj.towns.length === 0) {
    citySearchKeyword.value = ''
    showCitySelector.value = false
  }
}

const selectTown = (town) => {
  selectedTown.value = town
  city.value = \`\${selectedCity.value} \${selectedDistrict.value} \${town}\`
  citySearchKeyword.value = ''
  showCitySelector.value = false
}`
);

// Update template: The template uses v-for="district in currentDistricts"
content = content.replace(
  /<div class="district-list" v-if="selectedCity && currentDistricts\.length > 0">[\s\S]*?<\/div>\n\s*<\/div>/,
  `<div class="district-list" v-if="selectedCity && currentDistricts.length > 0">
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
            </div>`
);

// In searchResults computed property:
content = content.replace(
  /district: '',\n\s*districts: cityItem\.districts/g,
  `district: '',
            districts: cityItem.districts.map(d => d.name || d)`
);

content = content.replace(
  /cityItem\.districts\.forEach\(district => {/g,
  `cityItem.districts.forEach(dObj => {
          const district = dObj.name || dObj;`
);

// Add custom area logic modification:
content = content.replace(
  /const selectCustomCity = \(customCity\) => {\n\s*city\.value = customCity\n\s*selectedCity\.value = customCity\n\s*selectedDistrict\.value = ''\n\s*citySearchKeyword\.value = ''\n\s*showCitySelector\.value = false\n}/,
  `const selectCustomCity = (customCity) => {
  city.value = customCity
  selectedCity.value = customCity
  selectedDistrict.value = ''
  selectedTown.value = ''
  citySearchKeyword.value = ''
  showCitySelector.value = false
}`
);

fs.writeFileSync('src/views/Search.vue', content);
console.log("Patched Search.vue!");
