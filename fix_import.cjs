const fs = require('fs');
let content = fs.readFileSync('src/components/ProductModal.tsx', 'utf8');

if (!content.includes('AVAILABLE_EXTRAS } from')) {
  content = content.replace(
    "import { Product, Extra, CartItem } from '../types';",
    "import { Product, Extra, CartItem } from '../types';\nimport { AVAILABLE_EXTRAS } from '../data';"
  );
  fs.writeFileSync('src/components/ProductModal.tsx', content);
  console.log('Import fixed');
} else {
  console.log('Import already exists');
}
