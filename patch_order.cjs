const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

content = content.replace("paymentMethod?: string;", "paymentMethod?: string;\n  whatsapp?: string;");

fs.writeFileSync('src/lib/db.ts', content);
