const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "onClick={(e) => { e.stopPropagation(); handleAddToCart({ ...item, quantity: 1, cartItemId: Math.random().toString(36).substring(2, 9) }); }}",
  "onClick={(e) => { e.stopPropagation(); handleProductClick(item); }}"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched');
