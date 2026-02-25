import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./pcas.json', 'utf8'));
const hunan = data['湖南省'];

const cityData = [{
  province: "湖南省",
  cities: Object.keys(hunan).map(cityName => {
    const districtsData = hunan[cityName];
    return {
      name: cityName,
      districts: Object.keys(districtsData).map(distName => {
        return {
          name: distName,
          towns: districtsData[distName] || []
        };
      })
    };
  })
}];

fs.writeFileSync('src/data/cities.js', `export const cityData = ${JSON.stringify(cityData, null, 2)};

export const hotCities = [
  "长沙市","株洲市","湘潭市","衡阳市","岳阳市","常德市","邵阳市","益阳市","郴州市","永州市","怀化市","娄底市","张家界市","湘西土家族苗族自治州"
];
`);
console.log("Cities data generated successfully!");
