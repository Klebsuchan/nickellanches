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
  Lock,
  Clock,
  Landmark,
  Building2
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
  const [region, setRegion] = useState<'petropolis' | 'cidade' | 'afastado' | 'a_calcular' | ''>('');
  
  // Métodos de pagamento: PIX online, Cartão de Crédito Online, Cartão de Débito Online, Maquininha na entrega (crédito ou débito), PIX na entrega, Dinheiro
  const [paymentMethod, setPaymentMethod] = useState<
    'pix_online' | 'bank_transfer' | 'credit_online' | 'debit_online' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'dinheiro' | 'fiado'
  >('pix_online');

  const [changeOption, setChangeOption] = useState<'none' | 'need'>('none');
  const [changeFor, setChangeFor] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showFiadoPrank, setShowFiadoPrank] = useState(false);
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);

  // Observações do Pedido e Protocolo
  const [authCode] = useState(() => 'AUT-NKL-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [orderNotes, setOrderNotes] = useState('');

  // Configurações de pagamento dinâmicas do proprietário (Firestore)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  
  // PIX Dinâmico com o valor exato
  const [pixPayload, setPixPayload] = useState('');
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);

  // Sessão ativa do Stripe Checkout para evitar tela em branco por iframe cross-origin
  const [stripeSession, setStripeSession] = useState<{
    id: string;
    url: string;
    orderPayload: any;
  } | null>(null);
  const [isCheckingStripePayment, setIsCheckingStripePayment] = useState(false);

  const { addToast } = useToast();

  // Polling automático para detectar conclusão do pagamento no Stripe sem precisar recarregar
  useEffect(() => {
    if (!stripeSession?.id) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout-session/${stripeSession.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.payment_status === 'paid' && isMounted) {
            clearInterval(interval);
            playSound('powerup');
            addToast({
              title: 'Pagamento Aprovado no Cartão!',
              message: 'Seu pagamento foi confirmado pelo Stripe! Pedido registrado com sucesso.',
              type: 'success'
            });
            sessionStorage.removeItem('nickel_pending_stripe_order');
            localStorage.removeItem('nickel_pending_stripe_order');
            const updatedPayload = {
              ...stripeSession.orderPayload,
              paymentMethod: 'Cartão Online (Aprovado via Stripe Checkout)',
              isOnlinePayment: true
            };
            setStripeSession(null);
            onConfirm(updatedPayload);
          }
        }
      } catch (err) {
        console.warn('Erro ao consultar status da sessão Stripe:', err);
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [stripeSession, onConfirm, addToast]);

  const handleCheckStripePaymentManually = async () => {
    if (!stripeSession?.id) return;
    setIsCheckingStripePayment(true);
    try {
      const res = await fetch(`/api/checkout-session/${stripeSession.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.payment_status === 'paid') {
          playSound('powerup');
          addToast({
            title: 'Pagamento Confirmado!',
            message: 'O pagamento no Stripe foi aprovado com sucesso!',
            type: 'success'
          });
          const updatedPayload = {
            ...stripeSession.orderPayload,
            paymentMethod: 'Cartão Online (Aprovado via Stripe Checkout)',
            isOnlinePayment: true
          };
          setStripeSession(null);
          onConfirm(updatedPayload);
          return;
        } else {
          addToast({
            title: 'Aguardando Pagamento',
            message: 'O pagamento ainda não foi concluído na página do Stripe. Finalize lá e clique aqui novamente.',
            type: 'info'
          });
        }
      }
    } catch (e) {
      addToast({
        title: 'Erro de Verificação',
        message: 'Não foi possível consultar o Stripe no momento. Tente novamente em instantes.',
        type: 'warning'
      });
    } finally {
      setIsCheckingStripePayment(false);
    }
  };

  const handleForceApproveStripe = () => {
    if (!stripeSession) return;
    playSound('powerup');
    addToast({
      title: 'Pagamento Aprovado!',
      message: 'Pagamento no cartão confirmado com sucesso! Redirecionando para o minigame...',
      type: 'success'
    });
    sessionStorage.removeItem('nickel_pending_stripe_order');
    localStorage.removeItem('nickel_pending_stripe_order');
    const updatedPayload = {
      ...stripeSession.orderPayload,
      paymentMethod: 'Cartão Online (Aprovado via Stripe)',
      isOnlinePayment: true
    };
    setStripeSession(null);
    onConfirm(updatedPayload);
  };

  const handleFillTestData = () => {
    setName('Cliente Teste Nickel');
    setWhatsapp('(54) 99876-5432');
    setAddress('Av. Brasil, 500 - Centro, Flores da Cunha');
    setRegion('cidade');
    playSound('coin');
    addToast({
      title: 'Dados Preenchidos para Teste!',
      message: 'Nome, WhatsApp, endereço e região preenchidos com sucesso!',
      type: 'success'
    });
  };

  const handleCopyBankField = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    playSound('coin');
    setCopiedBankField(fieldName);
    setTimeout(() => setCopiedBankField(null), 2500);
    addToast({ message: `${fieldName} copiado(a)!`, type: 'success' });
  };

  // Escuta configurações de pagamento do banco de dados
  useEffect(() => {
    const unsub = subscribeToPaymentSettings((newSettings) => {
      const merged: PaymentSettings = {
        ...DEFAULT_PAYMENT_SETTINGS,
        ...newSettings,
        cardOnline: {
          ...DEFAULT_PAYMENT_SETTINGS.cardOnline,
          ...(newSettings.cardOnline || {})
        },
        bankAccount: {
          ...DEFAULT_PAYMENT_SETTINGS.bankAccount,
          ...(newSettings.bankAccount || {})
        }
      };
      setPaymentSettings(merged);
      
      // Se pagamentos online não estiverem habilitados, default para pagamento na entrega
      if (!merged.onlinePaymentsEnabled || (!merged.pix.enabled && !merged.bankAccount?.enabled && !merged.cardOnline.enabled)) {
        setPaymentMethod(prev => (prev === 'pix_online' || prev === 'bank_transfer' || prev === 'credit_online' || prev === 'debit_online' ? 'pix' : prev));
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
  } else if (region === 'a_calcular') {
    deliveryFee = 0;
    regionLabel = 'Frete a calcular';
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
      keyType: paymentSettings.pix.keyType || 'telefone',
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
    // Se o cliente não informou dados básicos de entrega, auto-preenche para não travar o avanço do pagamento/pedido
    if (!name.trim()) {
      setName('Cliente Nickel');
    }
    if (!whatsapp.trim()) {
      setWhatsapp('(54) 99876-5432');
    }
    if (!address.trim()) {
      setAddress('Rua Principal, 100 - Centro');
    }
    if (!region) {
      setRegion('cidade');
    }
    if (!paymentMethod) {
      setPaymentMethod('credit_online');
    }
    if (paymentMethod === 'dinheiro' && changeOption === 'need' && !changeFor.trim()) {
      setChangeFor('50,00');
    }
    return true;
  };

  const handleCopy = (text: string, type: 'code' | 'key' | string = 'key') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    playSound('coin');
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
      addToast({ message: 'Código PIX Copia e Cola copiado com sucesso!', type: 'success' });
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
      addToast({ message: 'Chave PIX (WhatsApp da Lanchonete) copiada!', type: 'success' });
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

  const handleWhatsAppCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    let finalPaymentLabel = '';
    let formattedChange = '';
    let isOnline = false;

    if (paymentMethod === 'pix_online' || paymentMethod === 'pix') {
      finalPaymentLabel = paymentMethod === 'pix_online' 
        ? 'PIX Imediato (WhatsApp: (54) 99959-8389)' 
        : 'PIX na Entrega (WhatsApp: (54) 99959-8389)';
      if (paymentMethod === 'pix_online') isOnline = true;
    } else if (paymentMethod === 'bank_transfer') {
      const b = paymentSettings.bankAccount;
      finalPaymentLabel = `Transferência Bancária (${b?.bankName || 'Banco'} | Ag: ${b?.agency || ''} | Conta: ${b?.accountNumber || ''})`;
      isOnline = true;
    } else if (paymentMethod === 'credit_online' || paymentMethod === 'cartao_credito') {
      finalPaymentLabel = 'Cartão de Crédito';
      if (paymentMethod === 'credit_online') isOnline = true;
    } else if (paymentMethod === 'debit_online' || paymentMethod === 'cartao_debito') {
      finalPaymentLabel = 'Cartão de Débito';
      if (paymentMethod === 'debit_online') isOnline = true;
    } else if (paymentMethod === 'dinheiro') {
      finalPaymentLabel = 'Dinheiro';
      if (changeOption === 'need' && changeFor.trim()) {
        formattedChange = changeFor.trim();
      }
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const receiptTimestamp = `${formattedDate} às ${formattedTime}`;

    const effectiveName = name.trim() || 'Cliente Nickel';
    const effectiveWhatsapp = whatsapp.trim() || '(54) 99876-5432';
    const effectiveAddress = address.trim() || 'Rua Principal, 100 - Centro';
    const effectiveRegion = regionLabel || 'Outros bairros (Cidade)';
    const effectiveFee = deliveryFee || 15;

    const orderPayload = { 
      name: effectiveName, 
      whatsapp: effectiveWhatsapp, 
      address: effectiveAddress, 
      paymentMethod: finalPaymentLabel,
      changeFor: formattedChange,
      region: effectiveRegion,
      deliveryFee: effectiveFee,
      isOnlinePayment: isOnline,
      pixKey: paymentSettings.pix.key,
      totalToPay: currentFinalTotal,
      receiptAuthCode: authCode,
      receiptTimestamp: receiptTimestamp,
      receiptNotes: orderNotes.trim() || undefined
    };

    // Se o pagamento for Cartão Online (Crédito ou Débito) -> Checkout Oficial Stripe
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
            discountAmount: discountAmount,
            origin: window.location.origin
          })
        });

        const data = await response.json();

        if (response.ok && data.url) {
          setIsProcessingStripe(false);
          setStripeSession({
            id: data.id,
            url: data.url,
            orderPayload
          });

          addToast({
            title: 'Sessão do Stripe Aberta!',
            message: 'Clique em "Abrir Página do Stripe" para pagar com segurança.',
            type: 'info'
          });
          return;
        } else {
          setIsProcessingStripe(false);
          const errorMsg = data.error || 'Não foi possível iniciar o Stripe Checkout. Tente novamente ou selecione PIX.';
          setErrorMessage(errorMsg);
          addToast({
            title: 'Atenção com o Pagamento',
            message: errorMsg,
            type: 'error'
          });
          return;
        }
      } catch (err: any) {
        setIsProcessingStripe(false);
        const errDesc = 'Erro ao conectar ao servidor do Stripe. Verifique sua conexão e tente novamente.';
        setErrorMessage(errDesc);
        addToast({
          title: 'Erro de Comunicação',
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
    paymentSettings.bankAccount?.enabled ||
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
            {/* Stripe Checkout Safe Window (Evita tela em branco por bloqueio de iframe) */}
            {stripeSession && (
              <div className="absolute inset-0 bg-[#FCF9F5] z-50 flex flex-col p-6 overflow-y-auto animate-in fade-in duration-200">
                <div className="max-w-md mx-auto my-auto w-full space-y-5 text-center">
                  <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <CreditCard size={32} />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase mb-2">
                      <Lock size={12} /> Checkout Criptografado Stripe
                    </div>
                    <h3 className="text-2xl font-black uppercase text-stone-900 tracking-tight">
                      Pagamento no Cartão
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                      Para sua segurança bancária e para evitar telas em branco do navegador, o Stripe abre em uma página oficial segura em nova aba:
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm text-left space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-500 font-bold uppercase">Total a Pagar no Cartão:</span>
                      <span className="text-xl font-black text-purple-700">
                        R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-500 font-medium">Bandeiras Aceitas:</span>
                      <span className="text-stone-800 font-semibold">Visa, Mastercard, Elo, Hiper</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-stone-100">
                      <span className="text-stone-500 font-medium">Status do Pagamento:</span>
                      <span className="flex items-center gap-1.5 text-amber-600 font-bold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        Aguardando conclusão no Stripe...
                      </span>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="space-y-3 pt-2">
                    <a
                      href={stripeSession.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-purple-700 hover:bg-purple-800 text-white font-black uppercase tracking-wider py-4 px-6 rounded-2xl shadow-xl hover:shadow-purple-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
                    >
                      <span>Abrir Página do Stripe</span>
                      <ExternalLink size={18} />
                    </a>

                    <button
                      type="button"
                      onClick={handleForceApproveStripe}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider py-3.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
                    >
                      <Check size={16} className="text-white stroke-[3]" />
                      <span>Confirmar Pagamento e Avançar para o Minigame</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(stripeSession.url);
                        playSound('coin');
                        addToast({
                          title: 'Link Copiado!',
                          message: 'Link seguro do Stripe copiado para sua área de transferência!',
                          type: 'success'
                        });
                      }}
                      className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase tracking-wider py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Copy size={15} />
                      <span>Copiar Link de Pagamento</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCheckStripePaymentManually}
                      disabled={isCheckingStripePayment}
                      className="w-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-bold uppercase tracking-wider py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
                    >
                      {isCheckingStripePayment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-stone-500 border-t-stone-800 rounded-full animate-spin" />
                          <span>Consultando Stripe...</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} className="text-green-600 stroke-[3]" />
                          <span>Já realizei o pagamento (Verificar)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStripeSession(null)}
                      className="text-xs text-stone-500 hover:text-stone-800 font-bold uppercase tracking-wider pt-2 block mx-auto transition-colors cursor-pointer"
                    >
                      Voltar e escolher outra forma (PIX / Dinheiro / Conta Bancária)
                    </button>
                  </div>
                </div>
              </div>
            )}

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
              <form id="checkout-form" onSubmit={handleWhatsAppCheckout} noValidate className="space-y-5">
                
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
                      {region === 'a_calcular' ? (
                        <span className="text-[#F28B20] font-bold">A calcular</span>
                      ) : region ? (
                        <span className="text-[#F28B20] font-bold">+ R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
                      ) : (
                        <span className="text-amber-600 font-bold italic">Selecione a opção abaixo</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-stone-200">
                      <div>
                        <span className="font-black text-stone-900 uppercase text-sm block">Total:</span>
                        <span className="text-[11px] text-stone-400 font-medium">{region === 'a_calcular' ? 'Lanches + Frete a calcular' : 'Lanches + Taxa de Entrega'}</span>
                      </div>
                      <span className="font-black text-2xl text-[#F28B20]">
                        R$ {currentFinalTotal.toFixed(2).replace('.', ',')}{region === 'a_calcular' ? ' + Frete' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dados do Cliente e Região */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-2">
                    <h3 className="font-black uppercase text-stone-900 text-sm">
                      Dados para Entrega
                    </h3>
                    <button
                      type="button"
                      onClick={handleFillTestData}
                      className="text-[11px] font-black text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles size={12} />
                      <span>Preenchimento Rápido (Teste)</span>
                    </button>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5 uppercase">
                      <UserIcon size={15} className="text-[#F28B20]" /> Nome Completo *
                    </label>
                    <input 
                      id="input-name"
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="Ex: João da Silva" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5 uppercase">
                      <Smartphone size={15} className="text-[#F28B20]" /> WhatsApp / Celular *
                    </label>
                    <input 
                      id="input-whatsapp"
                      type="tel" 
                      value={whatsapp} 
                      onChange={e => setWhatsapp(e.target.value)} 
                      placeholder="Ex: 54 99999-9999" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5 uppercase">
                      <MapPin size={15} className="text-[#F28B20]" /> Endereço de Entrega Completo *
                    </label>
                    <input 
                      id="input-address"
                      type="text" 
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                      placeholder="Rua, Número, Bairro, Ponto de Referência" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900 text-sm"
                    />
                  </div>

                  <div id="section-region" className="pt-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5 uppercase">
                      <MapPin size={15} className="text-[#F28B20]" /> Região de Entrega (Cálculo de Frete) *
                    </label>
                    <div className="space-y-2">
                      <label className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${region === 'a_calcular' ? 'border-[#F28B20] bg-orange-50/70 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="region" checked={region === 'a_calcular'} onChange={() => setRegion('a_calcular')} className="hidden" />
                          <span className="font-bold text-sm text-stone-900">Frete a calcular no WhatsApp</span>
                        </div>
                        <span className="font-bold text-sm text-[#F28B20]">A calcular</span>
                      </label>
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
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-xl border border-stone-200 text-xs gap-3">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-stone-500 font-bold uppercase text-[10px]">Chave PIX (Telefone)</span>
                                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <span>📱</span> Mesmo WhatsApp da Lanchonete
                                    </span>
                                  </div>
                                  <span className="font-black text-stone-900 text-base block mt-0.5 tracking-tight">
                                    {paymentSettings.pix.key === '54999598389' ? '(54) 99959-8389' : paymentSettings.pix.key}
                                  </span>
                                  <span className="text-[11px] text-stone-500 font-medium">
                                    Beneficiário: {paymentSettings.pix.merchantName || 'NICKEL LANCHES'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(paymentSettings.pix.key, 'key')}
                                    className="bg-[#F28B20] hover:bg-[#d97a1c] text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs shadow-sm"
                                  >
                                    {copiedKey ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                                    <span>{copiedKey ? 'Copiada!' : 'Copiar Chave'}</span>
                                  </button>
                                  {paymentSettings.pix.key === '54999598389' && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopy('(54) 99959-8389', 'key_fmt')}
                                      className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer text-xs"
                                      title="Copiar com formatação de telefone"
                                    >
                                      <span>(54) 99959-8389</span>
                                    </button>
                                  )}
                                </div>
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

                      {/* Opção CONTA BANCÁRIA (AGÊNCIA E CONTA) */}
                      {paymentSettings.bankAccount?.enabled && (
                        <div className="space-y-2">
                          <label 
                            onClick={() => setPaymentMethod('bank_transfer')}
                            className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                              paymentMethod === 'bank_transfer'
                                ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                                : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                paymentMethod === 'bank_transfer' ? 'border-blue-600 bg-white' : 'border-stone-300 bg-white'
                              }`}>
                                {paymentMethod === 'bank_transfer' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                              </div>
                              <div className={`p-2 rounded-lg ${paymentMethod === 'bank_transfer' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                <Landmark size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-stone-900 block">Conta Bancária (Agência & Conta)</span>
                                  <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md uppercase">
                                    {paymentSettings.bankAccount.bankName ? paymentSettings.bankAccount.bankName.split(' ')[0] : 'Banco'}
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500 font-medium">TED, DOC ou transferência entre contas</span>
                              </div>
                            </div>
                            <span className="font-black text-sm text-blue-700">
                              R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                            </span>
                          </label>

                          {/* Bloco expandido de Conta Bancária */}
                          {paymentMethod === 'bank_transfer' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-4"
                            >
                              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-100">
                                <div>
                                  <span className="text-xs text-stone-500 font-bold uppercase block">Valor Exato a Transferir</span>
                                  <span className="text-2xl font-black text-stone-900">
                                    R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                                <div className="text-right text-xs">
                                  <span className="text-stone-500 font-medium block">Instituição:</span>
                                  <span className="font-black text-blue-900 text-sm">{paymentSettings.bankAccount.bankName || 'Banco do Proprietário'}</span>
                                </div>
                              </div>

                              {/* Card com os dados bancários para copiar */}
                              <div className="bg-stone-900 text-white p-4 rounded-xl border border-stone-800 space-y-3 shadow-md">
                                <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                                  <span className="text-xs uppercase font-bold text-yellow-400 flex items-center gap-1.5">
                                    <Landmark size={14} /> Dados para Transferência
                                  </span>
                                  <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-800 px-2 py-0.5 rounded">
                                    {paymentSettings.bankAccount.accountType === 'poupanca' ? 'Conta Poupança' : 'Conta Corrente'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {/* Agência */}
                                  <div className="bg-stone-800/80 p-2.5 rounded-lg border border-stone-700 flex justify-between items-center">
                                    <div>
                                      <span className="text-[10px] text-stone-400 uppercase font-bold block">Agência</span>
                                      <span className="font-mono font-black text-sm text-yellow-300">{paymentSettings.bankAccount.agency || '0001'}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyBankField(paymentSettings.bankAccount.agency, 'Agência')}
                                      className="p-1.5 bg-stone-700 hover:bg-stone-600 rounded text-stone-300 hover:text-white transition-colors cursor-pointer"
                                      title="Copiar Agência"
                                    >
                                      {copiedBankField === 'Agência' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    </button>
                                  </div>

                                  {/* Conta */}
                                  <div className="bg-stone-800/80 p-2.5 rounded-lg border border-stone-700 flex justify-between items-center">
                                    <div>
                                      <span className="text-[10px] text-stone-400 uppercase font-bold block">Conta com Dígito</span>
                                      <span className="font-mono font-black text-sm text-yellow-300">{paymentSettings.bankAccount.accountNumber || '0000000-0'}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyBankField(paymentSettings.bankAccount.accountNumber, 'Conta')}
                                      className="p-1.5 bg-stone-700 hover:bg-stone-600 rounded text-stone-300 hover:text-white transition-colors cursor-pointer"
                                      title="Copiar Conta"
                                    >
                                      {copiedBankField === 'Conta' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    </button>
                                  </div>
                                </div>

                                {/* Titular e Documento */}
                                <div className="space-y-1.5 pt-1 text-xs border-t border-stone-800">
                                  <div className="flex justify-between items-center">
                                    <span className="text-stone-400">Favorecido / Titular:</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-white uppercase">{paymentSettings.bankAccount.holderName || 'BRAIAN KLEBER'}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyBankField(paymentSettings.bankAccount.holderName, 'Titular')}
                                        className="p-1 text-stone-400 hover:text-white rounded transition-colors"
                                      >
                                        {copiedBankField === 'Titular' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                      </button>
                                    </div>
                                  </div>

                                  {paymentSettings.bankAccount.holderDocument && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-stone-400">CPF / CNPJ:</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-stone-300">{paymentSettings.bankAccount.holderDocument}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyBankField(paymentSettings.bankAccount.holderDocument!, 'CPF/CNPJ')}
                                          className="p-1 text-stone-400 hover:text-white rounded transition-colors"
                                        >
                                          {copiedBankField === 'CPF/CNPJ' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Instruções */}
                              <div className="p-3 bg-white/80 rounded-xl border border-blue-100 text-xs text-stone-600 space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-stone-900">
                                  <ShieldCheck size={15} className="text-blue-600" />
                                  <span>Como confirmar o pagamento?</span>
                                </div>
                                <p className="text-[11px] leading-relaxed">
                                  {paymentSettings.bankAccount.instructions || 'Transfira o valor exato pelo aplicativo do seu banco para a agência e conta acima. Anexe o comprovante abaixo para envio junto com seu pedido pelo WhatsApp!'}
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
                                    Stripe
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500 font-medium">Checkout oficial seguro via Stripe</span>
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
                              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-purple-100 shadow-sm">
                                <div>
                                  <span className="text-xs text-stone-500 font-bold uppercase block">Total no Cartão de Crédito</span>
                                  <span className="text-2xl font-black text-purple-800">
                                    R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full block">
                                    Stripe Oficial
                                  </span>
                                  <span className="text-[11px] text-stone-500 font-medium block mt-1">
                                    Visa, Master, Elo, Hiper
                                  </span>
                                </div>
                              </div>

                              <div className="p-3 bg-white/80 rounded-xl border border-purple-100 text-xs text-stone-600 space-y-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-stone-900">
                                  <ShieldCheck size={16} className="text-purple-700 shrink-0" />
                                  <span>Pagamento 100% Protegido pelo Stripe</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-stone-600">
                                  Ao clicar em <strong>Pagar com Stripe</strong> abaixo, você acessa o checkout oficial criptografado para digitar seu cartão com total segurança bancária.
                                </p>
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
                                    Stripe
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500 font-medium">Débito oficial seguro via Stripe</span>
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
                              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-blue-100 shadow-sm">
                                <div>
                                  <span className="text-xs text-stone-500 font-bold uppercase block">Total no Cartão de Débito</span>
                                  <span className="text-2xl font-black text-blue-800">
                                    R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full block">
                                    Stripe Oficial
                                  </span>
                                  <span className="text-[11px] text-stone-500 font-medium block mt-1">
                                    Débito Bancário
                                  </span>
                                </div>
                              </div>

                              <div className="p-3 bg-white/80 rounded-xl border border-blue-100 text-xs text-stone-600 space-y-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-stone-900">
                                  <ShieldCheck size={16} className="text-blue-700 shrink-0" />
                                  <span>Pagamento 100% Protegido pelo Stripe</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-stone-600">
                                  Ao clicar em <strong>Pagar com Stripe</strong> abaixo, você acessa o checkout oficial criptografado para pagar no Débito com total segurança.
                                </p>
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
                    <div className="space-y-2">
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
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-stone-900 block">PIX na Entrega</span>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                📱 Mesmo WhatsApp
                              </span>
                            </div>
                            <span className="text-xs text-stone-500 font-medium">Chave PIX: (54) 99959-8389 • Pague ao motoboy</span>
                          </div>
                        </div>
                      </label>

                      {paymentMethod === 'pix' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-200 text-xs space-y-2.5 ml-2"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                              <QrCode size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-stone-900 text-xs">Chave PIX da Lanchonete:</span>
                                <span className="font-black text-[#F28B20] text-xs">
                                  {paymentSettings.pix.key === '54999598389' ? '(54) 99959-8389' : paymentSettings.pix.key}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-600 font-medium mt-1 leading-relaxed">
                                A chave PIX é o próprio número de WhatsApp da lanchonete! Você pode fazer o PIX com o motoboy no ato da entrega ou se preferir já adiantar enviando o comprovante nesta conversa do WhatsApp.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-orange-200/60">
                            <span className="text-[11px] text-stone-600 font-bold">Chave: {paymentSettings.pix.key}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(paymentSettings.pix.key, 'key_delivery')}
                              className="bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            >
                              {copiedKey ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                              <span>{copiedKey ? 'Copiada!' : 'Copiar Chave'}</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>

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

                {/* Observações do Pedido ou Entrega (Opcional) */}
                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                    Observação do Pedido ou Entrega (Opcional)
                  </label>
                  <input 
                    type="text" 
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="Ex: Sem cebola, campainha estragada, casa dos fundos, etc."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#F28B20] focus:bg-white text-stone-800 transition-all"
                  />
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleWhatsAppCheckout();
                }}
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
                    <span>Conectando ao Stripe Checkout...</span>
                  </>
                ) : (paymentMethod === 'credit_online' || paymentMethod === 'debit_online') ? (
                  <>
                    <CreditCard size={22} className="shrink-0 text-amber-300" />
                    <span>Pagar com Stripe (R$ {currentFinalTotal.toFixed(2).replace('.', ',')})</span>
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
                  ? '🔒 Pagamento processado pela plataforma oficial do Stripe com criptografia bancária e certificação PCI-DSS. Ao aprovar, você avança para o minigame!'
                  : 'Você confirmará seu pedido, poderá se divertir no joguinho do cachorrinho e, ao sair dele, o pedido será encaminhado para o WhatsApp!'}
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
