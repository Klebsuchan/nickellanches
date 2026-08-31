const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

content = content.replace(/doc\(db, 'orders'/g, "doc(db, 'global_orders'");

fs.writeFileSync('src/lib/db.ts', content);
console.log('Fixed db.ts');
