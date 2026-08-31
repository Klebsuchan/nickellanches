const fs = require('fs');

let dataTs = fs.readFileSync('src/data.ts', 'utf8');

// We are going to replace the 'bebidas' section with the new grouped products.
// First, find the indices of the 'bebidas' products in data.ts.

const newBebidas = `
  {
    "id": "b_agua",
    "name": "Água Mineral",
    "description": "Água mineral 500ml.",
    "price": 4,
    "points": 6,
    "emoji": "💧",
    "image": "/images/aguasemgas-1.jpg",
    "category": "bebidas",
    "choiceName": "Tipo",
    "choices": [
      { "name": "Sem Gás", "image": "/images/aguasemgas-1.jpg" },
      { "name": "Com Gás", "image": "/images/aguagas-1.jpg" }
    ]
  },
  {
    "id": "b_refri2l",
    "name": "Refrigerante 2 Litros",
    "description": "Refrigerante 2 litros geladinho.",
    "price": 15,
    "points": 22,
    "emoji": "🥤",
    "image": "/images/cocacola2l-1.jpg",
    "category": "bebidas",
    "choiceName": "Sabor",
    "choices": [
      { "name": "Coca Cola", "image": "/images/cocacola2l-1.jpg" },
      { "name": "Pepsi", "image": "/images/pepsi2l-1.jpg" },
      { "name": "Charrua", "image": "/images/charrua2l-1.jpg" }
    ]
  },
  {
    "id": "b_refri600",
    "name": "Refrigerante 600ml",
    "description": "Refrigerante 600ml geladinho.",
    "price": 10,
    "points": 15,
    "emoji": "🥤",
    "image": "/images/coca600ml-1.jpg",
    "category": "bebidas",
    "choiceName": "Sabor",
    "choices": [
      { "name": "Coca Cola", "image": "/images/coca600ml-1.jpg" },
      { "name": "Pepsi", "image": "/images/pepsi600ml-1.jpg" },
      { "name": "Guaraná", "image": "/images/guarana600-1.avif" },
      { "name": "Sprite", "image": "/images/sprite600ml-1.jpg" }
    ]
  },
  {
    "id": "b_refrilata",
    "name": "Refrigerante Lata",
    "description": "Refrigerante em lata geladinho.",
    "price": 7,
    "points": 10,
    "emoji": "🥤",
    "image": "/images/cocalata-1.jpg",
    "category": "bebidas",
    "choiceName": "Sabor",
    "choices": [
      { "name": "Coca Cola", "image": "/images/cocalata-1.jpg" },
      { "name": "Coca Cola Zero", "image": "/images/cocazero-1.jpg" }
    ]
  },
  {
    "id": "b_refri200",
    "name": "Refrigerante 200ml",
    "description": "Refrigerante 200ml caçulinha.",
    "price": 4,
    "points": 6,
    "emoji": "🥤",
    "image": "/images/coca200ml-1.jpg",
    "category": "bebidas",
    "choiceName": "Sabor",
    "choices": [
      { "name": "Coca Cola", "image": "/images/coca200ml-1.jpg" },
      { "name": "Guaraná", "image": "/images/gurana200ml-1.jpg" }
    ]
  },
  {
    "id": "b14",
    "name": "Cerveja Latão",
    "description": "Cerveja em lata grande (latão).",
    "price": 12,
    "points": 18,
    "emoji": "🍺",
    "image": "/images/latão-1.jpg",
    "category": "bebidas"
  },`;

// regex to replace all existing bebidas in data.ts.
// Look for objects that have "category": "bebidas"
const regex = /\s*\{\s*"id":\s*"b(1|2|3|4|5|6|7|8|9|10|11|12|13|14)"[\s\S]*?"category":\s*"bebidas"\s*\},?/g;

dataTs = dataTs.replace(regex, '');

// Now we need to insert our newBebidas inside the MENU_ITEMS array.
// Find the last lanche or something and append, or just append before the combos.
dataTs = dataTs.replace('  {', newBebidas + '\n  {');

fs.writeFileSync('src/data.ts', dataTs);
console.log('data.ts updated');
