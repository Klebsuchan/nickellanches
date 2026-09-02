const fs = require('fs');
let content = fs.readFileSync('src/components/CartDrawer.tsx', 'utf8');

const targetStr = '                  <div className="flex justify-between text-xl text-black font-black uppercase pt-2 border-t-2 border-stone-100">';
const replacement = '                  <div className="flex justify-between text-stone-500 font-bold uppercase text-xs pt-2">\n                    <span>Frete</span>\n                    <span className="text-right">Calculado no WhatsApp</span>\n                  </div>\n                  <div className="flex justify-between text-xl text-black font-black uppercase pt-2 border-t-2 border-stone-100">';

content = content.replace(targetStr, replacement);
fs.writeFileSync('src/components/CartDrawer.tsx', content);
