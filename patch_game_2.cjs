const fs = require('fs');
let code = fs.readFileSync('src/components/DogGame.tsx', 'utf8');

// 1. Remove mock progress interval
code = code.replace(
  /if \(\!order\?\.id\) \{[\s\S]*?return \(\) => clearInterval\(interval\);\n    \}/,
  `if (!order?.id) { return; }`
);

// 2. Remove mock toast logic
code = code.replace(
  /if \(\!order\?\.id\) \{[\s\S]*?\}\n  \}, \[progress, orderStatus, addToast, onFinishOrder, order\?\.id\]\);/,
  `}, [progress, orderStatus, addToast, onFinishOrder, order?.id]);`
);

fs.writeFileSync('src/components/DogGame.tsx', code);
console.log('effects patched!');
