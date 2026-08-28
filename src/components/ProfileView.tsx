import React, { useState } from 'react';
import { ArrowRight, MapPin, Plus, Trash2 } from 'lucide-react';

interface Address {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
}

interface ProfileViewProps {
  onClose: () => void;
}

export default function ProfileView({ onClose }: ProfileViewProps) {
  const [addresses, setAddresses] = useState<Address[]>([
    { id: '1', street: 'Rua das Flores', number: '123', neighborhood: 'Centro', city: 'São Paulo' }
  ]);
  const [showForm, setShowForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ street: '', number: '', neighborhood: '', city: '' });

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.number) return;
    
    setAddresses([...addresses, { ...newAddress, id: Date.now().toString() }]);
    setNewAddress({ street: '', number: '', neighborhood: '', city: '' });
    setShowForm(false);
  };

  const handleRemoveAddress = (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  return (
    <div className="w-full min-h-screen bg-[#FCF9F5] text-stone-900 relative z-50">
      <header className="py-4 px-6 flex items-center gap-4 bg-white sticky top-0 z-50 border-b border-stone-100 shadow-sm">
        <button onClick={onClose} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-900 hover:bg-stone-200 transition-colors">
          <ArrowRight size={20} className="rotate-180" />
        </button>
        <h1 className="text-lg font-black text-stone-900 tracking-tight uppercase">Minha Conta</h1>
      </header>
      
      <div className="max-w-3xl mx-auto px-6 py-10 pb-32">
        <div className="mb-10 bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 bg-[#4E2A84] text-white rounded-full flex items-center justify-center text-2xl font-black">
            L
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-stone-900">Lancheiro VIP</h2>
            <p className="text-stone-500 font-medium text-sm">braian.kleber.camargo@gmail.com</p>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-black uppercase tracking-tight text-stone-900">Meus Endereços</h3>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="text-[#F28B20] font-bold text-sm uppercase tracking-wider flex items-center gap-1 hover:text-orange-500">
              <Plus size={16} /> Novo Endereço
            </button>
          )}
        </div>

        {showForm && (
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
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl font-bold text-stone-500 hover:bg-stone-100 transition-colors">Cancelar</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-[#F28B20] text-white hover:bg-orange-500 transition-colors shadow-sm">Salvar Endereço</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white border border-stone-200 p-5 rounded-2xl flex items-start justify-between shadow-sm group hover:border-[#F28B20] transition-colors">
              <div className="flex gap-3">
                <div className="mt-1 text-[#F28B20]"><MapPin size={20} /></div>
                <div>
                  <p className="font-bold text-stone-900">{addr.street}, {addr.number}</p>
                  <p className="text-sm text-stone-500 font-medium">{addr.neighborhood} - {addr.city}</p>
                </div>
              </div>
              <button onClick={() => handleRemoveAddress(addr.id)} className="text-stone-300 hover:text-red-500 transition-colors p-2">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {addresses.length === 0 && !showForm && (
            <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-stone-200 border-dashed">
              <MapPin size={32} className="mx-auto mb-3 text-stone-300" />
              <p className="font-medium text-stone-500">Nenhum endereço cadastrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
