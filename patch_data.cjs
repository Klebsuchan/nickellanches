const fs = require('fs');

let content = fs.readFileSync('src/data.ts', 'utf-8');

// Adicionais
content = content.replace('{ id: "e1", name: "Uma carne a mais", price: 10 }', '{ id: "e1", name: "Uma carne a mais", price: 12 }');
content = content.replace('{ id: "e3", name: "Coração de frango", price: 9 }', '{ id: "e3", name: "Coração de frango", price: 10 }');
content = content.replace('{ id: "e4", name: "Cebola", price: 6 }', '{ id: "e4", name: "Cebola", price: 5 }');
content = content.replace('{ id: "e5", name: "Mussarela", price: 5 }', '{ id: "e5", name: "Mussarela", price: 7 }');
// e6 Bacon is already 10
// e7 Presunto is 5
content = content.replace('{ id: "e8", name: "Cheddar", price: 6 }', '{ id: "e8", name: "Cheddar", price: 7 }');
content = content.replace('{ id: "e9", name: "Ovo frito", price: 4 }', '{ id: "e9", name: "Ovo frito", price: 5 }');

// Lanches (Cachorros)
content = content.replace('"price": 18,\n    "points": 27,\n    "emoji": "🌭",\n    "image": "/images/nickeldog-1.avif",\n    "category": "lanches"\n  },\n  {\n    "id": "2"', '"price": 20,\n    "points": 30,\n    "emoji": "🌭",\n    "image": "/images/nickeldog-1.avif",\n    "category": "lanches"\n  },\n  {\n    "id": "2"');

content = content.replace('"name": "Cachorro Quente Especial",\n    "description": "Pão, 2 salsichas, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",\n    "price": 23,\n    "points": 34,', '"name": "Cachorro Quente Especial",\n    "description": "Pão, 2 salsichas, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",\n    "price": 25,\n    "points": 37,');

content = content.replace('"name": "Cachorro Quente Bacon",\n    "description": "Pão, salsicha, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup e bacon.",\n    "price": 25,\n    "points": 37,', '"name": "Cachorro Quente Bacon",\n    "description": "Pão, salsicha, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup e bacon.",\n    "price": 28,\n    "points": 42,');

content = content.replace('"name": "Cachorro Quente Frango",\n    "description": "Pão, frango grelhado, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",\n    "price": 22,\n    "points": 33,', '"name": "Cachorro Quente Frango",\n    "description": "Pão, frango grelhado, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",\n    "price": 26,\n    "points": 39,');

content = content.replace('"name": "Cachorro Quente Calabresa",\n    "description": "Pão, linguiça calabresa, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",\n    "price": 22,\n    "points": 33,', '"name": "Cachorro Quente Calabresa",\n    "description": "Pão, linguiça calabresa, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",\n    "price": 26,\n    "points": 39,');

content = content.replace('"name": "Cachorro Quente Strogonoff de Frango",\n    "description": "Pão, strogonoff de frango, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",\n    "price": 26,\n    "points": 39,', '"name": "Cachorro Quente Strogonoff de Frango",\n    "description": "Pão, strogonoff de frango, molho vermelho, milho, ervilha, tomate, queijo muçarela, batata palha, maionese, mostarda, ketchup.",\n    "price": 30,\n    "points": 45,');

// Xis
content = content.replace('"name": "Xis Simples",\n    "description": "Carne, queijo muçarela, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 18,\n    "points": 27,', '"name": "Xis Simples",\n    "description": "Carne, queijo muçarela, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 22,\n    "points": 33,');

content = content.replace('"name": "Xis Especial",\n    "description": "Carne, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 23,\n    "points": 34,', '"name": "Xis Especial",\n    "description": "Carne, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 27,\n    "points": 40,');

content = content.replace('"name": "Xis Duplo",\n    "description": "2 carnes, 2 queijos muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 30,\n    "points": 45,', '"name": "Xis Duplo",\n    "description": "2 carnes, 2 queijos muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 35,\n    "points": 52,');

content = content.replace('"name": "Xis Coração",\n    "description": "Coração de frango, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 29,\n    "points": 43,', '"name": "Xis Coração",\n    "description": "Coração de frango, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 33,\n    "points": 49,');

content = content.replace('"name": "Xis Bacon",\n    "description": "Carne, bacon, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 29,\n    "points": 43,', '"name": "Xis Bacon",\n    "description": "Carne, bacon, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 33,\n    "points": 49,');

content = content.replace('"name": "Xis Frango",\n    "description": "Peito de frango, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 25,\n    "points": 37,', '"name": "Xis Frango",\n    "description": "Peito de frango, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 29,\n    "points": 43,');

content = content.replace('"name": "Xis Calabresa",\n    "description": "Calabresa, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 25,\n    "points": 37,', '"name": "Xis Calabresa",\n    "description": "Calabresa, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 29,\n    "points": 43,');

