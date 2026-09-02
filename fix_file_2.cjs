const fs = require('fs');
let lines = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8').split('\n');

let targetIdx = -1;
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes("Campo de Troco caso seja Dinheiro")) {
    targetIdx = i;
    break;
  }
}

if (targetIdx !== -1) {
  // Find the closing brace for the Dinheiro na Entrega block
  for (let i = targetIdx; i < lines.length; i++) {
    if (lines[i].includes(")}")) {
      // check if it's right before </div>
      if (lines[i+1] && lines[i+1].includes("</div>") && lines[i+2] && lines[i+2].includes("{errorMessage && (")) {
        lines[i] = "                  )}\n                  </AnimatePresence>";
        break;
      }
    }
  }
}

fs.writeFileSync('src/components/CheckoutModal.tsx', lines.join('\n'));
