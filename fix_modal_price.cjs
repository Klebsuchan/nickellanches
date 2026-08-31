const fs = require('fs');

let content = fs.readFileSync('src/components/ProductModal.tsx', 'utf8');

content = content.replace(
  'const unitPrice = product.price + extrasTotal;',
  'const basePrice = selectedChoice?.price !== undefined ? selectedChoice.price : product.price;\n  const unitPrice = basePrice + extrasTotal;'
);

fs.writeFileSync('src/components/ProductModal.tsx', content);
