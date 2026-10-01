import React from 'react';
import { motion } from 'motion/react';

interface FloatingItem {
  type: 'word' | 'dog' | 'emoji' | 'napkin' | 'straw';
  text?: string;
  emoji?: string;
  size?: string;
  color?: string;
  x: string;
  duration: number;
  delay: number;
  rotateDelta?: number;
  initialRotate?: number;
}

const FLOATING_ITEMS: FloatingItem[] = [
  // PALAVRAS CÔMICAS SOLICITADAS
  { type: 'word', text: '🧀 QUEIJO', color: 'bg-[#FACC15] text-stone-950 border-black shadow-[4px_4px_0px_#000]', x: '6%', duration: 18, delay: 0, initialRotate: -8 },
  { type: 'word', text: '🍟 BATATA FRITA', color: 'bg-[#F28B20] text-white border-black shadow-[4px_4px_0px_#000]', x: '38%', duration: 17, delay: 4, initialRotate: 6 },
  { type: 'word', text: '🍔 X-NICKEL', color: 'bg-[#4E2A84] text-[#FACC15] border-black shadow-[4px_4px_0px_#000]', x: '72%', duration: 16, delay: 2, initialRotate: -10 },
  { type: 'word', text: '⭐ NICKEL LANCHES', color: 'bg-gradient-to-r from-[#4E2A84] to-[#F28B20] text-white border-black shadow-[4px_4px_0px_#000]', x: '88%', duration: 20, delay: 6, initialRotate: 8 },
  
  // SEGUNDA ONDA DE PALAVRAS COM OUTRAS CORES DO SITE
  { type: 'word', text: '🧀 QUEIJO', color: 'bg-amber-300 text-purple-950 border-purple-900 shadow-[4px_4px_0px_#4E2A84]', x: '52%', duration: 19, delay: 11, initialRotate: 12 },
  { type: 'word', text: '🍟 BATATA FRITA', color: 'bg-rose-500 text-yellow-200 border-black shadow-[4px_4px_0px_#000]', x: '18%', duration: 21, delay: 9, initialRotate: -6 },
  { type: 'word', text: '🍔 X-NICKEL', color: 'bg-[#F28B20] text-white border-black shadow-[4px_4px_0px_#000]', x: '84%', duration: 18, delay: 14, initialRotate: -8 },
  { type: 'word', text: '⭐ NICKEL LANCHES', color: 'bg-[#4E2A84] text-white border-[#FACC15] shadow-[4px_4px_0px_#000]', x: '24%', duration: 22, delay: 13, initialRotate: 10 },

  // O CACHORRINHO EM PIXELS DO JOGUINHO (PISCANDO COM BATATINHA FRITA NA MÃO)
  { type: 'dog', x: '12%', duration: 24, delay: 3, initialRotate: 5 },
  { type: 'dog', x: '62%', duration: 26, delay: 8, initialRotate: -8 },
  { type: 'dog', x: '80%', duration: 23, delay: 16, initialRotate: 10 },
  { type: 'dog', x: '32%', duration: 25, delay: 19, initialRotate: -4 },

  // ITENS TOTALMENTE A VER COM O DELIVERY:
  // Hambúrgueres / Xis
  { type: 'emoji', emoji: '🍔', size: 'text-5xl md:text-6xl', x: '2%', duration: 15, delay: 1, initialRotate: 15 },
  { type: 'emoji', emoji: '🍔', size: 'text-6xl md:text-7xl', x: '45%', duration: 18, delay: 7, initialRotate: -20 },
  { type: 'emoji', emoji: '🍔', size: 'text-5xl md:text-6xl', x: '92%', duration: 16, delay: 12, initialRotate: 25 },

  // Cachorro-quente
  { type: 'emoji', emoji: '🌭', size: 'text-5xl md:text-6xl', x: '15%', duration: 17, delay: 5, initialRotate: -15 },
  { type: 'emoji', emoji: '🌭', size: 'text-6xl md:text-7xl', x: '68%', duration: 16, delay: 1, initialRotate: 20 },
  { type: 'emoji', emoji: '🌭', size: 'text-5xl md:text-6xl', x: '35%', duration: 19, delay: 15, initialRotate: -10 },

  // Batata frita
  { type: 'emoji', emoji: '🍟', size: 'text-6xl md:text-7xl', x: '27%', duration: 15, delay: 2, initialRotate: 12 },
  { type: 'emoji', emoji: '🍟', size: 'text-6xl md:text-7xl', x: '78%', duration: 16, delay: 8, initialRotate: -18 },

  // Refrigerante e Bebidas
  { type: 'emoji', emoji: '🥤', size: 'text-5xl md:text-6xl', x: '22%', duration: 18, delay: 6, initialRotate: -12 },
  { type: 'emoji', emoji: '🥤', size: 'text-6xl md:text-7xl', x: '58%', duration: 17, delay: 3, initialRotate: 14 },
  { type: 'emoji', emoji: '🥤', size: 'text-5xl md:text-6xl', x: '96%', duration: 19, delay: 10, initialRotate: -16 },

  // Guardanapos estilizados de lanchonete
  { type: 'napkin', size: 'w-16 h-16 md:w-20 md:h-20', x: '9%', duration: 20, delay: 4, initialRotate: -15 },
  { type: 'napkin', size: 'w-14 h-14 md:w-16 md:h-16', x: '50%', duration: 22, delay: 12, initialRotate: 20 },
  { type: 'napkin', size: 'w-16 h-16 md:w-20 md:h-20', x: '74%', duration: 21, delay: 18, initialRotate: -10 },

  // Canudos de delivery listrados
  { type: 'straw', size: 'w-3 h-20 md:w-4 md:h-24', color: 'red', x: '30%', duration: 19, delay: 5, initialRotate: 35 },
  { type: 'straw', size: 'w-3 h-20 md:w-4 md:h-24', color: 'purple', x: '86%', duration: 18, delay: 11, initialRotate: -40 },
  { type: 'straw', size: 'w-3 h-20 md:w-4 md:h-24', color: 'orange', x: '42%', duration: 20, delay: 17, initialRotate: 45 },

  // Elementos adicionais de sabor
  { type: 'emoji', emoji: '🧀', size: 'text-5xl', x: '65%', duration: 16, delay: 13, initialRotate: -15 },
  { type: 'emoji', emoji: '🥓', size: 'text-5xl', x: '4%', duration: 17, delay: 14, initialRotate: 20 },
  { type: 'emoji', emoji: '🛵', size: 'text-5xl', x: '47%', duration: 14, delay: 8, initialRotate: -5 },
];

