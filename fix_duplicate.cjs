const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "<ProfileView onClose={() => setView('menu')} orderHistory={orderHistory} onPlayGame={() => setView('game')}\n            onPlayGame={() => setView('game')}",
  "<ProfileView onClose={() => setView('menu')} orderHistory={orderHistory} onPlayGame={() => setView('game')}"
);

fs.writeFileSync('src/App.tsx', content);
