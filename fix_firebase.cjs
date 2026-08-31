const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');
content = content.replace('experimentalAutoDetectLongPolling: true,', 'experimentalForceLongPolling: true,');
fs.writeFileSync('src/lib/firebase.ts', content);
