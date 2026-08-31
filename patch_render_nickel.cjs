const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('import RenderWithNickel')) {
  code = code.replace(
    "import NickelText from './components/NickelText';",
    "import NickelText from './components/NickelText';\nimport RenderWithNickel from './components/RenderWithNickel';"
  );
}

// Menu item name
code = code.replace(
  '<h4 className="font-bold text-stone-900 leading-tight line-clamp-1 text-lg tracking-tight">{item.name}</h4>',
  '<h4 className="font-bold text-stone-900 leading-tight line-clamp-1 text-lg tracking-tight"><RenderWithNickel text={item.name} /></h4>'
);

// Menu item description
code = code.replace(
  '<p className="text-stone-500 text-xs sm:text-sm mt-1 mb-3 line-clamp-2 leading-relaxed">{item.description}</p>',
  '<p className="text-stone-500 text-xs sm:text-sm mt-1 mb-3 line-clamp-2 leading-relaxed"><RenderWithNickel text={item.description} /></p>'
);

// Order item name (cart)
code = code.replace(
  '<h4 className="font-bold text-stone-900 leading-tight text-sm sm:text-base">{item.name}</h4>',
  '<h4 className="font-bold text-stone-900 leading-tight text-sm sm:text-base"><RenderWithNickel text={item.name} /></h4>'
);

fs.writeFileSync('src/App.tsx', code);
console.log('patched app with renderwithnickel');
