const fs = require('fs');
let content = fs.readFileSync('src/components/ProductModal.tsx', 'utf8');

content = content.replace(
  '<label \n                          key={extra.id} \n                          className="flex items-center justify-between p-0 cursor-pointer group"\n                        >',
  '<label \n                          key={extra.id} \n                          onClick={(e) => { e.preventDefault(); handleToggleExtra(extra); }} \n                          className="flex items-center justify-between p-0 cursor-pointer group"\n                        >'
);

fs.writeFileSync('src/components/ProductModal.tsx', content);
console.log('Fixed toggle');
