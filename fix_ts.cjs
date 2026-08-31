const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
admin = admin.replace(/for \(const id of Array\.from\(selectedIds\)\) \{/g, 'for (const id of Array.from(selectedIds) as string[]) {');
fs.writeFileSync('src/components/AdminPanel.tsx', admin);

let nickel = fs.readFileSync('src/components/RenderWithNickel.tsx', 'utf8');
nickel = nickel.replace(/<NickelText key=\{i\} \/>/g, '<span key={i}><NickelText /></span>');
fs.writeFileSync('src/components/RenderWithNickel.tsx', nickel);

console.log('TS Fixed');
