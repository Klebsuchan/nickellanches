const fs = require('fs');
let code = fs.readFileSync('src/components/StorySection.tsx', 'utf8');

if (!code.includes('import NickelText')) {
  code = code.replace(
    "import DeliveryInfoModal",
    "import NickelText from './NickelText';\nimport DeliveryInfoModal"
  );
}

code = code.replace(
  'A HISTÓRIA DA <span className="text-[#4E2A84]">NICKEL LANCHES</span>',
  'A HISTÓRIA DA <span className="text-[#4E2A84]"><NickelText /> LANCHES</span>'
);

code = code.replace(
  'Na Nickel Lanches,',
  'Na <NickelText /> Lanches,'
);

fs.writeFileSync('src/components/StorySection.tsx', code);
console.log('patched story');
