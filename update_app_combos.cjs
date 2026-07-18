const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const promoSectionTarget = '<PromoSection />';
const promoSectionReplacement = `<PromoSection \n            combos={menuItems.filter(i => i.id.startsWith('c') || i.name.toLowerCase().includes('combo') || i.name.toLowerCase().includes('trio'))} \n            onComboClick={setSelectedProduct} \n          />`;

code = code.replace(promoSectionTarget, promoSectionReplacement);

const mapTarget = '{menuItems.map((item) => (';
const mapReplacement = '{menuItems.filter(i => !(i.id.startsWith(\'c\') || i.name.toLowerCase().includes(\'combo\') || i.name.toLowerCase().includes(\'trio\'))).map((item) => (';

code = code.replace(mapTarget, mapReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated!');
