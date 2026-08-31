const fs = require('fs');

function addImports(file, newImports) {
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes('import NickelText')) return;
  code = code.replace(/import React[^;]*;/, "$&\n" + newImports);
  fs.writeFileSync(file, code);
  console.log('Fixed imports in', file);
}

addImports('src/components/AdminPanel.tsx', "import NickelText from './NickelText';\nimport RenderWithNickel from './RenderWithNickel';");
addImports('src/components/StorySection.tsx', "import NickelText from './NickelText';");

console.log('Done');
