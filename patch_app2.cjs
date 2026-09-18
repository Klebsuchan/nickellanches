const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "whatsapp: details.whatsapp\n      });",
  "whatsapp: details.whatsapp,\n        orderNumber\n      });"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched App saveOrder call');
