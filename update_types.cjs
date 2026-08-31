const fs = require('fs');

let content = fs.readFileSync('src/types.ts', 'utf8');
content = content.replace(
  "category: 'lanches' | 'porcoes' | 'bebidas' | 'doces';",
  `category: 'lanches' | 'porcoes' | 'bebidas' | 'doces';
  choices?: { name: string, price?: number, image?: string }[];
  choiceName?: string;`
);

fs.writeFileSync('src/types.ts', content);
