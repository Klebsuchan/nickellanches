import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Smartphone, 
  MapPin, 
  CreditCard, 
  QrCode, 
  Banknote, 
  User as UserIcon, 
  AlertCircle, 
  MessageCircle,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Wallet,
  Receipt,
  FileCheck,
  Upload,
  Image as ImageIcon,
  Trash2,
  Lock,
  Clock
} from 'lucide-react';
import { CartItem } from '../types';
import { PaymentSettings, subscribeToPaymentSettings, DEFAULT_PAYMENT_SETTINGS } from '../lib/db';
import { generatePixPayload, generatePixQRCode } from '../lib/pix';
import { useToast } from './Toast';
import { playSound } from '../lib/audio';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  discountAmount?: number;
  onConfirm: (details: any) => void;
}

export default function CheckoutModal({ isOpen, onClose, cart, total, discountAmount = 0, onConfirm }: CheckoutModalProps) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState<'petropolis' | 'cidade' | 'afastado' | ''>('');
  
  // Métodos de pagamento: PIX online, Cartão de Crédito Online, Cartão de Débito Online, Maquininha na entrega (crédito ou débito), PIX na entrega, Dinheiro
  const [paymentMethod, setPaymentMethod] = useState<
    'pix_online' | 'credit_online' | 'debit_online' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'dinheiro' | 'fiado'
  >('pix_online');

  const [changeOption, setChangeOption] = useState<'none' | 'need'>('none');
  const [changeFor, setChangeFor] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showFiadoPrank, setShowFiadoPrank] = useState(false);
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);

  // Protocolo e Comprovante de Pagamento
  const [authCode] = useState(() => 'AUT-NKL-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [receiptNotes, setReceiptNotes] = useState('');

  // Configurações de pagamento dinâmicas do proprietário (Firestore)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  
  // PIX Dinâmico com o valor exato
  const [pixPayload, setPixPayload] = useState('');
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const { addToast } = useToast();

  // Escuta configurações de pagamento do banco de dados
  useEffect(() => {
    const unsub = subscribeToPaymentSettings((newSettings) => {
      const merged: PaymentSettings = {
        ...DEFAULT_PAYMENT_SETTINGS,
        ...newSettings,
        cardOnline: {
          ...DEFAULT_PAYMENT_SETTINGS.cardOnline,
          ...(newSettings.cardOnline || {})
        }
      };
      setPaymentSettings(merged);
      
      // Se pagamentos online não estiverem habilitados, default para pagamento na entrega
      if (!merged.onlinePaymentsEnabled || (!merged.pix.enabled && !merged.cardOnline.enabled)) {
        setPaymentMethod(prev => (prev === 'pix_online' || prev === 'credit_online' || prev === 'debit_online' ? 'pix' : prev));
      }
    });
    return () => unsub();
  }, []);

  // Cálculo da taxa de frete e valor total exato
  let deliveryFee = 0;
  let regionLabel = '';
  if (region === 'petropolis') {
    deliveryFee = 10;
    regionLabel = 'Petrópolis';
  } else if (region === 'cidade') {
    deliveryFee = 15;
    regionLabel = 'Outros bairros (Cidade)';
  } else if (region === 'afastado') {
    deliveryFee = 20;
    regionLabel = 'Fora do trevo (Afastado)';
  }
  const currentFinalTotal = total + deliveryFee;

  // Atualiza o QR Code e Payload PIX oficial sempre que o total ou as configurações mudarem
  useEffect(() => {
    if (!paymentSettings.pix.key) {
      setPixPayload('');
      setPixQrCodeUrl('');
      return;
    }

    const payload = generatePixPayload({
      key: paymentSettings.pix.key,
      merchantName: paymentSettings.pix.merchantName || 'NICKEL LANCHES',
      merchantCity: paymentSettings.pix.merchantCity || 'PASSO FUNDO',
      amount: currentFinalTotal,
      txid: 'NICKEL'
    });

    setPixPayload(payload);

    if (payload) {
      generatePixQRCode(payload).then(url => setPixQrCodeUrl(url));
    }
  }, [paymentSettings.pix, currentFinalTotal]);

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
    if (!region) {
      setErrorMessage('Por favor, selecione sua região para o cálculo do frete.');
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

  const handleCopy = (text: string, type: 'code' | 'key') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    playSound('coin');
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
      addToast({ message: 'Código PIX Copia e Cola copiado!', type: 'success' });
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
      addToast({ message: 'Chave PIX copiada!', type: 'success' });
    }
  };

  const handleOpenCardPaymentLink = () => {
    const link = paymentSettings.cardOnline.paymentLinkUrl;
    if (link) {
      window.open(link, '_blank');
    } else {
      addToast({
        message: 'Link de cartão direto: ao enviar o pedido pelo WhatsApp, o link seguro será fornecido!',
        type: 'info'
      });
    }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        addToast({ message: 'O arquivo deve ter no máximo 8MB', type: 'error' });
        return;
      }
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptPreviewUrl(reader.result as string);
        addToast({ message: 'Comprovante anexado! Será encaminhado junto com o pedido.', type: 'success' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFileName('');
    setReceiptPreviewUrl(null);
  };

  const handleWhatsAppCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    let finalPaymentLabel = '';
    let formattedChange = '';
    let isOnline = false;

    if (paymentMethod === 'pix_online') {
      finalPaymentLabel = `PIX Imediato Online (Valor Exato R$ ${currentFinalTotal.toFixed(2).replace('.', ',')})`;
      isOnline = true;
    } else if (paymentMethod === 'credit_online') {
      finalPaymentLabel = `Cartão de Crédito Online (R$ ${currentFinalTotal.toFixed(2).replace('.', ',')})`;
      isOnline = true;
    } else if (paymentMethod === 'debit_online') {
      finalPaymentLabel = `Cartão de Débito Online (R$ ${currentFinalTotal.toFixed(2).replace('.', ',')})`;
      isOnline = true;
    } else if (paymentMethod === 'cartao_credito') {
      finalPaymentLabel = 'Cartão de Crédito (Maquininha na entrega)';
    } else if (paymentMethod === 'cartao_debito') {
      finalPaymentLabel = 'Cartão de Débito (Maquininha na entrega)';
    } else if (paymentMethod === 'pix') {
      finalPaymentLabel = 'PIX na Entrega (Chave ou QR Code ao Motoboy)';
    } else if (paymentMethod === 'dinheiro') {
      if (changeOption === 'need' && changeFor.trim()) {
        finalPaymentLabel = `Dinheiro (Troco para R$ ${changeFor.trim()})`;
        formattedChange = changeFor.trim();
      } else {
        finalPaymentLabel = 'Dinheiro (Não precisa de troco)';
      }
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const receiptTimestamp = `${formattedDate} às ${formattedTime}`;

    const orderPayload = { 
      name: name.trim(), 
      whatsapp: whatsapp.trim(), 
      address: address.trim(), 
      paymentMethod: finalPaymentLabel,
      changeFor: formattedChange,
      region: regionLabel,
      deliveryFee: deliveryFee,
      isOnlinePayment: isOnline,
      pixKey: paymentSettings.pix.key,
      totalToPay: currentFinalTotal,
      receiptAuthCode: authCode,
      receiptTimestamp: receiptTimestamp,
      receiptFileName: receiptFileName || undefined,
      receiptFilePreview: receiptPreviewUrl || undefined,
      receiptNotes: receiptNotes.trim() || undefined
    };

    // Se o pagamento for Cartão Online (Crédito ou Débito), processa pelo Stripe Checkout
    if (paymentMethod === 'credit_online' || paymentMethod === 'debit_online') {
      setIsProcessingStripe(true);
      setErrorMessage('');

      // Salva os dados do pedido no localStorage para restaurar e confirmar assim que retornar do Stripe
      try {
        const pendingData = {
          orderPayload,
          cart,
          total,
          discountAmount,
          authCode,
          timestamp: Date.now()
        };
        sessionStorage.setItem('nickel_pending_stripe_order', JSON.stringify(pendingData));
        localStorage.setItem('nickel_pending_stripe_order', JSON.stringify(pendingData));

        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart,
            orderDetails: orderPayload,
            discountAmount: discountAmount
          })
        });

        const data = await response.json();

        if (response.ok && data.url) {
          addToast({
            title: 'Redirecionando...',
            message: 'Abrindo o ambiente seguro do Stripe para pagamento no cartão.',
            type: 'info'
          });
          // Redireciona o usuário para o checkout do Stripe
          window.location.href = data.url;
          return;
        } else {
          setIsProcessingStripe(false);
          const errorMsg = data.error || 'Não foi possível iniciar o Stripe Checkout. Verifique a conexão ou a chave do Stripe.';
          setErrorMessage(errorMsg);
          addToast({
            title: 'Atenção com o Pagamento Online',
            message: errorMsg,
            type: 'error'
          });
          return;
        }
      } catch (err: any) {
        setIsProcessingStripe(false);
        const errDesc = 'Erro de comunicação ao conectar com o Stripe. Tente novamente ou selecione outro método.';
        setErrorMessage(errDesc);
        addToast({
          title: 'Erro de Pagamento',
          message: errDesc,
          type: 'error'
        });
        return;
      }
    }

    onConfirm(orderPayload);
  };

  const showOnlineSection = paymentSettings.onlinePaymentsEnabled && (
    paymentSettings.pix.enabled || 
    (paymentSettings.cardOnline.enabled && (paymentSettings.cardOnline.acceptCredit || paymentSettings.cardOnline.acceptDebit))
  );

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
                <p className="text-xs text-stone-500 font-medium">Confirme seus dados e a forma de pagamento</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              <form id="checkout-form" onSubmit={handleWhatsAppCheckout} className="space-y-5">
                
                {/* Resumo do Pedido com Valores */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
                    <h3 className="font-black uppercase text-stone-900 text-sm">
                      Resumo do Pedido
                    </h3>
                    <span className="text-xs text-stone-500 font-bold">
                      {cart.reduce((s, i) => s + i.quantity, 0)} itens
                    </span>
                  </div>

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

                  {/* Detalhamento Financeiro */}
                  <div className="border-t border-stone-100 pt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-600 font-semibold">
                      <span>Subtotal dos Lanches:</span>
                      <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>

                    <div className="flex justify-between text-stone-600 font-semibold">
                      <span>Taxa de Entrega {regionLabel ? `(${regionLabel})` : ''}:</span>
                      {region ? (
                        <span className="text-[#F28B20] font-bold">+ R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
                      ) : (
                        <span className="text-amber-600 font-bold italic">Selecione a região abaixo</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-stone-200">
                      <div>
                        <span className="font-black text-stone-900 uppercase text-sm block">Total a Pagar:</span>
                        <span className="text-[11px] text-stone-400 font-medium">Lanches + Taxa de Entrega</span>
                      </div>
                      <span className="font-black text-2xl text-[#F28B20]">
                        R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dados do Cliente e Região */}
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

                  <div className="pt-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5 uppercase">
                      <MapPin size={15} className="text-[#F28B20]" /> Região de Entrega (Cálculo de Frete) *
                    </label>
                    <div className="space-y-2">
                      <label className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${region === 'petropolis' ? 'border-[#F28B20] bg-orange-50/70 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="region" checked={region === 'petropolis'} onChange={() => setRegion('petropolis')} className="hidden" />
                          <span className="font-bold text-sm text-stone-900">Petrópolis</span>
                        </div>
                        <span className="font-bold text-sm text-[#F28B20]">+ R$ 10,00</span>
                      </label>
                      <label className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${region === 'cidade' ? 'border-[#F28B20] bg-orange-50/70 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="region" checked={region === 'cidade'} onChange={() => setRegion('cidade')} className="hidden" />
                          <span className="font-bold text-sm text-stone-900">Outros bairros (Cidade)</span>
                        </div>
                        <span className="font-bold text-sm text-[#F28B20]">+ R$ 15,00</span>
                      </label>
                      <label className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${region === 'afastado' ? 'border-[#F28B20] bg-orange-50/70 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="region" checked={region === 'afastado'} onChange={() => setRegion('afastado')} className="hidden" />
                          <span className="font-bold text-sm text-stone-900">Fora do trevo (Afastado)</span>
                        </div>
                        <span className="font-bold text-sm text-[#F28B20]">+ R$ 20,00</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* FORMA DE PAGAMENTO */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <div className="border-b border-stone-100 pb-2">
                    <h3 className="font-black uppercase text-stone-900 text-sm">
                      Forma de Pagamento
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">Escolha como prefere pagar o seu pedido</p>
                  </div>

                  {/* 1. SEÇÃO DE PAGAMENTOS ONLINE / ANTECIPADO */}
                  {showOnlineSection && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-stone-700 uppercase tracking-wider">
                        <Sparkles size={14} className="text-[#F28B20]" />
                        <span>Pagar Agora (Online / Antecipado)</span>
                        <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
                          Cai Direto na Conta
                        </span>
                      </div>

                      {/* Opção PIX ONLINE */}
                      {paymentSettings.pix.enabled && (
                        <div className="space-y-2">
                          <label 
                            onClick={() => setPaymentMethod('pix_online')}
                            className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                              paymentMethod === 'pix_online'
                                ? 'border-[#F28B20] bg-orange-50/70 shadow-sm'
                                : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                paymentMethod === 'pix_online' ? 'border-[#F28B20] bg-white' : 'border-stone-300 bg-white'
                              }`}>
                                {paymentMethod === 'pix_online' && <div className="w-2.5 h-2.5 rounded-full bg-[#F28B20]" />}
                              </div>
                              <div className={`p-2 rounded-lg ${paymentMethod === 'pix_online' ? 'bg-[#F28B20] text-white' : 'bg-green-100 text-green-700'}`}>
                                <QrCode size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-stone-900 block">PIX Imediato</span>
                                  <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-md uppercase">
                                    Cai na Hora
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500 font-medium">QR Code e Copia e Cola no valor exato</span>
                              </div>
                            </div>
                            <span className="font-black text-sm text-[#F28B20]">
                              R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                            </span>
                          </label>

                          {/* Bloco expandido do PIX ONLINE */}
                          {paymentMethod === 'pix_online' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 space-y-4"
                            >
                              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-orange-100">
                                <div>
                                  <span className="text-xs text-stone-500 font-bold uppercase block">Valor Exato a Pagar</span>
                                  <span className="text-2xl font-black text-stone-900">
                                    R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                                <div className="text-right text-xs">
                                  <span className="text-stone-500 font-medium block">Beneficiário:</span>
                                  <span className="font-bold text-stone-900">{paymentSettings.pix.merchantName || 'NICKEL LANCHES'}</span>
                                </div>
                              </div>

                              {/* QR Code */}
                              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-stone-200 text-center">
                                {pixQrCodeUrl ? (
                                  <img 
                                    src={pixQrCodeUrl} 
                                    alt="QR Code PIX com valor do pedido" 
                                    className="w-48 h-48 object-contain rounded-lg"
                                  />
                                ) : (
                                  <div className="w-48 h-48 flex items-center justify-center text-xs text-stone-400">
                                    Gerando QR Code...
                                  </div>
                                )}
                                <p className="text-[11px] text-stone-500 font-medium mt-1">
                                  Abra o app do seu banco e aponte a câmera para pagar
                                </p>
                              </div>

                              {/* Código Copia e Cola */}
                              <div>
                                <label className="text-xs font-bold text-stone-700 uppercase block mb-1">
                                  PIX Copia e Cola (com valor de R$ {currentFinalTotal.toFixed(2).replace('.', ',')})
                                </label>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    readOnly 
                                    value={pixPayload} 
                                    className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-stone-600 select-all outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(pixPayload, 'code')}
                                    className="bg-[#F28B20] hover:bg-[#d97a1c] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm"
                                  >
                                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                                    <span>{copiedCode ? 'Copiado!' : 'Copiar Código'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Chave PIX Avulsa */}
                              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-200 text-xs">
                                <div>
                                  <span className="text-stone-500 font-bold uppercase block text-[10px]">Chave PIX da Lanchonete</span>
                                  <span className="font-bold text-stone-900 text-sm">{paymentSettings.pix.key}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(paymentSettings.pix.key, 'key')}
                                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  {copiedKey ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                                  <span>{copiedKey ? 'Copiada' : 'Copiar Chave'}</span>
                                </button>
                              </div>

                              {/* Instrução */}
                              <div className="p-3 bg-white/80 rounded-xl border border-orange-100 text-xs text-stone-600 space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-stone-900">
                                  <ShieldCheck size={15} className="text-green-600" />
                                  <span>Como confirmar?</span>
                                </div>
                                <p className="text-[11px] leading-relaxed">
                                  {paymentSettings.pix.instructions || 'Faça o PIX no valor exato do seu pedido. Ao clicar no botão abaixo, envie o pedido pelo WhatsApp e anexe o comprovante na conversa para agilizar a preparação!'}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* Opção CARTÃO DE CRÉDITO ONLINE */}
                      {paymentSettings.cardOnline.enabled && paymentSettings.cardOnline.acceptCredit && (
                        <div className="space-y-2">
                          <label 
                            onClick={() => setPaymentMethod('credit_online')}
                            className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                              paymentMethod === 'credit_online'
                                ? 'border-purple-500 bg-purple-50/70 shadow-sm'
                                : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                paymentMethod === 'credit_online' ? 'border-purple-600 bg-white' : 'border-stone-300 bg-white'
                              }`}>
                                {paymentMethod === 'credit_online' && <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                              </div>
                              <div className={`p-2 rounded-lg ${paymentMethod === 'credit_online' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'}`}>
                                <CreditCard size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-stone-900 block">Cartão de Crédito Online</span>
                                  <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md uppercase">
                                    Crédito
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500 font-medium">Pague pelo link seguro da lanchonete</span>
                              </div>
                            </div>
                            <span className="font-black text-sm text-purple-700">
                              R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                            </span>
                          </label>

                          {paymentMethod === 'credit_online' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-3"
                            >
                              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-purple-100">
                                <div>
                                  <span className="text-xs text-stone-500 font-bold uppercase block">Valor a pagar no Crédito</span>
                                  <span className="text-xl font-black text-stone-900">
                                    R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                                <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full uppercase">
                                  Stripe Checkout Oficial
                                </span>
                              </div>

                              <div className="text-xs text-stone-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-purple-100 flex items-start gap-2.5">
                                <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold text-stone-800">Checkout Criptografado & Seguro</p>
                                  <p className="text-[11px] text-stone-500 mt-0.5">
                                    Ao clicar em &quot;Pagar com Cartão no Stripe&quot;, você preenche seus dados com total segurança bancária e retorna automaticamente com o pedido confirmado direto para o minigame do cachorrinho!
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* Opção CARTÃO DE DÉBITO ONLINE */}
                      {paymentSettings.cardOnline.enabled && paymentSettings.cardOnline.acceptDebit && (
                        <div className="space-y-2">
                          <label 
                            onClick={() => setPaymentMethod('debit_online')}
                            className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                              paymentMethod === 'debit_online'
                                ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                                : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                paymentMethod === 'debit_online' ? 'border-blue-600 bg-white' : 'border-stone-300 bg-white'
                              }`}>
                                {paymentMethod === 'debit_online' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                              </div>
                              <div className={`p-2 rounded-lg ${paymentMethod === 'debit_online' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                                <CreditCard size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-stone-900 block">Cartão de Débito Online</span>
                                  <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md uppercase">
                                    Débito Stripe
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500 font-medium">Debita da sua conta com segurança Stripe</span>
                              </div>
                            </div>
                            <span className="font-black text-sm text-blue-700">
                              R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                            </span>
                          </label>

                          {paymentMethod === 'debit_online' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3"
                            >
                              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-100">
                                <div>
                                  <span className="text-xs text-stone-500 font-bold uppercase block">Valor a debitar</span>
                                  <span className="text-xl font-black text-stone-900">
                                    R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                                <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full uppercase">
                                  Stripe Checkout Oficial
                                </span>
                              </div>

                              <div className="text-xs text-stone-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-blue-100 flex items-start gap-2.5">
                                <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold text-stone-800">Checkout Criptografado & Seguro</p>
                                  <p className="text-[11px] text-stone-500 mt-0.5">
                                    Processamento com certificação PCI pelo Stripe. Seu pedido será confirmado assim que o pagamento for concluído!
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. SEÇÃO DE PAGAMENTO NA ENTREGA (AO MOTOBOY) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-xs font-black text-stone-700 uppercase tracking-wider">
                      <span>🛵 Pagar na Entrega (ao Motoboy)</span>
                    </div>

                    {/* Cartão de Crédito na Entrega */}
                    <label 
                      onClick={() => setPaymentMethod('cartao_credito')}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'cartao_credito'
                          ? 'border-[#F28B20] bg-orange-50/70 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'cartao_credito' ? 'border-[#F28B20] bg-white' : 'border-stone-300 bg-white'
                        }`}>
                          {paymentMethod === 'cartao_credito' && <div className="w-2.5 h-2.5 rounded-full bg-[#F28B20]" />}
                        </div>
                        <div className={`p-2 rounded-lg ${paymentMethod === 'cartao_credito' ? 'bg-[#F28B20] text-white' : 'bg-stone-100 text-stone-600'}`}>
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-stone-900 block">Cartão de Crédito na Entrega</span>
                          <span className="text-xs text-stone-500 font-medium">O motoboy leva a maquininha na função Crédito</span>
                        </div>
                      </div>
                    </label>

                    {/* Cartão de Débito na Entrega */}
                    <label 
                      onClick={() => setPaymentMethod('cartao_debito')}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'cartao_debito'
                          ? 'border-[#F28B20] bg-orange-50/70 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'cartao_debito' ? 'border-[#F28B20] bg-white' : 'border-stone-300 bg-white'
                        }`}>
                          {paymentMethod === 'cartao_debito' && <div className="w-2.5 h-2.5 rounded-full bg-[#F28B20]" />}
                        </div>
                        <div className={`p-2 rounded-lg ${paymentMethod === 'cartao_debito' ? 'bg-[#F28B20] text-white' : 'bg-stone-100 text-stone-600'}`}>
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-stone-900 block">Cartão de Débito na Entrega</span>
                          <span className="text-xs text-stone-500 font-medium">O motoboy leva a maquininha na função Débito</span>
                        </div>
                      </div>
                    </label>

                    {/* PIX na Entrega */}
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
                          <span className="text-xs text-stone-500 font-medium">Pagar via PIX com o motoboy na entrega</span>
                        </div>
                      </div>
                    </label>

                    {/* Dinheiro */}
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
                          <span className="font-bold text-sm text-stone-900 block">Dinheiro em Espécie</span>
                          <span className="text-xs text-stone-500 font-medium">Pagamento em cédulas na entrega</span>
                        </div>
                      </div>
                    </label>

                    {/* Troco */}
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
                              placeholder={`Ex: ${(Math.ceil(currentFinalTotal / 10) * 10 + 10).toFixed(2).replace('.', ',')}`}
                              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-[#F28B20]"
                            />
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Fiado Prank */}
                    <label 
                      onClick={() => setShowFiadoPrank(true)}
                      className="flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all border-stone-200 hover:border-stone-300 bg-stone-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-stone-300 bg-white" />
                        <div className="p-2 rounded-lg bg-stone-100 text-stone-600">
                          <UserIcon size={18} />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-stone-900 block">Fiado (Só para os de verdade)</span>
                          <span className="text-xs text-stone-500 font-medium">Anota na minha conta e depois eu pago</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Seção Exclusiva: COMPROVANTE OFICIAL DE PAGAMENTO AUTOMÁTICO */}
                <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-purple-500/10 rounded-2xl p-4 md:p-5 border-2 border-amber-500/30 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                        <Receipt size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm md:text-base text-stone-900 uppercase tracking-tight">
                            Comprovante de Pagamento
                          </h4>
                          <span className="text-[10px] font-black uppercase tracking-wider bg-green-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Check size={10} /> Automático
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 font-medium">
                          Encaminhado automaticamente para o WhatsApp com os dados do pedido.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cartão de Autenticação do Comprovante */}
                  <div className="bg-white rounded-xl p-3.5 border border-stone-200 shadow-sm space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-stone-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Protocolo de Autenticação</span>
                        <span className="font-mono font-bold text-stone-900 text-xs flex items-center gap-1 text-[#4E2A84]">
                          <Lock size={12} className="text-amber-500" /> {authCode}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Destinatário / Favorecido</span>
                        <span className="font-bold text-stone-900 text-xs truncate block">
                          Nickel Lanches Passo Fundo
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Valor Quitado / Final</span>
                        <span className="font-black text-stone-900 text-sm text-[#F28B20]">
                          R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Status da Transação</span>
                        <span className="font-bold text-green-700 text-xs flex items-center gap-1">
                          <FileCheck size={13} className="text-green-600 shrink-0" /> Pronto p/ envio
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Anexar Print ou Foto do Comprovante do Banco (Opcional) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5 uppercase">
                        <Upload size={14} className="text-[#F28B20]" />
                        <span>Anexar Comprovante do Banco (Opcional)</span>
                      </label>
                      <span className="text-[10px] text-stone-500 font-medium">Print ou PDF do app</span>
                    </div>

                    {!receiptPreviewUrl ? (
                      <label className="border-2 border-dashed border-stone-300 hover:border-[#F28B20] bg-white rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                        <input 
                          type="file" 
                          accept="image/*,application/pdf" 
                          onChange={handleReceiptFileChange}
                          className="hidden" 
                        />
                        <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-orange-50 flex items-center justify-center text-stone-500 group-hover:text-[#F28B20] transition-colors mb-1.5">
                          <ImageIcon size={18} />
                        </div>
                        <span className="text-xs font-bold text-stone-700 group-hover:text-[#F28B20]">
                          Clique para selecionar foto ou print do comprovante
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium mt-0.5">
                          PNG, JPG ou PDF (Até 8MB)
                        </span>
                      </label>
                    ) : (
                      <div className="bg-white rounded-xl p-3 border border-stone-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={receiptPreviewUrl} 
                            alt="Prévia do Comprovante" 
                            className="w-12 h-12 object-cover rounded-lg border border-stone-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-stone-900 block truncate">
                              {receiptFileName}
                            </span>
                            <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                              <Check size={12} /> Comprovante vinculado com sucesso
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveReceipt}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Remover comprovante"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Campo de Observação opcional do comprovante */}
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">
                      Observação do Comprovante (Opcional)
                    </label>
                    <input 
                      type="text" 
                      value={receiptNotes}
                      onChange={e => setReceiptNotes(e.target.value)}
                      placeholder="Ex: Pago via Nubank em nome de Carlos Silva"
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#F28B20] text-stone-800"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Rodapé com botão de confirmação */}
            <div className="p-4 md:p-6 border-t border-stone-200 bg-white shrink-0">
              <button 
                type="submit"
                form="checkout-form"
                disabled={isProcessingStripe}
                className={`w-full ${
                  paymentMethod === 'credit_online' || paymentMethod === 'debit_online'
                    ? 'bg-purple-700 hover:bg-purple-800'
                    : 'bg-[#4E2A84] hover:bg-[#3D1F6B]'
                } disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl py-4 px-4 font-black uppercase tracking-wider shadow-lg hover:shadow-purple-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg cursor-pointer`}
              >
                {isProcessingStripe ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Conectando ao Stripe...</span>
                  </>
                ) : (paymentMethod === 'credit_online' || paymentMethod === 'debit_online') ? (
                  <>
                    <CreditCard size={22} className="shrink-0 text-amber-300" />
                    <span>Pagar com Cartão no Stripe (R$ {currentFinalTotal.toFixed(2).replace('.', ',')})</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={24} className="shrink-0 text-amber-300" />
                    <span>Confirmar Pedido & Jogar Minigame</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-stone-500 mt-2 font-medium">
                {(paymentMethod === 'credit_online' || paymentMethod === 'debit_online')
                  ? 'Você será direcionado para o Stripe para inserir os dados do cartão com segurança e, ao concluir, voltará direto para o minigame!'
                  : 'Você confirmará seu pedido, poderá se divertir no joguinho do cachorrinho e, ao sair dele, o pedido e o comprovante serão encaminhados para o WhatsApp!'}
              </p>
            </div>

          </motion.div>
        </div>
      )}
      
      {/* Prank Modal Fiado */}
      {showFiadoPrank && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFiadoPrank(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl relative z-10 p-6 flex flex-col items-center text-center overflow-hidden"
          >
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🤡</span>
            </div>
            <h3 className="text-2xl font-black text-stone-900 uppercase mb-2">Acreditou mesmo? kkkk</h3>
            <p className="text-stone-600 font-medium mb-6">
              Aqui fiado só amanhã! Escolhe outra forma de pagamento aí, espertinho(a).
            </p>
            <button 
              onClick={() => setShowFiadoPrank(false)}
              className="w-full bg-[#F28B20] text-white rounded-xl py-3 font-bold uppercase tracking-wider shadow-lg hover:bg-[#d97a1c] transition-all active:scale-95 cursor-pointer"
            >
              Tá bom, parei
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
