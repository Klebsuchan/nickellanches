const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/status: 'preparando'/g, "status: 'recebido'");
fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated');
