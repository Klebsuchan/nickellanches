const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

content = content.replace(
  "userName?: string;",
  "userName?: string;\n  paymentMethod?: string;\n  address?: string;"
);

fs.writeFileSync('src/lib/db.ts', content);
console.log('Types updated');
