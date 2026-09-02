const fs = require('fs');
let lines = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8').split('\n');

for (let i=0; i<lines.length; i++) {
  if (lines[i].includes("</AnimatePresence>") && i === 132) {
    lines[i] = "                          )}";
  }
}

fs.writeFileSync('src/components/CheckoutModal.tsx', lines.join('\n'));
