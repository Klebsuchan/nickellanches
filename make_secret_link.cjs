const fs = require('fs');
let content = fs.readFileSync('src/components/Footer.tsx', 'utf8');

const target = `<p>&copy; {new Date().getFullYear()} <NickelText /> Lanches. Todos os direitos reservados.</p>`;
const replacement = `<p>&copy; {new Date().getFullYear()} <button onClick={() => window.location.href = '/painel-admin'} className="hover:opacity-80 transition-opacity"><NickelText /></button> Lanches. Todos os direitos reservados.</p>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/Footer.tsx', content);
console.log('Done');
