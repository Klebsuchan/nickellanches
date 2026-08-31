const fs = require('fs');

let code = fs.readFileSync('src/components/WaiterPanel.tsx', 'utf8');

// Replace the normal view item logic in WaiterPanel
code = code.replace(
  '                    <span><span className="font-bold text-yellow-400">{item.quantity}x</span> <RenderWithNickel text={item.name} /></span>\n                    <span className="font-mono">R$ {(item.price * item.quantity).toFixed(2)}</span>',
  `                    <div>
                      <span><span className="font-bold text-yellow-400">{item.quantity}x</span> <RenderWithNickel text={item.name} /></span>
                      {item.extras && item.extras.length > 0 && (
                        <div className="text-xs text-yellow-400/80 pl-4 mt-1">+ {item.extras.map((e:any)=>e.name).join(', ')}</div>
                      )}
                      {item.observation && (
                        <div className="text-xs text-red-400 pl-4 mt-1 italic">"{item.observation}"</div>
                      )}
                    </div>
                    <span className="font-mono">R$ {((item.price + (item.extras?.reduce((sum:number, e:any) => sum + e.price, 0) || 0)) * item.quantity).toFixed(2)}</span>`
);

// Replace the printed view item logic in WaiterPanel
code = code.replace(
  '                  <span>{item.quantity}x <RenderWithNickel text={item.name.substring(0, 15)} /></span>\n                  <span>R$ {(item.price * item.quantity).toFixed(2)}</span>',
  `                  <div className="flex flex-col">
                    <span>{item.quantity}x <RenderWithNickel text={item.name.substring(0, 15)} /></span>
                    {item.extras && item.extras.length > 0 && (
                      <span className="pl-4">+ {item.extras.map((e:any)=>e.name).join(', ')}</span>
                    )}
                    {item.observation && (
                      <span className="pl-4 italic">"{item.observation}"</span>
                    )}
                  </div>
                  <span>R$ {((item.price + (item.extras?.reduce((sum:number, e:any) => sum + e.price, 0) || 0)) * item.quantity).toFixed(2)}</span>`
);

fs.writeFileSync('src/components/WaiterPanel.tsx', code);
console.log("Updated WaiterPanel.tsx");
