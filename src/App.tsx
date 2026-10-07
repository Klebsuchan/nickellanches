/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import NickelText from './components/NickelText';
import RenderWithNickel from './components/RenderWithNickel';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MessageCircle, Plus, Menu, Search, SlidersHorizontal, Bell, ShoppingCart, Star, ChefHat, LogOut, ArrowRight, Gamepad2, Tag, Heart, Utensils, BookOpen, Flame, Info, Home, ShoppingBag, User, LayoutGrid, MoreVertical, Share2 } from 'lucide-react';
import { MENU_ITEMS, DISCOUNT_CODES } from './data';
import { CartItem, Product, OrderInfo } from './types';
import AutoMarquee from './components/AutoMarquee';
import InstagramFeed from './components/InstagramFeed';
import OpeningHours from './components/OpeningHours';
import Footer from './components/Footer';
import DogGame from './components/DogGame';
import AdminPanel from './components/AdminPanel';
import ProfileView from './components/ProfileView';
import Sidebar from './components/Sidebar';
import FloatingBackground from './components/FloatingBackground';
import FeedbacksSection from './components/FeedbacksSection';
import StorySection from './components/StorySection';
import AppetiteVideo from './components/AppetiteVideo';
import HeroVideo from './components/HeroVideo';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import TrafficSignDiscount from './components/TrafficSignDiscount';
import { useToast } from './components/Toast';
import { isStoreClosedMonday, STORE_CLOSED_MESSAGE } from './lib/storeHours';
import { auth, signInWithGoogle, signOut, getNextOrderNumber } from './lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { subscribeToOrder, getLatestOrders, subscribeToProducts, subscribeToPromos, seedDatabase, createUserProfile, getUserProfile, addXpToUser, saveOrder, UserProfile, Order, getPrinterSettings, subscribeToAllOrders } from './lib/db';
import { executeUniversalPrint } from './lib/printerService';
import { playSound } from './lib/audio';

