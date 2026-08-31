const fs = require('fs');
let code = fs.readFileSync('src/components/WaiterPanel.tsx', 'utf8');

if (!code.includes('import RenderWithNickel')) {
  code = code.replace(
    "import NickelText",
    "import RenderWithNickel from './RenderWithNickel';\nimport NickelText"
  );
}

code = code.replace(
  '<span><span className="font-bold text-yellow-400">{item.quantity}x</span> {item.name}</span>',
  '<span><span className="font-bold text-yellow-400">{item.quantity}x</span> <RenderWithNickel text={item.name} /></span>'
);

code = code.replace(
  '<span>{item.quantity}x {item.name.substring(0, 15)}</span>',
  '<span>{item.quantity}x <RenderWithNickel text={item.name.substring(0, 15)} /></span>'
);

fs.writeFileSync('src/components/WaiterPanel.tsx', code);
console.log('patched waiter panel with renderwithnickel');