content = content.replace('"name": "Xis Strogonoff de Frango",\n    "description": "Strogonoff de frango, queijo muçarela, batata palha, milho, maionese, mostarda, ketchup.",\n    "price": 29,\n    "points": 43,', '"name": "Xis Strogonoff de Frango",\n    "description": "Strogonoff de frango, queijo muçarela, batata palha, milho, maionese, mostarda, ketchup.",\n    "price": 33,\n    "points": 49,');

content = content.replace('"name": "Xis Filé",\n    "description": "Filé, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 38,\n    "points": 57,', '"name": "Xis Filé",\n    "description": "Filé, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 43,\n    "points": 64,');

content = content.replace('"name": "Xis Olympus",\n    "description": "Carne, queijo, bacon, ovo, anéis de cebola, alface, tomate, barbecue e maionese caseira",\n    "price": 32,\n    "points": 48,', '"name": "Xis Olympus",\n    "description": "Carne, queijo, bacon, ovo, anéis de cebola, alface, tomate, barbecue e maionese caseira",\n    "price": 37,\n    "points": 55,');

content = content.replace('"name": "Xis Magma",\n    "description": "Carne, queijo muçarela, provolone, cheddar, calabresa, milho, tomate, maionese caseira.",\n    "price": 32,\n    "points": 48,', '"name": "Xis Magma",\n    "description": "Carne, queijo muçarela, provolone, cheddar, calabresa, milho, tomate, maionese caseira.",\n    "price": 37,\n    "points": 55,');

content = content.replace('"name": "Xis Cemuche",\n    "description": "2 carnes, cebola caramelizada, 2 queijos muçarela, dupla cheddar, molho especial apimentado, alface, maionese caseira.",\n    "price": 38,\n    "points": 57,', '"name": "Xis Cemuche",\n    "description": "2 carnes, cebola caramelizada, 2 queijos muçarela, dupla cheddar, molho especial apimentado, alface, maionese caseira.",\n    "price": 43,\n    "points": 64,');

content = content.replace('"name": "Xis Nickel Mix",\n    "description": "Carne, frango, coração de frango, bacon, calabresa, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 42,\n    "points": 63,', '"name": "Xis Nickel Mix",\n    "description": "Carne, frango, coração de frango, bacon, calabresa, queijo muçarela, presunto, ovo, milho, ervilha, alface, tomate, maionese, mostarda, ketchup.",\n    "price": 48,\n    "points": 72,');

content = content.replace('"name": "Xis Bomba",\n    "description": "Carne, queijo muçarela, cheddar, milho, ervilha, bacon, batata frita, barbecue, maionese caseira.",\n    "price": 32,\n    "points": 48,', '"name": "Xis Bomba",\n    "description": "Carne, queijo muçarela, cheddar, milho, ervilha, bacon, batata frita, barbecue, maionese caseira.",\n    "price": 37,\n    "points": 55,');

// Porções
content = content.replace('"name": "Batata Frita P",\n  "description": "Porção pequena de batata frita bem crocante",\n  "price": 15,\n  "points": 22,', '"name": "Batata Frita P",\n  "description": "Porção pequena de batata frita bem crocante",\n  "price": 18,\n  "points": 27,');

content = content.replace('"name": "Batata Frita M",\n  "description": "Porção média de batata frita bem crocante",\n  "price": 24,\n  "points": 36,', '"name": "Batata Frita M",\n  "description": "Porção média de batata frita bem crocante",\n  "price": 28,\n  "points": 42,');

content = content.replace('"name": "Batata Frita G",\n  "description": "Porção grande de batata frita, serve até 3 pessoas",\n  "price": 36,\n  "points": 54,', '"name": "Batata Frita G",\n  "description": "Porção grande de batata frita, serve até 3 pessoas",\n  "price": 40,\n  "points": 60,');

content = content.replace('"name": "Batata Frita P com Cheddar e Bacon",\n  "description": "Porção pequena de batata frita com cheddar e bacon crocante em cubos",\n  "price": 25,\n  "points": 37,', '"name": "Batata Frita P com Cheddar e Bacon",\n  "description": "Porção pequena de batata frita com cheddar e bacon crocante em cubos",\n  "price": 28,\n  "points": 42,');

content = content.replace('"name": "Batata Frita M com Cheddar e Bacon",\n  "description": "Porção média de batata frita com cheddar e bacon crocante em cubos",\n  "price": 34,\n  "points": 51,', '"name": "Batata Frita M com Cheddar e Bacon",\n  "description": "Porção média de batata frita com cheddar e bacon crocante em cubos",\n  "price": 42,\n  "points": 63,');

content = content.replace('"name": "Batata Frita G com Cheddar e Bacon",\n  "description": "Porção grande de batata frita com muito cheddar e bacon crocante em cubos",\n  "price": 46,\n  "points": 69,', '"name": "Batata Frita G com Cheddar e Bacon",\n  "description": "Porção grande de batata frita com muito cheddar e bacon crocante em cubos",\n  "price": 58,\n  "points": 87,');

fs.writeFileSync('src/data.ts', content);
console.log('Prices patched!');
