/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Star, ChefHat, LogOut, ArrowRight, Dog, Tag, Heart } from 'lucide-react';
import { MENU_ITEMS, DISCOUNT_CODES } from './data';
import { CartItem, Product, OrderInfo } from './types';
import DogGame from './components/DogGame';
import AdminPanel from './components/AdminPanel';
import Sidebar from './components/Sidebar';
import FloatingBackground from './components/FloatingBackground';
import FeedbacksSection from './components/FeedbacksSection';
import PromoSection from './components/PromoSection';
import StorySection from './components/StorySection';
import GallerySection from './components/GallerySection';
import LoyaltyLevels from './components/LoyaltyLevels';
import FAQSection from './components/FAQSection';
import LocationSection from './components/LocationSection';
import HeroVideo from './components/HeroVideo';
import ProductModal from './components/ProductModal';
import { useToast } from './components/Toast';
import { auth } from './lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { subscribeToProducts, subscribeToPromos, seedDatabase, createUserProfile, getUserProfile, addXpToUser, saveOrder, UserProfile, Order } from './lib/db';
import { playSound } from './lib/audio';

export default function App() {
  const [view, setView] = useState<'menu' | 'game' | 'admin'>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderInfo | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderInfo[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeModal, setActiveModal] = useState<'privacy' | 'contact' | null>(null);
  const [showCookies, setShowCookies] = useState(false);
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [discountCodes, setDiscountCodes] = useState<Record<string, number>>({});

  useEffect(() => {
    seedDatabase(MENU_ITEMS, DISCOUNT_CODES);
    const unsubProducts = subscribeToProducts(setMenuItems);
    const unsubPromos = subscribeToPromos((promos) => {
      const codeMap = promos.reduce((acc, curr) => ({ ...acc, [curr.code]: curr.discount }), {});
      setDiscountCodes(codeMap);
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

  const handleAcceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setShowCookies(false);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        await createUserProfile(u);
        const profile = await getUserProfile(u.uid);
        setUserProfile(profile);
        setUserPoints(profile?.xp || 0);
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
    setIsCartOpen(true);
    playSound('jump');
    addToast({
      title: 'Pedido Repetido!',
      message: 'Os itens foram adicionados à sua sacola.',
      type: 'success'
    });
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = (cartItem: CartItem) => {
    setCart(prev => [...prev, cartItem]);
    playSound('coin');
    addToast({
      message: `${cartItem.name} adicionado ao carrinho!`,
      type: 'success'
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const applyDiscount = () => {
    const code = discountCode.toUpperCase();
    if (discountCodes[code]) {
      setAppliedDiscount(discountCodes[code]);
      playSound('laser');
      addToast({ message: 'Cupom aplicado com sucesso!', type: 'success', title: 'Desconto' });
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

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    let orderId = Math.random().toString(36).substring(2, 9).toUpperCase();
    try {
      const uid = user ? user.uid : 'guest';
      orderId = await saveOrder(uid, {
        items: cart,
        totalPrice: totalCart,
        totalPoints: totalPoints,
        status: 'pendente', // initial status
        userName: user?.displayName || 'Anônimo'
      });
    } catch(e) {
      console.error("Error saving order", e);
    }

    const newOrder: OrderInfo = {
      id: orderId,
      items: [...cart],
      subtotal: totalCartBase,
      discount: discountAmount,
      total: totalCart,
      pointsEarned: totalPoints,
      status: 'pendente',
      timestamp: new Date()
    };
    
    setActiveOrder(newOrder);
    setOrderHistory(prev => [newOrder, ...prev]);
    setCart([]);
    setAppliedDiscount(null);
    setDiscountCode('');
    setIsCartOpen(false);
    setView('game');
    
    addToast({
      title: 'Pedido Enviado!',
      message: 'Seu lanche está sendo preparado na nave principal.',
      type: 'info'
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
        title: 'Missão Cumprida!',
        message: `Você ganhou +${activeOrder.pointsEarned} XP!`,
        type: 'xp'
      });
    }
    setView('menu');
    setActiveOrder(null);
    setShowReview(true);
  };

  const xisItems = menuItems.filter(i => i.name.toLowerCase().includes('xis') && !i.name.toLowerCase().includes('combo') && !i.name.toLowerCase().includes('trio'));
  const hotDogItems = menuItems.filter(i => i.name.toLowerCase().includes('cachorro quente') && !i.name.toLowerCase().includes('combo') && !i.name.toLowerCase().includes('trio'));
  const portionItems = menuItems.filter(i => i.name.toLowerCase().includes('batata frita') && !i.name.toLowerCase().includes('combo') && !i.name.toLowerCase().includes('trio'));
  const extraItems = menuItems.filter(i => !i.name.toLowerCase().includes('xis') && !i.name.toLowerCase().includes('cachorro quente') && !i.name.toLowerCase().includes('batata frita') && !i.id.startsWith('c') && !i.name.toLowerCase().includes('combo') && !i.name.toLowerCase().includes('trio'));

  const renderProductGrid = (items: Product[], title: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-10">
        <h3 className="text-2xl md:text-3xl font-display uppercase mb-4 border-b-4 border-black border-dashed pb-2 inline-block text-white">{title}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 flex-grow">
          {items.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
              className="comic-panel rounded-xl p-3 md:p-4 flex flex-col justify-between overflow-hidden relative cursor-pointer transition-transform hover:-translate-y-2 group"
              onClick={() => handleProductClick(item)}
            >
              <div className="absolute -right-4 -top-4 w-16 h-16 md:w-20 md:h-20 bg-yellow-400 rounded-full blur-xl md:blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              
              <div className="h-20 md:h-28 w-full bg-zinc-100 border-2 border-dashed border-zinc-300 rounded-lg mb-2 flex items-center justify-center relative z-10">
                <button
                  onClick={(e) => toggleFavorite(item.id, e)}
                  className="absolute top-1 left-1 md:top-2 md:left-2 z-20 w-6 h-6 md:w-8 md:h-8 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none"
                >
                  <Heart size={14} className={favorites.includes(item.id) ? 'fill-red-500 text-red-500' : 'text-zinc-400'} />
                </button>
                <span className="text-4xl md:text-6xl drop-shadow-md group-hover:scale-125 transition-transform duration-300">
                  {item.emoji}
                </span>
                <div className="absolute top-1 right-1 md:top-2 md:right-2 flex items-center gap-1 bg-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold text-zinc-900 border-2 border-black shadow-[1px_1px_0px_#F9E822] md:shadow-[2px_2px_0px_#F9E822]">
                  <Star size={8} className="text-yellow-500" /> +{item.points}
                </div>
              </div>
              
              <div className="flex justify-between items-start mb-1 relative z-10 text-black">
                <h3 className="text-sm md:text-xl font-bold font-display tracking-wide leading-tight">{item.name}</h3>
              </div>
              <p className="text-[9px] md:text-[10px] text-zinc-600 font-bold uppercase leading-tight mb-3 min-h-[30px] relative z-10 line-clamp-3 md:line-clamp-none">{item.description}</p>
              
              <div className="flex justify-between items-center mt-auto relative z-10">
                <span className="text-black font-display text-sm md:text-xl tracking-wider">R$ {item.price.toFixed(2)}</span>
                <button className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 text-black border-2 border-black rounded-full flex items-center justify-center hover:bg-yellow-300 transition-colors shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] shrink-0">
                  <ShoppingCart size={14} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderMenu = () => (
    <div className="w-full px-4 md:px-10 py-8 mx-auto max-w-[2560px]">
      {/* Header */}
      <header className="flex flex-col xl:flex-row justify-between items-center xl:items-center border-b-4 border-black border-dashed pb-6 mb-8 relative gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 relative z-10 w-full xl:w-auto text-center md:text-left">
          <motion.div 
            animate={{ rotate: [-3, 3, -3], y: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            onClick={handleLogoClick}
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 shrink-0 drop-shadow-[0_0_15px_rgba(244,228,45,0.4)] cursor-pointer mx-auto md:mx-0"
          >
            <img src="/logonickel-1.png" alt="Nickel Lanches" className="w-full h-full object-contain" />
          </motion.div>
          <div className="flex flex-col mt-4 md:mt-0">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-8xl font-logo leading-none tracking-tight flex flex-wrap justify-center md:justify-start gap-x-2 md:gap-x-4"
            >
              <span className="comic-text-bold">NICKEL</span>
              <span className="comic-text-bold !text-white">LANCHES</span>
            </motion.h1>
            <p className="text-xs sm:text-xs md:text-sm tracking-[0.2em] uppercase text-yellow-400 neon-text font-bold mt-2">O lanche mais divertido e animal do planeta! 🐶🚀</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2 xl:mt-0 w-full xl:w-auto">
          <div className="flex text-center md:text-right flex-col bg-zinc-900 md:bg-transparent border-2 border-black md:border-transparent p-2 md:p-0 rounded-xl shadow-[2px_2px_0px_#000] md:shadow-none">
            <span className="block text-[10px] md:text-[10px] uppercase opacity-50 text-yellow-400 md:text-white">Seus Pontos</span>
            <span className="text-xl md:text-2xl font-display text-yellow-400 flex items-center justify-center md:justify-end gap-1"><Star size={20} className="text-yellow-400" /> {userPoints} XP</span>
          </div>
          
          <button 
            onClick={() => setView('admin')}
            className="p-3 bg-white text-black border-2 border-black rounded-xl hover:bg-zinc-100 shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] transition-all hover:-translate-y-1"
            title="Painel do Garçom"
          >
            <ChefHat size={24} />
          </button>
        </div>
      </header>

      <HeroVideo />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Products Grid */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          
          <PromoSection 
            combos={menuItems.filter(i => i.id.startsWith('c') || i.name.toLowerCase().includes('combo') || i.name.toLowerCase().includes('trio'))} 
            onComboClick={setSelectedProduct} 
          />

          {/* Fun Banner */}
          <div className="relative comic-panel-alt rounded-2xl p-6 md:p-8 mb-4 overflow-hidden">
            <div className="absolute inset-0 opacity-5 game-bg" style={{ backgroundAttachment: 'fixed' }}></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-black">
              <motion.div 
                animate={{ y: [-15, 15, -15], rotate: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 5 }}
                className="text-6xl md:text-8xl drop-shadow-md"
              >
                🌭
              </motion.div>
              <div className="text-center md:text-left flex-1">
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-display text-black comic-text-bold uppercase mb-2 leading-none">HORA DO LANCHE!</h3>
                <p className="text-xs md:text-sm uppercase tracking-widest text-zinc-800 font-bold">Peça agora, jogue com o doguinho e suba no ranking!</p>
              </div>
              <motion.div 
                animate={{ y: [15, -15, 15], rotate: [10, -10, 10], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="text-6xl md:text-8xl drop-shadow-[0_0_30px_rgba(255,255,0,0.8)] hidden md:block"
              >
                🎮
              </motion.div>
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-display uppercase mb-6 drop-shadow-[2px_2px_0px_#fff]">O Cardápio Mágico</h2>
          <div className="flex flex-col gap-4 flex-grow">
            {renderProductGrid(xisItems, 'Xis')}
            {renderProductGrid(hotDogItems, 'Cachorro Quente')}
            {renderProductGrid(portionItems, 'Porções')}
            {renderProductGrid(extraItems, 'Bebidas e Extras')}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Sidebar user={user} onReorder={handleReorder} />
        </div>
      </div>

      {/* Info Sections */}
      <div className="mt-16 space-y-8 relative z-10 text-black">
        <LoyaltyLevels />
        <StorySection />
        <GallerySection />
        <LocationSection />
        <FAQSection />

        {/* Feedbacks Section */}
        <FeedbacksSection user={user} orderHistory={orderHistory} />
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t-4 border-black border-dashed flex flex-col md:flex-row justify-between items-center text-zinc-500 font-bold relative z-10 gap-4 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-2">
          <Dog size={24} className="text-yellow-500" />
          <span className="text-sm md:text-base">© 2024 Nickel Lanches. Todos os direitos caninos reservados.</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-sm mt-2 md:mt-0">
          <button onClick={() => setActiveModal('privacy')} className="hover:text-black hover:underline underline-offset-4 decoration-yellow-400 decoration-4">Termos de Privacidade</button>
          <button onClick={() => setActiveModal('contact')} className="hover:text-black hover:underline underline-offset-4 decoration-yellow-400 decoration-4">Contato</button>
        </div>
      </footer>

      {/* Cart Slide-over */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l-4 border-black z-50 p-6 flex flex-col text-black shadow-[-10px_0_0px_#F9E822]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-display uppercase comic-text-bold tracking-wider">Sua Sacola</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 border-2 border-transparent hover:border-black rounded-xl hover:shadow-[2px_2px_0px_#000] transition-all bg-white hover:-translate-y-1">
                  <ArrowRight size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {cart.length === 0 ? (
                  <div className="text-center text-zinc-500 mt-20">
                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold">Sua sacola está vazia.</p>
                    <p className="text-sm">Que tal adicionar um lanche animal?</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.cartItemId} className="flex flex-col gap-2 bg-zinc-100 p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
                      <div className="flex gap-4 items-center">
                        <span className="text-3xl bg-white w-12 h-12 flex items-center justify-center rounded-full border-2 border-black shadow-[1px_1px_0px_#000]">{item.emoji}</span>
                        <div className="flex-1">
                          <h4 className="font-bold font-display tracking-wide">{item.name}</h4>
                          <p className="text-zinc-800 font-bold">R$ {item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg font-display">x{item.quantity}</span>
                          <button 
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="text-red-500 hover:text-red-600 text-sm font-bold bg-white px-2 py-1 border-2 border-black rounded-lg shadow-[1px_1px_0px_#000]"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                      {item.extras && item.extras.length > 0 && (
                        <div className="text-xs text-zinc-600 font-bold mt-1">
                          <span className="text-black">+ Extras:</span> {item.extras.map(e => e.name).join(', ')} (+ R$ {item.extras.reduce((s, e) => s + e.price, 0).toFixed(2)})
                        </div>
                      )}
                      {item.observation && (
                        <div className="text-xs text-zinc-600 font-bold italic mt-1 bg-white p-2 border border-zinc-300 rounded">
                          " {item.observation} "
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {cart.length > 0 && (
                <div className="border-t-4 border-black border-dashed pt-6 mt-6">
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      placeholder="Cupom (ex: NICKEL10)" 
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="flex-1 border-2 border-black rounded-lg p-2 font-bold outline-none focus:ring-4 focus:ring-yellow-400/50 uppercase"
                    />
                    <button 
                      onClick={applyDiscount}
                      className="bg-black text-yellow-400 font-display uppercase px-4 rounded-lg border-2 border-black shadow-[2px_2px_0px_#F9E822] hover:shadow-[4px_4px_0px_#F9E822] transition-all active:-translate-y-0.5"
                    >
                      Aplicar
                    </button>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-zinc-600">Subtotal:</span>
                    <span className="font-bold">R$ {totalCartBase.toFixed(2)}</span>
                  </div>
                  {appliedDiscount !== null && (
                    <div className="flex justify-between items-center mb-2 text-green-600">
                      <span className="font-bold flex items-center gap-1"><Tag size={16} /> Desconto</span>
                      <span className="font-bold">- R$ {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-2 mt-4 pt-2 border-t-2 border-zinc-200">
                    <span className="text-zinc-600 font-bold uppercase">Total:</span>
                    <span className="text-2xl font-bold font-display">R$ {totalCart.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-6 text-sm text-yellow-500">
                    <span className="font-bold">Pontos a ganhar:</span>
                    <span className="font-bold flex items-center gap-1 bg-white border-2 border-black px-2 py-0.5 rounded-full shadow-[1px_1px_0px_#000] text-black"><Star size={14} className="text-yellow-500"/> {totalPoints} pts</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full py-4 bg-yellow-400 text-black border-2 border-black font-display text-xl tracking-widest uppercase rounded-xl shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#000]"
                  >
                    Finalizar Pedido
                    <ArrowRight size={20} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Review Modal */}
      <AnimatePresence>
        {showReview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-black rounded-2xl p-8 max-w-sm w-full text-center shadow-[8px_8px_0px_#000]"
            >
              <span className="text-6xl mb-4 block drop-shadow-md">🤩</span>
              <h2 className="text-4xl font-display uppercase text-black comic-text-bold tracking-wide mb-2">O que achou do lanche?</h2>
              <p className="text-zinc-600 font-bold text-sm mb-6 uppercase tracking-widest">Sua avaliação ajuda a melhorar a casa!</p>
              
              <div className="flex justify-center gap-2 mb-8">
                {[1,2,3,4,5].map(star => (
                  <button key={star} className="text-yellow-400 hover:scale-125 transition-transform" onClick={() => setShowReview(false)}>
                    <Star size={32} fill="currentColor" className="drop-shadow-[1px_1px_0px_#000]" />
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setShowReview(false)}
                className="w-full py-3 bg-yellow-400 border-2 border-black text-black font-display tracking-widest uppercase rounded-xl hover:bg-yellow-500 shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] transition-all hover:-translate-y-1"
              >
                Pular
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Parallax Background */}
      <div className="fixed inset-0 pointer-events-none z-0 game-bg opacity-20" style={{ backgroundAttachment: 'fixed', backgroundPosition: 'center' }}></div>
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 0, 0.1) 0%, transparent 70%)', backgroundAttachment: 'fixed' }}></div>
      
      <FloatingBackground />

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

      {/* Cart Button (Floating) */}
      <button 
        onClick={() => { setIsCartOpen(true); playSound('jump'); }}
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

      {/* WhatsApp Button */}
      <a 
        href="https://wa.me/5511999999999" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-[#25D366] text-white p-4 rounded-full border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-y-2 transition-all z-[90] flex items-center justify-center group"
      >
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
        <span className="absolute right-full mr-4 bg-white text-black font-bold font-display px-3 py-1 rounded-lg border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-[2px_2px_0px_#000] pointer-events-none">
          Peça pelo Zap!
        </span>
      </a>

      <div className="relative z-10">
        {view === 'menu' && renderMenu()}
        {view === 'game' && <DogGame order={activeOrder} onFinishOrder={handleFinishOrder} />}
        {view === 'admin' && <AdminPanel onClose={() => setView('menu')} />}
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
            🐶🚀
          </motion.div>
        )}
      </AnimatePresence>

      <ProductModal 
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
