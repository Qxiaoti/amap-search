import fs from 'fs';

const pcasRaw = fs.readFileSync('./pcas.json', 'utf8');
const pcas = JSON.parse(pcasRaw);

const hunan = pcas.find(p => p.name === '湖南省');
if (!hunan) {
  console.log("Not found hunan!");
  process.exit(1);
}

const cityData = [{
  province: "湖南省",
  cities: hunan.children.map(city => ({
    name: city.name,
    districts: city.children.map(dist => ({
      name: dist.name,
      towns: dist.children ? dist.children.map(t => t.name) : []
    }))
  }))
}];

fs.writeFileSync('src/data/cities.js', `export const cityData = ${JSON.stringify(cityData, null, 2)};

export const hotCities = [
  "长沙市","株洲市","湘潭市","衡阳市","岳阳市","常德市","邵阳市","益阳市","郴州市","永州市","怀化市","娄底市","张家界市","湘西土家族苗族自治州"
];
`);
console.log("Success");
