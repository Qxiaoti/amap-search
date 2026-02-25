const https = require('https');

const key = process.argv[2] || 'fb35e0df0ec21021bc2ea8f1d3558c70'; // fallback to some test key if I can find one or just let it fail
const url1 = `https://restapi.amap.com/v3/place/text?key=${key}&keywords=${encodeURIComponent("餐厅")}&city=${encodeURIComponent("平江县")}&citylimit=true`;
const url2 = `https://restapi.amap.com/v3/place/text?key=${key}&keywords=${encodeURIComponent("平江县 餐厅")}&city=${encodeURIComponent("岳阳市")}&citylimit=true`;

const fetchJSON = (url) => new Promise(resolve => {
  https.get(url, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => resolve(JSON.parse(body)));
  });
});

async function run() {
  const r1 = await fetchJSON(url1);
  const r2 = await fetchJSON(url2);
  console.log("URL1 count:", r1.count, r1.info);
  console.log("URL2 count:", r2.count, r2.info);
}
run();