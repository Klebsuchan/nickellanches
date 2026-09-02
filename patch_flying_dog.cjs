const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "            🐶🚀",
  "            <img src=\"/cochirrinho16bit.png\" alt=\"Cachorrinho\" className=\"w-48 h-48 object-contain drop-shadow-2xl scale-x-[-1]\" />"
);

fs.writeFileSync('src/App.tsx', content);
