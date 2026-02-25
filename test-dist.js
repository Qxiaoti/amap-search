const https = require('https');
const url = `https://restapi.amap.com/v3/config/district?keywords=${encodeURIComponent("平江县")}&subdistrict=2&key=b0b467ec6da8340d8db9c8ddc28905b1`;

https.get(url, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body));
});