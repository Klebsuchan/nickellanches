const fs = require('fs');

let dataTs = fs.readFileSync('src/data.ts', 'utf8');

// Use regex to remove items with category "porcoes"
const regex = /\s*\{\s*"id":\s*"(7|8|9|10|11|12|13|14|15)"[\s\S]*?"category":\s*"porcoes"\s*\},?/g;
dataTs = dataTs.replace(regex, '');

fs.writeFileSync('src/data.ts', dataTs);
console.log('Removed from data.ts');
