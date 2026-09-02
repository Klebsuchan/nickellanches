const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const oldOgTitle = '<meta property="og:title" content="Nickel Lanches | O Melhor Xis Gourmet e Cachorro-Quente de Passo Fundo - RS" />';
const newOgTitle = '<meta property="og:title" content="Nickel Lanches | Lanche em Passo Fundo: O Melhor Xis e Cachorro Quente" />';

const oldOgDesc = '<meta property="og:description" content="Peça o melhor xis gourmet artesanal e cachorro-quente prensado de Passo Fundo - RS no Nickel Lanches. O autêntico sabor gaúcho e entrega rápida!" />';
const newOgDesc = '<meta property="og:description" content="Procurando lanche em Passo Fundo? O Nickel Lanches tem o melhor xis da cidade e o autêntico cachorro quente prensado. Delivery rápido, qualidade extrema e chapa quente. Peça agora!" />';

const oldTwitterTitle = '<meta name="twitter:title" content="Nickel Lanches | O Melhor Xis Gourmet e Cachorro-Quente de Passo Fundo - RS" />';
const newTwitterTitle = '<meta name="twitter:title" content="Nickel Lanches | Lanche em Passo Fundo: O Melhor Xis e Cachorro Quente" />';

const oldTwitterDesc = '<meta name="twitter:description" content="Peça o melhor xis gourmet artesanal e cachorro-quente prensado de Passo Fundo - RS no Nickel Lanches!" />';
const newTwitterDesc = '<meta name="twitter:description" content="Procurando lanche em Passo Fundo? O Nickel Lanches tem o melhor xis da cidade e o autêntico cachorro quente prensado. Peça agora!" />';

content = content.replace(oldOgTitle, newOgTitle);
content = content.replace(oldOgDesc, newOgDesc);
content = content.replace(oldTwitterTitle, newTwitterTitle);
content = content.replace(oldTwitterDesc, newTwitterDesc);

fs.writeFileSync('index.html', content);
