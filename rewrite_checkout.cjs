const fs = require('fs');

const content = `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, Smartphone, MapPin, CreditCard, User as UserIcon, AlertCircle } from 'lucide-react';
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
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const validateForm = () => {
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return false;
    }
    if (!whatsapp.trim()) {
      setErrorMessage('Por favor, informe seu WhatsApp para contato.');
      return false;
    }
    if (!address.trim()) {
      setErrorMessage('Por favor, informe seu endereço de entrega.');
      return false;
    }
    return true;
  };

  const handleStripePayment = async () => {
    if (!validateForm()) return;
    
    setIsProcessingStripe(true);
    try {
      // Save pending order to localStorage to recover after Stripe redirect
      localStorage.setItem('pendingStripeOrder', JSON.stringify({
        cart,
        details: {
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          address: address.trim(),
          paymentMethod: 'Stripe Online'
        }
      }));

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          orderDetails: {
            name: name.trim(),
            whatsapp: whatsapp.trim(),
            address: address.trim(),
          }
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage(data.error || 'Erro ao processar pagamento online. Verifique se as chaves da Stripe estão configuradas.');
      }
    } catch (err: any) {
      setErrorMessage('Erro de conexão ao iniciar o pagamento.');
    } finally {
      setIsProcessingStripe(false);
    }
  };

  const handleWhatsAppPayment = () => {
    if (!validateForm()) return;
    
    onConfirm({ 
      name: name.trim(), 
      whatsapp: whatsapp.trim(), 
      address: address.trim(), 
      paymentMethod: 'A Combinar na Entrega (WhatsApp)',
      changeFor: ''
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
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl bg-[#FCF9F5] md:rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 bg-white border-b border-stone-200 shrink-0">
              <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Finalizar Pedido</h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              <div className="space-y-6">
                
                {/* Resumo */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                  <h3 className="font-black uppercase mb-3 text-stone-900 border-b border-stone-100 pb-2">Resumo</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2 mb-3">
                    {cart.map((item, idx) => {
                      const itemExtrasCost = item.extras?.reduce((acc, e) => acc + e.price, 0) || 0;
                      return (
                        <div key={idx} className="flex justify-between items-start text-sm">
                          <div>
                            <span className="font-bold text-stone-800">{item.quantity}x</span>{' '}
                            <span className="font-medium text-stone-600">{item.name}</span>
                          </div>
                          <span className="font-bold text-stone-700">
                            R$ {((item.price + itemExtrasCost) * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-stone-500 font-bold uppercase text-xs pt-3 pb-2 border-t border-stone-100">
                    <span>Frete</span>
                    <span className="text-right">Calculado no WhatsApp</span>
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

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="p-4 md:p-6 border-t border-stone-200 bg-white shrink-0">
              <h3 className="text-center font-black uppercase text-stone-400 text-xs tracking-wider mb-4">Escolha como deseja finalizar</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button 
                  onClick={handleStripePayment}
                  disabled={isProcessingStripe}
                  className="w-full bg-[#4E2A84] text-white rounded-xl py-4 px-2 font-black uppercase tracking-wider shadow-md hover:bg-[#3a1f63] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed border-2 border-transparent hover:border-[#F28B20]"
                >
                  <div className="flex items-center gap-2 text-base">
                    <CreditCard size={20} /> {isProcessingStripe ? 'Processando...' : 'Pagar Agora Online'}
                  </div>
                  <span className="text-[10px] opacity-80 font-medium normal-case tracking-normal">(Cartão ou PIX via Stripe)</span>
                </button>

                <button 
                  onClick={handleWhatsAppPayment}
                  className="w-full bg-green-500 text-white rounded-xl py-4 px-2 font-black uppercase tracking-wider shadow-md hover:bg-green-600 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border-2 border-transparent hover:border-green-300"
                >
                  <div className="flex items-center gap-2 text-base">
                    <CheckCircle size={20} /> Finalizar pelo WhatsApp
                  </div>
                  <span className="text-[10px] opacity-80 font-medium normal-case tracking-normal">(Pagar na entrega com o motoboy)</span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
`;

fs.writeFileSync('src/components/CheckoutModal.tsx', content);
