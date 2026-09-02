const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = "msg += `*TOTAL: R$ ${totalCart.toFixed(2).replace('.', ',')}*\\n\\n`;";
const replacement = "msg += `*TOTAL: R$ ${totalCart.toFixed(2).replace('.', ',')} + Frete a calcular*\\n\\n`;";

content = content.replace(targetStr, replacement);
fs.writeFileSync('src/App.tsx', content);
