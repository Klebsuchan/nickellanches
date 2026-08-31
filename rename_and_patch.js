import fs from 'fs';
import path from 'path';

function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\.]/g, '');
}

const dir = 'public/images';
const files = fs.readdirSync(dir);
const fileMap = {};

for (const file of files) {
  if (file === '.' || file === '..') continue;
  
  const safeName = removeAccents(file);
  const oldPath = path.join(dir, file);
  const newPath = path.join(dir, safeName);
  
  if (oldPath !== newPath) {
    fs.renameSync(oldPath, newPath);
  }
  // Map old filename (or safe version) to new safe path
  fileMap[file] = `/images/${safeName}`;
}

console.log("File map:", fileMap);

let data = fs.readFileSync('src/data.ts', 'utf-8');

// The file paths in data.ts might have accents right now, let's decode and replace them
// We can just find any `/images/XXXX.ext` and replace it with its safe version.
for (const [oldName, safePath] of Object.entries(fileMap)) {
  const oldPathPattern = `/images/${oldName}`;
  // replace exact string in data.ts
  data = data.split(oldPathPattern).join(safePath);
}

// Special check for "gurana" typo
data = data.split('/images/gurana200ml.jpg').join('/images/guarana200ml.jpg');
if (fs.existsSync('public/images/gurana200ml.jpg')) {
  fs.renameSync('public/images/gurana200ml.jpg', 'public/images/guarana200ml.jpg');
}

fs.writeFileSync('src/data.ts', data);
