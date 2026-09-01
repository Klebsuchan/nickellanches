const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

content = content.replace("interface Address {", "interface Address {\n  id: string;\n  street: string;\n  number: string;\n  neighborhood: string;\n  city: string;\n  reference?: string;\n}");

// Replace useState for addresses
content = content.replace(
  "const [addresses, setAddresses] = useState<Address[]>([\n    { id: '1', street: 'Rua das Flores', number: '123', neighborhood: 'Centro', city: 'São Paulo' }\n  ]);",
  `const [addresses, setAddresses] = useState<Address[]>(() => {
    const saved = localStorage.getItem('user_addresses');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [recentPayments, setRecentPayments] = useState<string[]>(() => {
    const saved = localStorage.getItem('recent_payments');
    return saved ? JSON.parse(saved) : ['PIX na Entrega', 'Cartão de Crédito'];
  });`
);

content = content.replace("setAddresses([...addresses, { ...newAddress, id: Date.now().toString() }]);", 
  "const updated = [...addresses, { ...newAddress, id: Date.now().toString() }];\n    setAddresses(updated);\n    localStorage.setItem('user_addresses', JSON.stringify(updated));");

content = content.replace("setAddresses(addresses.filter(a => a.id !== id));", 
  "const updated = addresses.filter(a => a.id !== id);\n    setAddresses(updated);\n    localStorage.setItem('user_addresses', JSON.stringify(updated));");

content = content.replace("const [newAddress, setNewAddress] = useState({ street: '', number: '', neighborhood: '', city: '' });",
  "const [newAddress, setNewAddress] = useState({ street: '', number: '', neighborhood: '', city: 'Passo Fundo', reference: '' });");

content = content.replace("setNewAddress({ street: '', number: '', neighborhood: '', city: '' });",
  "setNewAddress({ street: '', number: '', neighborhood: '', city: 'Passo Fundo', reference: '' });");

const formInputs = `
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
`;

// Replace the old form grid
content = content.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">[\s\S]*?<\/div>\s*<\/div>/, formInputs);

// Update Address rendering
const addressRender = `
              <div className="flex gap-3">
                <div className="mt-1 text-[#F28B20]"><MapPin size={20} /></div>
                <div>
                  <p className="font-bold text-stone-900">{addr.street}, {addr.number}</p>
                  <p className="text-sm text-stone-500 font-medium">{addr.neighborhood} - {addr.city}</p>
                  {addr.reference && <p className="text-xs text-stone-400 mt-1">Ref: {addr.reference}</p>}
                </div>
              </div>
`;

content = content.replace(/<div className="flex gap-3">[\s\S]*?<\/div>\s*<\/div>/, addressRender);

// Add Payment Methods section
const paymentMethodsUI = `
        <div className="mb-12">
          <h3 className="text-2xl font-black uppercase tracking-tight text-stone-900 mb-6 flex items-center gap-2">
            <ShoppingBag className="text-[#F28B20]" size={24} /> Métodos de Pagamento Recentes
          </h3>
          <div className="flex flex-wrap gap-3">
            {recentPayments.map((payment, idx) => (
              <div key={idx} className="bg-white border border-stone-200 px-5 py-3 rounded-xl shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="font-bold text-stone-700">{payment}</span>
              </div>
            ))}
            {recentPayments.length === 0 && (
              <p className="text-stone-500 font-medium text-sm">Nenhum pagamento recente.</p>
            )}
          </div>
        </div>
`;

content = content.replace('<div className="mt-12 mb-8">', paymentMethodsUI + '\n        <div className="mt-12 mb-8">');

// Add ShoppingBag import if missing, wait I already added it in the previous step
// Check if ShoppingBag is imported
fs.writeFileSync('src/components/ProfileView.tsx', content);
