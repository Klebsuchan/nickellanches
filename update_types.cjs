const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(
  "image?: string;",
  "image?: string;\n  images?: string[];\n  productExtras?: Extra[];"
);

content = content.replace(
  "status: 'preparando' | 'a_caminho' | 'entregue';",
  "status: 'recebido' | 'preparando' | 'a_caminho' | 'entregue';"
);

fs.writeFileSync('src/types.ts', content);
console.log('Types updated');
