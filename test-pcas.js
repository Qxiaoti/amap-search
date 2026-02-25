import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./pcas.json', 'utf8'));
console.log(typeof data);
if (Array.isArray(data)) {
  console.log('is array', data.length);
  console.log(data[0]);
} else {
  console.log('is object', Object.keys(data).slice(0, 5));
}
