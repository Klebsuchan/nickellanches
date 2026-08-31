/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import NickelText from './components/NickelText';
import RenderWithNickel from './components/RenderWithNickel';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Plus, Menu, Search, SlidersHorizontal, Bell, ShoppingCart, Star, ChefHat, LogOut, ArrowRight, Dog, Tag, Heart, Utensils, BookOpen, Flame, Info, Home, ShoppingBag, User, LayoutGrid } from 'lucide-react';
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
import { useToast } from './components/Toast';
import { auth } from './lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { subscribeToProducts, subscribeToPromos, seedDatabase, createUserProfile, getUserProfile, addXpToUser, saveOrder, UserProfile, Order } from './lib/db';
import { playSound } from './lib/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<'cardapio' | 'historia' | 'cozinha' | 'comunidade'>('cardapio');
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | 'Xis' | 'Cachorro Quente' | 'Bebidas'>('Todos');
  const [view, setView] = useState<'menu' | 'store' | 'game' | 'admin' | 'about' | 'profile'>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderInfo | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderInfo[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeModal, setActiveModal] = useState<'privacy' | 'contact' | 'terms' | 'cookies' | null>(null);
  const [showCookies, setShowCookies] = useState(true);
  const [showLastOrdersState, setShowLastOrdersState] = useState(false);
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
        status: 'preparando', // initial status
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
      status: 'preparando',
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
      <div className="flex overflow-x-auto gap-4 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-6 pb-6 snap-x hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {items.map((item, index) => {
          let badge = null;
          if (index === 0) badge = <span className="bg-[#4E2A84] text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest absolute top-4 left-4 z-20 shadow-sm">Bestseller</span>;
          else if (index === 1) badge = <span className="bg-[#F28B20] text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest absolute top-4 left-4 z-20 shadow-sm">Popular</span>;
          else if (index === 2) badge = <span className="bg-[#4E2A84] text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest absolute top-4 left-4 z-20 shadow-sm">Save 15%</span>;

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -5 }}
              className="min-w-[260px] md:min-w-0 bg-white rounded-3xl p-5 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative cursor-pointer border border-stone-100 snap-start shrink-0"
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
                   <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                 ) : (
                   <span className="text-8xl group-hover:scale-110 transition-transform duration-300 drop-shadow-xl translate-y-2">
                      {item.emoji}
                   </span>
                 )}
              </div>
              
              <div className="flex flex-col gap-1 z-10 relative px-1">
                <h4 className="font-bold text-stone-900 leading-tight line-clamp-1 text-lg tracking-tight"><RenderWithNickel text={item.name} /></h4>
                <p className="text-xs text-stone-500 line-clamp-2 min-h-[2rem] leading-relaxed font-medium mb-1.5">{item.description}</p>
                
                <div className="flex items-center gap-1.5 mb-4">
                  <Star size={14} className="text-[#F28B20]" fill="currentColor" />
                  <span className="text-xs font-bold text-stone-700">{(4 + Math.random()).toFixed(1)}</span>
                  <span className="text-xs text-stone-400">({(Math.random() * 20).toFixed(1)}K+)</span>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-black text-stone-900 tracking-tighter">
                    R$ {item.price.toFixed(2).replace('.', ',')}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAddToCart({ ...item, quantity: 1, cartItemId: Math.random().toString(36).substring(2, 9) }); }}
                    className="w-10 h-10 bg-[#F28B20] text-white rounded-full flex items-center justify-center hover:bg-orange-500 transition-transform hover:scale-105 shadow-[0_4px_15px_rgba(242,139,32,0.4)]"
                  >
                    <Plus size={20} strokeWidth={3} />
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
        {/* Header Store */}
        <header className="sticky top-0 z-50 bg-white border-b border-stone-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-0 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => { setView('menu'); window.scrollTo(0,0); }} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-900 hover:bg-stone-200 transition-colors">
                <ArrowRight size={20} className="rotate-180" />
              </button>
              <h1 className="text-xl md:text-2xl font-black text-[#4E2A84] font-display uppercase tracking-widest leading-none mt-1">VOLTAR AO INÍCIO</h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <button onClick={() => setIsCartOpen(true)} className="w-10 h-10 md:w-12 md:h-12 bg-[#F28B20] rounded-full flex items-center justify-center text-white relative shadow-md hover:bg-orange-500 transition-colors">
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
          <AutoMarquee items={lastOrderedProducts} onItemClick={setSelectedProduct} />
        )}

        <div id="cardapio" className="max-w-7xl mx-auto px-4 md:px-8 xl:px-0 py-12">
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
               : menuItems.filter(item => item.category === selectedCategory.toLowerCase()),
            selectedCategory === 'Todos' ? 'Todos os Lanches' : selectedCategory
          )}
        </div>
    </div>
  );
};


  const renderMenu = () => (
    <div className="w-full pb-0 bg-transparent">
      {/* Header com Navegação */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-0 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <img src="/logo.png" alt="Nickel Lanches" className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-md" />
            <div className="flex flex-col justify-center -ml-2 sm:-ml-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl tracking-tighter leading-none"><NickelText /></h1>
              <h2 className="text-sm sm:text-lg md:text-xl tracking-tighter leading-none -mt-0.5 sm:-mt-1" style={{ fontFamily: '"Russo One", sans-serif', fontStyle: 'italic', color: '#FFFFFF', WebkitTextStroke: '1px black', textShadow: '1px 1px 0px #000' }}>LANCHES</h2>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8">
            <button onClick={() => { setView('store'); setShowLastOrdersState(false); window.scrollTo(0,0); }} className="text-sm font-bold uppercase tracking-wider text-stone-600 hover:text-[#F28B20] transition-colors">Cardápio</button>
            <button onClick={() => { document.getElementById('quem-somos')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-bold uppercase tracking-wider text-stone-600 hover:text-[#F28B20] transition-colors">Quem Somos</button>
            <button onClick={() => { document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-bold uppercase tracking-wider text-stone-600 hover:text-[#F28B20] transition-colors">Contato</button>
            <button onClick={() => setView('game')} className="text-sm font-bold uppercase tracking-wider text-[#4E2A84] hover:text-[#F28B20] transition-colors flex items-center gap-2"><Dog size={16}/> Jogue nosso jogo</button>
            <button onClick={() => { setView('store'); setShowLastOrdersState(true); window.scrollTo(0,0); }} className="bg-[#F28B20] text-white px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors shadow-sm">Faça seu Pedido</button>
          </nav>

          <div className="flex items-center gap-2 md:gap-3 lg:hidden">
            <button onClick={() => setView('profile')} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-[#F28B20]">
              <User size={18} />
            </button>
            <button onClick={() => setIsCartOpen(true)} className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-900 relative">
              <ShoppingBag size={18} />
              {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4E2A84] rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
          
          {/* Desktop User/Cart icons */}
          <div className="hidden lg:flex items-center gap-3">
             <button onClick={() => setView('profile')} className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-[#F28B20] border border-stone-200 hover:bg-stone-100 transition-colors">
              <User size={20} />
            </button>
            <button onClick={() => setIsCartOpen(true)} className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-stone-900 border border-stone-200 hover:bg-stone-100 transition-colors relative">
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
        <HeroVideo onGoToStore={(showLastOrders) => { setView('store'); setShowLastOrdersState(showLastOrders); window.scrollTo(0, 0); }} />
      </div>

      {/* Quem Somos Section */}
      <div id="quem-somos" className="bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-0 py-8 md:py-16">
          <AppetiteVideo onGoToStore={(showLastOrders) => { setView('store'); setShowLastOrdersState(showLastOrders); window.scrollTo(0, 0); }} />
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
        <ProfileView onClose={() => setView('menu')} />
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
        href="https://wa.me/5554999598388" 
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
        {view === 'game' && <DogGame order={activeOrder} onFinishOrder={handleFinishOrder} onClose={() => { setView('menu'); window.scrollTo(0,0); }} onViewAbout={() => { setView('about'); window.scrollTo(0,0); }} />}
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

            <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={removeFromCart}
        discountCode={discountCode}
        setDiscountCode={setDiscountCode}
        onApplyDiscount={applyDiscount}
        appliedDiscount={appliedDiscount}
        totalCartBase={totalCartBase}
        discountAmount={discountAmount}
        totalCart={totalCart}
        onCheckout={() => setView('store')}
      />
      <ProductModal 
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
      </div>
    </div>
  );
}
