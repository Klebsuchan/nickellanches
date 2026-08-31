const fs = require('fs');
let content = fs.readFileSync('src/components/ProductModal.tsx', 'utf8');

content = content.replace(
  '  const displayImage = product.image',
  '  const displayExtras = (product.productExtras && product.productExtras.length > 0) ? product.productExtras : (product.category?.toLowerCase() !== "bebidas" ? AVAILABLE_EXTRAS : []);\n\n  const displayImage = product.image'
);

content = content.replace(
  '{(product.productExtras || []).length > 0 ? (',
  '{displayExtras.length > 0 ? ('
);

content = content.replace(
  'product.productExtras!.map(extra => {',
  'displayExtras.map(extra => {'
);

fs.writeFileSync('src/components/ProductModal.tsx', content);
console.log('Extras injected');
