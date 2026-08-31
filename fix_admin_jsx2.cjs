const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  "Nenhum pedido encontrado.</p>}\n                 </div>\n               )}",
  "Nenhum pedido encontrado.</p>}\n                 </div>\n                 </>\n               )}"
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Fixed JSX siblings error 2');
