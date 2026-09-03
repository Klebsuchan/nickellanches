import React, { useState } from 'react';
import { ArrowRight, MapPin, Plus, Trash2, Clock, ChevronDown, ShoppingBag, CreditCard } from 'lucide-react';
import { OrderInfo } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Address {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  reference?: string;
}

import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '../lib/db';
import { LogIn, LogOut, Star, Gamepad2, CheckCircle2, ChefHat, Bike, PackageCheck } from 'lucide-react';

interface ProfileViewProps {
  orderHistory?: OrderInfo[];
  onClose: () => void;
  user?: FirebaseUser | null;
  userProfile?: UserProfile | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function ProfileView({ onClose, orderHistory = [], user, userProfile, onLogin, onLogout, onPlayGame }: ProfileViewProps & { onPlayGame?: () => void }) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>(() => {
    const saved = localStorage.getItem('user_addresses');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [recentPayments, setRecentPayments] = useState<string[]>(() => {
    const saved = localStorage.getItem('recent_payments');
    return saved ? JSON.parse(saved) : ['PIX na Entrega', 'Cartão de Crédito'];
  });
  const [showForm, setShowForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ street: '', number: '', neighborhood: '', city: 'Passo Fundo', reference: '' });

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.number) return;
    
    const updated = [...addresses, { ...newAddress, id: Date.now().toString() }];
    setAddresses(updated);
    localStorage.setItem('user_addresses', JSON.stringify(updated));
    setNewAddress({ street: '', number: '', neighborhood: '', city: 'Passo Fundo', reference: '' });
    setShowForm(false);
  };

  const handleRemoveAddress = (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    localStorage.setItem('user_addresses', JSON.stringify(updated));
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

        
        {/* ACTIVE ORDERS TRACKER */}
        {orderHistory.filter(o => o.status !== 'entregue').length > 0 && (
          <div className="mb-12 space-y-6">
            <h3 className="text-2xl font-black uppercase tracking-tight text-[#F28B20] mb-6 flex items-center gap-2">
              <ChefHat size={28} /> Pedidos em Andamento
            </h3>
            {orderHistory.filter(o => o.status !== 'entregue').map(order => (
              <div key={order.id} className="bg-white border-2 border-[#4E2A84] p-6 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F28B20] rounded-full blur-3xl opacity-10"></div>
                
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <div>
                    <h4 className="font-black text-xl text-stone-900">Pedido #{order.id.substring(0,6)}</h4>
                    <p className="text-stone-500 font-medium text-sm">Total: R$ {order.total.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="bg-[#4E2A84] text-white px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-wide">
                    {order.status === 'recebido' && 'Recebido'}
                    {order.status === 'preparando' && 'Na Cozinha'}
                    {order.status === 'a_caminho' && 'Saiu para Entrega'}
                  </div>
                </div>

                {/* Status Stepper */}
                <div className="relative flex justify-between items-center mb-8 z-10 before:absolute before:top-1/2 before:-translate-y-1/2 before:h-1 before:bg-stone-200 before:w-full before:-z-10">
                  {[
                    { id: 'recebido', label: 'Recebido', icon: CheckCircle2 },
                    { id: 'preparando', label: 'Cozinha', icon: ChefHat },
                    { id: 'a_caminho', label: 'Entrega', icon: Bike },
                    { id: 'entregue', label: 'Concluído', icon: PackageCheck }
                  ].map((step, idx) => {
                    const statuses = ['recebido', 'preparando', 'a_caminho', 'entregue'];
                    const currentIndex = statuses.indexOf(order.status);
                    const isCompleted = idx <= currentIndex;
                    const isActive = idx === currentIndex;
                    
                    return (
                      <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${isCompleted ? 'bg-[#F28B20] border-white text-white shadow-md' : 'bg-stone-100 border-white text-stone-400'}`}>
                          <step.icon size={18} />
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-[#F28B20]' : 'text-stone-400'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-gradient-to-r from-stone-50 to-stone-100 rounded-2xl p-5 border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                  <div className="text-center md:text-left">
                    <h5 className="font-black text-stone-900 uppercase">A ansiedade bateu?</h5>
                    <p className="text-sm font-medium text-stone-500">Jogue nosso minigame enquanto preparamos seu lanche!</p>
                  </div>
                  <button 
                    onClick={() => { if(onPlayGame) onPlayGame(); }}
                    className="w-full md:w-auto bg-[#4E2A84] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-[#3a1f63] transition-colors shadow-md"
                  >
                    <Gamepad2 size={18} /> Jogar Agora
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white border border-stone-200 p-5 rounded-2xl flex items-start justify-between shadow-sm group hover:border-[#F28B20] transition-colors">
              
              <div className="flex gap-3">
                <div className="mt-1 text-[#F28B20]"><MapPin size={20} /></div>
                <div>
                  <p className="font-bold text-stone-900">{addr.street}, {addr.number}</p>
                  <p className="text-sm text-stone-500 font-medium">{addr.neighborhood} - {addr.city}</p>
                  {addr.reference && <p className="text-xs text-stone-400 mt-1">Ref: {addr.reference}</p>}
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
      
        
        <div className="mb-12">
          <h3 className="text-2xl font-black uppercase tracking-tight text-stone-900 mb-6 flex items-center gap-2">
            <CreditCard className="text-[#F28B20]" size={24} /> Métodos de Pagamento Recentes
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

        {/* Authentication Card */}
        <div className="mb-12">
          {user ? (
            <div className="bg-white border-2 border-[#4E2A84] p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4E2A84] rounded-full blur-3xl opacity-10"></div>
              <div className="flex items-center gap-4 relative z-10">
                <img src={user.photoURL || ''} alt="Profile" className="w-16 h-16 rounded-full border-4 border-white shadow-md object-cover" />
                <div>
                  <h3 className="font-black text-2xl text-stone-900 leading-none">{user.displayName}</h3>
                  <p className="text-stone-500 font-medium text-sm mb-2">{user.email}</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 font-bold text-sm rounded-full">
                    <Star size={14} className="fill-yellow-500" /> {userProfile?.xp || 0} Pontos de XP
                  </span>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-6 py-3 border-2 border-stone-200 text-stone-600 font-bold uppercase rounded-xl hover:bg-stone-50 hover:text-red-500 hover:border-red-200 transition-all relative z-10 w-full md:w-auto justify-center"
              >
                <LogOut size={18} /> Sair da Conta
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#4E2A84] to-[#6b3fb3] p-8 rounded-3xl shadow-md text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl opacity-20"></div>
              <div className="relative z-10 max-w-md">
                <h3 className="font-black text-3xl uppercase tracking-tight mb-2">Salve seus Pedidos</h3>
                <p className="text-white/80 font-medium">Faça login com o Google para manter seu histórico salvo na nuvem e acumular pontos de XP a cada pedido!</p>
              </div>
              <button 
                onClick={onLogin}
                className="flex items-center gap-2 px-8 py-4 bg-white text-[#4E2A84] font-black uppercase tracking-wider rounded-xl hover:scale-105 hover:shadow-lg active:scale-95 transition-all relative z-10 shadow-md w-full md:w-auto justify-center"
              >
                <LogIn size={20} /> Entrar com Google
              </button>
            </div>
          )}
        </div>

        <div className="mt-12 mb-8">
          <h3 className="text-2xl font-black uppercase tracking-tight text-stone-900 mb-6 flex items-center gap-2">
            <Clock className="text-[#F28B20]" size={24} /> Histórico de Pedidos
          </h3>
          
          <div className="space-y-4">
            {orderHistory.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 border-dashed">
                <ShoppingBag size={32} className="mx-auto mb-3 text-stone-300" />
                <p className="font-medium text-stone-500">Nenhum pedido encontrado.</p>
              </div>
            ) : (
              orderHistory.map(order => (
                <div key={order.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                  <div 
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-stone-900 text-lg">Pedido #{order.id}</p>
                      <p className="text-sm text-stone-500 font-medium">
                        {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(order.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-[#4E2A84]">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                      <ChevronDown size={20} className={`text-stone-400 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-stone-100 bg-stone-50/50"
                      >
                        <div className="p-5 space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <div>
                                <span className="font-bold text-stone-700">{item.quantity}x</span>{' '}
                                <span className="font-medium text-stone-600">{item.name}</span>
                                {item.extras && item.extras.length > 0 && (
                                  <div className="text-xs text-stone-500 ml-5 mt-0.5">
                                    + {item.extras.map(e => e.name).join(', ')}
                                  </div>
                                )}
                              </div>
                              <span className="font-medium text-stone-600">
                                R$ {((item.price + (item.extras?.reduce((acc, e) => acc + e.price, 0) || 0)) * item.quantity).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
