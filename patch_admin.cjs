const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
if (!code.includes('import NickelText')) {
  code = code.replace("import React,", "import NickelText from './NickelText';\nimport React,");
}
code = code.replace(
  '<h2 className="font-bold text-xl uppercase">NICKEL LANCHES</h2>',
  '<h2 className="font-bold text-xl uppercase"><NickelText /> LANCHES</h2>'
);
fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('patched admin');
