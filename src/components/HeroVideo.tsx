import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { subscribeToBanners, Banner } from '../lib/db';

interface HeroVideoProps {
  onGoToStore: (showLastOrders: boolean) => void;
  onOpenProduct?: (productId: string) => void;
}

export default function HeroVideo({ onGoToStore, onOpenProduct }: HeroVideoProps) {
  const scrollToMenu = () => {
    document.getElementById('cardapio')?.scrollIntoView({ behavior: 'smooth' });
  };

  const promos = [
    {
      id: 1,
      productId: "32",
      image: "/images/magma-1.png",
      title: "Xis Magma",
      description: "Carne, queijo muçarela, provolone, cheddar, calabresa, milho, tomate, maionese caseira."
    },
    {
      id: 2,
      productId: "33",
      image: "/images/xiscemuche-1.jpg",
      title: "Xis Cemuche",
      description: "2 carnes, cebola caramelizada, 2 queijos muçarela, dupla cheddar, molho especial apimentado..."
    },
    {
      id: 3,
      productId: "35",
      image: "/images/bomba-1.png",
      title: "Xis Bomba",
      description: "Carne, queijo muçarela, cheddar, milho, ervilha, bacon, batata frita, barbecue, maionese caseira."
    },
    {
      id: 4,
      productId: "31",
      image: "/images/olympus-1.png",
      title: "Xis Olympus",
      description: "Carne, queijo, bacon, ovo, anéis de cebola, alface, tomate, barbecue e maionese caseira."
    }
  ];

  const [currentPromo, setCurrentPromo] = useState(0);

  const nextPromo = () => setCurrentPromo((prev) => (prev + 1) % promos.length);
  const prevPromo = () => setCurrentPromo((prev) => (prev - 1 + promos.length) % promos.length);

  useEffect(() => {
    const interval = setInterval(nextPromo, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative rounded-[24px] md:rounded-[32px] overflow-hidden shadow-xl min-h-[350px] md:min-h-[500px] flex items-center justify-center bg-stone-900">
      {/* Video Background */}
      <video preload="auto" 
        autoPlay loop muted playsInline 
        className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-[0.25]"
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-burger-with-a-lot-of-cheese-and-bacon-43013-large.mp4" type="video/mp4" />
        Seu navegador não suporta vídeos.
      </video>
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-6xl mx-auto py-6 sm:py-10 md:py-16 px-4">
        
        {/* Banner Carousel */}
        {promos.length > 0 && (
        <div className="relative w-full aspect-[4/3] md:aspect-[21/9] rounded-2xl md:rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] mb-6 md:mb-8 border border-white/10 group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPromo}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full bg-stone-100 cursor-pointer"
              onClick={() => {
                if (onOpenProduct && promos[currentPromo].productId) {
                  onOpenProduct(promos[currentPromo].productId);
                }
              }}
            >
              <img loading="lazy" decoding="async"  src={promos[currentPromo].image} alt={promos[currentPromo].title} className="w-full h-full object-cover object-[center_center] md:object-[center_60%] transition-transform duration-700 hover:scale-105" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end items-start p-4 sm:p-6 md:p-12 text-left pointer-events-none h-full pt-[30%]">
                <span className="bg-[#F28B20] text-white font-black px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-sm uppercase tracking-widest shadow-lg mb-2 md:mb-3">
                  🔥 Peça Agora
                </span>
                <h3 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white mb-1 md:mb-2 leading-none drop-shadow-xl">
                  {promos[currentPromo].title}
                </h3>
                <p className="text-stone-200 font-bold text-xs sm:text-sm md:text-xl drop-shadow-md max-w-3xl line-clamp-2 md:line-clamp-none">
                  {promos[currentPromo].description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <button onClick={prevPromo} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/20">
            <ChevronLeft size={24} />
          </button>
          <button onClick={nextPromo} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/20">
            <ChevronRight size={24} />
          </button>

          {/* Dots */}
          {promos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {promos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPromo(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${idx === currentPromo ? 'w-8 bg-[#F28B20]' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
          )}
        </div>
        )}
        
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full flex flex-col sm:flex-row justify-center gap-4 max-w-2xl mx-auto">
          <button onClick={() => onGoToStore(false)} className="bg-stone-900/50 backdrop-blur-sm border-2 border-white/20 text-white font-black px-8 py-4 md:px-10 md:py-5 rounded-full flex items-center justify-center gap-3 hover:bg-white/10 hover:border-white/40 transition-all uppercase tracking-widest text-sm md:text-base w-full sm:w-auto shadow-lg">
            Cardápio Completo
          </button>
          <button onClick={() => onGoToStore(true)} className="bg-[#F28B20] text-white font-black px-8 py-4 md:px-10 md:py-5 rounded-full flex items-center justify-center gap-3 hover:bg-orange-500 transition-transform hover:scale-105 shadow-[0_8px_30px_rgba(242,139,32,0.4)] uppercase tracking-widest text-sm md:text-base w-full sm:w-auto">
            Faça seu Pedido <ArrowRight size={24} />
          </button>
        </motion.div>

      </div>
    </div>
  );
}
