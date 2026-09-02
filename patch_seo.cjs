const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const oldTags = `    <title>Nickel Lanches | O Melhor Xis Gourmet e Cachorro-Quente de Passo Fundo - RS</title>
    <meta name="title" content="Nickel Lanches | O Melhor Xis Gourmet e Cachorro-Quente de Passo Fundo - RS" />
    <meta name="description" content="Peça o melhor xis gourmet artesanal e cachorro-quente prensado de Passo Fundo - RS no Nickel Lanches. O autêntico sabor gaúcho, chapa quente, entrega rápida e pedido fácil pelo WhatsApp!" />
    <meta name="keywords" content="melhor xis de passo fundo, xis gourmet passo fundo, xis passo fundo, cachorro quente passo fundo, lanches passo fundo, delivery passo fundo, nickel lanches, pedir xis passo fundo, melhor cachorro quente de passo fundo, xis gaucho passo fundo, lanchonete passo fundo rs, delivery whatsapp passo fundo, xis especial passo fundo, xis bacon passo fundo, xis coracao passo fundo" />`;

const newTags = `    <title>Nickel Lanches | Lanche em Passo Fundo: O Melhor Xis e Cachorro Quente</title>
    <meta name="title" content="Nickel Lanches | Lanche em Passo Fundo: O Melhor Xis e Cachorro Quente" />
    <meta name="description" content="Procurando lanche em Passo Fundo? O Nickel Lanches tem o melhor xis da cidade e o autêntico cachorro quente prensado. Delivery rápido, qualidade extrema e chapa quente. Peça agora!" />
    <meta name="keywords" content="lanche em passo fundo, melhor xis de passo fundo, xis passo fundo, cachorro quente passo fundo, melhor cachorro quente de passo fundo, lanches artesanais passo fundo, delivery de lanche passo fundo, nickel lanches" />`;

content = content.replace(oldTags, newTags);
fs.writeFileSync('index.html', content);
