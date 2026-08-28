const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogo = `<img src="/logo.png" alt="Nickel Lanches" className="h-10 md:h-12 w-auto object-contain drop-shadow-sm" />
            <h1 className="sr-only">Nickel Lanches</h1>`;

const newLogo = `<img src="/logo.png" alt="Nickel Lanches" className="h-16 md:h-20 w-auto object-contain drop-shadow-sm" />
            <h1 className="text-2xl md:text-3xl font-black text-[#4E2A84] tracking-tighter leading-none mt-1" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>Nickel Lanches</h1>`;

code = code.replace(oldLogo, newLogo);

// Fix the gap if needed, the wrapper is `<div className="flex items-center gap-2 cursor-pointer"`
code = code.replace('<div className="flex items-center gap-2 cursor-pointer"', '<div className="flex items-center gap-3 cursor-pointer"');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated logo size and text');