export default function FloatingBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {FLOATING_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          initial={{ y: '-35vh', rotate: item.initialRotate || 0 }}
          animate={{ 
            y: ['-35vh', '135vh'],
            rotate: [
              item.initialRotate || 0,
              (item.initialRotate || 0) + (item.rotateDelta ?? (item.type === 'dog' ? 20 : 360))
            ]
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute opacity-85 hover:opacity-100 will-change-transform"
          style={{ left: item.x, top: 0 }}
        >
          {/* 1. PALAVRAS CÔMICAS ESTILIZADAS COM AS CORES DO SITE */}
          {item.type === 'word' && (
            <div className={`${item.color} border-[3px] px-3.5 py-1.5 md:px-5 md:py-2 rounded-2xl transform hover:scale-105 transition-transform flex items-center gap-1.5`}>
              <span className="font-display font-black text-sm md:text-lg tracking-wider uppercase whitespace-nowrap drop-shadow-xs">
                {item.text}
              </span>
            </div>
          )}

          {/* 2. O CACHORRINHO PIXEL DO JOGUINHO (PISCANDO COM BATATA FRITA NA MÃO) */}
          {item.type === 'dog' && (
            <div className="relative flex flex-col items-center">
              <div className="relative animate-pulse">
                {/* Brilho piscando no topo */}
                <span className="absolute -top-2.5 -left-2.5 text-xs animate-ping">✨</span>
                
                {/* Card do cachorrinho pixel */}
                <div className="p-2 md:p-2.5 bg-white/95 border-[3px] border-stone-900 rounded-2xl shadow-[4px_4px_0px_#4E2A84] backdrop-blur-xs flex items-center justify-center relative transform hover:rotate-6 transition-transform">
                  <img 
                    src="/cochirrinho16bit.png" 
                    alt="Cachorrinho Nickel Lanches"
                    className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-xs"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  
                  {/* Batata frita na patinha */}
                  <span className="absolute -bottom-2 -right-2 text-2xl md:text-3xl filter drop-shadow animate-bounce">
                    🍟
                  </span>
                </div>
                
                {/* Badge cômico */}
                <span className="mt-1 block text-center text-[9px] md:text-[10px] font-black uppercase px-2 py-0.5 bg-[#FACC15] text-stone-900 border-2 border-black rounded-full shadow-[2px_2px_0px_#000] whitespace-nowrap">
                  Nickel Dog 🐾
                </span>
              </div>
            </div>
          )}

          {/* 3. COMIDAS DO DELIVERY (Hambúrguer, Cachorro-Quente, Fritas, Refri) */}
          {item.type === 'emoji' && (
            <div className="comic-panel p-2.5 md:p-3.5 rounded-2xl transform hover:scale-110 transition-transform bg-white/95 border-2 border-stone-900 shadow-[4px_4px_0px_rgba(0,0,0,0.8)] flex items-center justify-center">
              <span className={`${item.size} filter drop-shadow-sm`}>{item.emoji}</span>
            </div>
          )}

          {/* 4. GUARDANAPO XADREZ DE LANCHONETE */}
          {item.type === 'napkin' && (
            <div className={`${item.size} p-1 transform rotate-12 rounded-2xl overflow-hidden border-[3px] border-stone-900 shadow-[4px_4px_0px_#000] bg-white`}>
              <div className="w-full h-full checkered-black-yellow rounded-xl"></div>
            </div>
          )}

          {/* 5. CANUDO LISTRADO DE DELIVERY */}
          {item.type === 'straw' && (
            <div 
              className={`${item.size} rounded-full border-2 border-stone-900 shadow-[3px_3px_0px_#000] transform overflow-hidden`}
              style={{
                backgroundImage: item.color === 'purple' 
                  ? 'repeating-linear-gradient(45deg, #4E2A84, #4E2A84 7px, #FACC15 7px, #FACC15 14px)'
                  : item.color === 'orange'
                  ? 'repeating-linear-gradient(45deg, #F28B20, #F28B20 7px, #FFFFFF 7px, #FFFFFF 14px)'
                  : 'repeating-linear-gradient(45deg, #EF4444, #EF4444 7px, #FFFFFF 7px, #FFFFFF 14px)'
              }}
            >
              {/* Junção sanfonada do canudo */}
              <div className="w-full h-3 border-y border-stone-900/60 mt-5 bg-white/40" />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
