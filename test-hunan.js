import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./pcas.json', 'utf8'));
const hunan = data['湖南省'];
console.log(Object.keys(hunan).slice(0, 3));
const firstCity = Object.values(hunan)[0];
console.log('firstCity', Object.keys(firstCity).slice(0, 3));
const firstArea = Object.values(firstCity)[0];
console.log('firstArea', Object.keys(firstArea).slice(0, 3));
