const fs = require('fs');

let data = fs.readFileSync('src/data.ts', 'utf-8');

const replacements = {
  "Água Com Gás": "/images/aguagas-1.jpg",
  "Água Sem Gás": "/images/aguasemgas-1.jpg",
  "Xis Bomba": "/images/bomba-1.png",
  "Charrua 2 Litros": "/images/charrua2l-1.jpg",
  "Coca Cola 200ml": "/images/coca200ml-1.jpg",
  "Coca Cola 600ml": "/images/coca600ml-1.jpg",
  "Coca Cola 2 Litros": "/images/cocacola2l-1.jpg",
  "Coca Cola Lata": "/images/cocalata-1.jpg",
  "Coca Cola Zero Lata": "/images/cocazero-1.jpg",
  "Xis Duplo": "/images/duplo-1.png",
  "Batata Frita P": "/images/fritascheddarbacon-1.jpg",
  "Batata Frita P com cheddar e bacon": "/images/fritascheddarbacon-1.jpg",
  "Batata Frita M": "/images/fritascheddarbacon-1.jpg",
  "Batata Frita M com cheddar e bacon": "/images/fritascheddarbacon-1.jpg",
  "Batata Frita G": "/images/fritascheddarbacon-1.jpg",
  "Batata Frita G com cheddar e bacon": "/images/fritascheddarbacon-1.jpg",
  "Guaraná 600ml": "/images/guarana600-1.avif",
  "Guaraná 200ml": "/images/gurana200ml-1.jpg",
  "Cerveja Latão": "/images/latão-1.jpg",
  "Xis Magma": "/images/magma-1.png",
  "Cachorro Quente Tradicional": "/images/nickeldog-1.avif",
  "Cachorro Quente Coração": "/images/nickeldog-1.avif",
  "Cachorro Quente Bacon": "/images/nickeldog-1.avif",
  "Cachorro Quente Frango": "/images/nickeldog-1.avif",
  "Cachorro Quente Calabresa": "/images/nickeldog-1.avif",
  "Cachorro Quente Strogonoff de Frango": "/images/nickeldog-1.avif",
  "Xis Prime": "/images/olympus-1.png",
  "Pepsi 2 Litros": "/images/pepsi2l-1.jpg",
  "Pepsi 600ml": "/images/pepsi600ml-1.jpg",
  "Sprite 600ml": "/images/sprite600ml-1.jpg",
  "Xis Bacon": "/images/xisbacon-1.avif",
  "Xis Calabresa": "/images/xiscalabresa-1.avif",
  "Xis Cemuche": "/images/xiscemuche-1.jpg",
  "Xis Coração": "/images/xiscoração-1.jpg",
  "Xis Especial": "/images/xisespecial-1.avif",
  "Xis Strogonoff de Frango": "/images/xisestrogonofefrango-1.jpg",
  "Xis Filé": "/images/xisfilé-1.avif",
  "Xis Frango": "/images/xisfrango-1.jpg",
  "Xis Nickel Mix": "/images/xisnickelmix-1.jpg",
  "Xis Simples": "/images/xissimples-1.avif"
};

// Also apply combos:
replacements["Combo Família"] = "/images/xisnickelmix-1.jpg";
replacements["Combo Kids"] = "/images/nickeldog-1.avif";
replacements["Nickel Trio"] = "/images/xisbacon-1.avif";
replacements["Combinho Casal"] = "/images/xissimples-1.avif";


let items = data.split('},');
for (let i = 0; i < items.length; i++) {
  for (const [name, img] of Object.entries(replacements)) {
    // Check if this item is for this name
    if (items[i].includes(`"name": "${name}"`)) {
      items[i] = items[i].replace(/"image":\s*"[^"]+"/, `"image": "${img}"`);
    }
  }
}
data = items.join('},');

fs.writeFileSync('src/data.ts', data);
console.log('Images updated in data.ts');
