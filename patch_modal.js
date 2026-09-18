const fs = require('fs');
let code = fs.readFileSync('src/components/ProductModal.tsx', 'utf8');
code = code.replace("(!isBeverage ? AVAILABLE_EXTRAS : [])", "AVAILABLE_EXTRAS");
fs.writeFileSync('src/components/ProductModal.tsx', code);
console.log('Patched');
