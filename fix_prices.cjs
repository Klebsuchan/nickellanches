const fs = require('fs');

let content = fs.readFileSync('src/data.ts', 'utf-8');

const priceMap = {
  "Xis Simples": 20,
  "Xis Especial": 25,
  "Xis Duplo": 33,
  "Xis Coração": 30,
  "Xis Bacon": 30,
  "Xis Frango": 27,
  "Xis Calabresa": 27,
  "Xis Strogonoff de Frango": 29,
  "Xis Filé": 39,
  "Xis Olympus": 34,
  "Xis Magma": 34,
  "Xis Cemuche": 40,
  "Xis Nickel Mix": 43,
  "Xis Bomba": 34,
  "Cachorro Quente Tradicional": 23,
  "Cachorro Quente Coração": 27,
  "Cachorro Quente Bacon": 27,
  "Cachorro Quente Frango": 24,
  "Cachorro Quente Calabresa": 24,
  "Cachorro Quente Strogonoff de Frango": 28,
  "Batata Frita P": 12,
  "Batata Frita M": 20,
  "Batata Frita G": 30,
  "Batata Frita P com Cheddar e Bacon": 21,
  "Batata Frita M com Cheddar e Bacon": 29,
  "Batata Frita G com Cheddar e Bacon": 40,
  "Refrigerante 2 Litros": 15,
  "Refrigerante Lata": 7,
  "Refrigerante 600ml": 10,
  "Refrigerante 200ml": 4,
  "Água Mineral": 4,
  "Cerveja Latão": 12
};

const extrasMap = {
  "Uma carne a mais": 11,
  "Calabresa": 8,
  "Coração de frango": 10,
  "Cebola": 5,
  "Mussarela": 5,
  "Bacon": 10,
  "Presunto": 5,
  "Cheddar": 5,
  "Ovo frito": 3
};

// Update extras
for (const [name, price] of Object.entries(extrasMap)) {
  const regex = new RegExp(`({.*name:\\s*"${name}".*?)price:\\s*\\d+(.*})`, 'g');
  content = content.replace(regex, `$1price: ${price}$2`);
}

// Update products
for (const [name, price] of Object.entries(priceMap)) {
  const priceRegex = new RegExp(`("name":\\s*"${name}"[^{]*?"price":\\s*)\\d+`, 'g');
  content = content.replace(priceRegex, `$1${price}`);
  
  const points = Math.ceil(price * 1.5);
  const pointsRegex = new RegExp(`("name":\\s*"${name}"[^{]*?"points":\\s*)\\d+`, 'g');
  content = content.replace(pointsRegex, `$1${points}`);
}

fs.writeFileSync('src/data.ts', content);
console.log('Prices successfully corrected based on images.');
