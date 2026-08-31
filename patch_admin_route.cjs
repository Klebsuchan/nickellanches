const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "if (window.location.pathname === '/painel-admin-secreto') {",
  "if (window.location.pathname === '/painel-admin') {"
);

fs.writeFileSync('src/App.tsx', content);
console.log('Done');
