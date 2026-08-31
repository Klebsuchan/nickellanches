const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  /<div className="grid gap-6 md:grid-cols-2">/g,
  `<div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-display uppercase font-bold text-black">Configuração</h2>
                     <button
                        onClick={() => setAutoPrintEnabled(!autoPrintEnabled)}
                        className={\`px-4 py-2 rounded-lg font-bold border border-stone-200 flex items-center gap-2 shadow-sm transition-colors \${autoPrintEnabled ? 'bg-green-400 text-black hover:bg-green-500' : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'}\`}
                     >
                       <Printer size={18} /> 
                       {autoPrintEnabled ? 'Impressão Automática: LIGADA' : 'Impressão Automática: DESLIGADA'}
                     </button>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">`
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('patched admin print toggle');
