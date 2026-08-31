import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroVideoProps {
  onGoToStore: (showLastOrders: boolean) => void;
}

export default function HeroVideo({ onGoToStore }: HeroVideoProps) {
  const scrollToMenu = () => {
    document.getElementById('cardapio')?.scrollIntoView({ behavior: 'smooth' });
  };

  const promos = [
    {
      id: 1,
      image: "/images/comboloucura.jpg",
      title: "Promoção Loucura",
      description: "4 X-Especiais por R$ 90 + Refri 2L Charrua"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=1200&auto=format&fit=crop",
      title: "Promoção Fim de Mês",
      description: "Batata Frita com Maionese Caseira por R$ 6!"
    },
    {
      id: 3,
      image: "/images/combinhocasal.jpg",
      title: "Combinho Casal",
      description: "O lanche perfeito para dividir com quem você ama!"
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
    <div className="w-full relative rounded-[24px] md:rounded-[32px] overflow-hidden shadow-xl min-h-[500px] flex items-center justify-center bg-stone-900">
      {/* Video Background */}
      <video 
        autoPlay loop muted playsInline 
        className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-[0.25]"
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-burger-with-a-lot-of-cheese-and-bacon-43013-large.mp4" type="video/mp4" />
        Seu navegador não suporta vídeos.
      </video>
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-6xl mx-auto py-10 md:py-16 px-4">
        
        {/* Banner Carousel */}
        <div className="relative w-full aspect-[4/4] sm:aspect-[16/9] md:aspect-[21/9] rounded-2xl md:rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] mb-8 border border-white/10 group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPromo}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full bg-stone-900"
            >
              <img src={promos[currentPromo].image} alt={promos[currentPromo].title} className="w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end items-start p-6 md:p-12 text-left">
                <span className="bg-[#F28B20] text-white font-black px-4 py-1.5 rounded-full text-xs md:text-sm uppercase tracking-widest shadow-lg mb-3">
                  🔥 Destaque
                </span>
                <h3 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white mb-2 leading-none drop-shadow-xl">
                  {promos[currentPromo].title}
                </h3>
                <p className="text-stone-200 font-bold text-sm md:text-xl drop-shadow-md max-w-3xl">
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
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {promos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPromo(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentPromo ? 'w-8 bg-[#F28B20]' : 'w-2 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </div>
        
        
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
