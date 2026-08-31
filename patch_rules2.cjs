const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf8');
content = content.replace(
  "    match /banners/{bannerId} {",
  "    match /settings/{settingId} {\n      allow read: if true;\n      allow write: if true;\n    }\n\n    match /banners/{bannerId} {"
);
fs.writeFileSync('firestore.rules', content);
console.log('Rules patched for settings');
