const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

content = content.replace(
  'export const db = getFirestore(app);',
  'export const db = initializeFirestore(app, { experimentalForceLongPolling: true });'
);

fs.writeFileSync('src/lib/firebase.ts', content);
