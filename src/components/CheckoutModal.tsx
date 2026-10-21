import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Building2,
  Navigation,
  Search,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { CartItem } from '../types';
import { PaymentSettings, subscribeToPaymentSettings, DEFAULT_PAYMENT_SETTINGS } from '../lib/db';
import { generatePixPayload, generatePixQRCode } from '../lib/pix';
import { useToast } from './Toast';
import { playSound } from '../lib/audio';
import { determineRegionFromAddress, searchPassoFundoAddresses, AddressSuggestion } from '../lib/passoFundoAddresses';
import { isStoreClosedMonday, getStoreStatus, STORE_CLOSED_MESSAGE, STORE_CLOSED_DESCRIPTION } from '../lib/storeHours';

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
  const [addressNumber, setAddressNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [submittedAttempt, setSubmittedAttempt] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const addressContainerRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Métodos de pagamento: inicia em 'teste_pagamento' para pular o checkout de pagamento no teste completo
  const [paymentMethod, setPaymentMethod] = useState<
    'pix_online' | 'bank_transfer' | 'credit_online' | 'debit_online' | 'fiado' | 'teste_pagamento'
  >('teste_pagamento');

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

  // Garante que uma nova sessão seja sempre gerada ao abrir o checkout
  useEffect(() => {
    setStripeSession(null);
  }, [isOpen]);

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
              paymentMethod: data?.realMethodLabel || stripeSession.orderPayload.paymentMethod || 'Cartão Online (Aprovado via Stripe)',
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
            paymentMethod: data?.realMethodLabel || stripeSession.orderPayload.paymentMethod || 'Cartão Online (Aprovado via Stripe)',
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
    setAddress('Av. Brasil, 500 - Centro, Passo Fundo');
    playSound('coin');
    addToast({
      title: 'Dados Preenchidos para Teste!',
      message: 'Nome, WhatsApp e endereço preenchidos com sucesso!',
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

  // Análise e cálculo automático do frete através da rua/bairro digitado
  const detectedRegion = useMemo(() => {
    return determineRegionFromAddress(`${address} ${neighborhood}`.trim());
  }, [address, neighborhood]);

  // Se o carrinho contiver o produto de teste ou tiver frete grátis, isento o valor da taxa de entrega
  const isTestOrFreeShippingCart = useMemo(() => {
    return cart.length > 0 && cart.some(item => 
      item.id.toLowerCase().includes('teste') || 
      item.name.toLowerCase().includes('teste') ||
      (item as any).freeShipping === true
    );
  }, [cart]);

  const deliveryFee = isTestOrFreeShippingCart ? 0 : ((address.trim() || neighborhood.trim()) ? detectedRegion.fee : 15);
  const regionLabel = isTestOrFreeShippingCart ? 'Frete Grátis (Produto Teste)' : ((address.trim() || neighborhood.trim()) ? detectedRegion.label : 'Passo Fundo');
  const detectedBairro = detectedRegion.detectedBairro;
  const currentFinalTotal = total + deliveryFee;

  // Busca inteligente de ruas em Passo Fundo
  const handleAddressChange = (val: string) => {
    setAddress(val);
    if (errorMessage) setErrorMessage('');
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (val.trim().length >= 2) {
      searchDebounceRef.current = setTimeout(async () => {
        setIsSearchingAddress(true);
        try {
          const results = await searchPassoFundoAddresses(val);
          setAddressSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch (_) {
          // ignore
        } finally {
          setIsSearchingAddress(false);
        }
      }, 150);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (sug: AddressSuggestion) => {
    setAddress(sug.street);
    if (sug.bairro && sug.bairro !== 'Passo Fundo') {
      setNeighborhood(sug.bairro);
    }
    setAddressSuggestions([]);
    setShowSuggestions(false);
    playSound('coin');
    setTimeout(() => {
      document.getElementById('input-address-number')?.focus();
    }, 50);
  };

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressContainerRef.current && !addressContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setSubmittedAttempt(true);
    setErrorMessage('');

    if (!name.trim() || name.trim().length < 2) {
      const msg = 'Por favor, preencha seu Nome Completo obrigatório.';
      setErrorMessage(msg);
      playSound('error');
      addToast({ title: 'Nome Obrigatório', message: msg, type: 'error' });
      document.getElementById('input-name')?.focus();
      return false;
    }

    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (!whatsapp.trim() || cleanPhone.length < 8) {
      const msg = 'Por favor, informe seu WhatsApp / Telefone de contato válido.';
      setErrorMessage(msg);
      playSound('error');
      addToast({ title: 'Contato Obrigatório', message: msg, type: 'error' });
      document.getElementById('input-whatsapp')?.focus();
      return false;
    }

    if (!address.trim() || address.trim().length < 3) {
      const msg = 'Por favor, informe o nome da Rua / Avenida para entrega.';
      setErrorMessage(msg);
      playSound('error');
      addToast({ title: 'Endereço Obrigatório', message: msg, type: 'error' });
      document.getElementById('input-address')?.focus();
      return false;
    }

    if (!addressNumber.trim()) {
      const msg = 'Por favor, informe o Número da residência (ou Complemento/Apto).';
      setErrorMessage(msg);
      playSound('error');
      addToast({ title: 'Número Obrigatório', message: msg, type: 'error' });
      document.getElementById('input-address-number')?.focus();
      return false;
    }

    if (!neighborhood.trim() || neighborhood.trim().length < 2) {
      const msg = 'Por favor, informe o Bairro para entrega.';
      setErrorMessage(msg);
      playSound('error');
      addToast({ title: 'Bairro Obrigatório', message: msg, type: 'error' });
      document.getElementById('input-neighborhood')?.focus();
      return false;
    }

    if (!paymentMethod) {
      setPaymentMethod('teste_pagamento');
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
    const status = getStoreStatus();
    if (!status.isOpen) {
      playSound('error');
      addToast({
        title: status.title,
        message: status.description,
        type: 'error'
      });
      return;
    }
    if (!validateForm()) return;

    let finalPaymentLabel = '';
    let formattedChange = '';
    let isOnline = false;

    if (paymentMethod === 'teste_pagamento') {
      finalPaymentLabel = '🧪 Teste de Pagamento (Pedido Ilusório)';
      isOnline = false;
    } else if (paymentMethod === 'pix_online') {
      finalPaymentLabel = 'PIX Imediato (Site: (54) 99959-8389)';
      isOnline = true;
    } else if (paymentMethod === 'bank_transfer') {
      const b = paymentSettings.bankAccount;
      finalPaymentLabel = `Transferência Bancária (${b?.bankName || 'Banco'} | Ag: ${b?.agency || ''} | Conta: ${b?.accountNumber || ''})`;
      isOnline = true;
    } else if (paymentMethod === 'credit_online') {
      finalPaymentLabel = 'Cartão de Crédito Online (Site)';
      isOnline = true;
    } else if (paymentMethod === 'debit_online') {
      finalPaymentLabel = 'Cartão de Débito Online (Site)';
      isOnline = true;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const receiptTimestamp = `${formattedDate} às ${formattedTime}`;

    const effectiveName = name.trim();
    const effectiveWhatsapp = whatsapp.trim();
    const effectiveAddress = `${address.trim()}, Nº ${addressNumber.trim()} - Bairro ${neighborhood.trim()}`;
    const effectiveRegion = regionLabel || 'Outros bairros (Cidade)';
    const effectiveFee = deliveryFee;

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

    // Modo de teste ativo: pula o checkout externo do Stripe para finalizar o pedido direto
    if (false && (paymentMethod === 'credit_online' || paymentMethod === 'debit_online')) {
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
            paymentMethod: paymentMethod,
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

          try {
            window.location.href = data.url;
          } catch (_) {}

          addToast({
            title: 'Sessão do Stripe Aberta!',
            message: 'Acesse o Stripe para efetuar o pagamento. Seu pedido será aprovado e confirmado automaticamente!',
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
                      onClick={() => {
                        setStripeSession(null);
                        handleWhatsAppCheckout();
                      }}
                      className="w-full bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-purple-200"
                    >
                      <RefreshCw size={14} />
                      <span>Gerar Novo Link Atualizado do Stripe</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStripeSession(null)}
                      className="text-xs text-stone-500 hover:text-stone-800 font-bold uppercase tracking-wider pt-1 block mx-auto transition-colors cursor-pointer"
                    >
                      Voltar e escolher outra forma (PIX / Cartão)
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

            {/* Aviso de Loja Fechada */}
            {!getStoreStatus().isOpen && (
              <div className="bg-red-600 text-white px-4 py-3 text-center text-xs md:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 shadow-inner">
                <AlertCircle size={18} className="shrink-0 animate-bounce" />
                <span>{getStoreStatus().bannerText}</span>
              </div>
            )}

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
                              <div className="text-xs text-amber-800/90 pl-2 mt-0.5 space-y-0.5">
                                {item.extras.map((e, eIdx) => (
                                  <div key={eIdx} className="flex items-center gap-1 font-medium">
                                    <span>• {e.name}</span>
                                    <span className="text-stone-500 font-semibold">
                                      ({e.price > 0 ? `+ R$ ${Number(e.price).toFixed(2).replace('.', ',')}` : 'Incluso'})
                                    </span>
                                  </div>
                                ))}
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

                  {/* Subtotal dos Lanches */}
                  <div className="border-t border-stone-100 pt-3 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-600 text-sm">Subtotal dos Itens:</span>
                      <span className="font-black text-lg text-stone-900">
                        R$ {(total + discountAmount).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-green-600 font-bold">
                        <span>Desconto (10% Primeira Compra):</span>
                        <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dados do Cliente e Região */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-2">
                    <div>
                      <h3 className="font-black uppercase text-stone-900 text-sm">
                        Dados Obrigatórios para Entrega
                      </h3>
                      <p className="text-[11px] text-stone-500 font-medium">Preencha todos os campos com * para concluir o pedido</p>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full">
                      Obrigatório *
                    </span>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5 uppercase">
                      <UserIcon size={15} className="text-[#F28B20]" /> Nome Completo <span className="text-red-500">*</span>
                    </label>
                    <input 
                      id="input-name"
                      type="text" 
                      required
                      value={name} 
                      onChange={e => { setName(e.target.value); if (errorMessage) setErrorMessage(''); }} 
                      placeholder="Ex: João da Silva" 
                      className={`w-full bg-stone-50 border rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900 text-sm ${
                        submittedAttempt && name.trim().length < 2 ? 'border-red-500 ring-2 ring-red-100 bg-red-50/30' : 'border-stone-200'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5 uppercase">
                      <Smartphone size={15} className="text-[#F28B20]" /> WhatsApp / Telefone de Contato <span className="text-red-500">*</span>
                    </label>
                    <input 
                      id="input-whatsapp"
                      type="tel" 
                      required
                      value={whatsapp} 
                      onChange={e => { setWhatsapp(e.target.value); if (errorMessage) setErrorMessage(''); }} 
                      placeholder="Ex: (54) 99999-9999" 
                      className={`w-full bg-stone-50 border rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900 text-sm ${
                        submittedAttempt && whatsapp.replace(/\D/g, '').length < 8 ? 'border-red-500 ring-2 ring-red-100 bg-red-50/30' : 'border-stone-200'
                      }`}
                    />
                  </div>
                  
                  <div ref={addressContainerRef} className="relative pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-1.5 uppercase">
                      <label className="flex items-center gap-2">
                        <MapPin size={15} className="text-[#F28B20]" /> Rua / Avenida <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                        Passo Fundo - RS
                      </span>
                    </div>

                    <div className="relative">
                      <input 
                        id="input-address"
                        type="text" 
                        required
                        value={address} 
                        onChange={e => handleAddressChange(e.target.value)} 
                        onFocus={() => {
                          if (addressSuggestions.length > 0) setShowSuggestions(true);
                        }}
                        placeholder="Digite o nome da rua (Ex: Rua Uruguai, Av. Brasil, Lava Pés...)" 
                        className={`w-full bg-stone-50 border rounded-xl px-4 py-3 pl-10 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900 text-sm ${
                          submittedAttempt && address.trim().length < 3 ? 'border-red-500 ring-2 ring-red-100 bg-red-50/30' : 'border-stone-200'
                        }`}
                        autoComplete="off"
                      />
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      {isSearchingAddress && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-[#F28B20] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>

                    {/* Sugestões inteligentes ao digitar a rua */}
                    <AnimatePresence>
                      {showSuggestions && addressSuggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute z-30 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-stone-100"
                        >
                          <div className="px-3 py-1.5 bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                            <span>Ruas encontradas em Passo Fundo</span>
                            <span className="text-stone-400 font-normal">Toque para selecionar</span>
                          </div>
                          {addressSuggestions.map((sug, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectSuggestion(sug)}
                              className="w-full px-3.5 py-2.5 text-left hover:bg-orange-50/80 flex items-center justify-between gap-3 transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Navigation size={15} className="text-[#F28B20] shrink-0 group-hover:scale-110 transition-transform" />
                                <div className="truncate">
                                  <span className="font-bold text-sm text-stone-900 block truncate">
                                    {sug.street}
                                  </span>
                                  <span className="text-xs text-stone-500 block truncate">
                                    {sug.bairro ? `${sug.bairro} - ` : ''}Passo Fundo, RS
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Número / Complemento e Bairro Obrigatórios */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-1.5 uppercase">
                        <Building2 size={14} className="text-[#F28B20]" /> Número / Apto <span className="text-red-500">*</span>
                      </label>
                      <input 
                        id="input-address-number"
                        type="text" 
                        required
                        value={addressNumber} 
                        onChange={e => { setAddressNumber(e.target.value); if (errorMessage) setErrorMessage(''); }} 
                        placeholder="Ex: 500, Apto 302" 
                        className={`w-full bg-stone-50 border rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900 text-sm ${
                          submittedAttempt && !addressNumber.trim() ? 'border-red-500 ring-2 ring-red-100 bg-red-50/30' : 'border-stone-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-1.5 uppercase">
                        <MapPin size={14} className="text-[#F28B20]" /> Bairro <span className="text-red-500">*</span>
                      </label>
                      <input 
                        id="input-neighborhood"
                        type="text" 
                        required
                        value={neighborhood} 
                        onChange={e => { setNeighborhood(e.target.value); if (errorMessage) setErrorMessage(''); }} 
                        placeholder="Ex: Centro, Petrópolis, Boqueirão..." 
                        className={`w-full bg-stone-50 border rounded-xl px-4 py-3 font-medium outline-none focus:border-[#F28B20] focus:ring-4 focus:ring-orange-100 transition-all text-stone-900 text-sm ${
                          submittedAttempt && neighborhood.trim().length < 2 ? 'border-red-500 ring-2 ring-red-100 bg-red-50/30' : 'border-stone-200'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Confirmação do endereço completo */}
                  {address.trim() && addressNumber.trim() && neighborhood.trim() && (
                    <div className="mt-1 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>
                        Entrega em: <strong>{address.trim()}, Nº {addressNumber.trim()} - {neighborhood.trim()}</strong> ({regionLabel})
                      </span>
                    </div>
                  )}
                </div>

                {/* FORMA DE PAGAMENTO */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                  <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
                    <div>
                      <h3 className="font-black uppercase text-stone-900 text-sm">
                        Forma de Pagamento
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">Modo de teste ativo: pagamento pulado automaticamente</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                      Sem Checkout
                    </span>
                  </div>

                  {/* Opção Principal em Destaque: Pular Pagamento (Teste Completo) */}
                  <label 
                    onClick={() => { setPaymentMethod('teste_pagamento'); setErrorMessage(''); }}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'teste_pagamento'
                        ? 'border-emerald-500 bg-emerald-50/90 shadow-sm'
                        : 'border-stone-200 hover:border-emerald-300 bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'teste_pagamento' ? 'border-emerald-600 bg-white' : 'border-stone-300 bg-white'
                      }`}>
                        {paymentMethod === 'teste_pagamento' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                      </div>
                      <div className={`p-2 rounded-lg ${paymentMethod === 'teste_pagamento' ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-100 text-emerald-800'}`}>
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-stone-900 block">⚡ Pular Pagamento (Teste sem Checkout)</span>
                          <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md">Ativo</span>
                        </div>
                        <span className="text-xs text-stone-600 font-medium block">Finaliza o pedido direto sem cobrança para testar comanda, painel e minigame</span>
                      </div>
                    </div>
                  </label>

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

                              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                                  <span>💡 Atenção com Cartões Múltiplos (Nubank, Inter, etc.):</span>
                                </div>
                                <p className="text-[11px] leading-relaxed">
                                  Cartões múltiplos (débito e crédito no mesmo cartão plástico) de bancos como Nubank costumam ser roteados pelas bandeiras de cartão online na função crédito. Se você deseja pagar utilizando o saldo em conta corrente/débito sem usar limite, recomendamos fortemente utilizar o <strong>PIX Imediato</strong>!
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. OUTRAS OPÇÕES */}
                  <div className="space-y-3 pt-2">
                    {/* Opção de Teste de Pagamento / Pedido Ilusório */}
                    <label 
                      onClick={() => { setPaymentMethod('teste_pagamento'); setErrorMessage(''); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'teste_pagamento'
                          ? 'border-amber-500 bg-amber-50/80 shadow-xs'
                          : 'border-stone-200 hover:border-amber-300 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'teste_pagamento' ? 'border-amber-600 bg-white' : 'border-stone-300 bg-white'
                        }`}>
                          {paymentMethod === 'teste_pagamento' && <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />}
                        </div>
                        <div className={`p-2 rounded-lg ${paymentMethod === 'teste_pagamento' ? 'bg-amber-500 text-stone-900 font-bold' : 'bg-amber-100 text-amber-800'}`}>
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900 block">🧪 Teste de Pagamento (Pedido Ilusório)</span>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">Simulação</span>
                          </div>
                          <span className="text-xs text-stone-500 font-medium block">Valida o caminho completo do pedido sem cobrar nada</span>
                        </div>
                      </div>
                    </label>

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
              {/* Resumo Financeiro Final (Frete calculado automaticamente pelo endereço) */}
              <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-3.5 space-y-1.5 text-xs mb-3 shadow-2xs">
                <div className="flex justify-between text-stone-600 font-semibold">
                  <span>Subtotal dos itens:</span>
                  <span>R$ {(total + discountAmount).toFixed(2).replace('.', ',')}</span>
                </div>
                {discountAmount > 0 ? (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Desconto Aplicado (10% Primeira Compra):</span>
                    <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-stone-400 font-medium text-[11px]">
                    <span>Primeira compra? Use o cupom:</span>
                    <span className="font-mono font-bold text-stone-700">PRIMEIRA10</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600 font-semibold">
                  <span>Taxa de Entrega:</span>
                  {deliveryFee > 0 ? (
                    <span className="text-[#F28B20] font-bold">+ R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
                  ) : (
                    <span className="text-emerald-600 font-black flex items-center gap-1">
                      <span>🚚 FRETE GRÁTIS</span>
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                  <span className="text-stone-900 font-black text-sm uppercase">Total Final:</span>
                  <span className="text-2xl font-black text-[#F28B20]">
                    R$ {currentFinalTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {!getStoreStatus().isOpen ? (
                <div className="space-y-2">
                  <button 
                    type="button"
                    disabled
                    className="w-full bg-stone-300 border-2 border-stone-400 text-stone-600 rounded-2xl py-4 px-4 font-black uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-3 text-base shadow-none opacity-90"
                  >
                    <Lock size={22} className="shrink-0 text-stone-500" />
                    <span>{getStoreStatus().title}</span>
                  </button>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                    <p className="text-xs text-red-700 font-bold">
                      🚫 {getStoreStatus().description}
                    </p>
                  </div>
                </div>
              ) : (
                <>
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
                    ) : paymentMethod === 'teste_pagamento' ? (
                      <>
                        <Sparkles size={22} className="shrink-0 text-amber-300 animate-pulse" />
                        <span>Finalizar Pedido de Teste (Ao Vivo)</span>
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
                </>
              )}
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
