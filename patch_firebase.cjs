const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(
  /export const db = initializeFirestore[\\s\\S]*?\\);/,
  "export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);"
);
code = code.replace(
  'import { getFirestore, initializeFirestore } from "firebase/firestore";',
  'import { getFirestore } from "firebase/firestore";'
);
code = code.replace(
  'const firebaseConfig = {',
  'import configFromJson from "../firebase-applet-config.json";\nconst firebaseConfig = {'
);
code = code.replace(
  '"ai-studio-nickellanches-8133d702-5451-4be1-a259-e8090108c42a"',
  'configFromJson.firestoreDatabaseId'
);

fs.writeFileSync('src/lib/firebase.ts', code);
console.log("Patched firebase.ts");
