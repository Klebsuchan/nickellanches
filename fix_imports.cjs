const fs = require('fs');

function addImports(file, newImports) {
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes('import NickelText')) return;
  // insert after the first import
  code = code.replace(/import React[^;]*;/, "$&\n" + newImports);
  fs.writeFileSync(file, code);
  console.log('Fixed imports in', file);
}

addImports('src/App.tsx', "import NickelText from './components/NickelText';\nimport RenderWithNickel from './components/RenderWithNickel';");
addImports('src/components/Footer.tsx', "import NickelText from './NickelText';");
addImports('src/components/WaiterPanel.tsx', "import NickelText from './NickelText';\nimport RenderWithNickel from './RenderWithNickel';");

console.log('Done');
