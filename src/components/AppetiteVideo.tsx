import React from 'react';
import NickelText from './NickelText';
import { motion } from 'motion/react';
import { ArrowRight, Star } from 'lucide-react';

interface AppetiteVideoProps {
  onGoToStore: (showLastOrders: boolean) => void;
}

export default function AppetiteVideo({ onGoToStore }: AppetiteVideoProps) {
  return (
    <div className="w-full flex flex-col items-center pb-8 mt-4 md:mt-8">
      
      <div className="w-full relative max-w-6xl px-4 sm:px-6 flex justify-center">
         
         {/* Main Video Container */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="w-full relative rounded-[24px] md:rounded-[32px] border-4 border-stone-200 shadow-xl overflow-hidden bg-stone-100 flex justify-center"
         >
           <video 
             autoPlay loop muted playsInline 
             className="w-full h-auto max-h-[70vh] md:max-h-[85vh] object-cover block"
           >
             <source src="/videobackground.mp4" type="video/mp4" />
             Seu navegador não suporta vídeos.
           </video>
         </motion.div>
         
         {/* Logo Cutout Overlay (Matches Image 1 precisely) */}
         <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute top-0 left-4 sm:left-6 z-10 bg-white rounded-br-[32px] md:rounded-br-[48px] pt-4 pl-4 pr-6 pb-6 md:pt-6 md:pl-6 md:pr-10 md:pb-10 flex flex-col items-center justify-center"
         >
            <img src="/logo.png" alt="Nickel Lanches" className="w-28 sm:w-36 md:w-48 h-auto object-contain drop-shadow-sm" />
            
            {/* SVG Smooth Curve Right */}
            <svg className="absolute top-0 -right-[24px] md:-right-[32px] w-[24px] h-[24px] md:w-[32px] md:h-[32px] text-white fill-current pointer-events-none" viewBox="0 0 32 32">
               <path d="M0 0 H32 A32 32 0 0 0 0 32 V0 Z" />
            </svg>
            
            {/* SVG Smooth Curve Bottom */}
            <svg className="absolute -bottom-[24px] md:-bottom-[32px] left-0 w-[24px] h-[24px] md:w-[32px] md:h-[32px] text-white fill-current pointer-events-none" viewBox="0 0 32 32">
               <path d="M0 0 H32 A32 32 0 0 0 0 32 V0 Z" />
            </svg>
         </motion.div>
         
      </div>
      
      {/* Content below */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="flex flex-col items-center mt-12 text-center px-4"
      >
        <div className="flex items-center gap-1 text-[#F28B20] mb-5">
          <Star size={24} className="fill-current drop-shadow-sm" />
          <Star size={24} className="fill-current drop-shadow-sm" />
          <Star size={24} className="fill-current drop-shadow-sm" />
          <Star size={24} className="fill-current drop-shadow-sm" />
          <Star size={24} className="fill-current drop-shadow-sm" />
        </div>
        
        <h3 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-stone-900 mb-8 leading-[1.1] max-w-4xl drop-shadow-sm">
          <span>"Delícias como essa você só encontra aqui na <NickelText />"</span>
        </h3>
        
        <button 
          onClick={() => onGoToStore(true)} 
          className="bg-[#F28B20] text-white font-black px-12 py-5 md:py-6 rounded-full flex items-center justify-center gap-3 hover:bg-orange-500 transition-transform hover:scale-105 shadow-[0_8px_30px_rgba(242,139,32,0.4)] uppercase tracking-widest text-sm md:text-lg"
        >
          Me deu fome <ArrowRight size={24} />
        </button>
      </motion.div>
      
    </div>
  );
}
