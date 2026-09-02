const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// temporarily uncomment seedDatabase
appContent = appContent.replace('// seedDatabase(MENU_ITEMS, DISCOUNT_CODES);', 'seedDatabase(MENU_ITEMS, DISCOUNT_CODES);');

fs.writeFileSync('src/App.tsx', appContent);
