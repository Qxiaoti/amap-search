import fs from 'fs';
let code = fs.readFileSync('src/views/Search.vue', 'utf8');

code = code.replace(
  /\.province-selector {\n\s*display: grid;\n\s*grid-template-columns: minmax\(100px, 1fr\) minmax\(100px, 1fr\) minmax\(100px, 1fr\);/,
  `.province-selector {\n  display: grid;\n  grid-template-columns: minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr);`
);

code = code.replace(
  /\.province-list,\n\.city-list,\n\.district-list {/,
  `.province-list,\n.city-list,\n.district-list,\n.town-list {`
);

code = code.replace(
  /\.province-list::.*,\n\.city-list::.*,\n\.district-list::.* {/g,
  `.province-list::-webkit-scrollbar,
.city-list::-webkit-scrollbar,
.district-list::-webkit-scrollbar,
.town-list::-webkit-scrollbar {`
);

code = code.replace(
  /\.province-list::.*-thumb,\n\.city-list::.*-thumb,\n\.district-list::.*-thumb {/g,
  `.province-list::-webkit-scrollbar-thumb,
.city-list::-webkit-scrollbar-thumb,
.district-list::-webkit-scrollbar-thumb,
.town-list::-webkit-scrollbar-thumb {`
);

code = code.replace(
  /\.district-list {\n\s*border-right: none;\n}/,
  `.district-list {
  border-right: 1px solid #F9F9F9;
}
.town-list {
  border-right: none;
}`
);

code = code.replace(
  /\.province-item,\n\.city-item,\n\.district-item {/,
  `.province-item,\n.city-item,\n.district-item,\n.town-item {`
);

code = code.replace(
  /\.province-item:hover,\n\.city-item:hover,\n\.district-item:hover {/,
  `.province-item:hover,\n.city-item:hover,\n.district-item:hover,\n.town-item:hover {`
);

code = code.replace(
  /\.province-item\.active,\n\.city-item\.active,\n\.district-item\.active {/,
  `.province-item.active,\n.city-item.active,\n.district-item.active,\n.town-item.active {`
);

fs.writeFileSync('src/views/Search.vue', code);
console.log("Patched styles!");
