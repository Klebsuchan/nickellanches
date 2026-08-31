const fs = require('fs');

let data = fs.readFileSync('src/data.ts', 'utf-8');

// Replace generic names with specific names if needed or reconstruct the menu items.
// Actually, let's extract the MENU_ITEMS array, filter out the old generic beverages, and add the new ones.
// Or simpler: replace 'Refrigerante 2 litros' block with 'Coca Cola 2 Litros', etc.

const newBeverages = [
  { id: "b1", name: "Coca Cola 2 Litros", description: "Refrigerante Coca Cola 2 Litros.", price: 15, points: 22, emoji: "🥤", image: "/images/cocacola2l.jpg", category: "bebidas" },
  { id: "b2", name: "Pepsi 2 Litros", description: "Refrigerante Pepsi 2 Litros.", price: 15, points: 22, emoji: "🥤", image: "/images/pepsi2l.jpg", category: "bebidas" },
  { id: "b3", name: "Charrua 2 Litros", description: "Refrigerante Charrua 2 Litros.", price: 15, points: 22, emoji: "🥤", image: "/images/charrua2l.jpg", category: "bebidas" },
  { id: "b4", name: "Coca Cola 600ml", description: "Refrigerante Coca Cola 600ml.", price: 10, points: 15, emoji: "🥤", image: "/images/coca600ml.jpg", category: "bebidas" },
  { id: "b5", name: "Pepsi 600ml", description: "Refrigerante Pepsi 600ml.", price: 10, points: 15, emoji: "🥤", image: "/images/pepsi600ml.jpg", category: "bebidas" },
  { id: "b6", name: "Guaraná 600ml", description: "Refrigerante Guaraná 600ml.", price: 10, points: 15, emoji: "🥤", image: "/images/guarana600.avif", category: "bebidas" },
  { id: "b7", name: "Sprite 600ml", description: "Refrigerante Sprite 600ml.", price: 10, points: 15, emoji: "🥤", image: "/images/sprite600ml.jpg", category: "bebidas" },
  { id: "b8", name: "Coca Cola Lata", description: "Refrigerante Coca Cola Lata.", price: 7, points: 10, emoji: "🥤", image: "/images/cocalata.jpg", category: "bebidas" },
  { id: "b9", name: "Coca Cola Zero Lata", description: "Refrigerante Coca Cola Zero Lata.", price: 7, points: 10, emoji: "🥤", image: "/images/cocazero.jpg", category: "bebidas" },
  { id: "b10", name: "Coca Cola 200ml", description: "Refrigerante Coca Cola 200ml.", price: 4, points: 6, emoji: "🥤", image: "/images/coca200ml.jpg", category: "bebidas" },
  { id: "b11", name: "Guaraná 200ml", description: "Refrigerante Guaraná 200ml.", price: 4, points: 6, emoji: "🥤", image: "/images/gurana200ml.jpg", category: "bebidas" },
  { id: "b12", name: "Água Sem Gás", description: "Água mineral sem gás.", price: 4, points: 6, emoji: "💧", image: "/images/aguasemgas.jpg", category: "bebidas" },
  { id: "b13", name: "Água Com Gás", description: "Água mineral com gás.", price: 4, points: 6, emoji: "💧", image: "/images/aguagas.jpg", category: "bebidas" },
  { id: "b14", name: "Cerveja Latão", description: "Cerveja em lata grande (latão).", price: 12, points: 18, emoji: "🍺", image: "/images/latão.jpg", category: "bebidas" }
];

// Read and rewrite data.ts safely.
// We will replace the beverage items. We know they are inside MENU_ITEMS.

// We can just find the indices of the old beverages and remove them.
let startIdx = data.indexOf('"name": "Refrigerante 2 litros"');
// Let's find the start of the object
let startObj = data.lastIndexOf('{', startIdx);
let endObj = data.indexOf('"name": "Xis Simples"');
let endObjStart = data.lastIndexOf('{', endObj);

let before = data.substring(0, startObj);
let after = data.substring(endObjStart);

let newBebidasStr = newBeverages.map(b => `  {
    "id": "${b.id}",
    "name": "${b.name}",
    "description": "${b.description}",
    "price": ${b.price},
    "points": ${b.points},
    "emoji": "${b.emoji}",
    "image": "${b.image}",
    "category": "${b.category}"
  }`).join(',\n') + ',\n';

let newData = before + newBebidasStr + after;

// Also rename Xis Filé Prime to Xis Olympus
newData = newData.replace(/"name":\s*"Xis Filé Prime"/g, '"name": "Xis Olympus"');
newData = newData.replace(/"name":\s*"Xis Filé Prime/g, '"name": "Xis Olympus');

fs.writeFileSync('src/data.ts', newData);
console.log('done');
