import fs from 'fs';
const vue = fs.readFileSync('src/views/Search.vue', 'utf8');
const start = vue.indexOf('<style scoped>');
console.log(vue.substring(start, start + 1000));
