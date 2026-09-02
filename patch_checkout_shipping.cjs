const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

const targetStr = '                  <div className="flex justify-between items-center pt-3 border-t border-stone-100">';
const replacement = '                  <div className="flex justify-between text-stone-500 font-bold uppercase text-xs pt-3 pb-2 border-t border-stone-100">\n                    <span>Frete</span>\n                    <span className="text-right">Calculado no WhatsApp</span>\n                  </div>\n                  <div className="flex justify-between items-center pt-3 border-t border-stone-100">';

content = content.replace(targetStr, replacement);
fs.writeFileSync('src/components/CheckoutModal.tsx', content);
