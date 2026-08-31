const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const targetHeader = `<div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display uppercase font-bold flex items-center gap-2">
                <CheckSquare size={24} className="text-yellow-500" /> 
                Pedidos Recentes
              </h2>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-stone-200 shadow-sm">
                <span className="text-sm font-bold uppercase text-stone-500">Impressão Auto:</span>
                <button 
                  onClick={() => setAutoPrintEnabled(!autoPrintEnabled)}
                  className={\`w-12 h-6 rounded-full transition-colors relative \${autoPrintEnabled ? 'bg-green-500' : 'bg-stone-300'}\`}
                >
                  <div className={\`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform \${autoPrintEnabled ? 'left-7' : 'left-1'}\`}></div>
                </button>
              </div>
            </div>`;

const newHeader = `<div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-display uppercase font-bold flex items-center gap-2">
                <CheckSquare size={24} className="text-yellow-500" /> 
                Pedidos Recentes
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    const pending = orders.filter(o => o.status === 'preparando');
                    if(pending.length === 0) {
                      addToast({ message: 'Nenhum pedido pendente', type: 'error' as any });
                      return;
                    }
                    // For mass print, print one by one
                    let delay = 0;
                    pending.forEach(order => {
                      setTimeout(() => {
                        setOrderToPrint(order);
                        setTimeout(() => window.print(), 500);
                      }, delay);
                      delay += 2000;
                    });
                  }}
                  className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors flex items-center gap-2"
                >
                  <Printer size={16} /> Imprimir Pendentes
                </button>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-stone-200 shadow-sm">
                  <span className="text-sm font-bold uppercase text-stone-500">Impressão Auto:</span>
                  <button 
                    onClick={() => setAutoPrintEnabled(!autoPrintEnabled)}
                    className={\`w-12 h-6 rounded-full transition-colors relative \${autoPrintEnabled ? 'bg-green-500' : 'bg-stone-300'}\`}
                  >
                    <div className={\`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform \${autoPrintEnabled ? 'left-7' : 'left-1'}\`}></div>
                  </button>
                </div>
              </div>
            </div>`;

content = content.replace(targetHeader, newHeader);
fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Mass print added');
