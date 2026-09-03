import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CheckCircle, 
  Smartphone, 
  MapPin, 
  CreditCard, 
  QrCode, 
  Banknote, 
  User as UserIcon, 
  AlertCircle, 
  MessageCircle 
} from 'lucide-react';
import { CartItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  onConfirm: (details: any) => void;
}

// Configuração: Pagamento online via site fica oculto por enquanto a pedido do usuário
const SHOW_ONLINE_PAYMENT = false;

export default function CheckoutModal({ isOpen, onClose, cart, total, onConfirm }: CheckoutModalProps) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | 'dinheiro'>('pix');
  const [changeOption, setChangeOption] = useState<'none' | 'need'>('none');
  const [changeFor, setChangeFor] = useState('');
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
      setErrorMessage('Por favor, informe seu endereço de entrega completo.');
      return false;
    }
    if (!paymentMethod) {
      setErrorMessage('Por favor, selecione a forma de pagamento.');
      return false;
    }
    if (paymentMethod === 'dinheiro' && changeOption === 'need' && !changeFor.trim()) {
      setErrorMessage('Por favor, informe para quanto dinheiro você precisa de troco.');
      return false;
    }
    return true;
  };

  const handleWhatsAppCheckout = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    let finalPaymentLabel = '';
    let formattedChange = '';

    if (paymentMethod === 'pix') {
      finalPaymentLabel = 'PIX na Entrega (Chave ou QR Code)';
    } else if (paymentMethod === 'cartao') {
      finalPaymentLabel = 'Cartão de Crédito / Débito (Maquininha na entrega)';
    } else if (paymentMethod === 'dinheiro') {
      if (changeOption === 'need' && changeFor.trim()) {
        finalPaymentLabel = `Dinheiro (Troco para R$ ${changeFor.trim()})`;
        formattedChange = changeFor.trim();
      } else {
        finalPaymentLabel = 'Dinheiro (Não precisa de troco)';
      }
    }

    onConfirm({ 
      name: name.trim(), 
      whatsapp: whatsapp.trim(), 
      address: address.trim(), 
      paymentMethod: finalPaymentLabel,
      changeFor: formattedChange
    });
  };

  // Mantido pronto caso o pagamento online via site seja reativado no futuro
  const handleStripePayment = async () => {
    if (!validateForm()) return;
    
    setIsProcessingStripe(true);
    try {
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
            className="w-full h-full md:h-auto md:max-h-[92vh] md:max-w-2xl bg-[#FCF9F5] md:rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 bg-white border-b border-stone-200 shrink-0">
              <div>
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Finalizar Pedido</h2>
                <p className="text-xs text-stone-500 font-medium">Seu pedido será enviado direto para o nosso WhatsApp</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              <form id="checkout-form" onSubmit={handleWhatsAppCheckout} className="space-y-5">
                
                {/* Resumo do Pedido */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                  <h3 className="font-black uppercase mb-3 text-stone-900 border-b border-stone-100 pb-2 text-sm">
                    Resumo do Pedido
                  </h3>
                  <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-2 mb-3">
                    {cart.map((item, idx) => {
                      const itemExtrasCost = item.extras?.reduce((acc, e) => acc + e.price, 0) || 0;
                      return (
                        <div key={idx} className="flex justify-between items-start text-sm">
                          <div>
                            <span className="font-bold text-stone-800">{item.quantity}x</span>{' '}
                            <span className="font-medium text-stone-700">{item.name}</span>
                            {item.extras && item.extras.length > 0 && (
                              <div className="text-xs text-stone-500">
                                + {item.extras.map(e => e.name).join(', ')}
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-stone-800">
                            R$ {((item.price + itemExtrasCost) * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-stone-500 font-bold uppercase text-xs pt-3 pb-2 border-t border-stone-100">
                    <span>Taxa de Entrega</span>
                    <span className="text-right text-stone-600 font-bold">Calculado no WhatsApp</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                    <span className="font-bold text-stone-500 uppercase text-sm">Total dos Lanches</span>
                    <span className="font-black text-2xl text-[#F28B20]">R$ {total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                {/* Dados do Cliente */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <h3 className="font-black uppercase mb-2 text-stone-900 border-b border-stone-100 pb-2 text-sm">
                    Dados para Entrega
                  </h3>
                  
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5 uppercase">
                      <UserIcon size={15} className="text-[#F28B20]" /> Nome Completo *
                    </label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                      placeholder="Ex: João da Silva" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5 uppercase">
                      <Smartphone size={15} className="text-[#F28B20]" /> WhatsApp / Celular *
                    </label>
                    <input 
                      type="tel" 
                      value={whatsapp} 
                      onChange={e => setWhatsapp(e.target.value)} 
                      required 
                      placeholder="Ex: 54 99999-9999" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5 uppercase">
                      <MapPin size={15} className="text-[#F28B20]" /> Endereço de Entrega Completo *
                    </label>
                    <input 
                      type="text" 
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                      required 
                      placeholder="Rua, Número, Bairro, Ponto de Referência" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900 text-sm"
                    />
                  </div>
                </div>

                {/* Forma de Pagamento na Entrega */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
                  <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
                    <div>
                      <h3 className="font-black uppercase text-stone-900 text-sm">
                        Como deseja pagar na entrega?
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">O pagamento é feito diretamente ao motoboy</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {/* Opção PIX */}
                    <label 
                      onClick={() => setPaymentMethod('pix')}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'pix'
                          ? 'border-[#F28B20] bg-orange-50/70 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'pix' ? 'border-[#F28B20] bg-white' : 'border-stone-300 bg-white'
                        }`}>
                          {paymentMethod === 'pix' && <div className="w-2.5 h-2.5 rounded-full bg-[#F28B20]" />}
                        </div>
                        <div className={`p-2 rounded-lg ${paymentMethod === 'pix' ? 'bg-[#F28B20] text-white' : 'bg-stone-100 text-stone-600'}`}>
                          <QrCode size={18} />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-stone-900 block">PIX na Entrega</span>
                          <span className="text-xs text-stone-500 font-medium">Chave ou QR Code na chegada do motoboy</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-md uppercase">
                        Rápido
                      </span>
                    </label>

                    {/* Opção Cartão */}
                    <label 
                      onClick={() => setPaymentMethod('cartao')}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'cartao'
                          ? 'border-[#F28B20] bg-orange-50/70 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'cartao' ? 'border-[#F28B20] bg-white' : 'border-stone-300 bg-white'
                        }`}>
                          {paymentMethod === 'cartao' && <div className="w-2.5 h-2.5 rounded-full bg-[#F28B20]" />}
                        </div>
                        <div className={`p-2 rounded-lg ${paymentMethod === 'cartao' ? 'bg-[#F28B20] text-white' : 'bg-stone-100 text-stone-600'}`}>
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-stone-900 block">Cartão (Crédito ou Débito)</span>
                          <span className="text-xs text-stone-500 font-medium">O motoboy leva a maquininha</span>
                        </div>
                      </div>
                    </label>

                    {/* Opção Dinheiro */}
                    <label 
                      onClick={() => setPaymentMethod('dinheiro')}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'dinheiro'
                          ? 'border-[#F28B20] bg-orange-50/70 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'dinheiro' ? 'border-[#F28B20] bg-white' : 'border-stone-300 bg-white'
                        }`}>
                          {paymentMethod === 'dinheiro' && <div className="w-2.5 h-2.5 rounded-full bg-[#F28B20]" />}
                        </div>
                        <div className={`p-2 rounded-lg ${paymentMethod === 'dinheiro' ? 'bg-[#F28B20] text-white' : 'bg-stone-100 text-stone-600'}`}>
                          <Banknote size={18} />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-stone-900 block">Dinheiro</span>
                          <span className="text-xs text-stone-500 font-medium">Pagamento em espécie na entrega</span>
                        </div>
                      </div>
                    </label>

                    {/* Campo de Troco (se dinheiro selecionado) */}
                    {paymentMethod === 'dinheiro' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 bg-stone-50 rounded-xl border border-stone-200 mt-2 space-y-2.5"
                      >
                        <span className="text-xs font-bold text-stone-700 uppercase block">Precisa de troco?</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setChangeOption('none');
                              setChangeFor('');
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                              changeOption === 'none'
                                ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            Não preciso de troco
                          </button>
                          <button
                            type="button"
                            onClick={() => setChangeOption('need')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                              changeOption === 'need'
                                ? 'bg-[#F28B20] text-white border-[#F28B20] shadow-sm'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            Preciso de troco
                          </button>
                        </div>

                        {changeOption === 'need' && (
                          <div className="pt-2">
                            <label className="text-[11px] font-bold text-stone-600 uppercase block mb-1">
                              Troco para quanto em dinheiro?
                            </label>
                            <input 
                              type="text" 
                              value={changeFor}
                              onChange={e => setChangeFor(e.target.value)}
                              placeholder="Ex: 50,00 ou 100,00"
                              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-[#F28B20]"
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Pagamento Online via Stripe (Oculto no momento conforme solicitado) */}
                {SHOW_ONLINE_PAYMENT && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                    <button 
                      type="button"
                      onClick={handleStripePayment}
                      disabled={isProcessingStripe}
                      className="w-full bg-[#4E2A84] text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2"
                    >
                      <CreditCard size={18} /> Pagar Agora com Cartão / Stripe
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Rodapé com botão exclusivo de enviar pelo WhatsApp */}
            <div className="p-4 md:p-6 border-t border-stone-200 bg-white shrink-0">
              <button 
                type="submit"
                form="checkout-form"
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl py-4 px-4 font-black uppercase tracking-wider shadow-lg hover:shadow-green-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg cursor-pointer"
              >
                <MessageCircle size={24} className="shrink-0" />
                <span>Enviar Pedido pelo WhatsApp</span>
              </button>
              <p className="text-center text-[11px] text-stone-500 mt-2 font-medium">
                Você será redirecionado para o WhatsApp com o pedido pronto e formatado!
              </p>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
