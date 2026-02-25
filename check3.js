import fs from 'fs';
const css = fs.readFileSync('src/style.css', 'utf8');
const start = css.indexOf('.province-selector');
console.log(css.substring(start, start + 800));
