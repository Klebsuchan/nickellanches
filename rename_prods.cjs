const fs = require('fs');
let data = fs.readFileSync('src/data.ts', 'utf-8');

data = data.replace(/"name": "Xis Olympus"/g, '"name": "Xis Prime"');
data = data.replace(/"name": "Xis Nickel Magma"/g, '"name": "Xis Magma"');
data = data.replace(/"name": "Xis Nickel Cemuche"/g, '"name": "Xis Cemuche"');
data = data.replace(/"name": "Xis Nickel Bomba"/g, '"name": "Xis Bomba"');

fs.writeFileSync('src/data.ts', data);
