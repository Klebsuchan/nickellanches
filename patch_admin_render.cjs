const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

if (!code.includes('import RenderWithNickel')) {
  code = code.replace(
    "import NickelText",
    "import RenderWithNickel from './RenderWithNickel';\nimport NickelText"
  );
}

code = code.replace(
  '<span className="text-red-500">{item.quantity}x</span> {item.name}',
  '<span className="text-red-500">{item.quantity}x</span> <RenderWithNickel text={item.name} />'
);

code = code.replace(
  '<span>{item.quantity}x {item.name.substring(0, 20)}</span>',
  '<span>{item.quantity}x <RenderWithNickel text={item.name.substring(0, 20)} /></span>'
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('patched admin panel with renderwithnickel');
