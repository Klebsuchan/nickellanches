const fs = require('fs');
let code = fs.readFileSync('src/components/Footer.tsx', 'utf8');

const oldLogo = `<img src="/logo.png" alt="Nickel Lanches" className="h-16 w-auto object-contain mb-4" />`;
const newLogo = `<div className="flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="Nickel Lanches" className="h-20 md:h-24 w-auto object-contain" />
            <h2 className="text-2xl md:text-3xl font-black text-[#F28B20] tracking-tighter leading-none" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>Nickel Lanches</h2>
          </div>`;

code = code.replace(oldLogo, newLogo);
fs.writeFileSync('src/components/Footer.tsx', code);
console.log('Footer.tsx updated logo size and text');
