import { cityData } from './src/data/cities.js';
let hasObjTown = false;
cityData.forEach(p => p.cities.forEach(c => c.districts.forEach(d => {
  if(d.towns) d.towns.forEach(t => { if(typeof t !== 'string') hasObjTown = true; });
})));
console.log('Has object town:', hasObjTown);