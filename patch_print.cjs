const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Pass setOrderToPrint down
content = content.replace(
  "{activeTab === 'settings' && <PrintSettingsEditor settings={printSettings} setSettings={setPrintSettings} />}",
  "{activeTab === 'settings' && <PrintSettingsEditor settings={printSettings} setSettings={setPrintSettings} onTestPrint={() => { setOrderToPrint({ id: 'TESTE-123', createdAt: { toDate: () => new Date() }, items: [{ name: 'Lanche Teste de Impressão', price: 0, quantity: 1, extras: [] }], totalPrice: 0, userName: 'Teste', address: 'Teste', paymentMethod: 'Teste', status: 'recebido' }); setTimeout(() => window.print(), 500); }} />}"
);

// Update PrintSettingsEditor signature
content = content.replace(
  "function PrintSettingsEditor({ settings, setSettings }: any) {",
  "function PrintSettingsEditor({ settings, setSettings, onTestPrint }: any) {"
);

// Add the button
const targetFormat = `          <h3 className="font-black uppercase border-b-2 border-stone-100 pb-2 mb-4">Cabeçalho (Recibo)</h3>`;
const newFormat = `          <div className="flex gap-4">
            <button onClick={onTestPrint} className="flex-1 py-4 bg-black text-white font-bold uppercase tracking-widest rounded-xl hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
              <Printer size={20}/> Escolher / Testar Impressora
            </button>
            <button onClick={handleSave} className="flex-1 py-4 bg-yellow-400 text-black font-bold uppercase tracking-widest rounded-xl hover:bg-yellow-500 transition-colors shadow-md flex items-center justify-center gap-2">
              <Save size={20}/> Salvar Definições
            </button>
          </div>
          
          <h3 className="font-black uppercase border-b-2 border-stone-100 pb-2 mb-4">Cabeçalho (Recibo)</h3>`;

content = content.replace(targetFormat, newFormat);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('AdminPanel patched for print test');
