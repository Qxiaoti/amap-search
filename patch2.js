import fs from 'fs';
let code = fs.readFileSync('src/views/Search.vue', 'utf8');

code = code.replace(
  /district: district,\n\s*districts: cityItem\.districts,/g,
  `district: district,\n              districts: cityItem.districts.map(d => d.name || d),`
);

// We should also patch searchPOI so it handles town when present
// Previously:
// if (parts.length >= 2) {
//   cityParam = parts[1]
//   districtParam = parts[1]
// } else {
//   cityParam = parts[0]
// }

// Let's change it so that if user selects a town, we append it to the keyword or use it. 
// AMap Text Search allows "town name" in keywords. But if we pass town as cityParam, it might fail.
// Wait! If cityParam is just a town, AMap might not recognize it as a city.
// Actually, for towns, passing the district as `cityParam` and appending town to the keyword is best!
// Or wait, AMap allows passing the city name, and in keyword we just include the town name, e.g. "沧港镇 餐饮".

code = code.replace(
  /let cityParam = ''\n\s*let districtParam = ''\n\s*if \(city\.value\.trim\(\)\) {[\s\S]*?console\.log\('城市参数:', cityParam, '区县参数:', districtParam\)\n\s*}/,
  `let cityParam = ''
        let districtParam = ''
        let townParam = ''
        
        if (city.value.trim()) {
            const parts = city.value.trim().split(/\\s+/)
            if (parts.length === 3) {
              // 市 区 镇
              cityParam = parts[1] // 区县名
              districtParam = parts[1]
              townParam = parts[2]
            } else if (parts.length === 2) {
              cityParam = parts[1]  // 区县名
              districtParam = parts[1]
            } else {
              cityParam = parts[0]
            }
            console.log('城市参数:', cityParam, '区县参数:', districtParam, '乡镇参数:', townParam)
          }
          
          let actualKeyword = keyword.value;
          if (townParam) {
            actualKeyword = \`\${townParam} \${actualKeyword}\`;
          }`
);

// We need to change the API URL to use actualKeyword instead of keyword.value
code = code.replace(
  /let url = `https:\/\/restapi\.amap\.com\/v3\/place\/text\?key=\$\{apiKey\}&keywords=\$\{encodeURIComponent\(keyword\.value\)\}&output=json&offset=\$\{pageSize\.value\}&page=\$\{page\}&extensions=base`/g,
  `let url = \`https://restapi.amap.com/v3/place/text?key=\${apiKey}&keywords=\${encodeURIComponent(actualKeyword || keyword.value)}&output=json&offset=\${pageSize.value}&page=\${page}&extensions=base\``
);

// Make same fix for loadAll:
code = code.replace(
  /let cityParam = ''\n\s*if \(city\.value\.trim\(\)\) {\n\s*const parts = city\.value\.trim\(\)\.split\(\/\\s\+\/\)\n\s*cityParam = parts\.length >= 2 \? parts\[1\] : parts\[0\]\n\s*}/g,
  `let cityParam = ''
        let townParam = ''
        if (city.value.trim()) {
          const parts = city.value.trim().split(/\\s+/)
          if (parts.length === 3) {
            cityParam = parts[1]
            townParam = parts[2]
          } else if (parts.length === 2) {
            cityParam = parts[1]
          } else {
            cityParam = parts[0]
          }
        }
        let actualKeyword = keyword.value;
        if (townParam) {
          actualKeyword = \`\${townParam} \${actualKeyword}\`;
        }`
);

fs.writeFileSync('src/views/Search.vue', code);
console.log("Patched actualKeyword and search logic!");
