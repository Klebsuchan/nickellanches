const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('import NickelText')) {
  code = code.replace(
    "import { ShoppingBag",
    "import NickelText from './components/NickelText';\nimport { ShoppingBag"
  );
}

// Hero text
code = code.replace(
  '<h1 className="text-2xl sm:text-3xl md:text-4xl tracking-tighter leading-none" style={{ fontFamily: \'"Russo One", sans-serif\', fontStyle: \'italic\', color: \'#FFD700\', WebkitTextStroke: \'1.5px black\', textShadow: \'2px 2px 0px #000\' }}>NICKEL</h1>',
  '<h1 className="text-2xl sm:text-3xl md:text-4xl tracking-tighter leading-none"><NickelText /></h1>'
);

// About text 1
code = code.replace(
  'Na Nickel Lanches,',
  'Na <NickelText /> Lanches,'
);

// About text 2
code = code.replace(
  'exclusivas da Nickel Lanches.',
  'exclusivas da <NickelText /> Lanches.'
);

fs.writeFileSync('src/App.tsx', code);
console.log('patched app.tsx');
