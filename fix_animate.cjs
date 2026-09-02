const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

content = content.replace(
  "{paymentMethod === 'Dinheiro na Entrega' && (",
  "<AnimatePresence>\n                  {paymentMethod === 'Dinheiro na Entrega' && ("
);
content = content.replace(
  "                  )}",
  "                  )}\n                  </AnimatePresence>"
);

fs.writeFileSync('src/components/CheckoutModal.tsx', content);
