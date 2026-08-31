const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const targetSave = `<div className="pt-6 border-t-2 border-stone-100 flex justify-end">
          <button onClick={handleSave} className="bg-stone-900 text-yellow-400 px-8 py-4 rounded-xl font-bold uppercase tracking-widest shadow-md hover:bg-stone-800 transition-colors flex items-center gap-2"><Save size={20} /> Salvar Configurações</button>
        </div>`;

const newButtons = `<div className="pt-6 border-t-2 border-stone-100 flex flex-col md:flex-row gap-4">
          <button onClick={onTestPrint} className="flex-1 bg-stone-100 text-stone-700 border-2 border-stone-300 px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-stone-200 transition-colors flex items-center justify-center gap-2">
            <Printer size={20} /> Escolher Impressora / Testar
          </button>
          <button onClick={handleSave} className="flex-1 bg-stone-900 text-yellow-400 px-8 py-4 rounded-xl font-bold uppercase tracking-widest shadow-md hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
            <Save size={20} /> Salvar Configurações
          </button>
        </div>`;

content = content.replace(targetSave, newButtons);
fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed buttons');
