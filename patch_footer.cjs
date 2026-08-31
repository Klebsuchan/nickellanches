const fs = require('fs');
let code = fs.readFileSync('src/components/Footer.tsx', 'utf8');

if (!code.includes('import NickelText')) {
  code = code.replace(
    "import { Instagram",
    "import NickelText from './NickelText';\nimport { Instagram"
  );
}

// Logo text
code = code.replace(
  '<h1 className="text-4xl md:text-5xl tracking-tighter leading-none" style={{ fontFamily: \'"Russo One", sans-serif\', fontStyle: \'italic\', color: \'#FFD700\', WebkitTextStroke: \'2px black\', textShadow: \'4px 4px 0px #000\' }}>NICKEL</h1>',
  '<h1 className="text-4xl md:text-5xl tracking-tighter leading-none"><NickelText /></h1>'
);

code = code.replace(
  '<p>NICKEL LANCHES LTDA</p>',
  '<p><NickelText /> LANCHES LTDA</p>'
);

code = code.replace(
  'Nickel Lanches. Todos os direitos reservados.',
  '<NickelText /> Lanches. Todos os direitos reservados.'
);

fs.writeFileSync('src/components/Footer.tsx', code);
console.log('patched footer.tsx');
