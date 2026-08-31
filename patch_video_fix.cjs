const fs = require('fs');
let code = fs.readFileSync('src/components/AppetiteVideo.tsx', 'utf8');
code = code.replace("import NickelText from './NickelText'; from 'react';", "import NickelText from './NickelText';");
fs.writeFileSync('src/components/AppetiteVideo.tsx', code);
console.log('patched video fix');
