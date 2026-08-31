const fs = require('fs');

const originalExtras = `export const AVAILABLE_EXTRAS: Extra[] = [
  { id: "e1", name: "Uma carne a mais", price: 10 },
  { id: "e2", name: "Calabresa", price: 8 },
  { id: "e3", name: "Coração de frango", price: 9 },
  { id: "e4", name: "Cebola", price: 6 },
  { id: "e5", name: "Mussarela", price: 5 },
  { id: "e6", name: "Bacon", price: 10 },
  { id: "e7", name: "Presunto", price: 5 },
  { id: "e8", name: "Cheddar", price: 6 },
  { id: "e9", name: "Ovo frito", price: 4 }
];`;

let dataTs = fs.readFileSync('src/data.ts', 'utf8');

// The file starts with AVAILABLE_EXTRAS and now has all the bebidas in it. 
// I need to extract the bebidas block we added, put originalExtras back, and then append the bebidas inside MENU_ITEMS.

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

// Replace from `export const AVAILABLE_EXTRAS` up to `export const DISCOUNT_CODES`
const startRegex = /export const AVAILABLE_EXTRAS: Extra\[\] = \[[\s\S]*?\];/;
dataTs = dataTs.replace(startRegex, originalExtras);

// Also remove `  {` since we appended it. We might need to check if there is an extra `  {` before `export const DISCOUNT_CODES`.
// Actually, earlier we did: dataTs.replace('  {', newBebidas + '\n  {');
// Which probably replaced the first `  {` which was inside `AVAILABLE_EXTRAS`.
// Wait, the newBebidas was prepended to the first `{`. So now `AVAILABLE_EXTRAS` contains newBebidas followed by the old Extras.
// But the replace startRegex already handles everything between `AVAILABLE_EXTRAS` and the `];` that closes it.
// Let's make sure.

dataTs = dataTs.replace('export const MENU_ITEMS: Product[] = [\n', 'export const MENU_ITEMS: Product[] = [\n' + newBebidas + '\n');

fs.writeFileSync('src/data.ts', dataTs);
