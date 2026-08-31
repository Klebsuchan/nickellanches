const fs = require('fs');
let code = fs.readFileSync('src/components/AppetiteVideo.tsx', 'utf8');

if (!code.includes('import NickelText')) {
  code = code.replace(
    "import React",
    "import React from 'react';\nimport NickelText from './NickelText';"
  );
  code = code.replace("import React from 'react';\nimport React", "import React");
}

code = code.replace(
  '"Delícias como essa você só encontra aqui na Nickel"',
  '<span>"Delícias como essa você só encontra aqui na <NickelText />"</span>'
);

fs.writeFileSync('src/components/AppetiteVideo.tsx', code);
console.log('patched video');
