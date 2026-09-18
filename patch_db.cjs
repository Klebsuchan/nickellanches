const fs = require('fs');
let code = fs.readFileSync('src/lib/db.ts', 'utf8');

code = code.replace(
  "  address?: string;\n}",
  "  address?: string;\n  orderNumber?: number;\n}"
);

fs.writeFileSync('src/lib/db.ts', code);
console.log('Patched Order Interface');
