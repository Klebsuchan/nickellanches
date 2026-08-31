const fs = require('fs');
let content = fs.readFileSync('src/components/Footer.tsx', 'utf8');

// Update CNPJ
content = content.replace('CNPJ: 12.345.678/0001-90', 'CNPJ: 63.024.150/0001-55');

// Remove "Desde 2015 "
content = content.replace(
  'Desde 2015 entregando a melhor experiência em lanches artesanais.',
  'Entregando a melhor experiência em lanches artesanais.'
);

// Remove email
const emailRegex = /<li>\s*<a href="mailto:[^>]+>\s*<Mail[^>]+>\s*<span[^>]+>[^<]+<\/span>\s*<\/a>\s*<\/li>/;
content = content.replace(emailRegex, '');

fs.writeFileSync('src/components/Footer.tsx', content);
console.log('Done');
