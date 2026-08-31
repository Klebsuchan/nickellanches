const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
appTsx = appTsx.replace(/totalCartBase=R\$ \{totalCartBase\.toFixed\(2\)\.replace\('\.', ','\)\}/g, "totalCartBase={totalCartBase}");
appTsx = appTsx.replace(/discountAmount=R\$ \{discountAmount\.toFixed\(2\)\.replace\('\.', ','\)\}/g, "discountAmount={discountAmount}");
appTsx = appTsx.replace(/totalCart=R\$ \{totalCart\.toFixed\(2\)\.replace\('\.', ','\)\}/g, "totalCart={totalCart}");
fs.writeFileSync('src/App.tsx', appTsx);
console.log('fixed App.tsx');

