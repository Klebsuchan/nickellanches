const fs = require('fs');
let code = fs.readFileSync('src/components/WaiterPanel.tsx', 'utf8');
if (!code.includes('import NickelText')) {
  code = code.replace("import React,", "import NickelText from './NickelText';\nimport React,");
}
code = code.replace(
  '<h2 className="text-2xl font-bold">NICKEL LANCHES</h2>',
  '<h2 className="text-2xl font-bold"><NickelText /> LANCHES</h2>'
);
fs.writeFileSync('src/components/WaiterPanel.tsx', code);
console.log('patched waiter');
