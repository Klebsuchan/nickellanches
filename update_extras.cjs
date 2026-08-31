const fs = require('fs');

let data = fs.readFileSync('src/data.ts', 'utf8');

const newExtras = `export const AVAILABLE_EXTRAS: Extra[] = [
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

data = data.replace(/export const AVAILABLE_EXTRAS: Extra\[\] = \[[\s\S]*?\];/, newExtras);

fs.writeFileSync('src/data.ts', data);
console.log("Updated data.ts");
