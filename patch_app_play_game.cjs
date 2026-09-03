const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "<ProfileView \n          onClose={() => setView('menu')} \n          orderHistory={orderHistory}",
  "<ProfileView \n          onClose={() => setView('menu')} \n          orderHistory={orderHistory}\n          onPlayGame={() => setView('game')}"
);

// We should also replace the standard one-liner format just in case:
content = content.replace(
  /<ProfileView\s+onClose=\{\(\) => setView\('menu'\)\}\s+orderHistory=\{orderHistory\}/,
  "<ProfileView onClose={() => setView('menu')} orderHistory={orderHistory} onPlayGame={() => setView('game')}"
);

fs.writeFileSync('src/App.tsx', content);
