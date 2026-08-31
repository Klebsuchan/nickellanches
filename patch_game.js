const fs = require('fs');
let code = fs.readFileSync('src/components/DogGame.tsx', 'utf8');

// Replace title
code = code.replace('>Dog voador</h3>', '>Nickel entrega</h3>');

// Replace spawn rate and speed
code = code.replace(
  'const spawnRate = Math.max(30, Math.floor(100 - (state.speed - 5) * 10));',
  'const spawnRate = Math.max(60, Math.floor(120 - (state.speed - 5) * 12));'
);

code = code.replace(
  'state.speed += 0.005; // slowly increase speed faster than before',
  `if (state.speed < 12) { state.speed += 0.003; }`
);

fs.writeFileSync('src/components/DogGame.tsx', code);
console.log('patched!');
