const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace("seedDatabase(MENU_ITEMS, DISCOUNT_CODES);", "// seedDatabase(MENU_ITEMS, DISCOUNT_CODES);");
fs.writeFileSync('src/App.tsx', content);
console.log('Seed removed.');
