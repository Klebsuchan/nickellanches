const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

const correctForm = `        {showForm && (
          <form onSubmit={handleAddAddress} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm mb-8 animate-fade-in">
            <h4 className="font-bold text-lg mb-4 text-[#4E2A84]">Adicionar Endereço</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Rua / Avenida</label>
                <input required value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4E2A84] font-medium" placeholder="Ex: Av. Brasil" />
              </div>
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Número</label>
                  <input required value={newAddress.number} onChange={e => setNewAddress({...newAddress, number: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4E2A84] font-medium" placeholder="123" />
                </div>
                <div className="w-2/3">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Bairro</label>
                  <input required value={newAddress.neighborhood} onChange={e => setNewAddress({...newAddress, neighborhood: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4E2A84] font-medium" placeholder="Centro" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Cidade</label>
                <input required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4E2A84] font-medium" placeholder="Passo Fundo" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Ponto de Referência (Opcional)</label>
                <input value={newAddress.reference || ''} onChange={e => setNewAddress({...newAddress, reference: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4E2A84] font-medium" placeholder="Ex: Perto do mercado" />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl font-bold text-stone-500 hover:bg-stone-100 transition-colors">Cancelar</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-[#F28B20] text-white hover:bg-orange-500 transition-colors shadow-sm">Salvar Endereço</button>
            </div>
          </form>
        )}`;

content = content.replace(/\{showForm && \([\s\S]*?<\/form>\s*\)\}/, correctForm);
fs.writeFileSync('src/components/ProfileView.tsx', content);
