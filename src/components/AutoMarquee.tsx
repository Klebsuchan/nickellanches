import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';

interface AutoMarqueeProps {
  items: Product[];
  onItemClick: (item: Product) => void;
}

export default function AutoMarquee({ items, onItemClick }: AutoMarqueeProps) {
  // Duplicate the array to create a seamless loop
  const marqueeItems = [...items, ...items, ...items];

  if (!items || items.length === 0) return null;

  return (
    <div id="ultimos-pedidos" className="w-full overflow-hidden bg-[#F28B20] py-8 relative -mx-4 px-4 md:mx-0 md:px-0 scroll-mt-20">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
      
      <div className="max-w-7xl mx-auto mb-4 px-4">
        <h2 className="text-white font-black uppercase text-xl tracking-widest text-center">🔥 Últimos Pedidos</h2>
      </div>

      <div className="relative flex overflow-x-hidden group">
        <motion.div 
          className="flex gap-4 px-4 py-2"
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 15,
          }}
        >
          {marqueeItems.map((item, idx) => (
            <div 
              key={`${item.id}-${idx}`} 
              onClick={() => onItemClick(item)}
              className="bg-white rounded-2xl p-4 shadow-lg w-64 shrink-0 flex flex-col justify-between cursor-pointer hover:-translate-y-1 transition-transform border-b-4 border-black group/card"
            >
              <div className="h-32 w-full bg-[#FCF9F5] rounded-xl mb-3 flex items-center justify-center overflow-hidden relative">
                {item.image ? (
                   <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300" />
                 ) : (
                   <span className="text-6xl drop-shadow-xl group-hover/card:scale-110 transition-transform duration-300">
                      {item.emoji}
                   </span>
                 )}
              </div>
              <div>
                <h3 className="font-bold text-stone-900 truncate leading-tight uppercase tracking-tight">{item.name}</h3>
                <p className="text-[#F28B20] font-black text-lg mt-1">R$ {item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