export default function App() {
  if (window.location.pathname === '/painel-admin') {
    return (
      <div className="min-h-screen bg-stone-100">
        <AdminPanel onClose={() => window.location.href = '/'} />
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'cardapio' | 'historia' | 'cozinha' | 'comunidade'>('cardapio');
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | 'Xis' | 'Cachorro Quente' | 'Combos' | 'Porções' | 'Bebidas'>('Todos');
  const [view, setView] = useState<'menu' | 'store' | 'game' | 'admin' | 'about' | 'profile'>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderInfo | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderInfo[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeModal, setActiveModal] = useState<'privacy' | 'contact' | 'terms' | 'cookies' | null>(null);
  const [showCookies, setShowCookies] = useState(true);
  const [showLastOrdersState, setShowLastOrdersState] = useState(false);
  const [menuItems, setMenuItems] = useState<Product[]>(MENU_ITEMS);
  const [discountCodes, setDiscountCodes] = useState<Record<string, number>>({});

  useEffect(() => {
    seedDatabase(MENU_ITEMS, DISCOUNT_CODES);
    const unsubProducts = subscribeToProducts(setMenuItems);
    const unsubPromos = subscribeToPromos((promos) => {
      const codeMap = promos.reduce((acc, curr) => ({ ...acc, [curr.code]: curr.discount }), {});
      setDiscountCodes(codeMap);
      
      // Auto-apply the first available promo if no promo is applied
      if (promos.length > 0 && cart.length > 0) {
        setDiscountCode(promos[0].code);
        setAppliedDiscount(promos[0].discount);
      }
    });
    return () => {
      unsubProducts();
      unsubPromos();
    };
  }, []);


  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);
  const { addToast } = useToast();
  
  const [logoClicks, setLogoClicks] = useState(0);
  const [showFlyingDog, setShowFlyingDog] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Navigation & History Management ---
  const goBack = () => window.history.back();

  const navigateToView = (newView: typeof view, extraState: any = {}) => {
    if (view === newView && !extraState.showLastOrdersState) return;
    window.history.pushState({ view: newView, ...extraState }, '');
    setView(newView);
    if (extraState.showLastOrdersState !== undefined) {
      setShowLastOrdersState(extraState.showLastOrdersState);
    }
    window.scrollTo(0, 0);
  };

  const openProduct = (p: Product) => {
    window.history.pushState({ view, product: p.id }, '');
    setSelectedProduct(p);
  };

  const openCart = () => {
    window.history.pushState({ view, cart: true }, '');
    setIsCartOpen(true);
  };

  const openCheckout = () => {
    if (isStoreClosedMonday()) {
      playSound('error');
      addToast({
        title: STORE_CLOSED_MESSAGE,
        message: 'Loja fechada segunda-feira: Nosso delivery está em manutenção hoje. Não é possível finalizar pedidos!',
        type: 'error'
      });
      return;
    }
    window.history.pushState({ view, checkout: true }, '');
    setIsCheckoutOpen(true);
    setIsCartOpen(false);
  };

  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ view: 'menu' }, '');
    }

    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (!state) {
        setView('menu');
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        setSelectedProduct(null);
        return;
      }

      setView(state.view || 'menu');
      if (state.showLastOrdersState !== undefined) {
        setShowLastOrdersState(state.showLastOrdersState);
      }
      setIsCartOpen(!!state.cart);
      setIsCheckoutOpen(!!state.checkout);
      
      if (state.product) {
        setMenuItems(prev => {
          const p = prev.find(m => m.id === state.product);
          setSelectedProduct(p || null);
          return prev;
        });
      } else {
        setSelectedProduct(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-impressão de novos pedidos em tempo real (para o balcão / computador da lanchonete)
  useEffect(() => {
    let isInitial = true;
    const printedOrders = new Set<string>(JSON.parse(localStorage.getItem('printed_orders') || '[]'));

    const unsubscribe = subscribeToAllOrders(async (orders) => {
      // No primeiro carregamento, marca os existentes para não reimprimir pedidos antigos
      if (isInitial) {
        orders.forEach(o => {
          if (o.id) printedOrders.add(o.id);
        });
        localStorage.setItem('printed_orders', JSON.stringify(Array.from(printedOrders)));
        isInitial = false;
        return;
      }

      // Procura novos pedidos com status 'recebido' que ainda não foram impressos
      for (const order of orders) {
        if (order.status === 'recebido' && order.id && !printedOrders.has(order.id)) {
          printedOrders.add(order.id);
          localStorage.setItem('printed_orders', JSON.stringify(Array.from(printedOrders)));

          try {
            const settings = await getPrinterSettings();
            if (settings.autoPrint) {
              playSound('order_alert');
              addToast({
                title: '🔔 Novo Pedido Recebido!',
                message: `Pedido #${order.orderNumber || order.id.slice(0, 4)} de ${order.userName || 'Cliente'} imprimindo automaticamente!`,
                type: 'success'
              });
              executeUniversalPrint(order, settings, addToast);
            }
          } catch (err) {
            console.warn('Erro ao auto-imprimir novo pedido em background:', err);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [addToast]);

  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const newClicks = prev + 1;
      if (newClicks >= 5) {
        setShowFlyingDog(true);
        setTimeout(() => setShowFlyingDog(false), 3000);
        playSound('powerup');
        addToast({ message: 'VOCÊ ENCONTROU O DOG VOADOR!', type: 'xp', title: 'SECRET' });
        return 0;
      }
      return newClicks;
    });
  };

  const toggleFavorite = (productId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setFavorites(prev => {
      const isFav = prev.includes(productId);
      const newFavs = isFav ? prev.filter(id => id !== productId) : [...prev, productId];
      localStorage.setItem('favorites', JSON.stringify(newFavs));
      if (!isFav) playSound('powerup');
      return newFavs;
    });
  };

  useEffect(() => {
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (!cookiesAccepted) {
      setShowCookies(true);
    }
  }, []);

  // Escuta retorno do Stripe Checkout (?payment=success ou ?payment=canceled)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const paymentStatus = queryParams.get('payment');
    const sessionId = queryParams.get('session_id');

    if (paymentStatus === 'success') {
      // Limpa os parâmetros da URL para evitar reprocessamento em reload
      window.history.replaceState({}, document.title, window.location.pathname);

      // Recupera dados do pedido pendente salvos antes do redirecionamento
      const savedPendingStr = sessionStorage.getItem('nickel_pending_stripe_order') || localStorage.getItem('nickel_pending_stripe_order');
      sessionStorage.removeItem('nickel_pending_stripe_order');
      localStorage.removeItem('nickel_pending_stripe_order');

      const processSuccessfulPayment = async () => {
        let orderItems = cart;
        let details: any = null;
        let finalDiscount = discountAmount;

        if (savedPendingStr) {
          try {
            const parsed = JSON.parse(savedPendingStr);
            if (parsed.orderPayload) details = parsed.orderPayload;
            if (parsed.cart && parsed.cart.length > 0) orderItems = parsed.cart;
            if (typeof parsed.discountAmount === 'number') finalDiscount = parsed.discountAmount;
          } catch (e) {
            console.error('Erro ao ler pedido pendente do Stripe:', e);
          }
        }

        // Se ainda faltar detalhes, tenta consultar a sessão no backend
        if (!details && sessionId) {
          try {
            const res = await fetch(`/api/checkout-session/${sessionId}`);
            if (res.ok) {
              const sessionData = await res.json();
              if (sessionData.metadata) {
                details = {
                  name: sessionData.metadata.name || sessionData.customer_details?.name || 'Cliente Stripe',
                  whatsapp: sessionData.metadata.whatsapp || '',
                  address: sessionData.metadata.address || 'Endereço registrado no checkout',
                  region: sessionData.metadata.region || '',
                  paymentMethod: 'Cartão Online (Aprovado via Stripe Checkout)',
                  isOnlinePayment: true,
                  receiptAuthCode: sessionData.metadata.receiptAuthCode || `AUT-STRIPE-${sessionId.substring(sessionId.length - 8).toUpperCase()}`,
                  deliveryFee: 0,
                  totalToPay: sessionData.metadata.total ? parseFloat(sessionData.metadata.total) : 0
                };
              }
            }
          } catch (err) {
            console.error('Erro ao buscar dados da sessão Stripe:', err);
          }
        }

        if (!details) {
          details = {
            name: 'Cliente Nickel',
            whatsapp: '',
            address: 'Endereço informado no checkout',
            paymentMethod: 'Cartão Online (Aprovado via Stripe)',
            isOnlinePayment: true,
            deliveryFee: 0
          };
        }

        // Garante que o status de pagamento online esteja marcado como aprovado
        details.isOnlinePayment = true;
        if (!details.paymentMethod.includes('Aprovado via Stripe')) {
          details.paymentMethod = `${details.paymentMethod} (Aprovado via Stripe)`;
        }

        // Confirmação final do pedido e redirecionamento para o minigame do cachorrinho
        await handleCheckout(details, orderItems, finalDiscount);
        playSound('powerup');
        addToast({
          title: 'Pagamento Aprovado no Cartão!',
          message: 'Seu pagamento foi confirmado pelo Stripe! Agora divirta-se no minigame enquanto preparamos seu lanche.',
          type: 'success'
        });
      };

      processSuccessfulPayment();
    } else if (paymentStatus === 'canceled') {
      window.history.replaceState({}, document.title, window.location.pathname);
      sessionStorage.removeItem('nickel_pending_stripe_order');
      localStorage.removeItem('nickel_pending_stripe_order');
      addToast({
        title: 'Pagamento Não Concluído',
        message: 'O pagamento via Stripe foi cancelado. Seus itens continuam na sacola para você tentar novamente ou escolher outro método.',
        type: 'info'
      });
      setIsCartOpen(true);
    }
  }, []);

  
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeOrder?.id) return;
    
    const unsub = subscribeToOrder(activeOrder.id, (orderData) => {
      if (orderData.status && orderData.status !== prevStatusRef.current) {
        const newStatus = orderData.status;
        
        if (prevStatusRef.current !== null) { // only if it's a change, not initial load
          if (newStatus === 'em_preparo') {
            addToast({
              title: 'Oba!',
              message: 'Seu lanche entrou em preparo. A chapa tá quente!',
              type: 'info'
            });
            playSound('powerup');
          } else if (newStatus === 'a_caminho') {
            addToast({
              title: 'Partiu!',
              message: 'O motoboy saiu para entrega. Fique atento!',
              type: 'success'
            });
            playSound('powerup');
          } else if (newStatus === 'entregue') {
            addToast({
              title: 'Entrega Concluída',
              message: 'Seu lanche chegou. Bom apetite!',
              type: 'success'
            });
            playSound('powerup');
          }
        }
        
        prevStatusRef.current = newStatus;
      }
    });
    
    return () => unsub();
  }, [activeOrder?.id, addToast]);


  const handleAcceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setShowCookies(false);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        try {
          await createUserProfile(u);
          const profile = await getUserProfile(u.uid);
          setUserProfile(profile);
          const orders = await getLatestOrders(u.uid);
          const mappedOrders = orders.map(o => ({
            id: o.id || '',
            items: o.items || [],
            subtotal: o.totalPrice || 0,
            discount: 0,
            total: o.totalPrice || 0,
            pointsEarned: o.totalPoints || 0,
            status: o.status || 'recebido',
            timestamp: o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || Date.now())
          }));
          setOrderHistory(mappedOrders as OrderInfo[]);
          setUserPoints(profile?.xp || 0);
        } catch (error) {
          console.error("Error loading user data (possibly offline or no permissions):", error);
        }
      } else {
        setUserProfile(null);
        setUserPoints(0);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleReorder = (order: Order) => {
    const newCartItems: CartItem[] = order.items.map(item => ({
      ...item,
      cartItemId: Math.random().toString(36).substring(2, 9),
    }));
    setCart(prev => [...prev, ...newCartItems]);
    openCart();
    playSound('jump');
    addToast({
      title: 'Pedido Repetido!',
      message: 'Os itens foram adicionados à sua sacola.',
      type: 'success'
    });
  };

  const handleProductClick = (product: Product) => {
    openProduct(product);
  };

  const handleAddToCart = (cartItem: CartItem) => {
    setCart(prev => [...prev, cartItem]);
    playSound('coin');
    addToast({
      message: `${cartItem.name} adicionado ao carrinho!`,
      type: 'success'
    });
    openCart();
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
  };

  const applyDiscount = (overrideCode?: string) => {
    const code = (overrideCode || discountCode).trim().toUpperCase();
    if (discountCodes[code] || DISCOUNT_CODES[code]) {
      const disc = discountCodes[code] || DISCOUNT_CODES[code];
      setAppliedDiscount(disc);
      setDiscountCode(code);
      playSound('laser');
      addToast({ message: `Cupom ${code} aplicado com sucesso! (10% OFF)`, type: 'success', title: 'Desconto' });
    } else {
      playSound('error');
      addToast({ message: 'Cupom inválido!', type: 'warning' });
    }
  };

  const totalCartBase = cart.reduce((sum, item) => {
    const extrasTotal = item.extras?.reduce((exSum, ex) => exSum + ex.price, 0) || 0;
    return sum + ((item.price + extrasTotal) * item.quantity);
  }, 0);

  let discountAmount = 0;
  if (appliedDiscount !== null) {
    if (appliedDiscount < 1) { // It's a percentage
      discountAmount = totalCartBase * appliedDiscount;
    } else { // Fixed amount
      discountAmount = appliedDiscount;
    }
  }

  const totalCart = Math.max(0, totalCartBase - discountAmount);
  const totalPoints = cart.reduce((sum, item) => sum + (item.points * item.quantity), 0);

  const handleShareWhatsApp = () => {
    const destaques = ['magma', 'cemuche', 'bomba', 'olympus'];
    const randomDestaque = destaques[Math.floor(Math.random() * destaques.length)];
    const shareUrl = `${window.location.origin}/?destaque=${randomDestaque}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    addToast({
      title: 'Link Copiado!',
      message: 'Link copiado! Ao encaminhar no WhatsApp, o banner dos destaques será exibido.',
      type: 'success'
    });
    const msg = `Dá uma olhada no cardápio da Nickel Lanches em Passo Fundo! 🍔🔥\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCheckout = async (details: any, customCartItems?: CartItem[], customDiscountAmount?: number) => {
    if (isStoreClosedMonday()) {
      playSound('error');
      addToast({
        title: STORE_CLOSED_MESSAGE,
        message: 'Loja fechada segunda-feira: Nosso delivery está em manutenção hoje. Não é possível finalizar pedidos!',
        type: 'error'
      });
      return;
    }
    const activeCart = (customCartItems && customCartItems.length > 0) ? customCartItems : cart;
    if (activeCart.length === 0) return;

    const baseSubtotal = activeCart.reduce((sum, item) => {
      const extrasTotal = item.extras?.reduce((acc, curr) => acc + curr.price, 0) || 0;
      return sum + ((item.price + extrasTotal) * item.quantity);
    }, 0);

    const activeDiscount = (typeof customDiscountAmount === 'number') ? customDiscountAmount : discountAmount;
    const computedTotalCart = Math.max(0, baseSubtotal - activeDiscount);
    const earnedPoints = activeCart.reduce((sum, item) => sum + (item.points * item.quantity), 0);
    
    // Get daily order number
    const orderNumber = await getNextOrderNumber();
    const now = new Date();
    const dateNow = now.toLocaleDateString('pt-BR');
    const timeNow = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const authCode = details.receiptAuthCode || `AUT-NKL-${Date.now().toString(36).substring(2, 8).toUpperCase()}`;
    const authHash = Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    let finalTotal = computedTotalCart;
    if (details.deliveryFee) {
      finalTotal = computedTotalCart + details.deliveryFee;
    }

    // 1. Build WhatsApp message following the exact customer template requested
    const clientName = (details.name || 'Cliente').trim();
    const clientNameUpper = clientName.toUpperCase();

    let msg = `Me chamo ${clientNameUpper}\n\n`;
    msg += `e gostaria de fazer um pedido aqui pelo whatsapp!\n\n`;
    msg += `Pedido Número: #${orderNumber}\n`;
    msg += `Gerado às: ${timeNow}\n\n`;
    msg += `ITENS DO PEDIDO:\n\n`;

    activeCart.forEach(item => {
      const itemTotal = (item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) * item.quantity;
      msg += `- ${item.quantity}x ${item.name} (R$ ${itemTotal.toFixed(2).replace('.', ',')})\n`;
      if (item.extras && item.extras.length > 0) {
        msg += `Adicionais: ${item.extras.map(e => e.name).join(', ')}\n`;
      }
      if (item.observation && item.observation.trim()) {
        msg += `Observação: ${item.observation.trim()}\n`;
      }
    });

    msg += `\n`;

    let totalLine = `TOTAL: R$ ${computedTotalCart.toFixed(2).replace('.', ',')}`;
    if (details.deliveryFee && details.deliveryFee > 0) {
      totalLine += ` + Frete R$ ${details.deliveryFee.toFixed(2).replace('.', ',')} (Total: R$ ${finalTotal.toFixed(2).replace('.', ',')})`;
    } else {
      totalLine += ` + Frete a calcular`;
    }
    msg += `${totalLine}\n\n`;

    msg += `DADOS PARA ENTREGA:\n`;
    msg += `Nome: ${clientName}\n`;
    msg += `WhatsApp: ${(details.whatsapp || '').trim()}\n`;
    const cleanAddress = (details.address || '').trim();
    const regionSuffix = details.region && details.region !== 'Frete a calcular' && !cleanAddress.toLowerCase().includes(details.region.toLowerCase())
      ? ` (${details.region})`
      : '';
    msg += `Endereço: ${cleanAddress}${regionSuffix}\n`;
    
    let paymentText = details.paymentMethod || 'Pix';
    if (details.changeFor) {
      paymentText += ` (Troco para R$ ${details.changeFor})`;
    }
    msg += `Forma de Pagamento: ${paymentText}`;
    if (paymentText.toLowerCase().includes('pix')) {
      msg += `\n*Chave PIX (WhatsApp): (54) 99959-8389*`;
    }
    if (details.receiptNotes && details.receiptNotes.trim()) {
      msg += `\nObservação da Entrega: ${details.receiptNotes.trim()}`;
    }
    
    // 2. Save order and receipt to Firebase
    let orderId = Math.random().toString(36).substring(2, 9).toUpperCase();
    try {
      const uid = user ? user.uid : 'guest';
      orderId = await saveOrder(uid, {
        items: activeCart,
        totalPrice: finalTotal,
        totalPoints: earnedPoints,
        status: 'recebido',
        userName: details.name || user?.displayName || 'Anônimo',
        address: details.address,
        paymentMethod: details.paymentMethod,
        whatsapp: details.whatsapp,
        deliveryFee: details.deliveryFee || 0,
        changeFor: details.changeFor || '',
        region: details.region || '',
        orderNumber,
        receiptAuthCode: authCode,
        receiptTimestamp: details.receiptTimestamp || `${dateNow} às ${timeNow}`,
        receiptNotes: details.receiptNotes || '',
        receiptFileName: details.receiptFileName || '',
        receiptSummary: `R$ ${finalTotal.toFixed(2).replace('.', ',')} via ${details.paymentMethod}`
      });

      // 3. Auto-impressão imediata assim que o pedido é realizado
      try {
        const printerSettings = await getPrinterSettings();
        if (printerSettings.autoPrint) {
          const printedSet = new Set<string>(JSON.parse(localStorage.getItem('printed_orders') || '[]'));
          printedSet.add(orderId);
          localStorage.setItem('printed_orders', JSON.stringify(Array.from(printedSet)));

          const orderObj: Order = {
            id: orderId,
            orderNumber,
            userName: details.name || user?.displayName || 'Anônimo',
            address: details.address || '',
            paymentMethod: details.paymentMethod || 'Pix',
            whatsapp: details.whatsapp || '',
            deliveryFee: details.deliveryFee || 0,
            changeFor: details.changeFor || '',
            region: details.region || '',
            totalPrice: finalTotal,
            totalPoints: earnedPoints,
            items: activeCart,
            receiptNotes: details.receiptNotes || '',
            status: 'recebido',
            createdAt: new Date()
          };

          playSound('order_alert');
          executeUniversalPrint(orderObj, printerSettings, addToast);
        }
      } catch (printErr) {
        console.warn('Erro ao acionar auto-impressão imediata:', printErr);
      }
    } catch(e) {
      console.error("Error saving order", e);
    }

    const newOrder: OrderInfo = {
      id: orderId,
      items: [...activeCart],
      subtotal: baseSubtotal,
      discount: activeDiscount,
      total: finalTotal,
      pointsEarned: earnedPoints,
      status: 'recebido',
      timestamp: new Date(),
      receiptAuthCode: authCode,
      receiptTimestamp: details.receiptTimestamp || `${dateNow} às ${timeNow}`,
      receiptNotes: details.receiptNotes,
      receiptFileName: details.receiptFileName,
      receiptSummary: `R$ ${finalTotal.toFixed(2).replace('.', ',')} via ${details.paymentMethod}`,
      whatsappMessage: msg
    };
    
    setActiveOrder(newOrder);
    setOrderHistory(prev => [newOrder, ...prev]);
    setCart([]);
    setAppliedDiscount(null);
    setDiscountCode('');
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    
    // Direct directly to minigame of the dog
    navigateToView('game');
    window.scrollTo(0,0);
    
    addToast({
      title: 'Pedido Confirmado!',
      message: 'Divirta-se com o minigame do cachorrinho! Seu lanche já está em preparo na cozinha.',
      type: 'success'
    });
  };

  const handleFinishOrder = async () => {
    if (activeOrder) {
      setUserPoints(prev => prev + activeOrder.pointsEarned);
      if (user) {
        await addXpToUser(user.uid, activeOrder.pointsEarned);
      }
      playSound('powerup');
      addToast({
        title: 'Pedido Concluído!',
        message: `Pedido finalizado com sucesso e você ganhou +${activeOrder.pointsEarned} XP!`,
        type: 'xp'
      });
    }
    navigateToView('menu');
    setActiveOrder(null);
    setShowReview(true);
  };

  const xisItems = menuItems.filter(i => (i.category === 'lanches' || i.name.toLowerCase().includes('xis')) && !i.name.toLowerCase().includes('cachorro') && !i.name.toLowerCase().includes('combo') && !i.name.toLowerCase().includes('trio'));
  const hotDogItems = menuItems.filter(i => i.name.toLowerCase().includes('cachorro quente') && !i.name.toLowerCase().includes('combo') && !i.name.toLowerCase().includes('trio'));
  const portionItems = menuItems.filter(i => i.name.toLowerCase().includes('batata frita') && !i.name.toLowerCase().includes('combo') && !i.name.toLowerCase().includes('trio'));
  const extraItems = menuItems.filter(i => !i.name.toLowerCase().includes('xis') && !i.name.toLowerCase().includes('cachorro quente') && !i.name.toLowerCase().includes('batata frita') && !i.id.startsWith('c') && !i.name.toLowerCase().includes('combo') && !i.name.toLowerCase().includes('trio'));

    const renderProductGrid = (items: Product[], title: string) => {
    if (items.length === 0) return null;
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 pb-6">
        {items.map((item, index) => {
          let badge = null;
          if (index === 0) badge = <span className="bg-[#4E2A84] text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest absolute top-4 left-4 z-20 shadow-sm">Bestseller</span>;
          else if (index === 1) badge = <span className="bg-[#F28B20] text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest absolute top-4 left-4 z-20 shadow-sm">Popular</span>;
          else if (index === 2) badge = <span className="bg-[#4E2A84] text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest absolute top-4 left-4 z-20 shadow-sm">Save 15%</span>;

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-5 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative cursor-pointer border border-stone-100"
              onClick={() => handleProductClick(item)}
            >
              {badge}
              <div className="absolute top-4 right-4 z-20">
                <button 
                  onClick={(e) => toggleFavorite(item.id, e)} 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors bg-white/50 backdrop-blur-sm"
                >
                  <Heart size={22} className={favorites.includes(item.id) ? 'fill-red-500 text-red-500' : ''} strokeWidth={2} />
                </button>
              </div>
              
              <div className="h-44 w-full bg-[#FCF9F5] rounded-[24px] mb-5 flex items-center justify-center relative overflow-hidden group">
                 {item.image ? (
                   <img loading="lazy" decoding="async"  src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                 ) : (
                   <span className="text-8xl group-hover:scale-110 transition-transform duration-300 drop-shadow-xl translate-y-2">
                      {item.emoji}
                   </span>
                 )}
              </div>
              
              <div className="flex flex-col gap-1 z-10 relative px-1">
                <h4 className="font-bold text-stone-900 leading-tight line-clamp-2 md:line-clamp-1 text-sm md:text-lg tracking-tight h-10 md:h-auto"><RenderWithNickel text={item.name} /></h4>
                <p className="hidden md:block text-xs text-stone-500 line-clamp-2 min-h-[2rem] leading-relaxed font-medium mb-1.5">{item.description}</p>
                
                <div className="flex items-center justify-between mt-auto md:mt-4">
                  <span className="text-base md:text-2xl font-black text-stone-900 tracking-tighter">
                    R$ {item.price.toFixed(2).replace('.', ',')}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleProductClick(item); }}
                    className="w-8 h-8 md:w-10 md:h-10 bg-[#F28B20] text-white rounded-full flex items-center justify-center hover:bg-orange-500 transition-transform hover:scale-105 shadow-[0_4px_15px_rgba(242,139,32,0.4)]"
                  >
                    <Plus size={16} strokeWidth={3} className="md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  
  const renderStore = () => {
    // Collect unique products from order history if needed
    const lastOrderedProducts = [];
    if (showLastOrdersState && orderHistory.length > 0) {
      const seenIds = new Set();
      orderHistory.forEach(order => {
        order.items.forEach(item => {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            lastOrderedProducts.push(item);
          }
        });
      });
    }

    return (
      <div className="w-full pb-0 bg-transparent min-h-screen">
        {/* Aviso de Segunda Fechada no Cardápio */}
        {isStoreClosedMonday() && (
          <div className="bg-red-600 text-white py-2 px-4 text-center text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm">
            <span className="text-amber-300">⚠️</span>
            <span>LOJA FECHADA SEGUNDA-FEIRA: DELIVERY EM MANUTENÇÃO HOJE!</span>
            <span className="hidden md:inline font-bold opacity-90">• Retornamos terça-feira às 18:30</span>
          </div>
        )}

        {/* Header Store */}
        <header className="sticky top-0 z-50 bg-white border-b border-stone-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-0 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => { navigateToView('menu'); window.scrollTo(0,0); }} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-900 hover:bg-stone-200 transition-colors">
                <ArrowRight size={20} className="rotate-180" />
              </button>
              <h1 className="text-xl md:text-2xl font-black text-[#4E2A84] font-display uppercase tracking-widest leading-none mt-1">VOLTAR AO INÍCIO</h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <button onClick={() => openCart()} className="w-10 h-10 md:w-12 md:h-12 bg-[#F28B20] rounded-full flex items-center justify-center text-white relative shadow-md hover:bg-orange-500 transition-colors">
                <ShoppingBag size={20} />
                {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#4E2A84] rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {showLastOrdersState && lastOrderedProducts.length > 0 && (
          <AutoMarquee items={lastOrderedProducts} onItemClick={openProduct} />
        )}

        <div id="cardapio" className="max-w-7xl mx-auto px-4 md:px-8 xl:px-0 py-12">
          {/* Plaquinha Amarela de Trânsito - 10% DE DESCONTO */}
          <TrafficSignDiscount variant="banner" onApplyCoupon={(c) => applyDiscount(c)} />
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-stone-900">Nosso Cardápio</h2>
            <div className="bg-white rounded-full px-4 py-2 shadow-sm border border-stone-200 flex items-center w-full md:w-auto">
              <Search size={18} className="text-stone-400 mr-2" />
              <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-stone-900 w-full font-medium placeholder:text-stone-400 text-sm" />
            </div>
          </div>

          <div className="flex overflow-x-auto gap-4 mb-10 pb-2 hide-scrollbar">
            {[
              { id: 'Todos', emoji: '🍔', label: 'Todos' },
              { id: 'Xis', emoji: '🍔', label: 'Xis' },
              { id: 'Cachorro Quente', emoji: '🌭', label: 'Cachorros' },
              { id: 'Combos', emoji: '🥤', label: 'Combos' },
              { id: 'Porções', emoji: '🍟', label: 'Porções' },
              { id: 'Bebidas', emoji: '🥤', label: 'Bebidas' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className="flex flex-col items-center gap-2 group shrink-0"
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-sm ${
                  selectedCategory === cat.id ? 'bg-[#FCF5E3] ring-2 ring-[#F28B20]' : 'bg-white hover:bg-stone-50 border border-stone-100'
                }`}>
                  {cat.emoji}
                </div>
                <span className={`text-sm font-bold transition-colors uppercase tracking-wider ${
                  selectedCategory === cat.id ? 'text-[#F28B20]' : 'text-stone-500'
                }`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>

          {renderProductGrid(
            selectedCategory === 'Todos' 
               ? menuItems 
               : selectedCategory === 'Xis'
                 ? xisItems
               : selectedCategory === 'Cachorro Quente'
                 ? hotDogItems
               : selectedCategory === 'Combos'
                 ? menuItems.filter(item => item.category === 'combos')
               : selectedCategory === 'Porções'
                 ? menuItems.filter(item => item.category === 'porcoes' || item.category === 'porções')
               : menuItems.filter(item => item.category === selectedCategory.toLowerCase()),
            selectedCategory === 'Todos' ? 'Todos os Lanches' : selectedCategory
          )}
        </div>
    </div>
  );
};


  const renderMenu = () => (
    <div className="w-full pb-0 bg-transparent">
      {/* Top Banner com Slogan Oficial ou Aviso de Segunda Fechada */}
      {isStoreClosedMonday() ? (
        <div className="bg-red-600 text-white py-2 px-4 text-center text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm animate-in fade-in">
          <span className="text-amber-300">⚠️</span>
          <span>LOJA FECHADA SEGUNDA-FEIRA: DELIVERY EM MANUTENÇÃO HOJE!</span>
          <span className="hidden md:inline font-bold opacity-90">• Retornamos terça-feira às 18:30</span>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#4E2A84] via-[#F28B20] to-[#4E2A84] text-white py-1.5 px-4 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs">
          <span className="text-orange-300">❤️</span>
          <span>MUITO AMOR ENVOLVIDO, E O PRAZER DE COMER BEM É GARANTIDO PRA VOCÊ!</span>
          <span className="text-orange-300">✨</span>
        </div>
      )}

      {/* Header com Navegação */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-0 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <img loading="eager" fetchPriority="high" src="/logo.png" alt="Nickel Lanches" className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform" />
            <div className="flex flex-col justify-center -ml-2 sm:-ml-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl tracking-tighter leading-none"><NickelText /></h1>
              <h2 className="text-sm sm:text-lg md:text-xl tracking-tighter leading-none -mt-0.5 sm:-mt-1" style={{ fontFamily: '"Russo One", sans-serif', fontStyle: 'italic', color: '#FFFFFF', WebkitTextStroke: '1px black', textShadow: '1px 1px 0px #000' }}>LANCHES</h2>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8">
            <button onClick={() => { navigateToView('store'); setShowLastOrdersState(false); window.scrollTo(0,0); }} className="text-sm font-bold uppercase tracking-wider text-stone-600 hover:text-[#F28B20] transition-colors">Cardápio</button>
            <button onClick={() => { document.getElementById('quem-somos')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-bold uppercase tracking-wider text-stone-600 hover:text-[#F28B20] transition-colors">Quem Somos</button>
            <button onClick={() => { document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-bold uppercase tracking-wider text-stone-600 hover:text-[#F28B20] transition-colors">Contato</button>
            <button onClick={() => navigateToView('game')} className="text-sm font-black uppercase tracking-wider text-[#4E2A84] hover:text-[#F28B20] transition-all flex items-center gap-2 group">
              <img src="/game-icon.svg" alt="Game" className="w-7 h-7 object-contain drop-shadow-sm group-hover:scale-125 group-hover:rotate-12 transition-transform duration-200" />
              <span className="bg-gradient-to-r from-[#4E2A84] to-[#F28B20] bg-clip-text text-transparent group-hover:text-[#F28B20]">Jogue nosso jogo</span>
            </button>
            <button onClick={() => { navigateToView('store'); setShowLastOrdersState(true); window.scrollTo(0,0); }} className="bg-[#F28B20] text-white px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors shadow-sm">Faça seu Pedido</button>
          </nav>

          <div className="flex items-center gap-2 md:gap-3 lg:hidden relative">
            <button onClick={() => navigateToView('game')} className="w-12 h-12 bg-gradient-to-tr from-amber-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-xs border border-purple-200/80 active:scale-95" title="Jogue nosso jogo">
              <img src="/game-icon.svg" alt="Game" className="w-8 h-8 object-contain drop-shadow-sm" />
            </button>
            <button onClick={() => openCart()} className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-900 relative">
              <ShoppingBag size={24} />
              {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#4E2A84] rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 ml-1">
              <MoreVertical size={20} />
            </button>

            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-12 right-0 w-48 bg-white border border-stone-200 rounded-2xl shadow-xl flex flex-col py-2 z-50 overflow-hidden"
                >
                  <button onClick={() => { setIsMobileMenuOpen(false); navigateToView('profile'); }} className="text-left px-4 py-3 font-bold text-sm text-[#F28B20] uppercase tracking-wide hover:bg-stone-50 transition-colors flex items-center gap-2">
                    <User size={16} /> Minha Conta
                  </button>
                  <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('quem-somos')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left px-4 py-3 font-bold text-sm text-stone-700 uppercase tracking-wide hover:bg-stone-50 transition-colors border-t border-stone-100">
                    Quem Somos
                  </button>
                  <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left px-4 py-3 font-bold text-sm text-stone-700 uppercase tracking-wide hover:bg-stone-50 transition-colors">
                    Contato
                  </button>
                  <button onClick={() => { setIsMobileMenuOpen(false); navigateToView('game'); }} className="text-left px-4 py-3 font-bold text-sm text-[#4E2A84] uppercase tracking-wide hover:bg-stone-50 transition-colors flex items-center gap-2.5 border-t border-stone-100">
                    <img src="/game-icon.svg" alt="Game" className="w-6 h-6 object-contain" /> Jogue nosso jogo
                  </button>
                  <button onClick={() => { setIsMobileMenuOpen(false); handleShareWhatsApp(); }} className="text-left px-4 py-3 font-bold text-sm text-[#25D366] uppercase tracking-wide hover:bg-stone-50 transition-colors flex items-center gap-2.5 border-t border-stone-100">
                    <Share2 size={16} /> Compartilhar no WhatsApp
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Desktop User/Cart icons */}
          <div className="hidden lg:flex items-center gap-3">
            <button onClick={handleShareWhatsApp} className="w-12 h-12 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-full flex items-center justify-center border border-[#25D366]/30 transition-all hover:scale-105 shadow-2xs cursor-pointer" title="Compartilhar no WhatsApp">
              <Share2 size={18} />
            </button>
            <button onClick={() => navigateToView('game')} className="w-12 h-12 bg-gradient-to-tr from-amber-50 via-purple-50 to-pink-50 rounded-full flex items-center justify-center border border-purple-200 hover:bg-purple-100 transition-all hover:scale-105 shadow-2xs" title="Jogue nosso jogo">
              <img src="/game-icon.svg" alt="Game" className="w-7 h-7 object-contain drop-shadow-sm" />
            </button>
             <button onClick={() => navigateToView('profile')} className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-[#F28B20] border border-stone-200 hover:bg-stone-100 transition-colors">
              <User size={20} />
            </button>
            <button onClick={() => openCart()} className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-stone-900 border border-stone-200 hover:bg-stone-100 transition-colors relative">
              <ShoppingBag size={20} />
              {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#4E2A84] rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-0 mt-6 mb-8">
        <HeroVideo 
          onGoToStore={(showLastOrders) => { navigateToView('store'); setShowLastOrdersState(showLastOrders); window.scrollTo(0, 0); }} 
          onOpenProduct={(id) => { 
            const p = menuItems.find(item => item.id === id); 
            if (p) openProduct(p); 
          }}
        />
      </div>

      {/* Plaquinha Amarela de Trânsito - 10% DE DESCONTO PARA A PRIMEIRA COMPRA */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-0">
        <TrafficSignDiscount variant="banner" onApplyCoupon={(c) => applyDiscount(c)} />
      </div>

      {/* Quem Somos Section */}
      <div id="quem-somos" className="bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-0 py-8 md:py-16">
          <AppetiteVideo onGoToStore={(showLastOrders) => { navigateToView('store'); setShowLastOrdersState(showLastOrders); window.scrollTo(0, 0); }} />
        </div>
        <StorySection />
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-0 mt-16 pb-16">
          <FeedbacksSection user={user} orderHistory={orderHistory} />
        </div>
      </div>

      <OpeningHours />

      {/* Instagram Feed */}
      <InstagramFeed />

      {/* Footer / Contato */}
      <div id="contato">
        <Footer onOpenModal={setActiveModal} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCF9F5] relative overflow-hidden text-stone-900">
      <div style={{ display: view === 'about' || view === 'profile' ? 'none' : 'block' }} className="fixed inset-0 pointer-events-none z-0">
        {/* Parallax Background */}
        <div className="absolute inset-0 game-bg opacity-20" style={{ backgroundAttachment: 'fixed', backgroundPosition: 'center' }}></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 0, 0.1) 0%, transparent 70%)', backgroundAttachment: 'fixed' }}></div>
        <FloatingBackground />
      </div>
      
      <div className="relative z-10 w-full h-full">
            {view === 'store' && renderStore()}
      {view === 'profile' && (
        <ProfileView onClose={() => navigateToView('menu')} orderHistory={orderHistory} onPlayGame={() => navigateToView('game')}
          user={user} 
          userProfile={userProfile} 
          onLogin={signInWithGoogle} 
          onLogout={signOut} 
        />
      )}
      {/* Info Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border-4 border-black rounded-2xl p-8 max-w-md w-full shadow-[8px_8px_0px_#000] relative"
            >
              <h2 className="text-3xl font-display uppercase text-black comic-text-bold tracking-wide mb-4">
                {activeModal === 'privacy' && 'Termos de Privacidade'}
                {activeModal === 'contact' && 'Contato'}
              </h2>
              <div className="text-zinc-800 font-bold mb-8 space-y-4">
                {activeModal === 'privacy' && (
                  <p>Nós respeitamos sua privacidade como um doguinho respeita seu osso! Seus dados de login são usados apenas para salvar seus pedidos intergalácticos e seus pontos XP.</p>
                )}
                {activeModal === 'contact' && (
                  <p>Mande um sinal de fumaça, um pombo correio ou um e-mail para <strong>alo@nickellanches.com.br</strong>. Atendemos de Marte à Lua!</p>
                )}
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full py-3 bg-yellow-400 border-2 border-black text-black font-display tracking-widest uppercase rounded-xl hover:bg-yellow-500 shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] transition-all hover:-translate-y-1"
              >
                Entendi!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cookie Banner */}
      <AnimatePresence>
        {showCookies && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 left-4 right-4 md:right-auto md:w-96 bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_#000] z-[110]"
          >
            <h3 className="text-xl font-display uppercase text-black comic-text-bold tracking-wide mb-2">🍪 Biscoitos? Digo, Cookies!</h3>
            <p className="text-sm font-bold text-zinc-600 mb-4">Usamos cookies para melhorar sua experiência intergaláctica e salvar seus XP.</p>
            <button 
              onClick={handleAcceptCookies}
              className="w-full py-2 bg-zinc-900 text-yellow-400 border-2 border-black font-display tracking-widest uppercase rounded-xl hover:bg-zinc-800 shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] transition-all hover:-translate-y-1"
            >
              Aceitar Tudo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button (Floating) */}
      {(view !== 'menu' || isCartOpen || isCheckoutOpen || selectedProduct) && (
        <button 
          onClick={goBack}
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-white text-stone-900 p-4 rounded-full shadow-xl border-2 border-stone-200 hover:bg-stone-100 hover:-translate-y-2 transition-all z-[90] flex items-center justify-center group"
          title="Voltar"
        >
          <ArrowLeft size={28} />
          <span className="absolute right-full mr-4 bg-stone-900 text-white font-bold px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
            Voltar
          </span>
        </button>
      )}

      {/* Cart Button (Floating) */}
      <button 
        onClick={() => { openCart(); playSound('jump'); }}
        className="fixed bottom-4 left-4 md:bottom-8 md:left-8 bg-yellow-400 text-black p-4 rounded-full border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-y-2 transition-all z-[90] flex items-center justify-center group"
      >
        <ShoppingCart size={32} />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 border-2 border-black text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-[2px_2px_0px_#000]">
            {cart.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        )}
        <span className="absolute left-full ml-4 bg-white text-black font-bold font-display px-3 py-1 rounded-lg border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-[2px_2px_0px_#000] pointer-events-none">
          Sua Sacola
        </span>
      </button>

      <div className="relative z-10">
        {view === 'menu' && renderMenu()}
        {view === 'game' && <DogGame order={activeOrder} onFinishOrder={handleFinishOrder} onClose={() => { navigateToView('menu'); window.scrollTo(0,0); }} onViewAbout={() => { navigateToView('about'); window.scrollTo(0,0); }} />}
        {view === 'admin' && <AdminPanel onClose={() => navigateToView('menu')} />}
      </div>
      
      <AnimatePresence>
        {showFlyingDog && (
          <motion.div 
            initial={{ x: '-100vw', y: '50vh', rotate: -20 }}
            animate={{ x: '100vw', y: '20vh', rotate: 20 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="fixed inset-0 pointer-events-none z-[100] text-9xl drop-shadow-2xl flex items-center justify-center"
          >
            <img loading="lazy" decoding="async"  src="/cochirrinho16bit.png" alt="Cachorrinho" className="w-48 h-48 object-contain drop-shadow-2xl scale-x-[-1]" />
          </motion.div>
        )}
      </AnimatePresence>

      
      {/* Modals Popups */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative text-left"
            >
              <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center hover:bg-stone-200">
                <Plus className="rotate-45" size={20} />
              </button>
              
              {activeModal === 'privacy' && (
                <>
                  <h2 className="text-2xl font-black uppercase text-[#4E2A84] mb-4">Política de Privacidade</h2>
                  <div className="space-y-4 text-stone-600 text-sm font-medium leading-relaxed">
                    <p>Sua privacidade é muito importante para nós. Esta política descreve como coletamos, usamos e protegemos as suas informações pessoais ao utilizar nosso aplicativo de delivery.</p>
                    <h3 className="text-lg font-bold text-stone-900 mt-6">1. Coleta de Dados</h3>
                    <p>Coletamos informações necessárias para processar seu pedido, como nome, endereço de entrega e dados de contato. Seus dados de pagamento são processados de forma segura e não armazenados em nossos servidores.</p>
                    <h3 className="text-lg font-bold text-stone-900 mt-4">2. Uso das Informações</h3>
                    <p>Utilizamos seus dados exclusivamente para garantir a entrega rápida do seu lanche, informar sobre o status do pedido e, caso você autorize, enviar promoções exclusivas da <NickelText /> Lanches.</p>
                    <p>Ao continuar usando nosso serviço, você concorda com nossa política.</p>
                  </div>
                </>
              )}

              {activeModal === 'cookies' && (
                <>
                  <h2 className="text-2xl font-black uppercase text-[#4E2A84] mb-4">Política de Cookies</h2>
                  <div className="space-y-4 text-stone-600 text-sm font-medium leading-relaxed">
                    <p>Utilizamos cookies para melhorar sua experiência em nossa plataforma, entender como você interage com nosso cardápio e oferecer recursos personalizados.</p>
                    <h3 className="text-lg font-bold text-stone-900 mt-6">1. O que são Cookies?</h3>
                    <p>Cookies são pequenos arquivos de texto salvos no seu dispositivo que ajudam o site a se lembrar de suas preferências, como os itens no seu carrinho.</p>
                    <h3 className="text-lg font-bold text-stone-900 mt-4">2. Gerenciamento</h3>
                    <p>Você pode desativar os cookies nas configurações do seu navegador, mas isso pode impedir o funcionamento correto de algumas funções, como salvar seus itens favoritos.</p>
                  </div>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <h2 className="text-2xl font-black uppercase text-[#4E2A84] mb-4">Termos de Uso</h2>
                  <div className="space-y-4 text-stone-600 text-sm font-medium leading-relaxed">
                    <p>Estes Termos de Uso regulam a utilização do nosso serviço de delivery.</p>
                    <h3 className="text-lg font-bold text-stone-900 mt-6">1. Pedidos</h3>
                    <p>Ao realizar um pedido, você concorda com os preços, taxas de entrega e tempos estimados informados no checkout. As imagens do cardápio são ilustrativas, mas garantimos a qualidade e o sabor.</p>
                    <h3 className="text-lg font-bold text-stone-900 mt-4">2. Cancelamentos</h3>
                    <p>Cancelamentos só podem ser realizados antes da confirmação pela cozinha. Uma vez em preparo, não poderemos estornar o valor integral.</p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={goBack}
        cart={cart}
        total={totalCart}
        discountAmount={discountAmount}
        onConfirm={handleCheckout}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={goBack}
        cart={cart}
        onRemoveItem={removeFromCart}
        discountCode={discountCode}
        setDiscountCode={setDiscountCode}
        onApplyDiscount={applyDiscount}
        onRemoveDiscount={removeDiscount}
        appliedDiscount={appliedDiscount}
        totalCartBase={totalCartBase}
        discountAmount={discountAmount}
        totalCart={totalCart}
        onCheckout={() => { setIsCartOpen(false); openCheckout(); }}
      />
      <ProductModal 
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={goBack}
        onAddToCart={handleAddToCart}
      />

      {/* Plaquinha de Trânsito Amarela Flutuante */}
      <TrafficSignDiscount variant="floating" onApplyCoupon={(c) => applyDiscount(c)} />
      </div>
    </div>
  );
}
