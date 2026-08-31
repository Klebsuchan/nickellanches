import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, Smartphone, MapPin, CreditCard, User as UserIcon } from 'lucide-react';
import { CartItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  onConfirm: (details: any) => void;
}

export default function CheckoutModal({ isOpen, onClose, cart, total, onConfirm }: CheckoutModalProps) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !whatsapp || !address || !paymentMethod) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    onConfirm({ name, whatsapp, address, paymentMethod });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex md:items-center justify-center md:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm hidden md:block"
          />

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="bg-white md:rounded-3xl w-full h-full md:h-auto max-w-xl md:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative z-10"
          >
            <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-xl font-black uppercase tracking-tighter">Finalizar Pedido</h2>
              <button onClick={onClose} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center hover:bg-stone-200">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-grow p-4 md:p-6 bg-stone-50">
              <form onSubmit={handleSubmit} id="checkout-form" className="space-y-6">
                
                {/* Resumo do Pedido */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                  <h3 className="font-black uppercase mb-4 text-stone-900 border-b border-stone-100 pb-2">Resumo do Pedido</h3>
                  <div className="space-y-3 mb-4 max-h-32 overflow-y-auto">
                    {cart.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm font-medium">
                        <span className="text-stone-600 line-clamp-1 pr-2">{item.quantity}x {item.name}</span>
                        <span className="text-stone-900 whitespace-nowrap">R$ {((item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) * item.quantity).toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                    <span className="font-bold text-stone-500 uppercase text-sm">Total a pagar</span>
                    <span className="font-black text-2xl text-[#F28B20]">R$ {total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <h3 className="font-black uppercase mb-2 text-stone-900 border-b border-stone-100 pb-2">Seus Dados</h3>
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-1.5 uppercase">
                      <UserIcon size={16} className="text-[#F28B20]" /> Nome Completo
                    </label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: João da Silva" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all" />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-1.5 uppercase">
                      <Smartphone size={16} className="text-[#F28B20]" /> WhatsApp
                    </label>
                    <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required placeholder="Ex: 51 99999-9999" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all" />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-1.5 uppercase">
                      <MapPin size={16} className="text-[#F28B20]" /> Endereço de Entrega
                    </label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} required placeholder="Rua, Número, Bairro, Complemento" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                  <h3 className="font-black uppercase mb-3 text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                    <CreditCard size={18} className="text-[#F28B20]" /> Forma de Pagamento
                  </h3>
                  <div className="space-y-2">
                    {['PIX (Pagamento na Entrega)', 'Cartão de Crédito/Débito na Entrega', 'Dinheiro na Entrega'].map(method => (
                      <label key={method} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === method ? 'border-[#F28B20] bg-orange-50/50' : 'border-stone-100 hover:border-stone-200'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method ? 'border-[#F28B20]' : 'border-stone-300'}`}>
                          {paymentMethod === method && <div className="w-2.5 h-2.5 rounded-full bg-[#F28B20]"></div>}
                        </div>
                        <span className="font-bold text-stone-700 text-sm">{method}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </form>
            </div>

            <div className="p-4 md:p-6 border-t border-stone-200 bg-white shrink-0">
              <button 
                type="submit"
                form="checkout-form"
                className="w-full bg-green-500 text-white rounded-xl py-4 font-black uppercase tracking-wider shadow-lg hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
              >
                <CheckCircle size={22} /> Enviar Pedido por WhatsApp
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
