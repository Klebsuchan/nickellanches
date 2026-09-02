const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import { auth } from './lib/firebase';",
  "import { auth, signInWithGoogle, signOut } from './lib/firebase';"
);

fs.writeFileSync('src/App.tsx', content);
