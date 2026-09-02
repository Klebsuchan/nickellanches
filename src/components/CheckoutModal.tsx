import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, Smartphone, MapPin, CreditCard, User as UserIcon, QrCode, Banknote, AlertCircle } from 'lucide-react';
import { CartItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  onConfirm: (details: any) => void;
}

const PAYMENT_METHODS = [
  {
    id: 'PIX (Pagamento na Entrega)',
    title: 'PIX na Entrega',
    description: 'Chave PIX ou QR Code na hora da entrega',
    icon: QrCode,
    badge: 'Mais Rápido'
  },
  {
    id: 'Cartão de Crédito/Débito na Entrega',
    title: 'Cartão de Crédito / Débito',
    description: 'Levamos a maquininha até você',
    icon: CreditCard,
  },
  {
    id: 'Dinheiro na Entrega',
    title: 'Dinheiro na Entrega',
    description: 'Pagamento em notas/moedas na entrega',
    icon: Banknote,
  }
];

export default function CheckoutModal({ isOpen, onClose, cart, total, onConfirm }: CheckoutModalProps) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX (Pagamento na Entrega)');
  const [changeFor, setChangeFor] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }
    if (!whatsapp.trim()) {
      setErrorMessage('Por favor, informe seu WhatsApp para contato.');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Por favor, informe seu endereço de entrega.');
      return;
    }
    if (!paymentMethod) {
      setErrorMessage('Por favor, selecione a forma de pagamento.');
      return;
    }

    let finalPayment = paymentMethod;
    if (paymentMethod === 'Dinheiro na Entrega' && changeFor.trim()) {
      finalPayment += ` (Troco para: ${changeFor.trim()})`;
    }

    onConfirm({ 
      name: name.trim(), 
      whatsapp: whatsapp.trim(), 
      address: address.trim(), 
      paymentMethod: finalPayment,
      changeFor: changeFor.trim()
    });
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
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-stone-900">Finalizar Pedido</h2>
                <p className="text-xs text-stone-500 font-medium">Preencha seus dados para receber o pedido</p>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center hover:bg-stone-200 transition-colors"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-grow p-4 md:p-6 bg-stone-50">
              <form onSubmit={handleSubmit} id="checkout-form" className="space-y-6">
                
                {/* Resumo do Pedido */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                  <h3 className="font-black uppercase mb-4 text-stone-900 border-b border-stone-100 pb-2 flex items-center justify-between">
                    <span>Resumo do Pedido</span>
                    <span className="text-xs text-stone-500 font-bold lowercase">({cart.length} itens)</span>
                  </h3>
                  <div className="space-y-3 mb-4 max-h-36 overflow-y-auto pr-1">
                    {cart.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm font-medium">
                        <div className="pr-2">
                          <span className="text-stone-800 font-bold">{item.quantity}x </span>
                          <span className="text-stone-600">{item.name}</span>
                          {item.extras && item.extras.length > 0 && (
                            <div className="text-xs text-[#F28B20] font-semibold">
                              + {item.extras.map(e => e.name).join(', ')}
                            </div>
                          )}
                          {item.observation && (
                            <div className="text-xs text-stone-400 italic">
                              Obs: {item.observation}
                            </div>
                          )}
                        </div>
                        <span className="text-stone-900 font-bold whitespace-nowrap">
                          R$ {((item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                    <span className="font-bold text-stone-500 uppercase text-sm">Total a pagar</span>
                    <span className="font-black text-2xl text-[#F28B20]">R$ {total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                {/* Dados do Cliente */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <h3 className="font-black uppercase mb-2 text-stone-900 border-b border-stone-100 pb-2">Seus Dados</h3>
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-1.5 uppercase">
                      <UserIcon size={16} className="text-[#F28B20]" /> Nome Completo *
                    </label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                      placeholder="Ex: João da Silva" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900" 
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-1.5 uppercase">
                      <Smartphone size={16} className="text-[#F28B20]" /> WhatsApp / Celular *
                    </label>
                    <input 
                      type="tel" 
                      value={whatsapp} 
                      onChange={e => setWhatsapp(e.target.value)} 
                      required 
                      placeholder="Ex: 54 99999-9999" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900" 
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-1.5 uppercase">
                      <MapPin size={16} className="text-[#F28B20]" /> Endereço de Entrega Completo *
                    </label>
                    <input 
                      type="text" 
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                      required 
                      placeholder="Rua, Número, Bairro, Complemento" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900" 
                    />
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
                    <h3 className="font-black uppercase text-stone-900 flex items-center gap-2">
                      <CreditCard size={18} className="text-[#F28B20]" /> Forma de Pagamento *
                    </h3>
                    <span className="text-[11px] font-black uppercase text-[#F28B20] bg-orange-50 px-2 py-0.5 rounded-full">
                      Selecione uma
                    </span>
                  </div>

                  <div className="space-y-2.5">
                                        {PAYMENT_METHODS.map(method => {
                      const isSelected = paymentMethod === method.id;
                      const IconComp = method.icon;
                      return (
                        <label
                          key={method.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-[#F28B20] bg-orange-50/60 shadow-sm'
                              : 'border-stone-200 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 pointer-events-none">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                              isSelected ? 'border-[#F28B20] bg-white' : 'border-stone-300 bg-white'
                            }`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#F28B20]"></div>}
                            </div>
                            
                            <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-[#F28B20] text-white' : 'bg-stone-100 text-stone-600'}`}>
                              <IconComp size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm ${isSelected ? 'text-stone-900' : 'text-stone-700'}`}>
                                  {method.title}
                                </span>
                                {method.badge && (
                                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md uppercase">
                                    {method.badge}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-stone-500 block font-medium">
                                {method.description}
                              </span>
                            </div>
                          </div>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value={method.id} 
                            checked={isSelected} 
                            onChange={(e) => {
                              if (e.target.checked) setPaymentMethod(method.id);
                            }}
                            className="sr-only" 
                          />
                        </label>
                      );
                    })}
                  </div>

                  {/* Campo de Troco caso seja Dinheiro */}
                  {paymentMethod === 'Dinheiro na Entrega' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-3 border-t border-stone-100"
                    >
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Precisa de troco? Para quanto?
                      </label>
                      <input 
                        type="text" 
                        value={changeFor} 
                        onChange={e => setChangeFor(e.target.value)} 
                        placeholder="Ex: R$ 50,00 ou Não preciso de troco" 
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[#F28B20] focus:ring-2 focus:ring-orange-100 transition-all text-stone-900"
                      />
                    </motion.div>
                  )}
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

              </form>
            </div>

            <div className="p-4 md:p-6 border-t border-stone-200 bg-white shrink-0">
              <button 
                type="submit"
                form="checkout-form"
                className="w-full bg-green-500 text-white rounded-xl py-4 font-black uppercase tracking-wider shadow-lg hover:bg-green-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg cursor-pointer"
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
