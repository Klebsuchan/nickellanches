const fs = require('fs');
let lines = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8').split('\n');

lines[132] = "                          )}";

fs.writeFileSync('src/components/CheckoutModal.tsx', lines.join('\n'));
