const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf8');
content = content.replace(
  "    match /system/{docId} {",
  "    match /banners/{bannerId} {\n      allow read: if true;\n      allow write: if true;\n    }\n\n    match /system/{docId} {"
);
fs.writeFileSync('firestore.rules', content);
console.log('Rules patched');
